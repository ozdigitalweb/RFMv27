export interface ProgramHighlight {
  title: string;
  description: string;
}

export interface ProgramTrack {
  title: string;
  artist: string;
  year?: string;
}

export interface ProgramVideoItem {
  id?: string;
  title?: string;
  url: string;
}

export interface ProgramItem {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday, or -1 for every day
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  title: string;
  isActive?: boolean; // Programa ativo ou pausado/desativado na grade
  host: string;
  hostRole?: string;
  description: string;
  genre: string;
  badge?: string;
  avatarUrl?: string; // Foto do Locutor / Apresentador (sincronizada do locutor)
  bannerUrl?: string; // Banner Panorâmico do Hotsite
  logoUrl?: string;   // Logo oficial do Programa
  // Reprise do Programa na Grade da Rádio
  hasReprise?: boolean;
  repriseDayOfWeek?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday, or -1 for every day
  repriseStartTime?: string; // "22:00"
  repriseEndTime?: string; // "00:00"
  repriseDaysLabel?: string; // Ex: "Sábado às 22:00"
  photoGallery?: string[]; // Galeria de até 10 fotos
  videoGallery?: Array<ProgramVideoItem | string>; // Galeria de até 4 vídeos
  mixcloudUser?: string; // Nome de usuário do Mixcloud (ex: "Avoxdobrasil")
  mixcloudUrl?: string; // Link direto do perfil ou programa no Mixcloud.com
  daysLabel?: string;
  hostBio?: string;
  instagramHandle?: string;
  whatsappNumber?: string; // Telefone WhatsApp do apresentador para pedidos musicais
  highlights?: ProgramHighlight[];
  playlist?: ProgramTrack[];
  // Autenticação e Vínculo de Locutor
  hostAccountId?: string;
  hostPassword?: string; // Senha direta opcional do programa/hotsite
  // Campos de Substituição / Locutor Online
  isSubstituted?: boolean;
  originalHost?: string;
  takeoverNotes?: string;
  isRebDefault?: boolean;
  // Campos de Banner Promocional vinculado ao programa
  promoActive?: boolean;
  promoBannerUrl?: string;
  promoTitle?: string;
  promoDescription?: string;
  promoActionUrl?: string;
  promoStartDate?: string; // YYYY-MM-DDTHH:mm
  promoEndDate?: string;   // YYYY-MM-DDTHH:mm
  promoScheduleSync?: boolean; // Se true, exibe no horário do programa na grade
  seedKey?: string;
}

export interface LiveTakeover {
  isActive: boolean;
  substituteHost: string; // Nome do locutor que assumiu
  substituteHostRole?: string; // Ex: "Locutor Substituto / Plantão Especial"
  substituteAvatarUrl?: string; // Foto do locutor que está no ar
  substituteWhatsapp?: string; // WhatsApp direto do locutor que está no ar
  substituteBio?: string;
  substituteInstagram?: string;
  originProgramTitle?: string; // De qual programa ele veio (se aplicável)
  targetProgramId?: string; // ID do programa original que ele está cobrindo
  takeoverType: 'covering_colleague' | 'live_dj_session';
  notes?: string; // Mensagem no ar (ex: "Cobringo o colega Carlos hoje!")
  startedAt: number;
}

export interface PromoBanner {
  id: string;
  programId?: string;
  programTitle?: string;
  title: string;
  subtitle?: string;
  description: string;
  bannerUrl: string;
  badge?: string;
  actionText?: string;
  actionUrl?: string;
  startDate: string; // YYYY-MM-DDTHH:mm
  endDate: string;   // YYYY-MM-DDTHH:mm
  scheduleSync?: boolean; // Sincronizar com horário do programa
  programTimeWindow?: { startTime: string; endTime: string; daysLabel?: string };
  isActive: boolean;
  createdAt: number;
}

export interface SongRequest {
  id: string;
  listenerName: string;
  city: string;
  songTitle: string;
  artist: string;
  dedication?: string;
  dedicatedTo?: string;
  recipientPhone?: string;
  artworkUrl?: string;
  previewUrl?: string;
  artistBio?: string;
  timestamp: number;
  votes: number;
  hasVoted?: boolean;
}

export interface ShoutoutMessage {
  id: string;
  author: string;
  city: string;
  message: string;
  timestamp: number;
  likes: number;
  isPinned?: boolean;
  hasLiked?: boolean;
  avatarColor: string;
}

export interface RadioAlarm {
  enabled: boolean;
  time: string; // "07:00"
  days: number[]; // [1, 2, 3, 4, 5]
  label: string;
}

export interface RadioStationConfig {
  name: string;
  slogan: string;
  streamUrl: string;
  alternativeStreams: { label: string; url: string }[];
  whatsappNumber: string; // e.g. "5548991984678"
  instagramHandle: string;
  facebookUrl: string;
  websiteUrl: string;
  email: string;
  location: string;
  bitrate: string;
  codec: string;
  logoUrl?: string; // Logotipo oficial da Emissora
  metadataDelaySeconds?: number; // Retardo em segundos para sincronizar o título com o buffer de áudio (default: 10s)
}

export type EqualizerPreset = 'flat' | 'bass' | 'rock' | 'pop' | 'vocal' | 'electronic';

export type ActiveTab = 'player' | 'requests' | 'schedule' | 'mural' | 'features' | 'rebeldia';

export interface HostAccount {
  id: string;
  name: string; // Nome Artístico ou Completo
  username: string; // Nome de usuário único (ex: carlos, clara_luz)
  email: string; // E-mail único
  password: string; // Senha cadastrada
  whatsapp?: string; // WhatsApp direto do locutor (default da rádio)
  bio?: string; // Biografia do locutor
  avatarUrl?: string; // Foto de perfil
  role?: string; // Ex: "Locutor Titular", "DJ Residente", "Apresentador", "Locutor Oficial 24h"
  programIds?: string[]; // IDs dos programas aos quais o locutor está vinculado
  programId?: string; // ID legado de programa principal (retrocompatibilidade)
  programTitle?: string; // Título do programa
  isMascot?: boolean; // Se é a conta oficial REB (com os mesmos privilégios de locutor)
  securityQuestion?: string; // Pergunta para recuperação de senha
  securityAnswer?: string; // Resposta para recuperação de senha
  createdAt: number;
  status: 'active' | 'pending';
}
