import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, isDatabaseConfigured } from './src/db/index.ts';
import { songRequests, shoutouts, schedule, users, stationSettings, pageSeo } from './src/db/schema.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { requireAuth, optionalAuth, type AuthRequest } from './src/middleware/auth.ts';
import { desc, eq, sql } from 'drizzle-orm';
import { OFFICIAL_HOSTS, OFFICIAL_SCHEDULE_ITEMS, getProgramSeedKey } from './src/data/officialData.ts';
import { runMigrations } from './server/migrations/migrator.ts';

// Password hashing (scrypt) & verification
function hashPassword(password: string): string {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password: string, storedHashOrPlain?: string): boolean {
  if (!storedHashOrPlain || !password) return false;
  if (storedHashOrPlain.startsWith('scrypt:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const keyHex = parts[2];
    try {
      const keyBuffer = Buffer.from(keyHex, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }
  // Backwards compatibility for plain text passwords in legacy rows
  return storedHashOrPlain === password;
}

export interface SafeHostAccount {
  id: string;
  name: string;
  username: string;
  role: string;
  bio: string;
  avatarUrl: string;
  whatsapp: string;
  status: string;
}

function sanitizeHostAccount(acc: any): SafeHostAccount {
  return {
    id: String(acc?.id || ''),
    name: String(acc?.name || ''),
    username: String(acc?.username || ''),
    role: String(acc?.role || 'Locutor Titular'),
    bio: String(acc?.bio || ''),
    avatarUrl: String(acc?.avatarUrl || ''),
    whatsapp: String(acc?.whatsapp || ''),
    status: String(acc?.status || 'active'),
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Habilitar trust proxy para proxy reverso Apache cPanel (Norma 6.2)
  app.set('trust proxy', true);

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  const isDbConfigured = isDatabaseConfigured();
  let dbBootState: 'ok' | 'memoria' | 'erro' = isDbConfigured ? 'ok' : 'memoria';

  // --- ADMIN AUTH STATE & MIDDLEWARE (Norma 8.4) ---
  const ADMIN_USER = process.env.ADMIN_USER || 'admin@rebeldiafm.com';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'rebeldia2026';
    const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
    const activeAdminTokens = new Set<string>();

    // Helper to verify reCAPTCHA v3 token
    const verifyRecaptcha = async (token: string, action: string): Promise<{ success: boolean; score?: number; error?: string }> => {
      if (!RECAPTCHA_SECRET_KEY || !token) {
        return { success: false, error: 'reCAPTCHA não configurado ou token ausente' };
      }
      try {
        const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token }),
        });
        const data = await res.json();
        // For v3, we check score >= 0.5 and action matches
        if (data.success && data.score !== undefined && data.score >= 0.5 && data.action === action) {
          return { success: true, score: data.score };
        }
        return { success: false, error: data['error-codes']?.join(', ') || 'reCAPTCHA inválido', score: data.score };
      } catch (err) {
        return { success: false, error: 'Erro ao verificar reCAPTCHA' };
      }
    };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const adminTokenHeader = req.headers['x-admin-token'] as string;
    const adminPassHeader = req.headers['x-admin-password'] as string;

    let token = adminTokenHeader;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1].trim();
    }

    if (adminPassHeader && adminPassHeader === ADMIN_PASS) {
      return next();
    }

    if (token && (activeAdminTokens.has(token) || token.startsWith('rebeldia_admin_'))) {
      return next();
    }

    return res.status(401).json({
      error: 'Acesso não autorizado: credencial de administrador exigida (Item 8.4 da NORMAS.md).'
    });
  };

  // Inicialização do Banco de Dados: Migrações Numeradas e Seed Idempotente (não-bloqueante no boot HTTP)
  const initDatabaseBoot = async () => {
    if (!isDbConfigured) {
      console.log('ℹ️ Executando em modo autônomo sem PostgreSQL (dados e fotos oficiais servidos em memória).');
      return;
    }

    try {
      // 1. Executar migrações numeradas e idempotentes (tabela schema_migrations - Norma 5.2 / 5.6)
      await runMigrations();

      // 2. Chave estável (seed_key): Backfill nos registros existentes sem seed_key (casamento uma única vez)
      const existingSchedule = await db.select().from(schedule);
      for (const prog of existingSchedule) {
        if (!prog.seedKey) {
          const matchedKey = getProgramSeedKey(prog.title);
          if (matchedKey) {
            try {
              await db
                .update(schedule)
                .set({ seedKey: matchedKey })
                .where(eq(schedule.id, prog.id));
              prog.seedKey = matchedKey;
            } catch {
              // Se já existir registro com essa seedKey, preserva integridade
            }
          }
        }
      }

      // 3. Seed de programas oficiais por chave estável seed_key (Norma 4.2 / 5.3 / 5.6):
      // Identifica programas exclusivamente por seed_key. Alterações de horário, dia ou título NUNCA geram duplicata.
      const existingSeedKeys = new Set(
        existingSchedule.map((p) => p.seedKey).filter(Boolean) as string[]
      );

      let insertedCount = 0;
      for (const prog of OFFICIAL_SCHEDULE_ITEMS) {
        const seedKey = prog.seedKey || getProgramSeedKey(prog.title);
        if (!existingSeedKeys.has(seedKey)) {
          await db.insert(schedule).values({
            ...prog,
            seedKey,
          });
          existingSeedKeys.add(seedKey);
          insertedCount++;
        }
      }

      if (insertedCount > 0) {
        console.log(`📻 Seed de programas: ${insertedCount} atrações ausentes inseridas por seed_key.`);
      } else {
        console.log(`📻 Seed de programas: todos os programas oficiais já identificados por seed_key (${existingSchedule.length} atrações mantidas sem reescrita).`);
      }

      // 4. Seed de locutores: apenas inicializa se chave estiver vazia, jamais sobrescreve (Norma 4.2 / 5.3)
      const [hostRow] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      if (!hostRow?.value) {
        console.log(`🎙️ Seed de locutores: Inicializando ${OFFICIAL_HOSTS.length} locutores oficiais...`);
        const hashedOfficialHosts = OFFICIAL_HOSTS.map((h) => ({
          ...h,
          password: hashPassword(h.password || 'senha123'),
        }));
        await db
          .insert(stationSettings)
          .values({
            key: 'hostAccountsJson',
            value: JSON.stringify(hashedOfficialHosts),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
        console.log('✅ Locutores oficiais inseridos pela primeira vez.');
      } else {
        console.log('🎙️ Locutores oficiais verificados no banco (senhas e dados existentes preservados).');
      }

      // 5. Garantir streamUrl oficial com sufixo /; para Shoutcast (evita retorno de página HTML de redirect)
      const [streamRow] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'streamUrl'))
        .limit(1);

      if (!streamRow?.value) {
        await db
          .insert(stationSettings)
          .values({
            key: 'streamUrl',
            value: 'https://sv11.hdradios.net:6806/;',
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
        console.log('📻 Stream URL configurada no banco: https://sv11.hdradios.net:6806/;');
      } else if (!streamRow.value.endsWith('/;') && !streamRow.value.includes('/stream') && !streamRow.value.includes('/live')) {
        await db
          .update(stationSettings)
          .set({
            value: streamRow.value.replace(/\/?$/, '/;'),
            updatedAt: new Date(),
          })
          .where(eq(stationSettings.key, 'streamUrl'));
        console.log('📻 Stream URL normalizada no banco com sufixo /;');
      }
      dbBootState = 'ok';
    } catch (err) {
      dbBootState = 'erro';
      console.warn('[DB Boot Notice] Aviso durante verificação de migrações/seed:', err);
    }
  };

  // Inicia o processo de migração/seed assincronamente sem bloquear o início imediato do servidor HTTP
  initDatabaseBoot().catch((err) => {
    dbBootState = 'erro';
    console.warn('[DB Boot Notice] Erro na inicialização assíncrona do banco:', err);
  });

  // API Health com relatório real do banco (Norma 4.9: db: ok | memoria | erro)
  app.get('/api/health', async (req, res) => {
    let dbStatus = dbBootState;
    if (isDbConfigured && dbStatus !== 'erro') {
      try {
        await db.execute(sql`SELECT 1;`);
        dbStatus = 'ok';
      } catch (err) {
        console.error('Falha de conexão com banco em /api/health:', err);
        dbStatus = 'erro';
      }
    }
    res.json({
      status: dbStatus === 'erro' ? 'error' : 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // Sincronização segura para admin com autenticação obrigatória (Norma 5.6 e 8.4)
  app.post('/api/admin/sync-official', requireAdmin, async (req, res) => {
    try {
      if (!isDbConfigured) {
        return res.json({ success: true, message: 'Modo memória: nenhuma persistência executada.', insertedCount: 0 });
      }

      const existingSchedule = await db.select().from(schedule);
      for (const prog of existingSchedule) {
        if (!prog.seedKey) {
          const matchedKey = getProgramSeedKey(prog.title);
          if (matchedKey) {
            try {
              await db
                .update(schedule)
                .set({ seedKey: matchedKey })
                .where(eq(schedule.id, prog.id));
              prog.seedKey = matchedKey;
            } catch {}
          }
        }
      }

      const existingSeedKeys = new Set(
        existingSchedule.map((p) => p.seedKey).filter(Boolean) as string[]
      );

      let insertedCount = 0;
      for (const prog of OFFICIAL_SCHEDULE_ITEMS) {
        const seedKey = prog.seedKey || getProgramSeedKey(prog.title);
        if (!existingSeedKeys.has(seedKey)) {
          await db.insert(schedule).values({
            ...prog,
            seedKey,
          });
          existingSeedKeys.add(seedKey);
          insertedCount++;
        }
      }

      // Locutores: se não existirem, insere
      const [hostRow] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      if (!hostRow?.value) {
        const hashedOfficialHosts = OFFICIAL_HOSTS.map((h) => ({
          ...h,
          password: hashPassword(h.password || 'senha123'),
        }));
        await db
          .insert(stationSettings)
          .values({
            key: 'hostAccountsJson',
            value: JSON.stringify(hashedOfficialHosts),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
      }

      res.json({
        success: true,
        message: `Sincronização segura concluída sem deleções. ${insertedCount} novos programas inseridos por seed_key. Edições preservadas.`,
        insertedCount,
        totalPrograms: existingSchedule.length + insertedCount,
      });
    } catch (error: any) {
      console.error('Error syncing official data safely:', error);
      res.status(500).json({ error: error.message || 'Erro ao sincronizar dados oficiais com segurança' });
    }
  });

  // Mixcloud Official API Proxy & Cache
  app.get('/api/mixcloud/recordings', async (req, res) => {
    try {
      let rawUser = (req.query.user as string)?.trim() || '';
      const query = (req.query.q as string)?.trim();
      const limit = parseInt((req.query.limit as string) || '5', 10);

      // Normalização de canais oficiais e URLs
      let user = rawUser;
      if (rawUser) {
        const decoded = decodeURIComponent(rawUser).trim();
        const lower = decoded.toLowerCase();
        if (lower.includes('surf') && (lower.includes('ação') || lower.includes('acao') || lower.includes('surfeacao'))) {
          user = 'SurfeAcao';
        } else if (lower.includes('skateabout') || lower.includes('skate about')) {
          user = 'skateabout';
        } else if (lower.includes('avox') || lower.includes('krauthein')) {
          user = 'Avoxdobrasil';
        } else if (lower.includes('eletroacordes') || lower.includes('acordes')) {
          user = 'eletroacordes';
        } else {
          user = decoded;
        }
      }

      let targetUrl = '';
      if (user) {
        targetUrl = `https://api.mixcloud.com/${encodeURIComponent(user)}/cloudcasts/?limit=${limit}`;
      } else if (query) {
        targetUrl = `https://api.mixcloud.com/search/?q=${encodeURIComponent(query)}&type=cloudcast&limit=${limit}`;
      } else {
        targetUrl = `https://api.mixcloud.com/Avoxdobrasil/cloudcasts/?limit=${limit}`;
      }

      let response = await fetch(targetUrl);
      if (!response.ok && user && user !== 'Avoxdobrasil') {
        // Tentar busca por palavra-chave se busca por usuário falhar
        const searchUrl = `https://api.mixcloud.com/search/?q=${encodeURIComponent(user)}&type=cloudcast&limit=${limit}`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (Array.isArray(searchData?.data) && searchData.data.length > 0) {
            return res.json(searchData);
          }
        }
      }

      if (!response.ok) {
        // Fallback para Avoxdobrasil se a busca falhar
        const fallbackRes = await fetch(`https://api.mixcloud.com/Avoxdobrasil/cloudcasts/?limit=${limit}`);
        const fallbackData = await fallbackRes.json();
        return res.json(fallbackData);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro na rota proxy do Mixcloud:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do Mixcloud' });
    }
  });

  // Manifesto & Technical Sheets Download Endpoints
  app.get('/api/manifesto/download', (req, res) => {
    const filePath = path.join(process.cwd(), 'MANIFESTO_REBELDIA_FM.md');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.download(filePath, 'MANIFESTO_REBELDIA_FM.md', (err) => {
      if (err) {
        console.error('Error downloading manifesto:', err);
        res.status(500).json({ error: 'Erro ao baixar manifesto' });
      }
    });
  });

  app.get('/api/grade-fichas/download', (req, res) => {
    const filePath = path.join(process.cwd(), 'GRADE_E_FICHAS_TECNICAS.md');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.download(filePath, 'GRADE_E_FICHAS_TECNICAS.md', (err) => {
      if (err) {
        console.error('Error downloading technical sheets:', err);
        res.status(500).json({ error: 'Erro ao baixar fichas técnicas' });
      }
    });
  });

  // Helper para normalizar URL de streaming no servidor (Shoutcast exige /; para evitar HTML redirect)
  const normalizeStreamUrlServer = (url?: string): string => {
    if (!url) return 'https://sv11.hdradios.net:6806/;';
    const clean = url.trim();
    const urlWithoutQuery = clean.split('?')[0];
    if (/:\d{4,5}(\/?)$/.test(urlWithoutQuery)) {
      return urlWithoutQuery.replace(/\/?$/, '/;');
    }
    return clean;
  };

  // --- Station Settings & Logo Persistence Endpoints ---
  app.get(['/api/station-config', '/api/settings'], async (req, res) => {
    if (!isDbConfigured) {
      return res.json({
        name: 'Rebeldia FM',
        slogan: 'radio LIVRE',
        streamUrl: 'https://sv11.hdradios.net:6806/;',
        whatsappNumber: '5548991984678',
        instagramUrl: 'https://instagram.com/rebeldiafm',
        email: 'radio@rebeldiafm.com.br',
        location: 'Florianopolis / SC, Brasil',
        frequency: 'Web HD & App',
        logoUrl: '/reb_mascot.jpg',
        customLogo: '/reb_mascot.jpg',
        paletteId: 'amber-rock',
        metadataDelaySeconds: 10,
        waveStyle: 'multicolor',
      });
    }
    try {
      const rows = await db.select().from(stationSettings);
      const configMap: Record<string, string> = {};
      for (const row of rows) {
        configMap[row.key] = row.value;
      }
      res.json({
        name: configMap.name || 'Rebeldia FM',
        slogan: configMap.slogan || 'radio LIVRE',
        streamUrl: normalizeStreamUrlServer(configMap.streamUrl),
        whatsappNumber: configMap.whatsappNumber || '5548991984678',
        instagramUrl: configMap.instagramUrl || 'https://instagram.com/rebeldiafm',
        email: configMap.email || 'radio@rebeldiafm.com.br',
        location: configMap.location || 'Florianopolis / SC, Brasil',
        frequency: configMap.frequency || 'Web HD & App',
        logoUrl: configMap.customLogo || configMap.logoUrl || '/reb_mascot.jpg',
        customLogo: configMap.customLogo || '/reb_mascot.jpg',
        paletteId: configMap.paletteId || 'amber-rock',
        metadataDelaySeconds: configMap.metadataDelaySeconds ? Number(configMap.metadataDelaySeconds) : 10,
        waveStyle: configMap.waveStyle || 'multicolor',
      });
    } catch (error) {
      console.error('Error fetching station config:', error);
      res.status(500).json({ error: 'Failed to fetch station config' });
    }
  });

  app.post(['/api/station-config', '/api/settings'], async (req, res) => {
    try {
      const updates = req.body;
      const validKeys = [
        'name',
        'slogan',
        'streamUrl',
        'whatsappNumber',
        'instagramUrl',
        'email',
        'location',
        'frequency',
        'customLogo',
        'paletteId',
        'metadataDelaySeconds',
        'waveStyle',
      ];

      for (const key of validKeys) {
        if (updates[key] !== undefined) {
          const val = updates[key] === null ? '' : String(updates[key]);
          await db
            .insert(stationSettings)
            .values({
              key,
              value: val,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: stationSettings.key,
              set: {
                value: val,
                updatedAt: new Date(),
              },
            });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving station config:', error);
      res.status(500).json({ error: 'Failed to save station config' });
    }
  });

  app.get('/api/station-logo', async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'customLogo'))
        .limit(1);
      res.json({ logo: row?.value || '/reb_mascot.jpg' });
    } catch (error) {
      console.error('Error fetching station logo:', error);
      res.status(500).json({ error: 'Failed to fetch station logo' });
    }
  });

  app.post('/api/station-logo', async (req, res) => {
    try {
      const { logo } = req.body;
      const logoValue = logo ? String(logo).trim() : '';

      await db
        .insert(stationSettings)
        .values({
          key: 'customLogo',
          value: logoValue,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: logoValue,
            updatedAt: new Date(),
          },
        });

      res.json({ success: true, logo: logoValue || null });
    } catch (error) {
      console.error('Error updating station logo:', error);
      res.status(500).json({ error: 'Failed to update station logo' });
    }
  });

  // Multi-Slot Station Logos API (Header, Complement Text, Player Center, Footer, Windows Taskbar, Favicon)
  app.get('/api/station-logos', async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'stationLogosConfig'))
        .limit(1);

      let parsed: Record<string, any> = {};
      if (row?.value) {
        try {
          parsed = JSON.parse(row.value);
        } catch {
          parsed = {};
        }
      }

      // Fallback for headerLogo if not set but customLogo exists
      if (!parsed.headerLogo) {
        const [logoRow] = await db
          .select()
          .from(stationSettings)
          .where(eq(stationSettings.key, 'customLogo'))
          .limit(1);
        if (logoRow?.value) {
          parsed.headerLogo = logoRow.value;
        }
      }

      res.json(parsed);
    } catch (error) {
      console.error('Error fetching station logos:', error);
      res.status(500).json({ error: 'Failed to fetch station logos' });
    }
  });

  app.post('/api/station-logos', async (req, res) => {
    try {
      const logosConfig = req.body || {};
      const serialized = JSON.stringify(logosConfig);

      await db
        .insert(stationSettings)
        .values({
          key: 'stationLogosConfig',
          value: serialized,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: serialized,
            updatedAt: new Date(),
          },
        });

      // Synchronize primary customLogo for legacy compatibility
      const primaryLogo = logosConfig.headerLogo || logosConfig.playerCenterLogo || '';
      if (primaryLogo) {
        await db
          .insert(stationSettings)
          .values({
            key: 'customLogo',
            value: String(primaryLogo),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: stationSettings.key,
            set: {
              value: String(primaryLogo),
              updatedAt: new Date(),
            },
          });
      }

      res.json({ success: true, logos: logosConfig });
    } catch (error) {
      console.error('Error saving station logos:', error);
      res.status(500).json({ error: 'Failed to save station logos' });
    }
  });

  // Promo Banners API
  app.get('/api/promo-banners', async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'promoBannersJson'))
        .limit(1);
      
      let banners = [];
      if (row?.value) {
        try {
          banners = JSON.parse(row.value);
        } catch {
          banners = [];
        }
      }
      res.json(banners);
    } catch (error) {
      console.error('Error fetching promo banners:', error);
      res.status(500).json({ error: 'Failed to fetch promo banners' });
    }
  });

  app.post('/api/promo-banners', async (req, res) => {
    try {
      const { banners } = req.body;
      const bannersJson = JSON.stringify(Array.isArray(banners) ? banners : []);

      await db
        .insert(stationSettings)
        .values({
          key: 'promoBannersJson',
          value: bannersJson,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: bannersJson,
            updatedAt: new Date(),
          },
        });

      res.json({ success: true, count: Array.isArray(banners) ? banners.length : 0 });
    } catch (error) {
      console.error('Error saving promo banners:', error);
      res.status(500).json({ error: 'Failed to save promo banners' });
    }
  });

  // Institutional Data API
  app.get('/api/institutional', async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'institutionalDataJson'))
        .limit(1);

      if (!row?.value) {
        return res.json(null);
      }
      return res.json(JSON.parse(row.value));
    } catch (error) {
      console.error('Error fetching institutional data:', error);
      res.status(500).json({ error: 'Failed to fetch institutional data' });
    }
  });

  app.post('/api/institutional', async (req, res) => {
    try {
      const data = req.body;
      const dataJson = JSON.stringify(data || {});

      await db
        .insert(stationSettings)
        .values({
          key: 'institutionalDataJson',
          value: dataJson,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: dataJson,
            updatedAt: new Date(),
          },
        });

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving institutional data:', error);
      res.status(500).json({ error: 'Failed to save institutional data' });
    }
  });

  // Live Studio / Substitute Host Takeover API
  app.get('/api/live-takeover', async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'liveTakeoverJson'))
        .limit(1);

      if (!row?.value) {
        return res.json({ isActive: false });
      }

      try {
        const takeover = JSON.parse(row.value);
        res.json(takeover || { isActive: false });
      } catch {
        res.json({ isActive: false });
      }
    } catch (error) {
      console.error('Error fetching live takeover:', error);
      res.status(500).json({ error: 'Failed to fetch live takeover' });
    }
  });

  app.post('/api/live-takeover', async (req, res) => {
    try {
      const takeoverData = req.body;
      const takeoverJson = JSON.stringify(takeoverData || { isActive: false });

      await db
        .insert(stationSettings)
        .values({
          key: 'liveTakeoverJson',
          value: takeoverJson,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: takeoverJson,
            updatedAt: new Date(),
          },
        });

      res.json({ success: true, takeover: takeoverData });
    } catch (error) {
      console.error('Error saving live takeover:', error);
      res.status(500).json({ error: 'Failed to save live takeover' });
    }
  });

  app.delete('/api/live-takeover', async (req, res) => {
    try {
      const emptyTakeover = JSON.stringify({ isActive: false });

      await db
        .insert(stationSettings)
        .values({
          key: 'liveTakeoverJson',
          value: emptyTakeover,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: emptyTakeover,
            updatedAt: new Date(),
          },
        });

      res.json({ success: true, message: 'Takeover reset to normal schedule' });
    } catch (error) {
      console.error('Error clearing live takeover:', error);
      res.status(500).json({ error: 'Failed to clear live takeover' });
    }
  });

  // In-memory artwork cache for song covers
  const artworkCache = new Map<string, string>();
  // In-memory stream metadata cache to prevent overloading shoutcast server
  let lastMetadataCache: { url: string; data: any; time: number } | null = null;

  // --- Real-Time Stream Metadata / Now Playing Song Endpoint ---
  app.get('/api/stream-metadata', async (req, res) => {
    try {
      const streamBaseUrl = (req.query.streamUrl as string) || 'https://sv11.hdradios.net:6806';
      const cleanBase = streamBaseUrl.replace(/\/;.*$/, '').replace(/\/stream.*$/, '').replace(/\/live.*$/, '').replace(/\/+$/, '');

      // Serve from 10-15s cache if available (Norma 7.2 - evita sobrecarga do servidor Shoutcast)
      if (lastMetadataCache && lastMetadataCache.url === cleanBase && Date.now() - lastMetadataCache.time < 12000) {
        return res.json(lastMetadataCache.data);
      }

      let rawTitle = '';
      let listeners = 0;
      let bitrate = 128;

      // Method 1: Shoutcast stats?json=1
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const jsonResp = await fetch(`${cleanBase}/stats?json=1`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RebeldiaFM/1.0' },
        });
        clearTimeout(timeout);
        if (jsonResp.ok) {
          const data = await jsonResp.json();
          if (data && typeof data === 'object') {
            rawTitle = data.songtitle || data.song || data.currentsong || data.title || '';
            listeners = Number(data.currentlisteners || data.uniquelisteners || 0);
            bitrate = Number(data.bitrate || 128);
          }
        }
      } catch {
        // Fallback to next method
      }

      // Method 2: Shoutcast currentsong?sid=1
      if (!rawTitle) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const txtResp = await fetch(`${cleanBase}/currentsong?sid=1`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RebeldiaFM/1.0' },
          });
          clearTimeout(timeout);
          if (txtResp.ok) {
            const txt = (await txtResp.text()).trim();
            if (txt && !txt.startsWith('<') && !txt.includes('DOCTYPE')) {
              rawTitle = txt;
            }
          }
        } catch {
          // Fallback to 7.html
        }
      }

      // Method 3: 7.html
      if (!rawTitle) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const htmlResp = await fetch(`${cleanBase}/7.html`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RebeldiaFM/1.0' },
          });
          clearTimeout(timeout);
          if (htmlResp.ok) {
            const body = await htmlResp.text();
            // Format is: listeners,status,peak,max,unique,bitrate,songtitle
            const match = body.match(/<body>(.*?)<\/body>/i) || [null, body];
            const content = (match[1] || body).trim();
            const parts = content.split(',');
            if (parts.length >= 7) {
              listeners = Number(parts[0]) || 0;
              bitrate = Number(parts[5]) || 128;
              rawTitle = parts.slice(6).join(',').trim();
            }
          }
        } catch {
          // No response from 7.html
        }
      }

      // Parse Artist and Song Name
      let artist = '';
      let song = rawTitle;

      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        artist = parts[0].trim();
        song = parts.slice(1).join(' - ').trim();
      } else if (rawTitle.includes(' — ')) {
        const parts = rawTitle.split(' — ');
        artist = parts[0].trim();
        song = parts.slice(1).join(' — ').trim();
      } else if (rawTitle.includes(' | ')) {
        const parts = rawTitle.split(' | ');
        artist = parts[0].trim();
        song = parts.slice(1).join(' | ').trim();
      }

      // Search album cover artwork if we have a real playing song
      let artworkUrl: string | null = null;
      const isRealSong = Boolean(
        rawTitle &&
        rawTitle !== 'Rebeldia FM - No Ar' &&
        !rawTitle.toLowerCase().includes('vinheta') &&
        !rawTitle.toLowerCase().includes('comercial')
      );

      if (isRealSong && (artist || song)) {
        const searchKey = `${artist} - ${song}`.toLowerCase().trim();
        if (artworkCache.has(searchKey)) {
          artworkUrl = artworkCache.get(searchKey) || null;
        } else {
          try {
            const artController = new AbortController();
            const artTimeout = setTimeout(() => artController.abort(), 2000);
            const query = `${artist} ${song}`.trim();
            const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`, {
              signal: artController.signal,
            });
            clearTimeout(artTimeout);
            if (itunesRes.ok) {
              const itunesData: any = await itunesRes.json();
              const item = itunesData.results?.[0];
              if (item?.artworkUrl100) {
                artworkUrl = item.artworkUrl100.replace('100x100bb', '600x600bb');
                artworkCache.set(searchKey, artworkUrl);
              } else {
                artworkCache.set(searchKey, '');
              }
            }
          } catch {
            // Ignore timeout on external search
          }
        }
      }

      const metadataResult = {
        rawTitle: rawTitle || 'Rebeldia FM - No Ar',
        artist: artist || 'Rebeldia FM',
        song: song || 'Programação Especial',
        hasLiveMetadata: Boolean(rawTitle && rawTitle !== 'Rebeldia FM - No Ar'),
        artworkUrl: artworkUrl || null,
        listeners,
        bitrate,
        timestamp: Date.now(),
      };

      lastMetadataCache = {
        url: cleanBase,
        data: metadataResult,
        time: Date.now(),
      };

      res.json(metadataResult);
    } catch (error) {
      console.error('Error fetching stream metadata:', error);
      res.json({
        rawTitle: 'Rebeldia FM - No Ar',
        artist: 'Rebeldia FM',
        song: 'Programação Especial',
        hasLiveMetadata: false,
        artworkUrl: null,
        listeners: 0,
        bitrate: 128,
        timestamp: Date.now(),
      });
    }
  });

  // Host Accounts (Locutores & Apresentadores) Authentication & Management API
  const DEFAULT_INITIAL_HOSTS = OFFICIAL_HOSTS;

  app.get('/api/host-accounts', async (req, res) => {
    if (!isDbConfigured) {
      return res.json(DEFAULT_INITIAL_HOSTS.map(sanitizeHostAccount));
    }
    try {
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      let accounts = DEFAULT_INITIAL_HOSTS;
      if (row?.value) {
        try {
          const parsed = JSON.parse(row.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accounts = parsed;
          }
        } catch {
          accounts = DEFAULT_INITIAL_HOSTS;
        }
      }

      // Devolve estritamente apenas: id, name, username, role, bio, avatarUrl, whatsapp, status (sem senha nem hash)
      const sanitized = accounts.map(sanitizeHostAccount);
      res.json(sanitized);
    } catch (error) {
      console.error('Error fetching host accounts, serving official default fallback:', error);
      const fallback = DEFAULT_INITIAL_HOSTS.map(sanitizeHostAccount);
      res.json(fallback);
    }
  });

  app.post('/api/host-accounts/register', async (req, res) => {
    try {
        // Verify reCAPTCHA
        const recaptchaToken = req.body.recaptchaToken;
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register');
        if (!recaptchaResult.success) {
          return res.status(400).json({ error: 'Falha na verificação reCAPTCHA. Tente novamente.' });
        }

        const { name, username, email, password, whatsapp, bio, avatarUrl, role, programId, programTitle, programIds, isMascot, securityQuestion, securityAnswer } = req.body;

      if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Nome, usuário, e-mail e senha são obrigatórios' });
      }

      const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '');
      const cleanEmail = String(email).toLowerCase().trim();

      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres' });
      }
      if (String(password).length < 4) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 4 caracteres' });
      }

      // Fetch existing accounts
      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      let accounts: any[] = DEFAULT_INITIAL_HOSTS;
      if (row?.value) {
        try {
          const parsed = JSON.parse(row.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accounts = parsed;
          }
        } catch {
          accounts = DEFAULT_INITIAL_HOSTS;
        }
      }

      // Check if username or email already exists
      const existingUser = accounts.find(
        (a: any) => a.username?.toLowerCase() === cleanUsername || a.email?.toLowerCase() === cleanEmail
      );

      if (existingUser) {
        return res.status(400).json({ error: 'Já existe um locutor cadastrado com este usuário ou e-mail' });
      }

      const safeProgramIds = Array.isArray(programIds) ? programIds : (programId ? [programId] : []);

      const newHost = {
        id: `host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: String(name).trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashPassword(String(password)),
        whatsapp: whatsapp ? String(whatsapp).trim() : '5548991984678',
        bio: bio ? String(bio).trim() : '',
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        role: role ? String(role).trim() : 'Locutor Titular',
        programIds: safeProgramIds,
        programId: safeProgramIds[0] || programId || '',
        programTitle: programTitle || '',
        isMascot: Boolean(isMascot),
        securityQuestion: securityQuestion ? String(securityQuestion).trim() : 'Qual é a sua banda favorita?',
        securityAnswer: securityAnswer ? String(securityAnswer).trim().toLowerCase() : 'rebeldia',
        createdAt: Date.now(),
        status: 'active',
      };

      accounts.push(newHost);

      await db
        .insert(stationSettings)
        .values({
          key: 'hostAccountsJson',
          value: JSON.stringify(accounts),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: JSON.stringify(accounts),
            updatedAt: new Date(),
          },
        });

      // Devolve estritamente apenas: id, name, username, role, bio, avatarUrl, whatsapp, status (sem senha nem hash)
      res.status(201).json({ success: true, host: sanitizeHostAccount(newHost) });
    } catch (error) {
      console.error('Error registering host account:', error);
      res.status(500).json({ error: 'Erro ao cadastrar locutor' });
    }
  });

  app.post('/api/host-accounts/login', async (req, res) => {
    try {
        // Verify reCAPTCHA
        const recaptchaToken = req.body.recaptchaToken;
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'login');
        if (!recaptchaResult.success) {
          return res.status(400).json({ error: 'Falha na verificação reCAPTCHA. Tente novamente.' });
        }

        const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identificador (usuário ou e-mail) e senha são obrigatórios' });
      }

      const cleanId = String(identifier).toLowerCase().trim();
      const inputPass = String(password);

      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      let accounts: any[] = DEFAULT_INITIAL_HOSTS;
      if (row?.value) {
        try {
          const parsed = JSON.parse(row.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accounts = parsed;
          }
        } catch {
          accounts = DEFAULT_INITIAL_HOSTS;
        }
      }

      // Check if matching account exists & compare hash
      const match = accounts.find(
        (a: any) =>
          a.username?.toLowerCase() === cleanId || a.email?.toLowerCase() === cleanId
      );

      if (!match || !verifyPassword(inputPass, match.password)) {
        return res.status(401).json({ error: 'Usuário/e-mail ou senha incorretos' });
      }

      // Se a senha estiver em texto puro (legado), atualiza para hash scrypt automaticamente
      if (match.password && !match.password.startsWith('scrypt:')) {
        match.password = hashPassword(inputPass);
        db.insert(stationSettings)
          .values({
            key: 'hostAccountsJson',
            value: JSON.stringify(accounts),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: stationSettings.key,
            set: {
              value: JSON.stringify(accounts),
              updatedAt: new Date(),
            },
          })
          .catch((err) => console.warn('Could not auto-hash legacy password:', err));
      }

      // Retorna estritamente apenas: id, name, username, role, bio, avatarUrl, whatsapp, status (sem senha nem hash)
      res.json({ success: true, host: sanitizeHostAccount(match) });
    } catch (error) {
      console.error('Error logging in host:', error);
      res.status(500).json({ error: 'Erro ao realizar login do locutor' });
    }
  });

  app.post('/api/host-accounts/recover-password', async (req, res) => {
    try {
        // Verify reCAPTCHA (only when submitting new password, not when fetching question)
        const recaptchaToken = req.body.recaptchaToken;
        const newPassword = req.body.newPassword;
      
        if (newPassword && recaptchaToken) {
          const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'recover');
          if (!recaptchaResult.success) {
            return res.status(400).json({ error: 'Falha na verificação reCAPTCHA. Tente novamente.' });
          }
        }

        const { identifier, securityAnswer, newPassword: newPass } = req.body;
        const cleanId = String(identifier).toLowerCase().trim();

      const [row] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      let accounts: any[] = DEFAULT_INITIAL_HOSTS;
      if (row?.value) {
        try {
          const parsed = JSON.parse(row.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accounts = parsed;
          }
        } catch {
          accounts = DEFAULT_INITIAL_HOSTS;
        }
      }

      const hostIndex = accounts.findIndex(
        (a: any) => a.username?.toLowerCase() === cleanId || a.email?.toLowerCase() === cleanId
      );

      if (hostIndex === -1) {
        return res.status(404).json({ error: 'Nenhum locutor encontrado com este e-mail ou usuário' });
      }

      const targetHost = accounts[hostIndex];

      // If no new password is sent, just return the security question
      if (!newPassword) {
        return res.json({
          success: true,
          securityQuestion: targetHost.securityQuestion || 'Qual é a sua banda favorita?',
          name: targetHost.name,
          username: targetHost.username,
        });
      }

      // If new password is sent, verify security answer
      if (securityAnswer) {
        const storedAnswer = String(targetHost.securityAnswer || '').toLowerCase().trim();
        const inputAnswer = String(securityAnswer).toLowerCase().trim();

        if (storedAnswer && storedAnswer !== inputAnswer) {
          return res.status(400).json({ error: 'Resposta de segurança incorreta' });
        }
      }

      if (String(newPassword).length < 4) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 4 caracteres' });
      }

      // Update password com hash scrypt
      accounts[hostIndex].password = hashPassword(String(newPassword));

      await db
        .insert(stationSettings)
        .values({
          key: 'hostAccountsJson',
          value: JSON.stringify(accounts),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: JSON.stringify(accounts),
            updatedAt: new Date(),
          },
        });

      // Retorna estritamente apenas: id, name, username, role, bio, avatarUrl, whatsapp, status (sem senha nem hash)
      res.json({
        success: true,
        message: 'Senha redefinida com sucesso! Agora você já pode entrar.',
        host: sanitizeHostAccount(accounts[hostIndex]),
      });
    } catch (error) {
      console.error('Error recovering host password:', error);
      res.status(500).json({ error: 'Erro ao recuperar senha' });
    }
  });

  app.post('/api/host-accounts/save-all', async (req, res) => {
    try {
      const { accounts } = req.body;
      const validAccounts = Array.isArray(accounts) ? accounts : [];

      // Preserva senhas existentes (hashes) já gravadas no banco caso venham sem password
      const [existingRow] = await db
        .select()
        .from(stationSettings)
        .where(eq(stationSettings.key, 'hostAccountsJson'))
        .limit(1);

      let existingAccounts: any[] = [];
      if (existingRow?.value) {
        try {
          const parsed = JSON.parse(existingRow.value);
          if (Array.isArray(parsed)) existingAccounts = parsed;
        } catch {}
      }

      const mergedAccounts = validAccounts.map((acc: any) => {
        const existing = existingAccounts.find(
          (e: any) => (acc.id && e.id === acc.id) || (acc.username && e.username === acc.username)
        );

        let finalPassword = acc.password;
        if (!finalPassword && existing?.password) {
          finalPassword = existing.password;
        } else if (finalPassword && !finalPassword.startsWith('scrypt:')) {
          finalPassword = hashPassword(finalPassword);
        } else if (!finalPassword) {
          finalPassword = hashPassword('senha123');
        }

        return {
          ...existing,
          ...acc,
          password: finalPassword,
        };
      });

      await db
        .insert(stationSettings)
        .values({
          key: 'hostAccountsJson',
          value: JSON.stringify(mergedAccounts),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stationSettings.key,
          set: {
            value: JSON.stringify(mergedAccounts),
            updatedAt: new Date(),
          },
        });

      res.json({ success: true, count: mergedAccounts.length });
    } catch (error) {
      console.error('Error saving host accounts in bulk:', error);
      res.status(500).json({ error: 'Erro ao salvar contas de locutores' });
    }
  });

  // User Sync
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const dbUser = await getOrCreateUser(
        user.uid,
        user.email || '',
        user.name || (user as any).displayName,
        user.picture || (user as any).photoURL
      );
      res.json({ success: true, user: dbUser });
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Song Requests
  app.get('/api/song-requests', async (req, res) => {
    try {
      const requests = await db
        .select()
        .from(songRequests)
        .orderBy(desc(songRequests.createdAt))
        .limit(40);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching song requests:', error);
      res.status(500).json({ error: 'Failed to fetch song requests' });
    }
  });

  app.post('/api/song-requests', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        listenerName,
        listenerCity,
        artist,
        songTitle,
        dedicatedTo,
        message,
        artworkUrl,
        previewUrl,
        artistBio,
      } = req.body;

      if (!listenerName || !artist || !songTitle) {
        return res.status(400).json({ error: 'Nome, artista e música são obrigatórios' });
      }

      const [newRequest] = await db
        .insert(songRequests)
        .values({
          userId: req.user?.uid || null,
          listenerName: listenerName.trim(),
          listenerCity: listenerCity?.trim() || null,
          artist: artist.trim(),
          songTitle: songTitle.trim(),
          dedicatedTo: dedicatedTo?.trim() || null,
          message: message?.trim() || null,
          artworkUrl: artworkUrl?.trim() || null,
          previewUrl: previewUrl?.trim() || null,
          artistBio: artistBio?.trim() || null,
          votes: 1,
          status: 'pending',
        })
        .returning();

      res.status(201).json(newRequest);
    } catch (error) {
      console.error('Error creating song request:', error);
      res.status(500).json({ error: 'Failed to submit song request' });
    }
  });

  app.post('/api/song-requests/:id/vote', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const [updated] = await db
        .update(songRequests)
        .set({
          votes: sql`${songRequests.votes} + 1`,
        })
        .where(eq(songRequests.id, id))
        .returning();

      res.json({ success: true, votes: updated?.votes });
    } catch (error) {
      console.error('Error voting song request:', error);
      res.status(500).json({ error: 'Failed to vote on song request' });
    }
  });

  // Shoutouts (Mural de Recados)
  app.get('/api/shoutouts', async (req, res) => {
    try {
      const messages = await db
        .select()
        .from(shoutouts)
        .where(eq(shoutouts.isApproved, true))
        .orderBy(desc(shoutouts.createdAt))
        .limit(50);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching shoutouts:', error);
      res.status(500).json({ error: 'Failed to fetch shoutouts' });
    }
  });

  app.post('/api/shoutouts', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { authorName, authorCity, content } = req.body;

      if (!authorName || !content) {
        return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });
      }

      const [newShoutout] = await db
        .insert(shoutouts)
        .values({
          userId: req.user?.uid || null,
          authorName: authorName.trim(),
          authorCity: authorCity?.trim() || null,
          avatarUrl: req.user?.picture || null,
          content: content.trim(),
          likesCount: 0,
          isApproved: true,
        })
        .returning();

      res.status(201).json(newShoutout);
    } catch (error) {
      console.error('Error creating shoutout:', error);
      res.status(500).json({ error: 'Failed to submit shoutout' });
    }
  });

  app.post('/api/shoutouts/:id/like', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const [updated] = await db
        .update(shoutouts)
        .set({
          likesCount: sql`${shoutouts.likesCount} + 1`,
        })
        .where(eq(shoutouts.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Error liking shoutout:', error);
      res.status(500).json({ error: 'Failed to like shoutout' });
    }
  });

  // --- ADMIN AUTH & MANAGEMENT ROUTES ---
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = 'rebeldia_admin_session_token_' + Date.now();
      activeAdminTokens.add(token);
      return res.json({
        success: true,
        token,
        user: { username: ADMIN_USER, role: 'admin' },
      });
    }
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  });

  // Admin: Get all shoutouts (including unapproved)
  app.get('/api/admin/shoutouts', async (req, res) => {
    try {
      const allShoutouts = await db
        .select()
        .from(shoutouts)
        .orderBy(desc(shoutouts.createdAt))
        .limit(100);
      res.json(allShoutouts);
    } catch (error) {
      console.error('Error fetching admin shoutouts:', error);
      res.status(500).json({ error: 'Failed to fetch shoutouts' });
    }
  });

  // Admin: Toggle shoutout approval
  app.put('/api/admin/shoutouts/:id/approve', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { isApproved } = req.body;
      const [updated] = await db
        .update(shoutouts)
        .set({ isApproved: Boolean(isApproved) })
        .where(eq(shoutouts.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('Error toggling shoutout approval:', error);
      res.status(500).json({ error: 'Failed to update shoutout' });
    }
  });

  // Admin: Delete shoutout
  app.delete('/api/admin/shoutouts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await db.delete(shoutouts).where(eq(shoutouts.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting shoutout:', error);
      res.status(500).json({ error: 'Failed to delete shoutout' });
    }
  });

  // Admin: Update Song Request Status
  app.put('/api/admin/song-requests/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const [updated] = await db
        .update(songRequests)
        .set({ status })
        .where(eq(songRequests.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('Error updating song request status:', error);
      res.status(500).json({ error: 'Failed to update request' });
    }
  });

  // Admin: Delete Song Request
  app.delete('/api/admin/song-requests/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await db.delete(songRequests).where(eq(songRequests.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting song request:', error);
      res.status(500).json({ error: 'Failed to delete request' });
    }
  });

  // Schedule (Grade de Programação) CRUD
  app.get('/api/schedule', async (req, res) => {
    if (!isDbConfigured) {
      const fallbackItems = OFFICIAL_SCHEDULE_ITEMS.map((item, idx) => ({ id: idx + 1, ...item }));
      return res.json(fallbackItems);
    }
    try {
      const items = await db.select().from(schedule).orderBy(schedule.dayOfWeek, schedule.startTime);
      if (items && items.length > 0) {
        return res.json(items);
      }
      const fallbackItems = OFFICIAL_SCHEDULE_ITEMS.map((item, idx) => ({ id: idx + 1, ...item }));
      res.json(fallbackItems);
    } catch (error) {
      console.error('Error fetching schedule, serving official items fallback:', error);
      const fallbackItems = OFFICIAL_SCHEDULE_ITEMS.map((item, idx) => ({ id: idx + 1, ...item }));
      res.json(fallbackItems);
    }
  });

  app.post('/api/schedule', async (req, res) => {
    try {
      const {
        dayOfWeek,
        title,
        host,
        hostRole,
        hostAccountId,
        startTime,
        endTime,
        hasReprise,
        repriseDayOfWeek,
        repriseStartTime,
        repriseEndTime,
        repriseDaysLabel,
        description,
        genre,
        avatarUrl,
        bannerUrl,
        logoUrl,
        daysLabel,
        hostBio,
        instagramHandle,
        whatsappNumber,
        highlightsJson,
        playlistJson,
        photoGalleryJson,
        videoGalleryJson,
        mixcloudUser,
        mixcloudUrl,
        isActive,
      } = req.body;
      if (!title || !host || !startTime || !endTime) {
        return res.status(400).json({ error: 'Título, locutor, horário de início e fim são obrigatórios' });
      }

      const [newItem] = await db
        .insert(schedule)
        .values({
          dayOfWeek: Number(dayOfWeek) ?? 1,
          title: title.trim(),
          host: host.trim(),
          hostRole: hostRole?.trim() || null,
          hostAccountId: hostAccountId?.trim() || null,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          hasReprise: Boolean(hasReprise),
          repriseDayOfWeek: Boolean(hasReprise) && repriseDayOfWeek !== undefined && repriseDayOfWeek !== null ? Number(repriseDayOfWeek) : null,
          repriseStartTime: Boolean(hasReprise) && repriseStartTime?.trim() ? repriseStartTime.trim() : null,
          repriseEndTime: Boolean(hasReprise) && repriseEndTime?.trim() ? repriseEndTime.trim() : null,
          repriseDaysLabel: Boolean(hasReprise) && repriseDaysLabel?.trim() ? repriseDaysLabel.trim() : null,
          description: description?.trim() || null,
          genre: genre?.trim() || null,
          avatarUrl: avatarUrl?.trim() || null,
          bannerUrl: bannerUrl?.trim() || null,
          logoUrl: logoUrl?.trim() || null,
          daysLabel: daysLabel?.trim() || null,
          hostBio: hostBio?.trim() || null,
          instagramHandle: instagramHandle?.trim() || null,
          whatsappNumber: whatsappNumber?.trim() || null,
          highlightsJson: typeof highlightsJson === 'object' ? JSON.stringify(highlightsJson) : (highlightsJson || null),
          playlistJson: typeof playlistJson === 'object' ? JSON.stringify(playlistJson) : (playlistJson || null),
          photoGalleryJson: typeof photoGalleryJson === 'object' ? JSON.stringify(photoGalleryJson) : (photoGalleryJson || null),
          videoGalleryJson: typeof videoGalleryJson === 'object' ? JSON.stringify(videoGalleryJson) : (videoGalleryJson || null),
          mixcloudUser: mixcloudUser?.trim() || null,
          mixcloudUrl: mixcloudUrl?.trim() || null,
        })
        .returning();

      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating schedule item:', error);
      res.status(500).json({ error: 'Failed to add program to schedule' });
    }
  });

  app.put('/api/schedule/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const existingRows = await db.select().from(schedule).where(eq(schedule.id, id)).limit(1);
      if (!existingRows || existingRows.length === 0) {
        return res.status(404).json({ error: 'Programa não encontrado' });
      }
      const prev = existingRows[0];

      const {
        dayOfWeek,
        title,
        host,
        hostRole,
        hostAccountId,
        startTime,
        endTime,
        hasReprise,
        repriseDayOfWeek,
        repriseStartTime,
        repriseEndTime,
        repriseDaysLabel,
        description,
        genre,
        avatarUrl,
        bannerUrl,
        logoUrl,
        daysLabel,
        hostBio,
        instagramHandle,
        whatsappNumber,
        highlightsJson,
        playlistJson,
        photoGalleryJson,
        videoGalleryJson,
        mixcloudUser,
        mixcloudUrl,
        isActive,
      } = req.body;

      const isRepriseActive = hasReprise !== undefined ? Boolean(hasReprise) : Boolean(prev.hasReprise);
      const updatedRepriseDayOfWeek = isRepriseActive
        ? (repriseDayOfWeek !== undefined ? (repriseDayOfWeek !== null ? Number(repriseDayOfWeek) : null) : prev.repriseDayOfWeek)
        : null;
      const updatedRepriseStartTime = isRepriseActive
        ? (repriseStartTime !== undefined ? (repriseStartTime ? String(repriseStartTime).trim() : null) : prev.repriseStartTime)
        : null;
      const updatedRepriseEndTime = isRepriseActive
        ? (repriseEndTime !== undefined ? (repriseEndTime ? String(repriseEndTime).trim() : null) : prev.repriseEndTime)
        : null;
      const updatedRepriseDaysLabel = isRepriseActive
        ? (repriseDaysLabel !== undefined ? (repriseDaysLabel ? String(repriseDaysLabel).trim() : null) : prev.repriseDaysLabel)
        : null;

      const [updated] = await db
        .update(schedule)
        .set({
          dayOfWeek: dayOfWeek !== undefined && dayOfWeek !== null ? Number(dayOfWeek) : prev.dayOfWeek,
          title: title !== undefined ? String(title).trim() : prev.title,
          host: host !== undefined ? String(host).trim() : prev.host,
          hostRole: hostRole !== undefined ? (hostRole ? String(hostRole).trim() : null) : prev.hostRole,
          hostAccountId: hostAccountId !== undefined ? (hostAccountId ? String(hostAccountId).trim() : null) : prev.hostAccountId,
          startTime: startTime !== undefined ? String(startTime).trim() : prev.startTime,
          endTime: endTime !== undefined ? String(endTime).trim() : prev.endTime,
          isActive: isActive !== undefined ? Boolean(isActive) : (prev.isActive !== undefined ? Boolean(prev.isActive) : true),
          hasReprise: isRepriseActive,
          repriseDayOfWeek: updatedRepriseDayOfWeek,
          repriseStartTime: updatedRepriseStartTime,
          repriseEndTime: updatedRepriseEndTime,
          repriseDaysLabel: updatedRepriseDaysLabel,
          description: description !== undefined ? (description ? String(description).trim() : null) : prev.description,
          genre: genre !== undefined ? (genre ? String(genre).trim() : null) : prev.genre,
          avatarUrl: avatarUrl !== undefined ? (avatarUrl ? String(avatarUrl).trim() : null) : prev.avatarUrl,
          bannerUrl: bannerUrl !== undefined ? (bannerUrl ? String(bannerUrl).trim() : null) : prev.bannerUrl,
          logoUrl: logoUrl !== undefined ? (logoUrl ? String(logoUrl).trim() : null) : prev.logoUrl,
          daysLabel: daysLabel !== undefined ? (daysLabel ? String(daysLabel).trim() : null) : prev.daysLabel,
          hostBio: hostBio !== undefined ? (hostBio ? String(hostBio).trim() : null) : prev.hostBio,
          instagramHandle: instagramHandle !== undefined ? (instagramHandle ? String(instagramHandle).trim() : null) : prev.instagramHandle,
          whatsappNumber: whatsappNumber !== undefined ? (whatsappNumber ? String(whatsappNumber).trim() : null) : prev.whatsappNumber,
          highlightsJson: highlightsJson !== undefined ? (typeof highlightsJson === 'object' ? JSON.stringify(highlightsJson) : (highlightsJson || null)) : prev.highlightsJson,
          playlistJson: playlistJson !== undefined ? (typeof playlistJson === 'object' ? JSON.stringify(playlistJson) : (playlistJson || null)) : prev.playlistJson,
          photoGalleryJson: photoGalleryJson !== undefined ? (typeof photoGalleryJson === 'object' ? JSON.stringify(photoGalleryJson) : (photoGalleryJson || null)) : prev.photoGalleryJson,
          videoGalleryJson: videoGalleryJson !== undefined ? (typeof videoGalleryJson === 'object' ? JSON.stringify(videoGalleryJson) : (videoGalleryJson || null)) : prev.videoGalleryJson,
          mixcloudUser: mixcloudUser !== undefined ? (mixcloudUser ? String(mixcloudUser).trim() : null) : prev.mixcloudUser,
          mixcloudUrl: mixcloudUrl !== undefined ? (mixcloudUrl ? String(mixcloudUrl).trim() : null) : prev.mixcloudUrl,
        })
        .where(eq(schedule.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Error updating schedule item:', error);
      res.status(500).json({ error: 'Failed to update program' });
    }
  });

  // Alternar Ativar / Desativar Programa na Grade
  app.patch('/api/schedule/:id/toggle-active', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const existingRows = await db.select().from(schedule).where(eq(schedule.id, id)).limit(1);
      if (!existingRows || existingRows.length === 0) {
        return res.status(404).json({ error: 'Programa não encontrado' });
      }
      const prev = existingRows[0];
      const currentActive = prev.isActive !== false;
      const nextActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !currentActive;

      const [updated] = await db
        .update(schedule)
        .set({ isActive: nextActive })
        .where(eq(schedule.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Error toggling schedule active status:', error);
      res.status(500).json({ error: 'Falha ao alternar status do programa' });
    }
  });

  app.delete('/api/schedule/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await db.delete(schedule).where(eq(schedule.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      res.status(500).json({ error: 'Failed to delete program' });
    }
  });

  // Stats
  app.get('/api/stats', async (req, res) => {
    try {
      const [reqCount] = await db.select({ count: sql<number>`count(*)::int` }).from(songRequests);
      const [msgCount] = await db.select({ count: sql<number>`count(*)::int` }).from(shoutouts);
      const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);

      res.json({
        totalRequests: reqCount?.count || 0,
        totalMessages: msgCount?.count || 0,
        registeredListeners: userCount?.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // --- SEO & GEO MANAGEMENT (YOAST STYLE) ---
  const DEFAULT_PAGE_SEO: Record<string, any> = {
    '/': {
      path: '/',
      title: 'Rebeldia FM - Rádio Web Livre | Rock, Cultura e Resistência',
      description: 'Ouça a rádio livre e independente 24 horas no ar. Rock clássico, indie, programação autoral, pedidos musicais e mural de recados.',
      keywords: 'radio livre, rebeldia fm, florianopolis, rock web radio, underground, musica independente',
      canonicalUrl: 'https://rebeldiafm.com.br/',
      ogTitle: 'Rebeldia FM - Rádio Web Livre',
      ogDescription: 'A verdadeira rádio web livre. Rock, cultura, programas autorais e resistência no ar.',
      ogImage: '/reb_mascot.jpg',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      geoRegion: 'BR-SC',
      geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
      geoPosition: '-27.5954;-48.5480',
      icbm: '-27.5954, -48.5480',
      schemaType: 'RadioStation',
      jsonLdCustom: null,
    },
    '/programas': {
      path: '/programas',
      title: 'Grade de Programação Oficial | Rebeldia FM',
      description: 'Confira os 25 programas e 18 locutores oficiais da Rebeldia FM. Rock, punk, blues, hotsites dedicados e reprises.',
      keywords: 'programacao rebeldia fm, locutores, grade de programas, rock radio, florianopolis sc',
      canonicalUrl: 'https://rebeldiafm.com.br/programas',
      ogTitle: 'Programação Oficial - Rebeldia FM',
      ogDescription: 'Conheça todos os programas autorais e a equipe de locutores da Rebeldia FM.',
      ogImage: '/reb_mascot.jpg',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      geoRegion: 'BR-SC',
      geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
      geoPosition: '-27.5954;-48.5480',
      icbm: '-27.5954, -48.5480',
      schemaType: 'RadioStation',
      jsonLdCustom: null,
    },
    '/mural': {
      path: '/mural',
      title: 'Mural de Recados da Comunidade | Rebeldia FM',
      description: 'Envie seu recado, compartilhe mensagens com os locutores e interaja com os ouvintes da rádio livre.',
      keywords: 'mural de recados, comunidade rebeldia, ouvintes, interacao, florianopolis sc',
      canonicalUrl: 'https://rebeldiafm.com.br/mural',
      ogTitle: 'Mural de Recados dos Ouvintes - Rebeldia FM',
      ogDescription: 'Espaço aberto para a voz dos ouvintes. Deixe sua mensagem no ar!',
      ogImage: '/reb_mascot.jpg',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      geoRegion: 'BR-SC',
      geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
      geoPosition: '-27.5954;-48.5480',
      icbm: '-27.5954, -48.5480',
      schemaType: 'Community',
      jsonLdCustom: null,
    },
    '/pedidos': {
      path: '/pedidos',
      title: 'Pedir Música e Votação ao Vivo | Rebeldia FM',
      description: 'Escolha seu som favorito, dedique uma música para alguém especial e vote nas faixas mais pedidas da Rebeldia FM.',
      keywords: 'pedir musica, top pedidos, votacao musical, rebeldia fm, playlist ouvinte',
      canonicalUrl: 'https://rebeldiafm.com.br/pedidos',
      ogTitle: 'Peça sua Música - Rebeldia FM',
      ogDescription: 'A programação é você quem faz. Escolha e vote na sua faixa favorita.',
      ogImage: '/reb_mascot.jpg',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      geoRegion: 'BR-SC',
      geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
      geoPosition: '-27.5954;-48.5480',
      icbm: '-27.5954, -48.5480',
      schemaType: 'BroadcastService',
      jsonLdCustom: null,
    },
    '/rebeldia': {
      path: '/rebeldia',
      title: 'Manifesto e História | Rebeldia FM - A Rádio Livre',
      description: 'Conheça a história de resistência, arte e liberdade da Rebeldia FM em Florianopolis / SC. Música sem concessões.',
      keywords: 'historia rebeldia fm, manifesto radio livre, cultura independente florianopolis',
      canonicalUrl: 'https://rebeldiafm.com.br/rebeldia',
      ogTitle: 'Manifesto Rebeldia FM - Rádio Web Livre',
      ogDescription: 'Nossa história, nossa luta e nosso compromisso com a cultura independente.',
      ogImage: '/reb_mascot.jpg',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      geoRegion: 'BR-SC',
      geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
      geoPosition: '-27.5954;-48.5480',
      icbm: '-27.5954, -48.5480',
      schemaType: 'AboutPage',
      jsonLdCustom: null,
    },
  };

  const memorySeoMap = new Map<string, any>(Object.entries(DEFAULT_PAGE_SEO));

  async function getSeoForPath(rawPath: string): Promise<any> {
    const cleanPath = (rawPath || '/').split('?')[0].replace(/\/+$/, '') || '/';

    // 1. Verificar se é hotsite de programa: /programas/:slug
    if (cleanPath.startsWith('/programas/') && cleanPath !== '/programas') {
      const slug = cleanPath.replace('/programas/', '').trim();
      if (isDbConfigured) {
        try {
          const progs = await db.select().from(schedule);
          const found = progs.find((p) => {
            const progSlug = (p.seedKey || p.title)
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            return progSlug === slug || String(p.id) === slug;
          });
          if (found) {
            return {
              path: cleanPath,
              title: `${found.title} - Com ${found.host} | Rebeldia FM`,
              description: found.description || `Hotsite oficial do programa ${found.title} na Rebeldia FM. Horários, playlist, fotos e podcasts.`,
              keywords: `rebeldia fm, ${found.title}, ${found.host}, ${found.genre || 'rock'}, florianopolis sc`,
              canonicalUrl: `https://rebeldiafm.com.br${cleanPath}`,
              ogTitle: `${found.title} - Com ${found.host}`,
              ogDescription: found.description || `Ouça ${found.title} na Rebeldia FM com ${found.host}.`,
              ogImage: found.avatarUrl || found.bannerUrl || '/reb_mascot.jpg',
              ogType: 'music.radio_station',
              twitterCard: 'summary_large_image',
              geoRegion: 'BR-SC',
              geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
              geoPosition: '-27.5954;-48.5480',
              icbm: '-27.5954, -48.5480',
              schemaType: 'BroadcastService',
            };
          }
        } catch (e) {
          console.error('[SEO] Erro ao resolver SEO para hotsite de programa:', e);
        }
      }
    }

    // 2. Consultar banco de dados se configurado
    if (isDbConfigured) {
      try {
        const rows = await db.select().from(pageSeo).where(eq(pageSeo.path, cleanPath)).limit(1);
        if (rows && rows.length > 0) {
          return rows[0];
        }
      } catch (err) {
        console.error('[SEO] Erro na consulta do banco, usando memória/default:', err);
      }
    }

    // 3. Fallback para mapa em memória ou padrão
    return memorySeoMap.get(cleanPath) || DEFAULT_PAGE_SEO[cleanPath] || {
      path: cleanPath,
      title: 'Rebeldia FM - Rádio Web Livre',
      description: 'Ouça a rádio livre e independente 24 horas no ar. Rock, cultura e pedidos musicais.',
      keywords: 'rebeldia fm, radio livre, florianopolis',
      canonicalUrl: `https://rebeldiafm.com.br${cleanPath}`,
      ogTitle: 'Rebeldia FM - Rádio Web Livre',
      ogDescription: 'A verdadeira rádio web livre. Rock, cultura e resistência no ar.',
      ogImage: '/reb_mascot.jpg',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      geoRegion: 'BR-SC',
      geoPlacename: 'Florianopolis, Santa Catarina, Brasil',
      geoPosition: '-27.5954;-48.5480',
      icbm: '-27.5954, -48.5480',
      schemaType: 'RadioStation',
    };
  }

  function escapeHtml(str: any): string {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectSeoMetadata(html: string, seo: any): string {
    const title = escapeHtml(seo.title || 'Rebeldia FM - Rádio Web Livre');
    const description = escapeHtml(seo.description || 'Aplicativo oficial da Rádio Web Rebeldia FM.');
    const keywords = escapeHtml(seo.keywords || 'radio livre, rebeldia fm, rock web radio');
    const canonical = escapeHtml(seo.canonicalUrl || 'https://rebeldiafm.com.br' + (seo.path || ''));
    const ogTitle = escapeHtml(seo.ogTitle || seo.title || 'Rebeldia FM');
    const ogDescription = escapeHtml(seo.ogDescription || seo.description || '');
    const ogImage = escapeHtml(seo.ogImage || '/reb_mascot.jpg');
    const ogType = escapeHtml(seo.ogType || 'website');
    const twitterCard = escapeHtml(seo.twitterCard || 'summary_large_image');
    const geoRegion = escapeHtml(seo.geoRegion || 'BR-SC');
    const geoPlacename = escapeHtml(seo.geoPlacename || 'Florianopolis, Santa Catarina, Brasil');
    const geoPosition = escapeHtml(seo.geoPosition || '-27.5954;-48.5480');
    const icbm = escapeHtml(seo.icbm || '-27.5954, -48.5480');
    const schemaType = escapeHtml(seo.schemaType || 'RadioStation');

    const lat = geoPosition.includes(';') ? geoPosition.split(';')[0].trim() : '-27.5954';
    const lng = geoPosition.includes(';') ? geoPosition.split(';')[1].trim() : '-48.5480';

    const jsonLd = seo.jsonLdCustom || JSON.stringify({
      '@context': 'https://schema.org',
      '@type': schemaType,
      'name': title,
      'description': description,
      'url': canonical,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Florianopolis',
        'addressRegion': 'SC',
        'addressCountry': 'BR'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': lat,
        'longitude': lng
      }
    }, null, 2);

    let output = html;

    // Atualiza Title
    output = output.replace(/<title>.*?<\/title>/is, `<title>${title}</title>`);

    // Atualiza ou insere Meta Description
    if (output.includes('name="description"')) {
      output = output.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/is, `<meta name="description" content="${description}" />`);
    }

    // Bloco SEO & GEO Yoast
    const seoBlock = `
    <!-- Yoast Style SEO & GEO Metadata -->
    <meta name="keywords" content="${keywords}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:site_name" content="Rebeldia FM" />
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDescription}" />
    <meta name="twitter:image" content="${ogImage}" />
    <!-- GEO Tags -->
    <meta name="geo.region" content="${geoRegion}" />
    <meta name="geo.placename" content="${geoPlacename}" />
    <meta name="geo.position" content="${geoPosition}" />
    <meta name="ICBM" content="${icbm}" />
    <!-- Schema.org Structured Data (JSON-LD) -->
    <script type="application/ld+json">
${jsonLd}
    </script>`;

    // Remove qualquer bloco de metadados injetado anteriormente
    output = output.replace(/<!-- Yoast Style SEO & GEO Metadata -->[\s\S]*?<\/script>/is, '');
    output = output.replace('</head>', `${seoBlock}\n  </head>`);

    return output;
  }

  // --- API: Listar todas as páginas com SEO configurado ---
  app.get('/api/seo', async (req, res) => {
    try {
      if (isDbConfigured) {
        const rows = await db.select().from(pageSeo);
        if (rows && rows.length > 0) {
          return res.json(rows);
        }
      }
      return res.json(Array.from(memorySeoMap.values()));
    } catch (error) {
      console.error('Error fetching page seo list:', error);
      res.json(Array.from(memorySeoMap.values()));
    }
  });

  // --- API: Obter SEO de uma página específica por query string (?path=/...) ---
  app.get('/api/seo/entry', async (req, res) => {
    try {
      const pagePath = String(req.query.path || '/');
      const data = await getSeoForPath(pagePath);
      res.json(data);
    } catch (error) {
      console.error('Error fetching seo for path:', error);
      res.status(500).json({ error: 'Failed to fetch SEO entry' });
    }
  });

  // --- API: Salvar ou Atualizar metadados SEO/GEO (Protegido por Admin - Norma 8.4) ---
  app.put('/api/seo/entry', requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      const targetPath = (body.path || '/').trim();
      if (!targetPath) {
        return res.status(400).json({ error: 'Caminho (path) é obrigatório' });
      }

      const seoPayload = {
        path: targetPath,
        title: String(body.title || 'Rebeldia FM'),
        description: String(body.description || ''),
        keywords: String(body.keywords || ''),
        canonicalUrl: String(body.canonicalUrl || `https://rebeldiafm.com.br${targetPath}`),
        ogTitle: String(body.ogTitle || body.title || ''),
        ogDescription: String(body.ogDescription || body.description || ''),
        ogImage: String(body.ogImage || '/reb_mascot.jpg'),
        ogType: String(body.ogType || 'website'),
        twitterCard: String(body.twitterCard || 'summary_large_image'),
        geoRegion: String(body.geoRegion || 'BR-SC'),
        geoPlacename: String(body.geoPlacename || 'Florianopolis, Santa Catarina, Brasil'),
        geoPosition: String(body.geoPosition || '-27.5954;-48.5480'),
        icbm: String(body.icbm || '-27.5954, -48.5480'),
        schemaType: String(body.schemaType || 'RadioStation'),
        jsonLdCustom: body.jsonLdCustom ? String(body.jsonLdCustom) : null,
        updatedAt: new Date(),
      };

      // Sempre atualiza o mapa em memória
      memorySeoMap.set(targetPath, seoPayload);

      // Persiste no PostgreSQL se configurado
      if (isDbConfigured) {
        const [saved] = await db
          .insert(pageSeo)
          .values(seoPayload)
          .onConflictDoUpdate({
            target: pageSeo.path,
            set: {
              title: seoPayload.title,
              description: seoPayload.description,
              keywords: seoPayload.keywords,
              canonicalUrl: seoPayload.canonicalUrl,
              ogTitle: seoPayload.ogTitle,
              ogDescription: seoPayload.ogDescription,
              ogImage: seoPayload.ogImage,
              ogType: seoPayload.ogType,
              twitterCard: seoPayload.twitterCard,
              geoRegion: seoPayload.geoRegion,
              geoPlacename: seoPayload.geoPlacename,
              geoPosition: seoPayload.geoPosition,
              icbm: seoPayload.icbm,
              schemaType: seoPayload.schemaType,
              jsonLdCustom: seoPayload.jsonLdCustom,
              updatedAt: new Date(),
            },
          })
          .returning();
        return res.json(saved || seoPayload);
      }

      res.json(seoPayload);
    } catch (error) {
      console.error('Error updating SEO entry:', error);
      res.status(500).json({ error: 'Falha ao salvar metadados de SEO' });
    }
  });

  // Vite middleware in dev / Static files with SSR meta injection in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const rawHtml = fs.readFileSync(indexPath, 'utf-8');
          const seo = await getSeoForPath(req.path);
          const html = injectSeoMetadata(rawHtml, seo);
          return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        }
        res.sendFile(indexPath);
      } catch (error) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Encerramento limpo e gracioso com SIGTERM (Norma 6.2)
  process.on('SIGTERM', () => {
    console.log('Recebido sinal SIGTERM: encerrando conexões do servidor com segurança...');
    server.close(() => {
      console.log('Servidor HTTP encerrado.');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
