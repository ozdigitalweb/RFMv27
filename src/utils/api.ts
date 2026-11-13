import { OFFICIAL_SCHEDULE_ITEMS, OFFICIAL_HOSTS } from '../data/officialData';
import { DEFAULT_RADIO_CONFIG, INITIAL_REQUESTS, INITIAL_MESSAGES, INITIAL_PROMO_BANNERS } from '../data/initialData';

export interface DbSongRequest {
  id: number;
  userId: string | null;
  listenerName: string;
  listenerCity: string | null;
  artist: string;
  songTitle: string;
  dedicatedTo: string | null;
  dedication?: string | null;
  message: string | null;
  artworkUrl?: string | null;
  previewUrl?: string | null;
  artistBio?: string | null;
  votes: number;
  status: string;
  createdAt: string;
}

export interface DbShoutout {
  id: number;
  userId: string | null;
  authorName: string;
  authorCity: string | null;
  avatarUrl: string | null;
  content: string;
  likesCount: number;
  isApproved: boolean;
  createdAt: string;
}

export interface DbScheduleItem {
  id: number;
  dayOfWeek: number;
  daysOfWeek?: number[] | null;
  title: string;
  host: string;
  hostRole?: string | null;
  hostAccountId?: string | null;
  startTime: string;
  endTime: string;
  isActive?: boolean | null;
  hasReprise?: boolean | null;
  repriseDayOfWeek?: number | null;
  repriseStartTime?: string | null;
  repriseEndTime?: string | null;
  repriseDaysLabel?: string | null;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  genre: string | null;
  daysLabel?: string | null;
  hostBio?: string | null;
  instagramHandle?: string | null;
  whatsappNumber?: string | null;
  highlightsJson?: string | null;
  playlistJson?: string | null;
  photoGalleryJson?: string | null;
  videoGalleryJson?: string | null;
  mixcloudUser?: string | null;
  mixcloudUrl?: string | null;
  createdAt: string;
}

export interface DbStats {
  totalRequests: number;
  totalMessages: number;
  registeredListeners: number;
}

export const api = {
  async getSongRequests(): Promise<DbSongRequest[]> {
    try {
      const res = await fetch('/api/song-requests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}
    return INITIAL_REQUESTS.map((req, idx) => ({
      id: idx + 1,
      userId: null,
      listenerName: req.listenerName,
      listenerCity: req.city || null,
      artist: req.artist,
      songTitle: req.songTitle,
      dedicatedTo: req.dedication || null,
      message: null,
      artworkUrl: req.artworkUrl || null,
      previewUrl: req.previewUrl || null,
      artistBio: req.artistBio || null,
      votes: req.votes,
      status: 'pending',
      createdAt: new Date(req.timestamp).toISOString(),
    }));
  },

  async createSongRequest(
    data: {
      listenerName: string;
      listenerCity?: string;
      artist: string;
      songTitle: string;
      dedicatedTo?: string;
      message?: string;
      artworkUrl?: string;
      previewUrl?: string;
      artistBio?: string;
    },
    token?: string | null
  ): Promise<DbSongRequest> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/song-requests', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao enviar pedido de música');
    }
    return res.json();
  },

  async voteSongRequest(id: number | string): Promise<{ success: boolean; votes?: number }> {
    try {
      const res = await fetch(`/api/song-requests/${id}/vote`, {
        method: 'POST',
      });
      if (!res.ok) return { success: false };
      return res.json();
    } catch {
      return { success: false };
    }
  },

  async getShoutouts(): Promise<DbShoutout[]> {
    try {
      const res = await fetch('/api/shoutouts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}
    return INITIAL_MESSAGES.map((msg, idx) => ({
      id: idx + 1,
      userId: null,
      authorName: msg.author,
      authorCity: msg.city || null,
      avatarUrl: null,
      content: msg.message,
      likesCount: msg.likes,
      isApproved: true,
      createdAt: new Date(msg.timestamp).toISOString(),
    }));
  },

  async createShoutout(
    data: {
      authorName: string;
      authorCity?: string;
      content: string;
    },
    token?: string | null
  ): Promise<DbShoutout> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/shoutouts', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao enviar recado');
    }
    return res.json();
  },

  async likeShoutout(id: number): Promise<DbShoutout> {
    const res = await fetch(`/api/shoutouts/${id}/like`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to like shoutout');
    return res.json();
  },

  async getSchedule(): Promise<DbScheduleItem[]> {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {}
    return OFFICIAL_SCHEDULE_ITEMS.map((item, idx) => ({
      id: idx + 1,
      ...item,
      description: item.description ?? null,
      avatarUrl: item.avatarUrl ?? null,
      genre: item.genre ?? null,
      createdAt: new Date().toISOString(),
    }));
  },

  async createScheduleItem(data: Omit<DbScheduleItem, 'id' | 'createdAt'>): Promise<DbScheduleItem> {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao salvar programa');
    }
    return res.json();
  },

  async updateScheduleItem(id: number, data: Partial<DbScheduleItem>): Promise<DbScheduleItem> {
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar programa');
    }
    return res.json();
  },

  async toggleScheduleActive(id: number, isActive?: boolean): Promise<DbScheduleItem> {
    const res = await fetch(`/api/schedule/${id}/toggle-active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isActive !== undefined ? { isActive } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao alterar status do programa');
    }
    return res.json();
  },

  async deleteScheduleItem(id: number): Promise<void> {
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao remover programa');
  },

  async getStats(): Promise<DbStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Admin APIs
  async adminLogin(username: string, password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciais de administrador inválidas');
    }
    return res.json();
  },

  async adminGetShoutouts(): Promise<DbShoutout[]> {
    const res = await fetch('/api/admin/shoutouts');
    if (!res.ok) throw new Error('Failed to fetch admin shoutouts');
    return res.json();
  },

  async adminApproveShoutout(id: number, isApproved: boolean): Promise<DbShoutout> {
    const res = await fetch(`/api/admin/shoutouts/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved }),
    });
    if (!res.ok) throw new Error('Falha ao alterar moderação do recado');
    return res.json();
  },

  async adminDeleteShoutout(id: number): Promise<void> {
    const res = await fetch(`/api/admin/shoutouts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao excluir recado');
  },

  async adminUpdateSongRequestStatus(id: number, status: string): Promise<DbSongRequest> {
    const res = await fetch(`/api/admin/song-requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status do pedido');
    return res.json();
  },

  async adminDeleteSongRequest(id: number): Promise<void> {
    const res = await fetch(`/api/admin/song-requests/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao excluir pedido musical');
  },

  async getStationConfig(): Promise<any> {
    try {
      const res = await fetch('/api/station-config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) return data;
      }
    } catch {}
    return {
      name: DEFAULT_RADIO_CONFIG.name,
      slogan: DEFAULT_RADIO_CONFIG.slogan,
      streamUrl: DEFAULT_RADIO_CONFIG.streamUrl,
      whatsappNumber: DEFAULT_RADIO_CONFIG.whatsappNumber,
      instagramUrl: DEFAULT_RADIO_CONFIG.instagramHandle,
      email: DEFAULT_RADIO_CONFIG.email,
      location: DEFAULT_RADIO_CONFIG.location,
      frequency: 'Web HD & App',
      logoUrl: null,
      customLogo: null,
      paletteId: 'amber-rock',
      metadataDelaySeconds: DEFAULT_RADIO_CONFIG.metadataDelaySeconds || 10,
      waveStyle: 'multicolor',
    };
  },

  async saveStationConfig(config: Record<string, any>): Promise<boolean> {
    try {
      const res = await fetch('/api/station-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getStationLogo(): Promise<string | null> {
    try {
      const res = await fetch('/api/station-logo');
      if (!res.ok) return null;
      const data = await res.json();
      return data.logo || null;
    } catch {
      return null;
    }
  },

  async saveStationLogo(logo: string | null): Promise<boolean> {
    try {
      const res = await fetch('/api/station-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: logo || '' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getStationLogos(): Promise<any> {
    try {
      const res = await fetch('/api/station-logos');
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  },

  async saveStationLogos(logos: any): Promise<boolean> {
    try {
      const res = await fetch('/api/station-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logos || {}),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getPromoBanners(): Promise<any[]> {
    try {
      const res = await fetch('/api/promo-banners');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    return INITIAL_PROMO_BANNERS;
  },

  async savePromoBanners(banners: any[]): Promise<boolean> {
    try {
      const res = await fetch('/api/promo-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getLiveTakeover(): Promise<any> {
    try {
      const res = await fetch('/api/live-takeover');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async saveLiveTakeover(takeoverData: any): Promise<boolean> {
    try {
      const res = await fetch('/api/live-takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(takeoverData),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getInstitutionalData(): Promise<any | null> {
    try {
      const res = await fetch('/api/institutional');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async saveInstitutionalData(data: any): Promise<boolean> {
    try {
      const res = await fetch('/api/institutional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async clearLiveTakeover(): Promise<boolean> {
    try {
      const res = await fetch('/api/live-takeover', {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Host Accounts (Locutores & Apresentadores)
  async getHostAccounts(): Promise<any[]> {
    try {
      const res = await fetch('/api/host-accounts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    return OFFICIAL_HOSTS.map((h) => ({
      id: h.id,
      name: h.name,
      username: h.username,
      role: h.role,
      bio: h.bio,
      avatarUrl: h.avatarUrl,
      whatsapp: h.whatsapp,
      status: h.status,
    }));
  },

  async registerHost(accountData: any, recaptchaToken?: string): Promise<{ success: boolean; host?: any; error?: string }> {
    try {
      const res = await fetch('/api/host-accounts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...accountData, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao cadastrar locutor' };
      }
      return { success: true, host: data.host };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro de conexão com o servidor' };
    }
  },

    async loginHost(identifier: string, password: string, programId?: string, recaptchaToken?: string): Promise<{ success: boolean; host?: any; error?: string }> {
    try {
      const res = await fetch('/api/host-accounts/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, programId, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Identificador ou senha inválidos' };
      }
      return { success: true, host: data.host };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro de conexão com o servidor' };
    }
  },

    async recoverHostPassword(data: { identifier: string; securityAnswer?: string; newPassword?: string }, recaptchaToken?: string): Promise<{ success: boolean; securityQuestion?: string; message?: string; error?: string; name?: string; username?: string }> {
    try {
      const res = await fetch('/api/host-accounts/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, recaptchaToken }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Erro ao recuperar senha' };
      }
      return { success: true, ...result };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro de conexão com o servidor' };
    }
  },

  async saveHostAccounts(accounts: any[]): Promise<boolean> {
    try {
      const res = await fetch('/api/host-accounts/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getStreamMetadata(streamUrl?: string): Promise<StreamMetadata> {
    try {
      const url = streamUrl ? `/api/stream-metadata?streamUrl=${encodeURIComponent(streamUrl)}` : '/api/stream-metadata';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch stream metadata');
      return await res.json();
    } catch {
      return {
        rawTitle: 'Rebeldia FM - No Ar',
        artist: 'Rebeldia FM',
        song: 'Programação Especial',
        hasLiveMetadata: false,
        listeners: 0,
        bitrate: 128,
        timestamp: Date.now(),
      };
    }
  },
  async getPageSeoList(): Promise<PageSeoData[]> {
    try {
      const res = await fetch('/api/seo');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.error('Error fetching SEO list:', e);
    }
    return [];
  },

  async getPageSeo(path: string): Promise<PageSeoData | null> {
    try {
      const res = await fetch(`/api/seo/entry?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Error fetching SEO entry:', e);
    }
    return null;
  },

  async savePageSeo(seoData: PageSeoData, adminToken?: string): Promise<{ success: boolean; data?: PageSeoData; error?: string }> {
    try {
      const token = adminToken || (typeof localStorage !== 'undefined' ? (localStorage.getItem('rebeldia_admin_token') || 'rebeldia_admin_session') : '');
      const res = await fetch('/api/seo/entry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-admin-token': token,
        },
        body: JSON.stringify(seoData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao salvar SEO' };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao salvar SEO' };
    }
  },
};

export interface PageSeoData {
  id?: number;
  path: string;
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  faviconUrl?: string;
  ogType?: string;
  twitterCard?: string;
  geoRegion?: string;
  geoPlacename?: string;
  geoPosition?: string;
  icbm?: string;
  schemaType?: string;
  jsonLdCustom?: string | null;
  updatedAt?: string;
}

export interface StreamMetadata {
  rawTitle: string;
  artist: string;
  song: string;
  hasLiveMetadata: boolean;
  artworkUrl?: string | null;
  listeners?: number;
  bitrate?: number;
  timestamp?: number;
}

