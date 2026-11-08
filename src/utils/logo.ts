// Utility to manage custom station logo across the entire app with server & database persistence
const LOGO_STORAGE_KEY = 'rebeldia_custom_logo';

let inMemoryLogo: string | null = null;
let hasSyncedWithServer = false;

export function getCustomLogo(): string {
  if (typeof window === 'undefined') return '/reb_mascot.jpg';
  if (inMemoryLogo !== null) return inMemoryLogo;
  try {
    const saved = localStorage.getItem(LOGO_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      inMemoryLogo = saved.trim();
      return inMemoryLogo;
    }
  } catch (e) {
    console.error('Error reading custom logo from storage:', e);
  }

  // Trigger background sync if not done yet
  if (!hasSyncedWithServer) {
    fetchAndSyncServerLogo();
  }

  return '/reb_mascot.jpg';
}

export async function fetchAndSyncServerLogo(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  hasSyncedWithServer = true;
  try {
    const res = await fetch('/api/station-logo');
    if (res.ok) {
      const data = await res.json();
      const serverLogo = data.logo && data.logo.trim().length > 0 ? data.logo.trim() : null;
      
      const localLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      
      // If server has a logo that differs from local storage, update local storage and notify
      if (serverLogo !== localLogo) {
        if (serverLogo) {
          localStorage.setItem(LOGO_STORAGE_KEY, serverLogo);
        } else {
          localStorage.removeItem(LOGO_STORAGE_KEY);
        }
        inMemoryLogo = serverLogo;
        window.dispatchEvent(
          new CustomEvent('rebeldia_logo_updated', {
            detail: serverLogo,
          })
        );
      }
      return serverLogo;
    }
  } catch (e) {
    console.warn('Could not sync logo with server:', e);
  }
  return null;
}

export function saveCustomLogo(logoUrlOrData: string | null): void {
  if (typeof window === 'undefined') return;
  const normalized = logoUrlOrData && logoUrlOrData.trim().length > 0 ? logoUrlOrData.trim() : null;
  inMemoryLogo = normalized;

  try {
    if (normalized) {
      localStorage.setItem(LOGO_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving custom logo to localStorage:', e);
  }

  // Broadcast custom event so all mounted components update immediately
  window.dispatchEvent(
    new CustomEvent('rebeldia_logo_updated', {
      detail: normalized,
    })
  );

  // Persist asynchronously to Cloud SQL backend so any new browser/device loads it
  fetch('/api/station-logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logo: normalized || '' }),
  }).catch((err) => {
    console.error('Failed to persist logo to server:', err);
  });
}
