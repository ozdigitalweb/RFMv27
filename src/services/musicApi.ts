export interface MusicTrackResult {
  id: number | string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  artworkLargeUrl?: string;
  previewUrl?: string;
  year?: string;
  genre?: string;
  artistBio?: string;
}

let activeController: AbortController | null = null;
const bioCache = new Map<string, string>();

export async function getArtistReleaseBio(artistName: string): Promise<string> {
  const cleanName = artistName.trim();
  if (!cleanName || cleanName.length < 2) return '';
  
  if (bioCache.has(cleanName.toLowerCase())) {
    return bioCache.get(cleanName.toLowerCase()) || '';
  }

  try {
    const formatted = encodeURIComponent(cleanName.replace(/\s+/g, '_'));
    const res = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${formatted}`);
    if (res.ok) {
      const data = await res.json();
      if (data.extract && typeof data.extract === 'string') {
        const shortBio = data.extract.split('\n')[0].slice(0, 260) + (data.extract.length > 260 ? '...' : '');
        bioCache.set(cleanName.toLowerCase(), shortBio);
        return shortBio;
      }
    }

    // Try en.wikipedia fallback if pt summary is not found
    const resEn = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`);
    if (resEn.ok) {
      const dataEn = await resEn.json();
      if (dataEn.extract && typeof dataEn.extract === 'string') {
        const shortBio = dataEn.extract.split('\n')[0].slice(0, 260) + (dataEn.extract.length > 260 ? '...' : '');
        bioCache.set(cleanName.toLowerCase(), shortBio);
        return shortBio;
      }
    }
  } catch (err) {
    // silently fail back to empty
  }

  return '';
}

export async function searchMusicDatabase(query: string): Promise<MusicTrackResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // Cancel previous pending search
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();
  const signal = activeController.signal;

  try {
    // Primary search targeting international and regional catalog
    const encoded = encodeURIComponent(trimmed);
    const url = `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=12&media=music`;

    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Music API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    const tracks: MusicTrackResult[] = data.results.map((item: any) => ({
      id: item.trackId || item.collectionId || Math.random(),
      title: item.trackName || item.collectionName || 'Faixa Desconhecida',
      artist: item.artistName || 'Artista Desconhecido',
      album: item.collectionName,
      artworkUrl: item.artworkUrl60 || item.artworkUrl100,
      artworkLargeUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : undefined,
      previewUrl: item.previewUrl,
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : undefined,
      genre: item.primaryGenreName,
    }));

    return tracks;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.warn('Music API search error, attempting fallback:', error);
    return [];
  }
}
