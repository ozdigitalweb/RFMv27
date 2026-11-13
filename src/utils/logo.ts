// Utility to manage custom station logos across the entire app with server & database persistence
import { StationLogosConfig } from '../types';

const LOGO_STORAGE_KEY = 'rebeldia_custom_logo';
const MULTI_LOGOS_STORAGE_KEY = 'rebeldia_station_logos';

let inMemoryLogo: string | null = null;
let inMemoryLogos: StationLogosConfig | null = null;
let hasSyncedWithServer = false;

export const DEFAULT_STATION_LOGOS: StationLogosConfig = {
  headerLogo: '/reb_mascot.jpg',
  headerComplementText: 'Florianópolis / SC • 87.9 MHz',
  playerCenterLogo: '/reb_mascot.jpg',
  footerLogo: '/reb_mascot.jpg',
  windowsTaskbarIcon: '/reb_mascot.jpg',
  faviconIcon: '/reb_mascot.jpg',
};

export function getStationLogos(): StationLogosConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_STATION_LOGOS };
  if (inMemoryLogos !== null) return inMemoryLogos;

  try {
    const saved = localStorage.getItem(MULTI_LOGOS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      inMemoryLogos = {
        headerLogo: parsed.headerLogo || localStorage.getItem(LOGO_STORAGE_KEY) || DEFAULT_STATION_LOGOS.headerLogo,
        headerComplementText: parsed.headerComplementText ?? DEFAULT_STATION_LOGOS.headerComplementText,
        playerCenterLogo: parsed.playerCenterLogo || DEFAULT_STATION_LOGOS.playerCenterLogo,
        footerLogo: parsed.footerLogo || DEFAULT_STATION_LOGOS.footerLogo,
        windowsTaskbarIcon: parsed.windowsTaskbarIcon || DEFAULT_STATION_LOGOS.windowsTaskbarIcon,
        faviconIcon: parsed.faviconIcon || DEFAULT_STATION_LOGOS.faviconIcon,
      };
      return inMemoryLogos;
    }
  } catch (e) {
    console.error('Error reading station logos from storage:', e);
  }

  // Fallback to legacy single logo if present
  const legacyLogo = localStorage.getItem(LOGO_STORAGE_KEY);
  inMemoryLogos = {
    ...DEFAULT_STATION_LOGOS,
    headerLogo: legacyLogo || DEFAULT_STATION_LOGOS.headerLogo,
  };

  if (!hasSyncedWithServer) {
    fetchAndSyncServerLogos();
  }

  return inMemoryLogos;
}

export function applyDynamicFavicon(faviconUrl?: string | null): void {
  if (typeof document === 'undefined') return;
  const rawUrl = (faviconUrl && faviconUrl.trim().length > 0) ? faviconUrl.trim() : '/reb_mascot.jpg';
  const isRelativePath = rawUrl.startsWith('/');
  const url = isRelativePath
    ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
    : rawUrl;

  let linkIcon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!linkIcon) {
    linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    document.head.appendChild(linkIcon);
  }
  linkIcon.removeAttribute('type');
  linkIcon.href = url;

  let linkShortcut = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
  if (!linkShortcut) {
    linkShortcut = document.createElement('link');
    linkShortcut.rel = 'shortcut icon';
    document.head.appendChild(linkShortcut);
  }
  linkShortcut.href = url;

  let linkApple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!linkApple) {
    linkApple = document.createElement('link');
    linkApple.rel = 'apple-touch-icon';
    document.head.appendChild(linkApple);
  }
  linkApple.href = url;
}

export function applyDynamicWindowsTile(iconUrl?: string | null): void {
  if (typeof document === 'undefined') return;
  const url = (iconUrl && iconUrl.trim().length > 0) ? iconUrl.trim() : '/reb_mascot.jpg';
  
  let tileMeta = document.querySelector<HTMLMetaElement>("meta[name='msapplication-TileImage']");
  if (!tileMeta) {
    tileMeta = document.createElement('meta');
    tileMeta.name = 'msapplication-TileImage';
    document.head.appendChild(tileMeta);
  }
  tileMeta.content = url;
}

export async function fetchAndSyncServerLogos(): Promise<StationLogosConfig | null> {
  if (typeof window === 'undefined') return null;
  hasSyncedWithServer = true;
  try {
    const res = await fetch('/api/station-logos');
    if (res.ok) {
      const serverLogos: StationLogosConfig = await res.json();
      const current = getStationLogos();
      const merged: StationLogosConfig = {
        ...current,
        ...serverLogos,
      };

      inMemoryLogos = merged;
      localStorage.setItem(MULTI_LOGOS_STORAGE_KEY, JSON.stringify(merged));

      if (merged.headerLogo) {
        localStorage.setItem(LOGO_STORAGE_KEY, merged.headerLogo);
      }

      // Apply dynamic DOM elements (only mascot outside /programas/:slug; program hotsite manages its own logo favicon)
      const isOnProgramSlug =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/programas/') &&
        window.location.pathname.replace(/\/+$/, '') !== '/programas';
      if (!isOnProgramSlug) {
        applyDynamicFavicon('/reb_mascot.jpg');
      }
      if (merged.windowsTaskbarIcon) applyDynamicWindowsTile(merged.windowsTaskbarIcon);

      window.dispatchEvent(
        new CustomEvent('rebeldia_logos_updated', {
          detail: merged,
        })
      );
      window.dispatchEvent(
        new CustomEvent('rebeldia_logo_updated', {
          detail: merged.headerLogo,
        })
      );

      return merged;
    }
  } catch (e) {
    console.warn('Could not sync logos with server:', e);
  }
  return null;
}

export function saveStationLogos(updated: Partial<StationLogosConfig>): void {
  if (typeof window === 'undefined') return;

  const current = getStationLogos();
  const merged: StationLogosConfig = {
    ...current,
    ...updated,
  };

  inMemoryLogos = merged;

  try {
    localStorage.setItem(MULTI_LOGOS_STORAGE_KEY, JSON.stringify(merged));
    if (merged.headerLogo) {
      localStorage.setItem(LOGO_STORAGE_KEY, merged.headerLogo);
    }
  } catch (e) {
    console.error('Error saving logos to localStorage:', e);
  }

  // Apply immediately to HTML DOM head (preserve program logo favicon when on /programas/:slug)
  const isOnProgramSlug =
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/programas/') &&
    window.location.pathname.replace(/\/+$/, '') !== '/programas';
  if (!isOnProgramSlug) {
    applyDynamicFavicon('/reb_mascot.jpg');
  }
  if (merged.windowsTaskbarIcon) applyDynamicWindowsTile(merged.windowsTaskbarIcon);

  // Broadcast updates
  window.dispatchEvent(
    new CustomEvent('rebeldia_logos_updated', {
      detail: merged,
    })
  );
  window.dispatchEvent(
    new CustomEvent('rebeldia_logo_updated', {
      detail: merged.headerLogo,
    })
  );

  // Persist to server
  fetch('/api/station-logos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(merged),
  }).catch((err) => {
    console.error('Failed to persist station logos to server:', err);
  });
}

// Backwards compatibility wrappers
export function getCustomLogo(): string {
  const logos = getStationLogos();
  return logos.headerLogo || '/reb_mascot.jpg';
}

export function saveCustomLogo(logoUrlOrData: string | null): void {
  saveStationLogos({ headerLogo: logoUrlOrData });
}

export async function fetchAndSyncServerLogo(): Promise<string | null> {
  const logos = await fetchAndSyncServerLogos();
  return logos?.headerLogo || null;
}
