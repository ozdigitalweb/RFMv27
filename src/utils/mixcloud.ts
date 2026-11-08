// Utilitário de Integração e Cache com a API oficial do Mixcloud.com

export interface MixcloudRecording {
  key: string;
  url: string;
  name: string;
  created_time: string;
  play_count: number;
  favorite_count: number;
  audio_length: number; // segundos
  picture: string;
  user: {
    name: string;
    username: string;
    url: string;
  };
  tags: string[];
}

// Mapeamento automático de locutores e programas conhecidos da Rebeldia FM para contas no Mixcloud
export function resolveMixcloudUserOrQuery(program: {
  title?: string;
  host?: string;
  mixcloudUser?: string;
  mixcloudUrl?: string;
}): { user?: string; query?: string } {
  // Helper de normalização para canais conhecidos
  const normalizeKnownUser = (raw: string): string => {
    const decoded = decodeURIComponent(raw).trim();
    const lower = decoded.toLowerCase();
    if (lower.includes('surf') && (lower.includes('ação') || lower.includes('acao') || lower.includes('surfeacao'))) {
      return 'SurfeAcao';
    }
    if (lower.includes('skateabout') || lower.includes('skate about')) {
      return 'skateabout';
    }
    if (lower.includes('avox') || lower.includes('krauthein')) {
      return 'Avoxdobrasil';
    }
    if (lower.includes('eletroacordes') || lower.includes('acordes')) {
      return 'eletroacordes';
    }
    return decoded;
  };

  // 1. Se configurado link ou usuário direto
  if (program.mixcloudUser?.trim()) {
    const user = normalizeKnownUser(program.mixcloudUser.trim());
    return { user };
  }

  if (program.mixcloudUrl?.trim()) {
    const cleanUrl = program.mixcloudUrl.trim();
    const match = cleanUrl.match(/mixcloud\.com\/([^/?#]+)/i);
    if (match?.[1]) {
      const user = normalizeKnownUser(match[1]);
      return { user };
    }
  }

  const title = (program.title || '').toLowerCase();
  const host = (program.host || '').toLowerCase();

  // 2. Reconhecimento de "Skate About" / "Alê Braga" -> skateabout
  if (title.includes('skate') || host.includes('ale braga') || host.includes('alê braga')) {
    return { user: 'skateabout' };
  }

  // 3. Reconhecimento de "Surf & Ação" / "Paulo Henrique (PH)" -> SurfeAcao
  if (title.includes('surf') || host.includes('paulo henrique') || host.includes('(ph)')) {
    return { user: 'SurfeAcao' };
  }

  // 4. Reconhecimento de "Avox do Brasil" / "Marcelo Krauthein"
  if (
    title.includes('avox') ||
    host.includes('krauthein') ||
    title.includes('musica boa') ||
    title.includes('vox do brasil')
  ) {
    return { user: 'Avoxdobrasil' };
  }

  // 5. Reconhecimento de "Acordes Elétricos" / "Rodrigo Vizzotto"
  if (title.includes('acordes') || host.includes('vizzotto')) {
    return { user: 'eletroacordes' };
  }

  // 6. Se não encontrar usuário direto, pesquisa pelo título ou nome do locutor
  const sanitizedTitle = (program.title || '')
    .replace(/[^\w\sÀ-ú]/gi, ' ')
    .trim();
  return { query: sanitizedTitle || program.host || 'Rebeldia FM' };
}

// Formatar duração em segundos para "1h 58m" ou "45m"
export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'Duração N/D';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  return `${minutes} min`;
}

// Formatar data ISO para data legível em Português
export function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// Persistência de curtidas locais (LocalStorage)
const LIKES_STORAGE_KEY = 'rebeldia_mixcloud_likes_v1';

export function getLocalLikeStatus(key: string): { liked: boolean; customCountBonus: number } {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    if (!raw) return { liked: false, customCountBonus: 0 };
    const parsed = JSON.parse(raw);
    const item = parsed[key];
    if (!item) return { liked: false, customCountBonus: 0 };
    return {
      liked: !!item.liked,
      customCountBonus: item.customCountBonus || (item.liked ? 1 : 0),
    };
  } catch {
    return { liked: false, customCountBonus: 0 };
  }
}

export function toggleLocalLike(key: string): { liked: boolean; customCountBonus: number } {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const current = parsed[key] || { liked: false, customCountBonus: 0 };

    const newLiked = !current.liked;
    const newBonus = newLiked ? Math.max(1, (current.customCountBonus || 0) + 1) : Math.max(0, (current.customCountBonus || 1) - 1);

    parsed[key] = {
      liked: newLiked,
      customCountBonus: newBonus,
      updatedAt: Date.now(),
    };

    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(parsed));
    return { liked: newLiked, customCountBonus: newBonus };
  } catch (e) {
    console.error('Erro ao alternar like no localStorage:', e);
    return { liked: true, customCountBonus: 1 };
  }
}

// Buscar os últimos 5 programas gravados no Mixcloud
export async function fetchMixcloudRecordings(
  target: string | { user?: string; query?: string },
  limit: number = 5
): Promise<{ recordings: MixcloudRecording[]; sourceInfo: string }> {
  try {
    let rawItems: any[] = [];
    let sourceInfo = '';

    const resolvedTarget: { user?: string; query?: string } =
      typeof target === 'string'
        ? (() => {
            const clean = target.trim();
            const match = clean.match(/mixcloud\.com\/([^/?#]+)/i);
            if (match?.[1]) {
              return { user: decodeURIComponent(match[1]).trim() };
            }
            return { user: clean };
          })()
        : target;

    // 1. Tentar primeiro busca por usuário específico (ex: Avoxdobrasil ou eletroacordes)
    if (resolvedTarget.user) {
      sourceInfo = `@${resolvedTarget.user} (Mixcloud)`;
      try {
        const directUrl = `https://api.mixcloud.com/${encodeURIComponent(resolvedTarget.user)}/cloudcasts/?limit=${limit}`;
        const res = await fetch(directUrl);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data) && json.data.length > 0) {
            rawItems = json.data;
          }
        }
      } catch (err) {
        console.warn('Falha na chamada direta Mixcloud, tentando rota de proxy:', err);
      }

      // Se falhou no cliente direto, tentar rota local de proxy do Express
      if (rawItems.length === 0) {
        try {
          const proxyRes = await fetch(`/api/mixcloud/recordings?user=${encodeURIComponent(resolvedTarget.user)}&limit=${limit}`);
          if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            if (Array.isArray(proxyJson?.data)) {
              rawItems = proxyJson.data;
            }
          }
        } catch {
          // segue para fallback
        }
      }
    }

    // 2. Se não tinha usuário ou se o usuário retornou vazio, tenta busca por termo
    if (rawItems.length === 0 && resolvedTarget.query) {
      sourceInfo = `Busca: "${resolvedTarget.query}"`;
      try {
        const searchUrl = `https://api.mixcloud.com/search/?q=${encodeURIComponent(resolvedTarget.query)}&type=cloudcast&limit=${limit}`;
        const res = await fetch(searchUrl);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data) && json.data.length > 0) {
            rawItems = json.data;
          }
        }
      } catch {
        // segue para proxy search
      }

      if (rawItems.length === 0) {
        try {
          const proxyRes = await fetch(`/api/mixcloud/recordings?q=${encodeURIComponent(resolvedTarget.query)}&limit=${limit}`);
          if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            if (Array.isArray(proxyJson?.data)) {
              rawItems = proxyJson.data;
            }
          }
        } catch {
          // continua
        }
      }
    }

    // 3. Fallback inteligente de segurança para programas da emissora (Avoxdobrasil) se nada for encontrado
    if (rawItems.length === 0) {
      try {
        sourceInfo = 'Acervo Rebeldia FM (@Avoxdobrasil)';
        const fallbackRes = await fetch(`https://api.mixcloud.com/Avoxdobrasil/cloudcasts/?limit=${limit}`);
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          if (Array.isArray(json?.data)) {
            rawItems = json.data;
          }
        }
      } catch {
        // Silencioso
      }
    }

    // Normalizar até 5 itens
    const normalized: MixcloudRecording[] = rawItems.slice(0, limit).map((item) => {
      const pic =
        item.pictures?.large ||
        item.pictures?.extra_large ||
        item.pictures?.medium ||
        item.pictures?.thumbnail ||
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80';

      const tags = Array.isArray(item.tags)
        ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name)).filter(Boolean)
        : [];

      return {
        key: item.key,
        url: item.url,
        name: item.name || 'Gravação do Programa',
        created_time: item.created_time || '',
        play_count: item.play_count || 0,
        favorite_count: item.favorite_count || 0,
        audio_length: item.audio_length || 0,
        picture: pic,
        user: {
          name: item.user?.name || 'Rebeldia FM',
          username: item.user?.username || 'Avoxdobrasil',
          url: item.user?.url || 'https://www.mixcloud.com/Avoxdobrasil/',
        },
        tags,
      };
    });

    return { recordings: normalized, sourceInfo };
  } catch (error) {
    console.error('Erro geral ao buscar gravações do Mixcloud:', error);
    return { recordings: [], sourceInfo: '' };
  }
}
