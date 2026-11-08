export interface ColorPalette {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  tag: string;
  mode: 'dark' | 'light';
  baseThemeId?: string;
  isDefault?: boolean;
  colors: string[]; // Cores em formato hex
  colorNames: string[];
  previewGradient: string;
  cssVariables: Record<string, string>;
}

export const COLOR_PALETTES: ColorPalette[] = [
  // ==================== PALETAS ESCURAS (DARK MODE) ====================
  {
    id: 'default-rock',
    name: 'Rock Rebeldia (Escuro)',
    subtitle: 'Identidade Clássica do Estúdio',
    description: 'Paleta padrão da rádio com base escura profunda, detalhes em âmbar dourado e acentos em carmesim de transmissão ao vivo.',
    tag: '🌙 Escuro / Padrão',
    mode: 'dark',
    baseThemeId: 'default-rock',
    isDefault: true,
    colors: ['#09090B', '#18181B', '#F59E0B', '#EF4444', '#FFFFFF'],
    colorNames: ['Deep Obsidian', 'Zinc Studio', 'Âmbar Dourado', 'Vermelho Rock', 'Branco Puro'],
    previewGradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #09090B 100%)',
    cssVariables: {
      '--color-primary': '#F59E0B',
      '--color-primary-rgb': '245, 158, 11',
      '--color-primary-hover': '#D97706',
      '--color-secondary': '#EF4444',
      '--color-secondary-rgb': '239, 68, 68',
      '--color-accent': '#F97316',
      '--color-accent-rgb': '249, 115, 22',
      '--color-bg-base': '#09090B',
      '--color-bg-surface': 'rgba(18, 18, 22, 0.85)',
      '--color-bg-surface-hover': 'rgba(28, 28, 34, 0.95)',
      '--color-bg-card': '#121216',
      '--color-border': 'rgba(255, 255, 255, 0.12)',
      '--color-border-active': 'rgba(245, 158, 11, 0.6)',
      '--color-text-main': '#F4F4F5',
      '--color-text-muted': '#A1A1AA',
      '--color-badge-bg': 'rgba(245, 158, 11, 0.15)',
      '--color-badge-text': '#FCD34D',
      '--color-glow': 'rgba(245, 158, 11, 0.35)',
      '--theme-highlight': '#F59E0B',
      '--theme-highlight-text': '#000000',
    },
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet & Forest (Escuro)',
    subtitle: 'Paleta Anexo 1 - Violeta, Ameixa & Floresta',
    description: 'Tons misteriosos e refinados: Violeta Real (#6B256F), Ameixa Escura (#35122E), Azul Céu (#93B4DB), Pistache (#D0E4AE) e Verde Floresta (#194B32).',
    tag: '🌙 Escuro / Anexo 1',
    mode: 'dark',
    baseThemeId: 'cyber-violet',
    colors: ['#6B256F', '#35122E', '#93B4DB', '#D0E4AE', '#194B32'],
    colorNames: ['#6B256F Roxo Violeta', '#35122E Ameixa Escura', '#93B4DB Azul Céu', '#D0E4AE Verde Pistache', '#194B32 Verde Floresta'],
    previewGradient: 'linear-gradient(135deg, #6B256F 0%, #93B4DB 45%, #D0E4AE 75%, #194B32 100%)',
    cssVariables: {
      '--color-primary': '#93B4DB',
      '--color-primary-rgb': '147, 180, 219',
      '--color-primary-hover': '#7FA4D4',
      '--color-secondary': '#D0E4AE',
      '--color-secondary-rgb': '208, 228, 174',
      '--color-accent': '#6B256F',
      '--color-accent-rgb': '107, 37, 111',
      '--color-bg-base': '#130916',
      '--color-bg-surface': 'rgba(38, 18, 42, 0.85)',
      '--color-bg-surface-hover': 'rgba(53, 18, 46, 0.95)',
      '--color-bg-card': '#200e24',
      '--color-border': 'rgba(208, 228, 174, 0.18)',
      '--color-border-active': 'rgba(147, 180, 219, 0.65)',
      '--color-text-main': '#F2F5FB',
      '--color-text-muted': '#B8A8C0',
      '--color-badge-bg': 'rgba(147, 180, 219, 0.18)',
      '--color-badge-text': '#D0E4AE',
      '--color-glow': 'rgba(147, 180, 219, 0.4)',
      '--theme-highlight': '#D0E4AE',
      '--theme-highlight-text': '#194B32',
    },
  },
  {
    id: 'sunset-vintage',
    name: 'Sunset Vintage & Terracotta (Escuro)',
    subtitle: 'Paleta Anexo 2 - Vintage Rock & Tons Terrosos',
    description: 'Tons quentes e nostálgicos: Oliva (#636500), Ocre Dourado (#B29B27), Amarelo Ouro (#FFB400), Laranja Coral (#FF6333) e Terracota (#BE1E1C).',
    tag: '🌙 Escuro / Anexo 2',
    mode: 'dark',
    baseThemeId: 'sunset-vintage',
    colors: ['#636500', '#B29B27', '#FFB400', '#FF6333', '#BE1E1C'],
    colorNames: ['#636500 Verde Oliva', '#B29B27 Ocre Dourado', '#FFB400 Amarelo Ouro', '#FF6333 Laranja Coral', '#BE1E1C Vermelho Tijolo'],
    previewGradient: 'linear-gradient(135deg, #636500 0%, #B29B27 25%, #FFB400 50%, #FF6333 75%, #BE1E1C 100%)',
    cssVariables: {
      '--color-primary': '#FFB400',
      '--color-primary-rgb': '255, 180, 0',
      '--color-primary-hover': '#E6A200',
      '--color-secondary': '#FF6333',
      '--color-secondary-rgb': '255, 99, 51',
      '--color-accent': '#BE1E1C',
      '--color-accent-rgb': '190, 30, 28',
      '--color-bg-base': '#130E09',
      '--color-bg-surface': 'rgba(36, 26, 17, 0.88)',
      '--color-bg-surface-hover': 'rgba(51, 37, 23, 0.95)',
      '--color-bg-card': '#21170e',
      '--color-border': 'rgba(255, 180, 0, 0.18)',
      '--color-border-active': 'rgba(255, 99, 51, 0.65)',
      '--color-text-main': '#FFF7ED',
      '--color-text-muted': '#CDB59E',
      '--color-badge-bg': 'rgba(255, 180, 0, 0.18)',
      '--color-badge-text': '#FFD166',
      '--color-glow': 'rgba(255, 99, 51, 0.42)',
      '--theme-highlight': '#FFB400',
      '--theme-highlight-text': '#130E09',
    },
  },
  {
    id: 'pop-cmyk',
    name: 'CMYK Studio & Vibrant Pop (Escuro)',
    subtitle: 'Paleta Anexo 3 - Magenta, Azul Real & Esmeralda',
    description: 'Cores gráficas de alto impacto: Amarelo Solar (#FFB800), Magenta Neon (#E62B6E), Azul Real (#1C75BC), Verde Esmeralda (#268E6C) e Branco (#FFFFFF).',
    tag: '🌙 Escuro / Anexo 3',
    mode: 'dark',
    baseThemeId: 'pop-cmyk',
    colors: ['#FFB800', '#E62B6E', '#1C75BC', '#268E6C', '#FFFFFF'],
    colorNames: ['#FFB800 Amarelo Pop', '#E62B6E Magenta Neon', '#1C75BC Azul Real', '#268E6C Verde Esmeralda', '#FFFFFF Branco Puro'],
    previewGradient: 'linear-gradient(135deg, #FFB800 0%, #E62B6E 33%, #1C75BC 66%, #268E6C 100%)',
    cssVariables: {
      '--color-primary': '#E62B6E',
      '--color-primary-rgb': '230, 43, 110',
      '--color-primary-hover': '#D0195C',
      '--color-secondary': '#1C75BC',
      '--color-secondary-rgb': '28, 117, 188',
      '--color-accent': '#FFB800',
      '--color-accent-rgb': '255, 184, 0',
      '--color-bg-base': '#090D15',
      '--color-bg-surface': 'rgba(17, 26, 40, 0.88)',
      '--color-bg-surface-hover': 'rgba(24, 38, 58, 0.95)',
      '--color-bg-card': '#101927',
      '--color-border': 'rgba(230, 43, 110, 0.22)',
      '--color-border-active': 'rgba(28, 117, 188, 0.65)',
      '--color-text-main': '#FFFFFF',
      '--color-text-muted': '#9FB2C8',
      '--color-badge-bg': 'rgba(230, 43, 110, 0.18)',
      '--color-badge-text': '#FFAED1',
      '--color-glow': 'rgba(230, 43, 110, 0.45)',
      '--theme-highlight': '#E62B6E',
      '--theme-highlight-text': '#FFFFFF',
    },
  },
  {
    id: 'neon-tecnoblog',
    name: 'Neon Sunset & Electric Wave (Escuro)',
    subtitle: 'Paleta Anexo 4 - Rosa Orquídea, Azul & Âmbar',
    description: 'Gradiente dinâmico e elétrico: Rosa Orquídea (#C850A0), Azul Elétrico (#3B82F6), Âmbar Radiante (#F59E0B), Rubro (#E11D48) e Índigo (#3B49DF).',
    tag: '🌙 Escuro / Anexo 4',
    mode: 'dark',
    baseThemeId: 'neon-tecnoblog',
    colors: ['#C850A0', '#3B82F6', '#F59E0B', '#E11D48', '#F97316', '#3B49DF'],
    colorNames: ['#C850A0 Rosa Orquídea', '#3B82F6 Azul Elétrico', '#F59E0B Âmbar Rádio', '#E11D48 Rubro Carmim', '#F97316 Laranja Solar', '#3B49DF Azul Índigo'],
    previewGradient: 'linear-gradient(135deg, #C850A0 0%, #3B82F6 25%, #F59E0B 50%, #E11D48 75%, #3B49DF 100%)',
    cssVariables: {
      '--color-primary': '#3B82F6',
      '--color-primary-rgb': '59, 130, 246',
      '--color-primary-hover': '#2563EB',
      '--color-secondary': '#C850A0',
      '--color-secondary-rgb': '200, 80, 160',
      '--color-accent': '#F97316',
      '--color-accent-rgb': '249, 115, 22',
      '--color-bg-base': '#0A0D1A',
      '--color-bg-surface': 'rgba(19, 25, 50, 0.88)',
      '--color-bg-surface-hover': 'rgba(28, 36, 71, 0.95)',
      '--color-bg-card': '#121730',
      '--color-border': 'rgba(59, 130, 246, 0.22)',
      '--color-border-active': 'rgba(200, 80, 160, 0.65)',
      '--color-text-main': '#F8FAFC',
      '--color-text-muted': '#94A3B8',
      '--color-badge-bg': 'rgba(59, 130, 246, 0.18)',
      '--color-badge-text': '#93C5FD',
      '--color-glow': 'rgba(59, 130, 246, 0.45)',
      '--theme-highlight': '#C850A0',
      '--theme-highlight-text': '#FFFFFF',
    },
  },

  // ==================== PALETAS CLARAS (LIGHT MODE) ====================
  {
    id: 'default-rock-light',
    name: 'Rock Rebeldia (Claro)',
    subtitle: 'Estúdio Clean & Âmbar Dourado',
    description: 'Versão clara da identidade clássica: base clean off-white (#F8FAFC), acentos nobres em âmbar dourado (#D97706), carmesim (#DC2626) e tipografia em ardósia escura.',
    tag: '☀️ Claro / Clean',
    mode: 'light',
    baseThemeId: 'default-rock',
    colors: ['#F8FAFC', '#E2E8F0', '#D97706', '#DC2626', '#0F172A'],
    colorNames: ['Off-White Estúdio', 'Borda Slate', 'Âmbar Dourado', 'Vermelho Rock', 'Ardósia Escura'],
    previewGradient: 'linear-gradient(135deg, #FFFFFF 0%, #D97706 45%, #DC2626 80%, #0F172A 100%)',
    cssVariables: {
      '--color-primary': '#D97706',
      '--color-primary-rgb': '217, 119, 6',
      '--color-primary-hover': '#B45309',
      '--color-secondary': '#DC2626',
      '--color-secondary-rgb': '220, 38, 38',
      '--color-accent': '#EA580C',
      '--color-accent-rgb': '234, 88, 12',
      '--color-bg-base': '#CBD5E1',
      '--color-bg-surface': 'rgba(241, 245, 249, 0.95)',
      '--color-bg-surface-hover': 'rgba(226, 232, 240, 0.98)',
      '--color-bg-card': '#E2E8F0',
      '--color-border': 'rgba(15, 23, 42, 0.18)',
      '--color-border-active': 'rgba(217, 119, 6, 0.7)',
      '--color-text-main': '#0F172A',
      '--color-text-muted': '#334155',
      '--color-badge-bg': 'rgba(217, 119, 6, 0.18)',
      '--color-badge-text': '#92400E',
      '--color-glow': 'rgba(217, 119, 6, 0.25)',
      '--theme-highlight': '#D97706',
      '--theme-highlight-text': '#FFFFFF',
    },
  },
  {
    id: 'cyber-violet-light',
    name: 'Cyber Violet & Forest (Claro)',
    subtitle: 'Paleta Anexo 1 - Lavanda & Floresta',
    description: 'Visual límpido com tons do anexo 1: base lavanda cristalina (#FAF5FF), contraste em violeta nobre (#6B256F), verde floresta (#194B32) e azul celeste (#3B82F6).',
    tag: '☀️ Claro / Anexo 1',
    mode: 'light',
    baseThemeId: 'cyber-violet',
    colors: ['#FAF5FF', '#F3E8FF', '#6B256F', '#194B32', '#3B82F6'],
    colorNames: ['Lavanda Cristal', 'Nuvem Violeta', 'Violeta Real', 'Verde Floresta', 'Azul Celeste'],
    previewGradient: 'linear-gradient(135deg, #FAF5FF 0%, #6B256F 45%, #194B32 100%)',
    cssVariables: {
      '--color-primary': '#6B256F',
      '--color-primary-rgb': '107, 37, 111',
      '--color-primary-hover': '#521955',
      '--color-secondary': '#194B32',
      '--color-secondary-rgb': '25, 75, 50',
      '--color-accent': '#3B82F6',
      '--color-accent-rgb': '59, 130, 246',
      '--color-bg-base': '#DDD6FE',
      '--color-bg-surface': 'rgba(243, 232, 255, 0.96)',
      '--color-bg-surface-hover': 'rgba(233, 213, 255, 0.95)',
      '--color-bg-card': '#EDE9FE',
      '--color-border': 'rgba(107, 37, 111, 0.22)',
      '--color-border-active': 'rgba(107, 37, 111, 0.7)',
      '--color-text-main': '#1E1022',
      '--color-text-muted': '#581C87',
      '--color-badge-bg': 'rgba(107, 37, 111, 0.18)',
      '--color-badge-text': '#581C87',
      '--color-glow': 'rgba(107, 37, 111, 0.25)',
      '--theme-highlight': '#6B256F',
      '--theme-highlight-text': '#FFFFFF',
    },
  },
  {
    id: 'sunset-vintage-light',
    name: 'Sunset Vintage & Terracotta (Claro)',
    subtitle: 'Paleta Anexo 2 - Creme & Terracota',
    description: 'Visual acolhedor e nostálgico do anexo 2: base creme suave (#EADCB7), ocre dourado (#B29B27), terracota marcante (#BE1E1C) e oliva (#636500).',
    tag: '☀️ Claro / Anexo 2',
    mode: 'light',
    baseThemeId: 'sunset-vintage',
    colors: ['#EADCB7', '#E4D5AD', '#B29B27', '#BE1E1C', '#636500'],
    colorNames: ['Creme Suave', 'Areia Vintage', 'Ocre Dourado', 'Terracota', 'Verde Oliva'],
    previewGradient: 'linear-gradient(135deg, #EADCB7 0%, #B29B27 40%, #BE1E1C 100%)',
    cssVariables: {
      '--color-primary': '#B29B27',
      '--color-primary-rgb': '178, 155, 39',
      '--color-primary-hover': '#95811A',
      '--color-secondary': '#BE1E1C',
      '--color-secondary-rgb': '190, 30, 28',
      '--color-accent': '#FF6333',
      '--color-accent-rgb': '255, 99, 51',
      '--color-bg-base': '#E2D4AF',
      '--color-bg-surface': 'rgba(247, 239, 219, 0.96)',
      '--color-bg-surface-hover': 'rgba(238, 226, 196, 0.95)',
      '--color-bg-card': '#EDE3C8',
      '--color-border': 'rgba(120, 53, 15, 0.22)',
      '--color-border-active': 'rgba(190, 30, 28, 0.7)',
      '--color-text-main': '#291B0E',
      '--color-text-muted': '#573D26',
      '--color-badge-bg': 'rgba(178, 155, 39, 0.2)',
      '--color-badge-text': '#7B670A',
      '--color-glow': 'rgba(190, 30, 28, 0.25)',
      '--theme-highlight': '#BE1E1C',
      '--theme-highlight-text': '#FFFFFF',
    },
  },
  {
    id: 'pop-cmyk-light',
    name: 'CMYK Studio & Vibrant Pop (Claro)',
    subtitle: 'Paleta Anexo 3 - Branco Puro & Magenta',
    description: 'Estética pop com tons do anexo 3: base suave (#CBD5E1), magenta neon (#E62B6E), azul real (#1C75BC) e verde esmeralda (#268E6C).',
    tag: '☀️ Claro / Anexo 3',
    mode: 'light',
    baseThemeId: 'pop-cmyk',
    colors: ['#CBD5E1', '#E2E8F0', '#E62B6E', '#1C75BC', '#268E6C'],
    colorNames: ['Cinza Suave', 'Slate', 'Magenta Neon', 'Azul Real', 'Verde Esmeralda'],
    previewGradient: 'linear-gradient(135deg, #CBD5E1 0%, #E62B6E 40%, #1C75BC 80%, #268E6C 100%)',
    cssVariables: {
      '--color-primary': '#E62B6E',
      '--color-primary-rgb': '230, 43, 110',
      '--color-primary-hover': '#D0195C',
      '--color-secondary': '#1C75BC',
      '--color-secondary-rgb': '28, 117, 188',
      '--color-accent': '#FFB800',
      '--color-accent-rgb': '255, 184, 0',
      '--color-bg-base': '#CBD5E1',
      '--color-bg-surface': 'rgba(241, 245, 249, 0.96)',
      '--color-bg-surface-hover': 'rgba(226, 232, 240, 0.98)',
      '--color-bg-card': '#E2E8F0',
      '--color-border': 'rgba(28, 117, 188, 0.22)',
      '--color-border-active': 'rgba(230, 43, 110, 0.7)',
      '--color-text-main': '#0F172A',
      '--color-text-muted': '#334155',
      '--color-badge-bg': 'rgba(230, 43, 110, 0.18)',
      '--color-badge-text': '#BE123C',
      '--color-glow': 'rgba(230, 43, 110, 0.25)',
      '--theme-highlight': '#E62B6E',
      '--theme-highlight-text': '#FFFFFF',
    },
  },
  {
    id: 'neon-tecnoblog-light',
    name: 'Neon Sunset & Electric Wave (Claro)',
    subtitle: 'Paleta Anexo 4 - Azul Elétrico & Orquídea',
    description: 'Visual moderno e solar: base suave (#BFDBFE), azul elétrico (#2563EB), rosa orquídea (#C850A0), âmbar solar (#D97706) e alto contraste.',
    tag: '☀️ Claro / Anexo 4',
    mode: 'light',
    baseThemeId: 'neon-tecnoblog',
    colors: ['#BFDBFE', '#DBEAFE', '#2563EB', '#C850A0', '#D97706'],
    colorNames: ['Azul Suave', 'Azul Névoa', 'Azul Elétrico', 'Rosa Orquídea', 'Âmbar Solar'],
    previewGradient: 'linear-gradient(135deg, #BFDBFE 0%, #2563EB 40%, #C850A0 75%, #D97706 100%)',
    cssVariables: {
      '--color-primary': '#2563EB',
      '--color-primary-rgb': '37, 99, 235',
      '--color-primary-hover': '#1D4ED8',
      '--color-secondary': '#C850A0',
      '--color-secondary-rgb': '200, 80, 160',
      '--color-accent': '#D97706',
      '--color-accent-rgb': '217, 119, 6',
      '--color-bg-base': '#BFDBFE',
      '--color-bg-surface': 'rgba(239, 246, 255, 0.96)',
      '--color-bg-surface-hover': 'rgba(219, 234, 254, 0.98)',
      '--color-bg-card': '#DBEAFE',
      '--color-border': 'rgba(37, 99, 235, 0.22)',
      '--color-border-active': 'rgba(200, 80, 160, 0.7)',
      '--color-text-main': '#0F172A',
      '--color-text-muted': '#1E3A8A',
      '--color-badge-bg': 'rgba(37, 99, 235, 0.18)',
      '--color-badge-text': '#1D4ED8',
      '--color-glow': 'rgba(37, 99, 235, 0.25)',
      '--theme-highlight': '#2563EB',
      '--theme-highlight-text': '#FFFFFF',
    },
  },
];

export const STORAGE_KEY_PALETTE = 'rebeldia_color_theme';

export function getSavedPaletteId(): string {
  if (typeof window === 'undefined') return 'default-rock';
  return localStorage.getItem(STORAGE_KEY_PALETTE) || 'default-rock';
}

export function getPaletteById(id: string): ColorPalette {
  return COLOR_PALETTES.find((p) => p.id === id) || COLOR_PALETTES[0];
}

export function getPalettesByMode(mode: 'dark' | 'light'): ColorPalette[] {
  return COLOR_PALETTES.filter((p) => p.mode === mode);
}

/**
 * Alterna rapidamente uma paleta entre versão Clara e Escura
 */
export function togglePaletteMode(currentId: string, targetMode: 'dark' | 'light'): string {
  const current = getPaletteById(currentId);
  if (current.mode === targetMode) return currentId;

  // Procura a versão correspondente pelo baseThemeId
  const target = COLOR_PALETTES.find(
    (p) => p.baseThemeId === current.baseThemeId && p.mode === targetMode
  );

  if (target) return target.id;

  // Fallback para o padrão do modo alvo
  return targetMode === 'light' ? 'default-rock-light' : 'default-rock';
}

export function applyTheme(paletteId: string): ColorPalette {
  const palette = getPaletteById(paletteId);
  if (typeof document === 'undefined') return palette;

  const root = document.documentElement;
  
  // Set data-theme and data-theme-mode attributes
  root.setAttribute('data-theme', palette.id);
  root.setAttribute('data-theme-mode', palette.mode);

  // Sync Tailwind .dark and .light classes on <html>
  if (palette.mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Update mobile status bar theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor && palette.cssVariables['--color-bg-base']) {
    metaThemeColor.setAttribute('content', palette.cssVariables['--color-bg-base']);
  }

  // Apply all CSS variables to :root
  Object.entries(palette.cssVariables).forEach(([varName, value]) => {
    root.style.setProperty(varName, value);
  });

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY_PALETTE, palette.id);
  } catch (e) {
    console.error('Error saving palette to localStorage:', e);
  }

  return palette;
}

