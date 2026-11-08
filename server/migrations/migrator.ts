import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { getDbConfig } from '../../src/db/index.ts';

async function executeMigrationsOnce(): Promise<{ applied: string[]; alreadyApplied: string[] }> {
  const applied: string[] = [];
  const alreadyApplied: string[] = [];

  const baseConfig = getDbConfig();
  // Se SQL_ADMIN_USER estiver definido (Cloud SQL / DDL), usar credenciais de admin para migrações
  const adminUser = process.env.SQL_ADMIN_USER || baseConfig.user;
  const adminPassword = process.env.SQL_ADMIN_PASSWORD || baseConfig.password;

  const poolConfig: any = {
    max: 2,
    connectionTimeoutMillis: 10000,
  };

  if (baseConfig.host) poolConfig.host = baseConfig.host;
  if (baseConfig.port) poolConfig.port = baseConfig.port;
  if (adminUser) poolConfig.user = adminUser;
  if (adminPassword) poolConfig.password = adminPassword;
  if (baseConfig.database) poolConfig.database = baseConfig.database;

  if (!baseConfig.host && process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
  }

  const migrationPool = new Pool(poolConfig);
  const migrationDb = drizzle(migrationPool);

  try {
    // 1. Criar tabela de controle se não existir
    await migrationDb.execute(sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE,
        applied_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Buscar migrações já executadas
    const existingResult: any = await migrationDb.execute(sql`
      SELECT name FROM schema_migrations ORDER BY id ASC;
    `);

    const appliedSet = new Set<string>();
    if (existingResult?.rows) {
      for (const row of existingResult.rows) {
        appliedSet.add(row.name);
      }
    }

    // 3. Localizar arquivos de migração a partir de process.cwd() (Fase 2 ready)
    const migrationsDir = path.resolve(process.cwd(), 'server/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`[Migrator] Diretório de migrações não encontrado em ${migrationsDir}`);
      return { applied, alreadyApplied };
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        alreadyApplied.push(file);
        continue;
      }

      console.log(`[Migrator] Executando migração: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Executa o script SQL da migração
      await migrationDb.execute(sql.raw(sqlContent));

      // Registra a migração no banco
      await migrationDb.execute(sql`
        INSERT INTO schema_migrations (name) VALUES (${file})
        ON CONFLICT (name) DO NOTHING;
      `);

      applied.push(file);
      console.log(`[Migrator] ✅ Migração aplicada com sucesso: ${file}`);
    }
  } finally {
    await migrationPool.end().catch(() => {});
  }

  return { applied, alreadyApplied };
}

export async function runMigrations(): Promise<{ applied: string[]; alreadyApplied: string[] }> {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxRetries = isProduction ? 5 : 1;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await executeMigrationsOnce();
    } catch (error) {
      lastError = error;
      if (isProduction && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`[Migrator] Tentativa ${attempt}/5 falhou. Nova tentativa em ${delayMs / 1000}s... Erro:`, error);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }

  if (isProduction) {
    console.error(`[Migrator] ⚠️ Falha na execução de migrações após ${maxRetries} tentativas em produção. O servidor continuará em execução com status de erro no /api/health (Norma 4.8).`);
    console.error(lastError);
  }

  throw lastError;
}
