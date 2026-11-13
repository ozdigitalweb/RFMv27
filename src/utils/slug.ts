export function toSlug(val?: unknown): string {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stripParenthetical(val?: unknown): string {
  return String(val || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getProgramSlug(prog: {
  title?: string | null;
  seedKey?: string | null;
  id?: string | number | null;
}): string {
  return toSlug(prog.title) || toSlug(prog.seedKey) || String(prog.id || '').toLowerCase();
}

export function getProgramLogoSrc(prog?: {
  logoUrl?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
} | null): string {
  const candidate = prog?.logoUrl || prog?.avatarUrl || prog?.bannerUrl || '/reb_mascot.jpg';
  const trimmed = String(candidate || '').trim();
  return trimmed.length > 0 ? trimmed : '/reb_mascot.jpg';
}

export function findProgramBySlug<
  T extends { id?: string | number | null; title?: string | null; seedKey?: string | null }
>(programs: T[], rawSlug: string): T | undefined {
  if (!Array.isArray(programs) || programs.length === 0) return undefined;
  let decoded = rawSlug || '';
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep raw string if malformed URI component
  }
  const slug = decoded.trim().toLowerCase();
  const normalizedSlug = toSlug(slug);
  if (!slug && !normalizedSlug) return undefined;

  // 1. Exact title, seedKey, or id match
  const exactMatch = programs.find(
    (p) =>
      toSlug(p.title) === slug ||
      toSlug(p.title) === normalizedSlug ||
      (p.seedKey && (toSlug(p.seedKey) === slug || toSlug(p.seedKey) === normalizedSlug)) ||
      String(p.id ?? '').toLowerCase() === slug
  );
  if (exactMatch) return exactMatch;

  // 2. Match title without parenthetical suffix (e.g. "Surf & Ação (S & A)" -> "surf-acao")
  const noParensMatch = programs.find((p) => {
    const baseTitleSlug = toSlug(stripParenthetical(p.title));
    return Boolean(baseTitleSlug) && baseTitleSlug === normalizedSlug;
  });
  if (noParensMatch) return noParensMatch;

  // 3. Match seedKey without "prog-" prefix or connecting "-e-"
  const compactTarget = normalizedSlug.replace(/-e-/g, '-');
  return programs.find((p) => {
    if (!p.seedKey) return false;
    const seedSlug = toSlug(String(p.seedKey).replace(/^prog-/i, ''));
    if (seedSlug === normalizedSlug) return true;
    return seedSlug.replace(/-e-/g, '-') === compactTarget;
  });
}
