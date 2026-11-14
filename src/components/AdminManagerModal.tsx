import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Music,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Sparkles,
  KeyRound,
  RefreshCw,
  LogOut,
  Check,
  X,
  AlertCircle,
  Flame,
  Image as ImageIcon,
  FileText,
  Copy,
  Search,
  Instagram,
  Phone,
  BarChart3,
  Sliders,
  Database,
  ExternalLink,
  ChevronRight,
  User,
  Headphones,
  Mic2,
  Layers,
  HelpCircle,
  CheckCheck,
  Globe,
  Award,
  Send,
  Heart,
  Bot,
  Mail,
  Gift,
  Tag,
  ToggleLeft,
  ToggleRight,
  Upload,
  Camera,
  Video,
  Film,
  Play,
  UserCheck,
  MessageCircle,
  Repeat,
  Power,
  PowerOff,
  Disc,
  Save,
} from 'lucide-react';
import { api, DbScheduleItem, DbShoutout, DbSongRequest, DbStats } from '../utils/api';
import {
  ProgramItem,
  ActiveTab,
  PromoBanner,
  ProgramVideoItem,
  HostAccount,
  RadioStationConfig,
  ScheduleSwapRecord,
  LiveTakeover,
} from '../types';
import {
  MixcloudRecording,
  resolveMixcloudUserOrQuery,
  fetchMixcloudRecordings,
} from '../utils/mixcloud';
import {
  InstitutionalData,
  DEFAULT_INSTITUTIONAL_DATA,
  getSavedInstitutionalData,
  saveInstitutionalData,
} from '../data/institutional';
import { LogoUploader } from './LogoUploader';
import { AdminBannersSection } from './AdminBannersSection';
import { AdminSeoSection } from './AdminSeoSection';
import { AdminScheduleSwapsSection } from './AdminScheduleSwapsSection';
import { AdminHostCoringaSection, AdminHostMyProfileSection } from './AdminHostFilteredSections';
import { INITIAL_PROMO_BANNERS, DEFAULT_REB_PROGRAM, INITIAL_HOST_ACCOUNTS } from '../data/initialData';
import {
  ensureSystemHosts,
  isProtectedSystemHost,
  isCoringaHost,
  resolveHostWhatsapp,
  isHostOwnerOfProgram,
  findDuplicateHostPhones,
  formatPhoneDisplay,
  isValidCellPhone,
} from '../utils/hostPhone';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  promoBanners?: PromoBanner[];
  onSavePromoBanners?: (banners: PromoBanner[]) => void;
  stationConfig?: RadioStationConfig;
  onSaveStationConfig?: (config: RadioStationConfig) => void;
  currentLoggedInHost?: HostAccount | null;
  hostToken?: string | null;
  onHostLogin?: (host: HostAccount, token?: string | null) => void;
  onHostLogout?: () => void;
  scheduleSwaps?: ScheduleSwapRecord[];
  onSwapsUpdated?: (swaps: ScheduleSwapRecord[]) => void;
  liveTakeover?: LiveTakeover | null;
  currentLiveProgram?: ProgramItem | null;
  onStartTakeover?: (takeover: LiveTakeover) => Promise<void> | void;
  onStopTakeover?: () => Promise<void> | void;
}

const DEFAULT_ADMIN_USER = 'admin@rebeldiafm.com';
const DEFAULT_ADMIN_PASS = 'rebeldia2026';

const DAYS_MAP = [
  { id: -1, label: 'Todos os Dias / Diário', short: 'Diário' },
  { id: 1, label: 'Segunda-feira', short: 'Seg' },
  { id: 2, label: 'Terça-feira', short: 'Ter' },
  { id: 3, label: 'Quarta-feira', short: 'Qua' },
  { id: 4, label: 'Quinta-feira', short: 'Qui' },
  { id: 5, label: 'Sexta-feira', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' },
];

const GENRE_PRESETS = [
  'Rock Clássico & Nacional',
  'Rock Alternativo & Indie',
  'Heavy Metal & Hard Rock',
  'MPB & Pop Rock',
  'Flashback 80s & 90s',
  'Blues, Jazz & Soul',
  'Debates, Notícias & Opinião',
  'Especial de Fim de Semana',
  'Madrugada Sem Comerciais',
];

const TIME_PRESETS = [
  { label: 'Manhã (06h-08h)', start: '06:00', end: '08:00' },
  { label: 'Matutino (08h-12h)', start: '08:00', end: '12:00' },
  { label: 'Almoço (12h-14h)', start: '12:00', end: '14:00' },
  { label: 'Tarde (14h-18h)', start: '14:00', end: '18:00' },
  { label: 'Drive / Volta (18h-20h)', start: '18:00', end: '20:00' },
  { label: 'Noite (20h-00h)', start: '20:00', end: '00:00' },
  { label: 'Madrugada (00h-06h)', start: '00:00', end: '06:00' },
];

const STOCK_AVATARS = [
  { label: 'Locutor Rock', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { label: 'Apresentadora Headphone', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
  { label: 'DJ / Produtor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { label: 'Voz da Madrugada', url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&auto=format&fit=crop&q=80' },
];

const STOCK_LOGOS = [
  { label: 'Logo Rock Emblema', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
  { label: 'Logo Vinil Retrô', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  { label: 'Logo Frequência FM', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80' },
  { label: 'Logo Estúdio Master', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=80' },
];

const STOCK_BANNERS = [
  { label: 'Estúdio Neon & Mics', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Vinil & Clássicos', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Mesa de Som Master', url: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Palco & Multidão', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Acústico & MPB', url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&auto=format&fit=crop&q=80' },
];

export interface ProgramFormState {
  id?: number;
  dayOfWeek: number;
  daysLabel: string;
  title: string;
  host: string;
  hostRole: string;
  hostAccountId?: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  // Reprise do Programa na Grade da Rádio
  hasReprise?: boolean;
  repriseDayOfWeek?: number;
  repriseStartTime?: string;
  repriseEndTime?: string;
  repriseDaysLabel?: string;
  genre: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  logoUrl: string;
  photoGallery: string[];
  videoGallery: Array<{ id?: string; title?: string; url: string }>;
  hostBio: string;
  instagramHandle: string;
  whatsappNumber: string;
  highlights: Array<{ title: string; description: string }>;
  playlist: Array<{ title: string; artist: string; year?: string }>;
  mixcloudUser?: string;
  mixcloudUrl?: string;
  // Campos de Promoção Vinculada
  promoActive?: boolean;
  promoTitle?: string;
  promoDescription?: string;
  promoBannerUrl?: string;
  promoActionUrl?: string;
  promoStartDate?: string;
  promoEndDate?: string;
  promoScheduleSync?: boolean;
}

const DEFAULT_PROGRAM_FORM: ProgramFormState = {
  dayOfWeek: 1,
  daysLabel: 'Segunda a Sexta',
  title: '',
  host: '',
  hostRole: 'Locutor & Apresentador',
  hostAccountId: 'host-reb',
  startTime: '10:00',
  endTime: '12:00',
  isActive: true,
  hasReprise: false,
  repriseDayOfWeek: 6,
  repriseStartTime: '',
  repriseEndTime: '',
  repriseDaysLabel: '',
  genre: 'Rock, MPB & Alternativo',
  description: '',
  avatarUrl: STOCK_AVATARS[0].url,
  bannerUrl: STOCK_BANNERS[0].url,
  logoUrl: '',
  photoGallery: [],
  videoGallery: [],
  hostBio: '',
  instagramHandle: '',
  whatsappNumber: '5548991984678',
  mixcloudUser: '',
  mixcloudUrl: '',
  highlights: [
    { title: 'Voz do Ouvinte', description: 'Leitura dos recados do mural e pedidos musicais do público.' },
    { title: 'Lado B & Raridades', description: 'Faixas exclusivas e versões raras fora do circuito comercial.' },
    { title: 'Momento Debate', description: 'Comentários com liberdade editorial, opinião autêntica e cultura.' },
    { title: 'Super Sequência', description: 'Bloco ininterrupto de músicas selecionadas para curtir no talo.' },
  ],
  playlist: [
    { title: 'Tempo Perdido', artist: 'Legião Urbana', year: '1986' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: '1991' },
    { title: 'Metamorfose Ambulante', artist: 'Raul Seixas', year: '1973' },
  ],
  promoActive: false,
  promoTitle: '',
  promoDescription: '',
  promoBannerUrl: '',
  promoActionUrl: '',
  promoScheduleSync: true,
};

type AdminNavSection =
  | 'schedule'
  | 'new_program'
  | 'coringa'
  | 'swaps'
  | 'my_profile'
  | 'hosts'
  | 'banners'
  | 'shoutouts'
  | 'requests'
  | 'rebeldia'
  | 'stats'
  | 'mixcloud'
  | 'seo';

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onNavigateToTab,
  promoBanners = INITIAL_PROMO_BANNERS,
  onSavePromoBanners,
  stationConfig,
  onSaveStationConfig,
  currentLoggedInHost = null,
  hostToken = null,
  onHostLogin,
  onHostLogout,
  scheduleSwaps,
  onSwapsUpdated,
  liveTakeover = null,
  currentLiveProgram = null,
  onStartTakeover,
  onStopTakeover,
}) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('rebeldia_admin_session'));
  });
  const authRole: 'admin' | 'host' | null = isAdminAuthenticated
    ? 'admin'
    : currentLoggedInHost
    ? 'host'
    : null;
  const isAuthenticated = authRole !== null;

  const [loginMode, setLoginMode] = useState<'host' | 'admin'>('host');
  const [hostPhoneInput, setHostPhoneInput] = useState('');
  const [hostPasswordInput, setHostPasswordInput] = useState('');
  const [localSwaps, setLocalSwaps] = useState<ScheduleSwapRecord[]>(scheduleSwaps || []);

  useEffect(() => {
    if (scheduleSwaps) {
      setLocalSwaps(scheduleSwaps);
    }
  }, [scheduleSwaps]);

  const [metadataDelaySeconds, setMetadataDelaySeconds] = useState<number>(() => {
    if (stationConfig?.metadataDelaySeconds !== undefined) {
      return stationConfig.metadataDelaySeconds;
    }
    try {
      const saved = localStorage.getItem('rebeldia_station_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.metadataDelaySeconds !== undefined) return Number(parsed.metadataDelaySeconds);
      }
    } catch {}
    return 10;
  });

  useEffect(() => {
    if (stationConfig?.metadataDelaySeconds !== undefined) {
      setMetadataDelaySeconds(stationConfig.metadataDelaySeconds);
    }
  }, [stationConfig?.metadataDelaySeconds]);

  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Active Admin Section Navigation (persists during editing and actions)
  const [activeSection, setActiveSection] = useState<AdminNavSection>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_admin_active_section');
      return (saved as AdminNavSection) || 'schedule';
    } catch {
      return 'schedule';
    }
  });

  const handleSelectSection = (section: AdminNavSection) => {
    setActiveSection(section);
    try {
      localStorage.setItem('rebeldia_admin_active_section', section);
    } catch {}
  };

  // Host Accounts (Locutores & REB Oficial) State
  const [hostAccountsList, setHostAccountsList] = useState<HostAccount[]>(INITIAL_HOST_ACCOUNTS);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);
  const [isSavingHost, setIsSavingHost] = useState(false);
  const [hostSearchQuery, setHostSearchQuery] = useState('');
  const [editingHostAccount, setEditingHostAccount] = useState<HostAccount | null>(null);
  const [isAddingNewHost, setIsAddingNewHost] = useState(false);
  const [newHostForm, setNewHostForm] = useState<Partial<HostAccount>>({
    name: '',
    username: '',
    email: '',
    password: '',
    whatsapp: '5548991984678',
    role: 'Locutor & Apresentador',
    bio: '',
    avatarUrl: '',
    programIds: [],
    securityQuestion: 'Qual é o seu estilo musical favorito?',
    securityAnswer: '',
    status: 'active',
  });

  // Promo Banners State
  const [bannersList, setBannersList] = useState<PromoBanner[]>(promoBanners);

  // Sync banners from props or API
  useEffect(() => {
    if (promoBanners && promoBanners.length > 0) {
      setBannersList(promoBanners);
    }
  }, [promoBanners]);

  const handleSaveBannersList = (updated: PromoBanner[]) => {
    setBannersList(updated);
    if (onSavePromoBanners) {
      onSavePromoBanners(updated);
    } else {
      localStorage.setItem('rebeldia_promo_banners', JSON.stringify(updated));
      api.savePromoBanners(updated).catch(() => {});
    }
  };

  // Institutional Management State (REBELDIA)
  const [institutionalForm, setInstitutionalForm] = useState<InstitutionalData>(getSavedInstitutionalData);
  const [isSavingInstitutional, setIsSavingInstitutional] = useState(false);

  // Schedule Management State
  const [scheduleList, setScheduleList] = useState<DbScheduleItem[]>([]);
  const [editingProgram, setEditingProgram] = useState<ProgramFormState | null>(null);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [togglingProgId, setTogglingProgId] = useState<number | null>(null);
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [scheduleFilterDay, setScheduleFilterDay] = useState<number>(-2); // -2 = all, -1 = daily, 0-6 days
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

  // Program Form Step (Passos do cadastro)
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);

  // Shoutouts Moderation State
  const [shoutoutsList, setShoutoutsList] = useState<DbShoutout[]>([]);
  const [isLoadingShoutouts, setIsLoadingShoutouts] = useState(false);
  const [shoutoutFilter, setShoutoutFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [shoutoutSearch, setShoutoutSearch] = useState('');

  // Song Requests Moderation State
  const [requestsList, setRequestsList] = useState<DbSongRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'playing' | 'played'>('all');
  const [requestSearch, setRequestSearch] = useState('');

  // System Stats
  const [dbStats, setDbStats] = useState<DbStats | null>(null);

  // Status Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mixcloud Modal & Test State
  const [quickMixcloudModal, setQuickMixcloudModal] = useState<{
    isOpen: boolean;
    program: DbScheduleItem | null;
    mixcloudUrl: string;
    mixcloudUser: string;
    isSaving: boolean;
    isTesting: boolean;
    testResult: { success: boolean; message: string; recordings?: MixcloudRecording[] } | null;
  }>({
    isOpen: false,
    program: null,
    mixcloudUrl: '',
    mixcloudUser: '',
    isSaving: false,
    isTesting: false,
    testResult: null,
  });

  // Step 4 Mixcloud Test in Program Form
  const [formMixcloudTesting, setFormMixcloudTesting] = useState(false);
  const [formMixcloudTestResult, setFormMixcloudTestResult] = useState<{
    success: boolean;
    message: string;
    recordings?: MixcloudRecording[];
  } | null>(null);

  // Mixcloud Central Section Filters & Local State
  const [mixcloudFilterTerm, setMixcloudFilterTerm] = useState('');
  const [mixcloudFilterStatus, setMixcloudFilterStatus] = useState<'all' | 'configured' | 'empty'>('all');
  const [mixcloudInlineTestingId, setMixcloudInlineTestingId] = useState<number | null>(null);
  const [mixcloudInlineResults, setMixcloudInlineResults] = useState<
    Record<number, { success: boolean; message: string; recordings?: MixcloudRecording[] }>
  >({});
  const [mixcloudInlineValues, setMixcloudInlineValues] = useState<
    Record<number, { user: string; url: string; isSaving?: boolean }>
  >({});

  const extractMixcloudUserFromUrl = (url: string): string => {
    if (!url) return '';
    try {
      const clean = url.trim().replace(/^https?:\/\/(www\.)?mixcloud\.com\//i, '').replace(/\/+$/, '');
      const parts = clean.split('/');
      return decodeURIComponent(parts[0] || '').trim();
    } catch {
      return url.trim();
    }
  };

  const handleTestMixcloudConnection = async (targetUserOrUrl: string) => {
    if (!targetUserOrUrl.trim()) {
      return { success: false, message: 'Digite um usuário ou endereço do Mixcloud para testar.' };
    }
    try {
      const res = await fetchMixcloudRecordings(targetUserOrUrl.trim(), 5);
      if (res.recordings && res.recordings.length > 0) {
        return {
          success: true,
          message: `${res.recordings.length} gravações encontradas no Mixcloud (${res.sourceInfo || 'Mixcloud Oficial'})!`,
          recordings: res.recordings,
        };
      } else {
        return {
          success: false,
          message: 'Nenhuma gravação recente encontrada para este canal ou usuário.',
        };
      }
    } catch (e: unknown) {
      return {
        success: false,
        message: 'Erro ao consultar o Mixcloud. Verifique o usuário ou link.',
      };
    }
  };

  const handleOpenQuickMixcloud = (prog: DbScheduleItem) => {
    setQuickMixcloudModal({
      isOpen: true,
      program: prog,
      mixcloudUrl: prog.mixcloudUrl || (prog.mixcloudUser ? `https://www.mixcloud.com/${prog.mixcloudUser}` : ''),
      mixcloudUser: prog.mixcloudUser || '',
      isSaving: false,
      isTesting: false,
      testResult: null,
    });
  };

  const handleSaveQuickMixcloud = async () => {
    if (!quickMixcloudModal.program) return;
    setQuickMixcloudModal((prev) => ({ ...prev, isSaving: true }));
    try {
      const progId = quickMixcloudModal.program.id;
      const userVal = quickMixcloudModal.mixcloudUser.trim() || null;
      const urlVal = quickMixcloudModal.mixcloudUrl.trim() || null;

      await api.updateScheduleItem(progId, {
        mixcloudUser: userVal,
        mixcloudUrl: urlVal,
      });

      setScheduleList((prev) =>
        prev.map((p) =>
          p.id === progId
            ? { ...p, mixcloudUser: userVal, mixcloudUrl: urlVal }
            : p
        )
      );

      showToast(`Mixcloud do programa "${quickMixcloudModal.program.title}" salvo com sucesso!`);
      setQuickMixcloudModal((prev) => ({
        ...prev,
        isSaving: false,
        isOpen: false,
      }));
      onRefreshData?.();
    } catch (err) {
      console.error('Erro ao salvar Mixcloud:', err);
      showToast('Erro ao salvar configurações do Mixcloud.');
      setQuickMixcloudModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  const handleInlineSaveMixcloud = async (prog: DbScheduleItem, customUser?: string, customUrl?: string) => {
    const userVal = (customUser !== undefined ? customUser : (mixcloudInlineValues[prog.id]?.user ?? (prog.mixcloudUser || ''))).trim() || null;
    const urlVal = (customUrl !== undefined ? customUrl : (mixcloudInlineValues[prog.id]?.url ?? (prog.mixcloudUrl || ''))).trim() || null;

    setMixcloudInlineValues((prev) => ({
      ...prev,
      [prog.id]: {
        user: userVal || '',
        url: urlVal || '',
        isSaving: true,
      },
    }));

    try {
      await api.updateScheduleItem(prog.id, {
        mixcloudUser: userVal,
        mixcloudUrl: urlVal,
      });

      setScheduleList((prev) =>
        prev.map((p) =>
          p.id === prog.id
            ? { ...p, mixcloudUser: userVal, mixcloudUrl: urlVal }
            : p
        )
      );

      showToast(`Hotsite "${prog.title}": Mixcloud salvo com sucesso!`);
      onRefreshData?.();
    } catch (e) {
      console.error('Erro ao salvar Mixcloud do hotsite:', e);
      showToast('Erro ao salvar Mixcloud do hotsite.');
    } finally {
      setMixcloudInlineValues((prev) => ({
        ...prev,
        [prog.id]: {
          ...(prev[prog.id] || { user: '', url: '' }),
          isSaving: false,
        },
      }));
    }
  };

  // Custom Confirmation Dialog (safe for iframe)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
    isLoading?: boolean;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load Admin / Host Data when authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSchedule();
      loadHostAccounts();
      loadSwaps();
      if (authRole === 'admin') {
        loadShoutouts();
        loadRequests();
        loadStats();
      }
    }
  }, [isOpen, isAuthenticated, authRole]);

  // Enforce filtered section scope when authenticated as host
  useEffect(() => {
    if (authRole === 'host') {
      const allowedHostSections: AdminNavSection[] = ['schedule', 'new_program', 'coringa', 'swaps', 'my_profile'];
      if (!allowedHostSections.includes(activeSection)) {
        setActiveSection('schedule');
        setEditingProgram(null);
      } else if (activeSection === 'new_program' && editingProgram && !editingProgram.id) {
        setActiveSection('schedule');
        setEditingProgram(null);
      }
    }
  }, [authRole, activeSection, editingProgram]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog?.isOpen) {
          setConfirmDialog(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmDialog]);

  const loadSwaps = async () => {
    try {
      const data = await api.getScheduleSwaps();
      setLocalSwaps(data);
      onSwapsUpdated?.(data);
    } catch (err) {
      console.error('Error loading schedule swaps:', err);
    }
  };

  const loadSchedule = async () => {
    try {
      const data = await api.getSchedule();
      setScheduleList(data);
    } catch (err) {
      console.error('Error loading schedule:', err);
    }
  };

  const loadShoutouts = async () => {
    setIsLoadingShoutouts(true);
    try {
      const data = await api.adminGetShoutouts();
      setShoutoutsList(data);
    } catch (err) {
      console.error('Error loading admin shoutouts:', err);
    } finally {
      setIsLoadingShoutouts(false);
    }
  };

  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await api.getSongRequests();
      setRequestsList(data);
    } catch (err) {
      console.error('Error loading admin song requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await api.getStats();
      setDbStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadHostAccounts = async () => {
    setIsLoadingHosts(true);
    try {
      const data = await api.getHostAccounts();
      if (data && Array.isArray(data) && data.length > 0) {
        setHostAccountsList(ensureSystemHosts(data, INITIAL_HOST_ACCOUNTS));
      } else {
        setHostAccountsList(INITIAL_HOST_ACCOUNTS);
      }
    } catch (err) {
      console.error('Error loading host accounts:', err);
      setHostAccountsList(INITIAL_HOST_ACCOUNTS);
    } finally {
      setIsLoadingHosts(false);
    }
  };

  const [isSyncingOfficial, setIsSyncingOfficial] = useState(false);
  const handleSyncOfficialContent = async () => {
    setIsSyncingOfficial(true);
    try {
      const res = await fetch('/api/admin/sync-official', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Grade e Locutores oficiais publicados e sincronizados com sucesso!');
        await loadSchedule();
        await loadHostAccounts();
        if (onRefreshData) onRefreshData();
      } else {
        showToast('Erro ao sincronizar conteúdo oficial.');
      }
    } catch {
      showToast('Falha na conexão ao sincronizar.');
    } finally {
      setIsSyncingOfficial(false);
    }
  };

  const handleSaveHostAccount = async (updated: HostAccount) => {
    setIsSavingHost(true);
    try {
      const nextList = hostAccountsList.map((h) => (h.id === updated.id ? updated : h));
      await api.saveHostAccounts(nextList);
      setHostAccountsList(nextList);

      // Sincroniza automaticamente todos os programas vinculados a este locutor (foto, nome, cargo, whatsapp)
      const linkedPrograms = scheduleList.filter(
        (p) => p.hostAccountId === updated.id || p.host.toLowerCase() === updated.name.toLowerCase()
      );
      if (linkedPrograms.length > 0) {
        for (const prog of linkedPrograms) {
          try {
            await api.updateScheduleItem(prog.id, {
              host: updated.name,
              hostAccountId: updated.id,
              avatarUrl: updated.avatarUrl || prog.avatarUrl,
              hostRole: updated.role || prog.hostRole,
              whatsappNumber: updated.whatsapp || null,
              hostBio: updated.bio || prog.hostBio,
            });
          } catch (e) {
            console.error('Error syncing program host:', e);
          }
        }
        await loadSchedule();
      }

      onRefreshData?.();
      showToast(`Perfil do locutor ${updated.name} salvo com sucesso!`);
      setEditingHostAccount(null);
    } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao salvar locutor';
          showToast(message);
        } finally {
      setIsSavingHost(false);
    }
  };

  const handleDeleteHostAccount = (host: HostAccount) => {
    if (isProtectedSystemHost(host)) {
      showToast(
        isCoringaHost(host)
          ? 'O perfil fixo Coringa é protegido pelo sistema e não pode ser excluído.'
          : 'A conta REB Oficial é a conta mestre e não pode ser excluída.'
      );
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Conta do Locutor',
      message: `Deseja realmente remover o acesso e cadastro do locutor "${host.name}" (@${host.username})?`,
      confirmText: 'Excluir Locutor',
      onConfirm: async () => {
        const nextList = hostAccountsList.filter((h) => h.id !== host.id);
        setHostAccountsList(nextList);
        await api.saveHostAccounts(nextList);
        showToast(`Locutor ${host.name} removido.`);
        setConfirmDialog(null);
      },
    });
  };

  const handleCreateNewHostAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostForm.name?.trim() || !newHostForm.username?.trim()) {
      showToast('Nome e Usuário são obrigatórios');
      return;
    }

    setIsSavingHost(true);
    try {
      const selectedProgIds = newHostForm.programIds || [];
      const primaryProg = scheduleList.find((p) => selectedProgIds.includes(String(p.id)));

      const newAcc: HostAccount = {
        id: `host-${Date.now()}`,
        name: newHostForm.name.trim(),
        username: newHostForm.username.trim().toLowerCase().replace(/\s+/g, ''),
        email: newHostForm.email?.trim() || `${newHostForm.username?.trim().toLowerCase()}@rebeldiafm.com.br`,
        password: newHostForm.password?.trim() || 'senha123',
        whatsapp: newHostForm.whatsapp?.trim() || '5548991984678',
        role: newHostForm.role?.trim() || 'Locutor & Apresentador',
        bio: newHostForm.bio?.trim() || '',
        avatarUrl: newHostForm.avatarUrl?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        programIds: selectedProgIds,
        programId: selectedProgIds[0] || undefined,
        programTitle: primaryProg ? primaryProg.title : undefined,
        securityQuestion: newHostForm.securityQuestion || 'Qual é o seu estilo musical favorito?',
        securityAnswer: newHostForm.securityAnswer || 'rock',
        createdAt: Date.now(),
        status: 'active',
      };

      const nextList = [...hostAccountsList, newAcc];
      await api.saveHostAccounts(nextList);
      setHostAccountsList(nextList);
      showToast(`Locutor ${newAcc.name} cadastrado com sucesso!`);
      setIsAddingNewHost(false);
      setNewHostForm({
        name: '',
        username: '',
        email: '',
        password: '',
        whatsapp: '5548991984678',
        role: 'Locutor & Apresentador',
        bio: '',
        avatarUrl: '',
        programIds: [],
        securityQuestion: 'Qual é o seu estilo musical favorito?',
        securityAnswer: '',
        status: 'active',
      });
    } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao cadastrar locutor';
          showToast(message);
        } finally {
      setIsSavingHost(false);
    }
  };

  const handleEditRebHotsite = () => {
    // Carrega o Hotsite 24h do REB no formulário de edição
    setEditingProgram({
      id: undefined,
      dayOfWeek: -1,
      daysLabel: '24h • Horário Livre & Transmissão Contínua',
      title: DEFAULT_REB_PROGRAM.title,
      host: 'REB',
      hostRole: 'Locutor Virtual Oficial 24h',
      startTime: '00:00',
      endTime: '23:59',
      genre: DEFAULT_REB_PROGRAM.genre || 'Rock, Indie & Alternativo',
      description: DEFAULT_REB_PROGRAM.description || '',
      avatarUrl: DEFAULT_REB_PROGRAM.avatarUrl || '/reb_mascot.jpg',
      bannerUrl: DEFAULT_REB_PROGRAM.bannerUrl || '',
      logoUrl: DEFAULT_REB_PROGRAM.logoUrl || '/reb_mascot.jpg',
      photoGallery: DEFAULT_REB_PROGRAM.photoGallery || ['/reb_mascot.jpg'],
      videoGallery: [],
      hostBio: DEFAULT_REB_PROGRAM.hostBio || 'REB é a voz lendária e locutor oficial da Rebeldia FM.',
      instagramHandle: '@rebeldiafm',
      whatsappNumber: DEFAULT_REB_PROGRAM.whatsappNumber || '5548991984678',
      mixcloudUser: 'Avoxdobrasil',
      mixcloudUrl: 'https://www.mixcloud.com/Avoxdobrasil/',
      hasReprise: false,
      repriseDayOfWeek: 6,
      repriseStartTime: '',
      repriseEndTime: '',
      repriseDaysLabel: '',
      highlights: [
        { title: 'Voz do Ouvinte & Pedidos', description: 'Leitura dos recados do mural e pedidos musicais do público 24h.' },
        { title: 'Lado B & Raridades', description: 'Faixas exclusivas e versões raras fora do circuito comercial.' },
        { title: 'Super Sequência Sem Censura', description: 'Bloco ininterrupto de rock, indie e música livre no talo.' },
      ],
      playlist: [
        { title: 'Tempo Perdido', artist: 'Legião Urbana', year: '1986' },
        { title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: '1991' },
        { title: 'Metamorfose Ambulante', artist: 'Raul Seixas', year: '1973' },
      ],
    });
    setFormStep(1);
    setActiveSection('new_program');
    showToast('Carregando Hotsite Oficial do REB para edição!');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoadingAuth(true);

    try {
      const res = await api.adminLogin(username.trim(), password.trim());
      if (res.success) {
        localStorage.setItem('rebeldia_admin_session', res.token);
        localStorage.setItem('rebeldia_admin_open', 'true');
        setIsAdminAuthenticated(true);
        showToast('Autenticado como Admin Geral no painel!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Usuário ou senha incorretos';
      setLoginError(message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleHostPanelLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!isValidCellPhone(hostPhoneInput)) {
      setLoginError('Informe seu número de celular com DDD (ex: 48 99999-9999).');
      return;
    }
    setIsLoadingAuth(true);

    try {
      const res = await api.loginHost(hostPhoneInput.trim(), hostPasswordInput);
      if (res.success && res.host) {
        onHostLogin?.(res.host, res.token || null);
        localStorage.setItem('rebeldia_admin_open', 'true');
        setActiveSection('schedule');
        setEditingProgram(null);
        showToast(`Bem-vindo(a), ${res.host.name}! Painel do Locutor liberado.`);
      } else {
        setLoginError(res.error || 'Celular ou senha pessoal incorretos.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao autenticar com seu celular';
      setLoginError(message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rebeldia_admin_open');
    if (authRole === 'admin') {
      localStorage.removeItem('rebeldia_admin_session');
      setIsAdminAuthenticated(false);
    } else if (authRole === 'host') {
      onHostLogout?.();
    }
    setEditingProgram(null);
    showToast('Desconectado do painel com sucesso!');
    onClose();
  };

  const handleBackToSite = () => {
    localStorage.removeItem('rebeldia_admin_open');
    onClose();
  };

  // Schedule Actions
  const handleOpenNewProgram = () => {
    const defaultHost = hostAccountsList[0] || null;
    setEditingProgram({
      ...DEFAULT_PROGRAM_FORM,
      host: defaultHost?.name || 'REB',
      hostRole: defaultHost?.role || 'Locutor & Apresentador Oficial',
      hostAccountId: defaultHost?.id || 'host-reb',
      avatarUrl: defaultHost?.avatarUrl || STOCK_AVATARS[0].url,
      whatsappNumber: defaultHost?.whatsapp || '5548991984678',
      hostBio: defaultHost?.bio || '',
      logoUrl: '',
      hasReprise: false,
      repriseDayOfWeek: 6,
      repriseStartTime: '',
      repriseEndTime: '',
      repriseDaysLabel: '',
    });
    setFormStep(1);
    setActiveSection('new_program');
  };

  const handleOpenEditProgram = (prog: DbScheduleItem) => {
    let highlights = [
      { title: 'Voz do Ouvinte', description: 'Leitura dos recados do mural e pedidos musicais do público.' },
      { title: 'Lado B & Raridades', description: 'Faixas exclusivas e versões raras fora do circuito comercial.' },
      { title: 'Momento Debate', description: 'Comentários com liberdade editorial, opinião autêntica e cultura.' },
      { title: 'Super Sequência', description: 'Bloco ininterrupto de músicas selecionadas para curtir no talo.' },
    ];
    if (prog.highlightsJson) {
      try {
        const parsed = JSON.parse(prog.highlightsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          highlights = parsed;
        }
      } catch {}
    }

    let playlist = [
      { title: 'Tempo Perdido', artist: 'Legião Urbana', year: '1986' },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: '1991' },
      { title: 'Metamorfose Ambulante', artist: 'Raul Seixas', year: '1973' },
    ];
    if (prog.playlistJson) {
      try {
        const parsed = JSON.parse(prog.playlistJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          playlist = parsed;
        }
      } catch {}
    }

    let photoGallery: string[] = [];
    if (prog.photoGalleryJson) {
      try {
        const parsed = JSON.parse(prog.photoGalleryJson);
        if (Array.isArray(parsed)) {
          photoGallery = parsed;
        }
      } catch {}
    }

    let videoGallery: Array<{ id?: string; title?: string; url: string }> = [];
    if (prog.videoGalleryJson) {
      try {
        const parsed = JSON.parse(prog.videoGalleryJson);
        if (Array.isArray(parsed)) {
          videoGallery = parsed;
        }
      } catch {}
    }

    const linkedHost = hostAccountsList.find(
      (h) => (prog.hostAccountId && h.id === prog.hostAccountId) || h.name.toLowerCase() === prog.host.toLowerCase()
    );

    setEditingProgram({
      id: prog.id,
      dayOfWeek: prog.dayOfWeek,
      daysLabel: prog.daysLabel || DAYS_MAP.find((d) => d.id === prog.dayOfWeek)?.label || 'Todos os Dias',
      title: prog.title,
      host: linkedHost?.name || prog.host,
      hostRole: prog.hostRole || linkedHost?.role || 'Locutor & Apresentador',
      hostAccountId: linkedHost?.id || prog.hostAccountId || undefined,
      startTime: prog.startTime,
      endTime: prog.endTime,
      isActive: prog.isActive !== false,
      hasReprise: Boolean(prog.hasReprise),
      repriseDayOfWeek: prog.repriseDayOfWeek !== undefined && prog.repriseDayOfWeek !== null ? prog.repriseDayOfWeek : 6,
      repriseStartTime: Boolean(prog.hasReprise) ? (prog.repriseStartTime || '') : '',
      repriseEndTime: Boolean(prog.hasReprise) ? (prog.repriseEndTime || '') : '',
      repriseDaysLabel: Boolean(prog.hasReprise) ? (prog.repriseDaysLabel || '') : '',
      genre: prog.genre || '',
      description: prog.description || '',
      avatarUrl: linkedHost?.avatarUrl || prog.avatarUrl || '',
      bannerUrl: prog.bannerUrl || '',
      logoUrl: prog.logoUrl || '',
      photoGallery,
      videoGallery,
      hostBio: linkedHost?.bio || prog.hostBio || '',
      instagramHandle: prog.instagramHandle || '',
      whatsappNumber: linkedHost?.whatsapp || prog.whatsappNumber || '5548991984678',
      highlights,
      playlist,
      mixcloudUser: prog.mixcloudUser || '',
      mixcloudUrl: prog.mixcloudUrl || '',
    });
    setFormStep(1);
    setActiveSection('new_program');
  };

  const handleDuplicateProgram = (prog: DbScheduleItem) => {
    let highlights = [];
    if (prog.highlightsJson) {
      try {
        highlights = JSON.parse(prog.highlightsJson);
      } catch {}
    }
    let playlist = [];
    if (prog.playlistJson) {
      try {
        playlist = JSON.parse(prog.playlistJson);
      } catch {}
    }
    let photoGallery: string[] = [];
    if (prog.photoGalleryJson) {
      try {
        photoGallery = JSON.parse(prog.photoGalleryJson);
      } catch {}
    }
    let videoGallery: Array<{ id?: string; title?: string; url: string }> = [];
    if (prog.videoGalleryJson) {
      try {
        videoGallery = JSON.parse(prog.videoGalleryJson);
      } catch {}
    }

    setEditingProgram({
      dayOfWeek: prog.dayOfWeek,
      daysLabel: prog.daysLabel || 'Cópia de ' + prog.title,
      title: `${prog.title} (Cópia)`,
      host: prog.host,
      hostRole: prog.hostRole || 'Locutor & Apresentador',
      hostAccountId: prog.hostAccountId || undefined,
      startTime: prog.startTime,
      endTime: prog.endTime,
      isActive: true,
      hasReprise: Boolean(prog.hasReprise),
      repriseDayOfWeek: prog.repriseDayOfWeek !== undefined && prog.repriseDayOfWeek !== null ? prog.repriseDayOfWeek : 6,
      repriseStartTime: Boolean(prog.hasReprise) ? (prog.repriseStartTime || '') : '',
      repriseEndTime: Boolean(prog.hasReprise) ? (prog.repriseEndTime || '') : '',
      repriseDaysLabel: Boolean(prog.hasReprise) ? (prog.repriseDaysLabel || '') : '',
      genre: prog.genre || '',
      description: prog.description || '',
      avatarUrl: prog.avatarUrl || '',
      bannerUrl: prog.bannerUrl || '',
      logoUrl: prog.logoUrl || '',
      photoGallery,
      videoGallery,
      hostBio: prog.hostBio || '',
      instagramHandle: prog.instagramHandle || '',
      whatsappNumber: prog.whatsappNumber || '5548991984678',
      mixcloudUser: prog.mixcloudUser || '',
      mixcloudUrl: prog.mixcloudUrl || '',
      highlights: highlights.length ? highlights : DEFAULT_PROGRAM_FORM.highlights,
      playlist: playlist.length ? playlist : DEFAULT_PROGRAM_FORM.playlist,
    });
    setFormStep(1);
    setActiveSection('new_program');
    showToast('Programa clonado como novo rascunho!');
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram?.title?.trim() || !editingProgram?.host?.trim() || !editingProgram?.startTime?.trim() || !editingProgram?.endTime?.trim()) {
      showToast('Preencha os campos obrigatórios (*)');
      return;
    }

    setIsSavingProgram(true);
    try {
      const linkedHostForSave = hostAccountsList.find(
        (h) =>
          (editingProgram.hostAccountId && h.id === editingProgram.hostAccountId) ||
          h.name.toLowerCase() === editingProgram.host.trim().toLowerCase()
      );

      const payload = {
        dayOfWeek: editingProgram.dayOfWeek ?? 1,
        daysLabel: editingProgram.daysLabel?.trim() || null,
        title: editingProgram.title.trim(),
        host: editingProgram.host.trim(),
        hostRole: editingProgram.hostRole?.trim() || null,
        hostAccountId: editingProgram.hostAccountId?.trim() || null,
        startTime: editingProgram.startTime.trim(),
        endTime: editingProgram.endTime.trim(),
        isActive: editingProgram.isActive !== false,
        hasReprise: Boolean(editingProgram.hasReprise),
        repriseDayOfWeek: editingProgram.hasReprise && editingProgram.repriseDayOfWeek !== undefined && editingProgram.repriseDayOfWeek !== null ? Number(editingProgram.repriseDayOfWeek) : null,
        repriseStartTime: editingProgram.hasReprise && editingProgram.repriseStartTime?.trim() ? editingProgram.repriseStartTime.trim() : null,
        repriseEndTime: editingProgram.hasReprise && editingProgram.repriseEndTime?.trim() ? editingProgram.repriseEndTime.trim() : null,
        repriseDaysLabel: editingProgram.hasReprise && editingProgram.repriseDaysLabel?.trim() ? editingProgram.repriseDaysLabel.trim() : null,
        description: editingProgram.description?.trim() || null,
        genre: editingProgram.genre?.trim() || null,
        avatarUrl: editingProgram.avatarUrl?.trim() || null,
        bannerUrl: editingProgram.bannerUrl?.trim() || null,
        logoUrl: editingProgram.logoUrl?.trim() || null,
        hostBio: editingProgram.hostBio?.trim() || null,
        instagramHandle: editingProgram.instagramHandle?.trim() || null,
        whatsappNumber: linkedHostForSave?.whatsapp?.trim() || null,
        mixcloudUser: editingProgram.mixcloudUser?.trim() || null,
        mixcloudUrl: editingProgram.mixcloudUrl?.trim() || null,
        highlightsJson: JSON.stringify(editingProgram.highlights || []),
        playlistJson: JSON.stringify(editingProgram.playlist || []),
        photoGalleryJson: JSON.stringify(editingProgram.photoGallery || []),
        videoGalleryJson: JSON.stringify(editingProgram.videoGallery || []),
      };

      // Garante persistência da sessão e do painel aberto
      localStorage.setItem('rebeldia_admin_open', 'true');

      if (editingProgram.id) {
        await api.updateScheduleItem(editingProgram.id, payload);
        showToast('Programa e Hotsite atualizados com sucesso!');
        setEditingProgram((prev) => (prev ? { ...prev, ...payload } : null));
      } else {
        const created = await api.createScheduleItem(payload);
        showToast('Novo programa e Hotsite publicados no ar!');
        if (created && created.id) {
          setEditingProgram((prev) => (prev ? { ...prev, id: created.id, ...payload } : null));
        }
      }

      await loadSchedule();
      onRefreshData?.();
    } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao salvar programa';
          showToast(message);
        } finally {
      setIsSavingProgram(false);
    }
  };

  const handleToggleProgramActive = async (prog: DbScheduleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentActive = prog.isActive !== false;
    const nextActive = !currentActive;

    // Atualização otimista imediata na interface
    setScheduleList((prev) =>
      prev.map((item) => (item.id === prog.id ? { ...item, isActive: nextActive } : item))
    );
    setTogglingProgId(prog.id);

    try {
      await api.toggleScheduleActive(prog.id, nextActive);
      showToast(
        nextActive
          ? `Programa "${prog.title}" ativado na programação oficial!`
          : `Programa "${prog.title}" desativado (fora do ar).`
      );
      onRefreshData?.();
    } catch (err: unknown) {
      // Reverte em caso de erro
      setScheduleList((prev) =>
        prev.map((item) => (item.id === prog.id ? { ...item, isActive: currentActive } : item))
      );
          const message = err instanceof Error ? err.message : 'Erro ao alternar status do programa';
          showToast(message);
        } finally {
      setTogglingProgId(null);
    }
  };

  const handleAddHighlight = () => {
    if (!editingProgram) return;
    setEditingProgram((prev) => prev ? ({
      ...prev,
      highlights: [...(prev.highlights || []), { title: 'Novo Quadro Especial', description: 'Conteúdo e proposta deste quadro...' }]
    }) : null);
  };

  const handleUpdateHighlight = (index: number, field: 'title' | 'description', val: string) => {
    if (!editingProgram) return;
    const updated = [...(editingProgram.highlights || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setEditingProgram({ ...editingProgram, highlights: updated });
    }
  };

  const handleRemoveHighlight = (index: number) => {
    if (!editingProgram) return;
    setEditingProgram({
      ...editingProgram,
      highlights: (editingProgram.highlights || []).filter((_, i) => i !== index),
    });
  };

  const handleAddPlaylistItem = () => {
    if (!editingProgram) return;
    setEditingProgram((prev) => prev ? ({
      ...prev,
      playlist: [...(prev.playlist || []), { title: 'Nome da Música', artist: 'Artista ou Banda', year: '2026' }]
    }) : null);
  };

  const handleUpdatePlaylistItem = (index: number, field: 'title' | 'artist' | 'year', val: string) => {
    if (!editingProgram) return;
    const updated = [...(editingProgram.playlist || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setEditingProgram({ ...editingProgram, playlist: updated });
    }
  };

  const handleRemovePlaylistItem = (index: number) => {
    if (!editingProgram) return;
    setEditingProgram({
      ...editingProgram,
      playlist: (editingProgram.playlist || []).filter((_, i) => i !== index),
    });
  };

  // Funções de manipulação e compressão de mídia (Upload direto de imagem)
  const processImageFile = (file: File, maxDimension = 900, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProgram) return;
    try {
      const dataUrl = await processImageFile(file, 600, 0.9);
      setEditingProgram({ ...editingProgram, avatarUrl: dataUrl });
      showToast('Foto do locutor carregada com sucesso!');
    } catch {
      showToast('Erro ao processar imagem');
    }
  };

  const handleUploadHostAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>, isNew = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 600, 0.9);
      if (isNew) {
        setNewHostForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      } else if (editingHostAccount) {
        setEditingHostAccount((prev) => (prev ? { ...prev, avatarUrl: dataUrl } : null));
      }
      showToast('Foto do perfil do comunicador carregada com sucesso!');
    } catch {
      showToast('Erro ao processar foto');
    }
  };

  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProgram) return;
    try {
      const dataUrl = await processImageFile(file, 600, 0.9);
      setEditingProgram({ ...editingProgram, logoUrl: dataUrl });
      showToast('Logo do programa carregado com sucesso!');
    } catch {
      showToast('Erro ao processar imagem do logo');
    }
  };

  const handleUploadBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProgram) return;
    try {
      const dataUrl = await processImageFile(file, 1200, 0.85);
      setEditingProgram({ ...editingProgram, bannerUrl: dataUrl });
      showToast('Banner de capa carregado com sucesso!');
    } catch {
      showToast('Erro ao processar banner');
    }
  };

  const handleUploadPromoBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProgram) return;
    try {
      const dataUrl = await processImageFile(file, 1200, 0.85);
      setEditingProgram({ ...editingProgram, promoBannerUrl: dataUrl });
      showToast('Banner promocional carregado com sucesso!');
    } catch {
      showToast('Erro ao processar banner promocional');
    }
  };

  const handleUploadGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProgram) return;

    const currentPhotos = editingProgram.photoGallery || [];
    const slotsAvailable = 10 - currentPhotos.length;
    if (slotsAvailable <= 0) {
      showToast('Limite máximo de 10 fotos atingido!');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, slotsAvailable) as File[];
    try {
      const newUrls = await Promise.all(filesToProcess.map((f: File) => processImageFile(f, 900, 0.85)));
      setEditingProgram({
        ...editingProgram,
        photoGallery: [...currentPhotos, ...newUrls],
      });
      showToast(`${newUrls.length} foto(s) adicionada(s) à galeria!`);
    } catch {
      showToast('Erro ao adicionar fotos');
    }
  };

  const handleAddGalleryPhotoUrl = (url: string) => {
    if (!url.trim() || !editingProgram) return;
    const current = editingProgram.photoGallery || [];
    if (current.length >= 10) {
      showToast('Limite máximo de 10 fotos atingido!');
      return;
    }
    setEditingProgram({
      ...editingProgram,
      photoGallery: [...current, url.trim()],
    });
    showToast('Foto adicionada à galeria!');
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    if (!editingProgram) return;
    setEditingProgram({
      ...editingProgram,
      photoGallery: (editingProgram.photoGallery || []).filter((_, i) => i !== index),
    });
  };

  const handleAddVideoToGallery = (url: string, title?: string) => {
    if (!url.trim() || !editingProgram) return;
    const current = editingProgram.videoGallery || [];
    if (current.length >= 4) {
      showToast('Limite máximo de 4 vídeos atingido!');
      return;
    }
    const newVideo = {
      id: String(Date.now()),
      url: url.trim(),
      title: title?.trim() || `Vídeo #${current.length + 1}`,
    };
    setEditingProgram({
      ...editingProgram,
      videoGallery: [...current, newVideo],
    });
    showToast('Vídeo adicionado à galeria!');
  };

  const handleRemoveVideoFromGallery = (index: number) => {
    if (!editingProgram) return;
    setEditingProgram({
      ...editingProgram,
      videoGallery: (editingProgram.videoGallery || []).filter((_, i) => i !== index),
    });
  };

  const promptDeleteProgram = (prog: { id: number; title: string }) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Programa da Grade?',
      message: `Tem certeza que deseja excluir permanentemente o programa "${prog.title}" e seu Hotsite? Esta ação removerá o item da grade de programação e do banco de dados Cloud SQL.`,
      confirmText: 'Sim, Excluir Programa',
      onConfirm: async () => {
        try {
          await api.deleteScheduleItem(prog.id);
          showToast('Programa excluído com sucesso!');
          if (editingProgram?.id === prog.id) {
            setEditingProgram(null);
            setActiveSection('schedule');
          }
          await loadSchedule();
          onRefreshData?.();
        } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Erro ao excluir programa';
                  showToast(message);
                }
      },
    });
  };

  // Shoutouts Actions
  const handleToggleApproveShoutout = async (id: number, currentApproved: boolean) => {
    try {
      await api.adminApproveShoutout(id, !currentApproved);
      setShoutoutsList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isApproved: !currentApproved } : s))
      );
      showToast(currentApproved ? 'Recado ocultado do mural' : 'Recado aprovado para o ar!');
      onRefreshData?.();
    } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao atualizar moderação';
          showToast(message);
        }
  };

  const promptDeleteShoutout = (id: number, author: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Recado do Mural?',
      message: `Deseja excluir permanentemente o recado de "${author}" do banco de dados?`,
      confirmText: 'Excluir Recado',
      onConfirm: async () => {
        try {
          await api.adminDeleteShoutout(id);
          setShoutoutsList((prev) => prev.filter((s) => s.id !== id));
          showToast('Recado excluído do banco');
          onRefreshData?.();
        } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Erro ao excluir recado';
                  showToast(message);
                }
      },
    });
  };

  // Song Requests Actions
  const handleUpdateSongStatus = async (id: number, newStatus: string) => {
    try {
      await api.adminUpdateSongRequestStatus(id, newStatus);
      setRequestsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      showToast(`Status do pedido atualizado: ${newStatus.toUpperCase()}`);
      onRefreshData?.();
    } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao atualizar status do pedido';
          showToast(message);
        }
  };

  const promptDeleteSongRequest = (id: number, songTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Pedido Musical?',
      message: `Deseja excluir permanentemente o pedido da música "${songTitle}" da fila do estúdio?`,
      confirmText: 'Excluir Pedido',
      onConfirm: async () => {
        try {
          await api.adminDeleteSongRequest(id);
          setRequestsList((prev) => prev.filter((r) => r.id !== id));
          showToast('Pedido musical excluído');
          onRefreshData?.();
        } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Erro ao excluir pedido';
                  showToast(message);
                }
      },
    });
  };

  // Institutional Actions (REBELDIA)
  const handleSaveInstitutional = async () => {
    setIsSavingInstitutional(true);
    try {
      saveInstitutionalData(institutionalForm);
      await api.saveInstitutionalData(institutionalForm);

      // Salva retardo no stationConfig
      if (onSaveStationConfig && stationConfig) {
        onSaveStationConfig({
          ...stationConfig,
          metadataDelaySeconds,
        });
      } else {
        await api.saveStationConfig({ metadataDelaySeconds });
        try {
          const saved = localStorage.getItem('rebeldia_station_config');
          const parsed = saved ? JSON.parse(saved) : {};
          parsed.metadataDelaySeconds = metadataDelaySeconds;
          localStorage.setItem('rebeldia_station_config', JSON.stringify(parsed));
        } catch {}
      }

      showToast('Dados institucionais e retardo de sincronia salvos!');
      onRefreshData?.();

      // Fechar a guia/modal automaticamente após salvar
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      showToast('Erro ao salvar dados institucionais');
    } finally {
      setIsSavingInstitutional(false);
    }
  };

  const handleResetInstitutional = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restaurar Padrão Institucional?',
      message: 'Deseja restaurar todos os textos do Manifesto, História e Contatos da REBELDIA para os valores originais de fábrica?',
      confirmText: 'Restaurar Padrão',
      onConfirm: async () => {
        setInstitutionalForm(DEFAULT_INSTITUTIONAL_DATA);
        saveInstitutionalData(DEFAULT_INSTITUTIONAL_DATA);
        await api.saveInstitutionalData(DEFAULT_INSTITUTIONAL_DATA);
        showToast('Dados restaurados para o padrão original da REBELDIA!');
        onRefreshData?.();
      },
    });
  };

  const roleScopedScheduleList = useMemo(() => {
    if (authRole === 'admin') return scheduleList;
    if (authRole === 'host' && currentLoggedInHost) {
      return scheduleList.filter((prog) =>
        isHostOwnerOfProgram(currentLoggedInHost, {
          id: String(prog.id),
          title: prog.title,
          host: prog.host,
          hostAccountId: prog.hostAccountId || undefined,
        })
      );
    }
    return [];
  }, [authRole, currentLoggedInHost, scheduleList]);

  const activeProgramsCount = useMemo(
    () => roleScopedScheduleList.filter((p) => p.isActive !== false).length,
    [roleScopedScheduleList]
  );
  const inactiveProgramsCount = useMemo(
    () => roleScopedScheduleList.filter((p) => p.isActive === false).length,
    [roleScopedScheduleList]
  );

  // Filtered Programs (scoped to role)
  const filteredSchedule = useMemo(() => {
    return roleScopedScheduleList.filter((prog) => {
      const isProgActive = prog.isActive !== false;
      const matchStatus =
        scheduleStatusFilter === 'all' ||
        (scheduleStatusFilter === 'active' && isProgActive) ||
        (scheduleStatusFilter === 'inactive' && !isProgActive);
      const matchDay = scheduleFilterDay === -2 || prog.dayOfWeek === scheduleFilterDay;
      const matchSearch =
        !scheduleSearchQuery.trim() ||
        prog.title.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
        prog.host.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
        (prog.genre && prog.genre.toLowerCase().includes(scheduleSearchQuery.toLowerCase()));
      return matchStatus && matchDay && matchSearch;
    });
  }, [roleScopedScheduleList, scheduleStatusFilter, scheduleFilterDay, scheduleSearchQuery]);

  // Counts for Badges
  const pendingShoutoutsCount = shoutoutsList.filter((s) => !s.isApproved).length;
  const pendingRequestsCount = requestsList.filter((r) => r.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/85 backdrop-blur-md overflow-hidden"
    >
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[80] px-4 py-3 rounded-2xl bg-zinc-900 text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-amber-500/50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Console Modal Shell - Fullscreen with 10px margin on mobile, 30px on desktop */}
      <div
        className="bg-zinc-950 border border-zinc-800/80 rounded-2xl w-full h-[calc(100vh-20px)] sm:h-[calc(100vh-60px)] flex flex-col shadow-2xl overflow-hidden text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP STATUS BAR */}
        <header className="h-16 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between gap-4 bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBackToSite();
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5 border border-zinc-700/60 cursor-pointer active:scale-95"
              title="Voltar para a Rádio sem deslogar (mantém sessão ativa)"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Voltar ao Site</span>
            </button>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-amber-500/20">
                <Radio className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-white font-display tracking-tight">
                    Rebeldia Studio
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                    Admin Console
                  </span>
                  <span className="hidden md:flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    PostgreSQL Live
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    loadSchedule();
                    loadHostAccounts();
                    loadSwaps();
                    if (authRole === 'admin') {
                      loadShoutouts();
                      loadRequests();
                      loadStats();
                    }
                    showToast('Dados sincronizados com o banco de dados!');
                  }}
                  className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/50 transition cursor-pointer"
                  title="Atualizar dados do servidor"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Desconectar do painel e encerrar sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sair</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBackToSite();
              }}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer border border-zinc-700/60 active:scale-95"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* AUTH CHECK: LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
            <div className="w-full max-w-md space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/10">
                  {loginMode === 'host' ? <Phone className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
                </div>
                <h3 className="text-2xl font-black text-white font-display">
                  {loginMode === 'host' ? 'Painel do Locutor' : 'Acesso Admin Geral'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {loginMode === 'host'
                    ? 'Entre exclusivamente com o seu número de celular e senha pessoal para gerenciar seus programas, assumir o Coringa e trocar horários.'
                    : 'Acesso completo da diretoria para gerenciar toda a grade, locutores, banners, SEO e configurações globais.'}
                </p>
              </div>

              {/* Dual Login Mode Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('host');
                    setLoginError('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginMode === 'host'
                      ? 'bg-emerald-500 text-black shadow-sm font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Locutor (Celular)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('admin');
                    setLoginError('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginMode === 'admin'
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Geral</span>
                </button>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginMode === 'host' ? (
                <form onSubmit={handleHostPanelLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Número do Celular (com DDD)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={hostPhoneInput}
                        onChange={(e) => setHostPhoneInput(e.target.value)}
                        placeholder="(48) 99999-9999"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono tabular-nums focus:outline-none focus:border-emerald-400 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Sua Senha Pessoal
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={hostPasswordInput}
                        onChange={(e) => setHostPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-400 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4 text-black" />
                    <span>{isLoadingAuth ? 'Verificando...' : 'Entrar no Painel do Locutor'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      E-mail ou Usuário
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin@rebeldiafm.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Senha de Administrador
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4 text-black" />
                    <span>{isLoadingAuth ? 'Verificando...' : 'Acessar Console Admin Geral'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* AUTHENTICATED STUDIO CONSOLE: SIDEBAR + CONTENT AREA */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* --- LATERAL SUBMENUS / SIDEBAR --- */}
            <aside className="w-full md:w-64 lg:w-72 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col shrink-0 overflow-y-auto">
              {/* Studio Info Badge */}
              <div className="p-4 border-b border-zinc-800/60 hidden md:block">
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      {authRole === 'host' ? 'Locutor Conectado' : 'Administrador Conectado'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  {authRole === 'host' && currentLoggedInHost ? (
                    <>
                      <p className="text-xs font-bold text-white truncate">{currentLoggedInHost.name}</p>
                      <span className="text-[10px] text-emerald-400 font-mono tabular-nums block">
                        {formatPhoneDisplay(currentLoggedInHost.whatsapp || '')}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono block">Nível: Locutor</span>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-white truncate">Diretoria de Programação</p>
                      <span className="text-[10px] text-amber-400 font-mono block">Nível: Super Admin</span>
                    </>
                  )}
                </div>
              </div>

              {/* Lateral Submenu Groups */}
              {authRole === 'host' ? (
                <nav className="p-3 space-y-2 flex-1">
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono block mb-2">
                    Painel do Locutor
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('schedule');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'schedule' || activeSection === 'new_program'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4" />
                      <span>Meus Programas</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'schedule' || activeSection === 'new_program'
                          ? 'bg-black/20 text-black'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {roleScopedScheduleList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('coringa');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'coringa'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Assumir Coringa</span>
                    </div>
                    {liveTakeover?.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white">
                        NO AR
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('swaps');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'swaps'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Repeat className="w-4 h-4 text-amber-400" />
                      <span>Troca de Horário</span>
                    </div>
                    {localSwaps.filter((s) => s.type === 'one_time' && s.status === 'active').length > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeSection === 'swaps'
                            ? 'bg-black/20 text-black'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {localSwaps.filter((s) => s.type === 'one_time' && s.status === 'active').length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('my_profile');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'my_profile'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>Meu Perfil & Senha</span>
                    </div>
                  </button>
                </nav>
              ) : (
              <nav className="p-3 space-y-6 flex-1">
                {/* GRUPO 1: PROGRAMAÇÃO & NO AR */}
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-amber-400/90 font-mono block">
                    No Ar & Programação
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('schedule');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'schedule'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4" />
                      <span>Grade & Programas</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'schedule' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {scheduleList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenNewProgram}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      activeSection === 'new_program'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Programa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('swaps');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'swaps'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Repeat className="w-4 h-4 text-amber-400" />
                      <span>Trocas de Horário</span>
                    </div>
                    {localSwaps.length > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          activeSection === 'swaps' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {localSwaps.length}
                      </span>
                    )}
                  </button>

                  {/* Mixcloud & Programas Gravados */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('mixcloud');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'mixcloud'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Disc className="w-4 h-4 text-blue-400" />
                      <span>Mixcloud & Gravados</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'mixcloud'
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                      }`}
                    >
                      {scheduleList.filter((p) => p.mixcloudUser || p.mixcloudUrl).length}/{scheduleList.length}
                    </span>
                  </button>

                  {/* Locutores & REB */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('hosts');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'hosts'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-amber-400/60 bg-black">
                        <img src="/reb_mascot.jpg" alt="REB" className="w-full h-full object-cover" />
                      </div>
                      <span>Locutores & Equipe REB</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'hosts' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {hostAccountsList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSection('banners');
                      setEditingProgram(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'banners'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>Promoções & Banners</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'banners' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {bannersList.filter((b) => b.isActive).length} no ar
                    </span>
                  </button>
                </div>

                {/* GRUPO 2: INTERATIVIDADE & OUVINTES */}
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono block">
                    Interatividade Ouvintes
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectSection('shoutouts')}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'shoutouts'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>Mural de Recados</span>
                    </div>
                    {pendingShoutoutsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-600 text-white animate-pulse">
                        {pendingShoutoutsCount} novos
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
                        {shoutoutsList.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSection('requests')}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'requests'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Music className="w-4 h-4" />
                      <span>Pedidos Musicais</span>
                    </div>
                    {pendingRequestsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-black">
                        {pendingRequestsCount} pend.
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
                        {requestsList.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* GRUPO 3: INSTITUCIONAL & MARCA */}
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-amber-400/90 font-mono block">
                    Institucional & Marca
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectSection('rebeldia')}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'rebeldia'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80 border border-amber-500/20 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>REBELDIA</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'rebeldia' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      Rádio Livre
                    </span>
                  </button>
                </div>

                {/* GRUPO 4: BUSCA & REDES SOCIAIS (SEO & GEO YOAST) */}
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono block">
                    Busca & Redes Sociais
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectSection('seo')}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'seo'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80 border border-emerald-500/20 bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>SEO & GEO (Yoast)</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        activeSection === 'seo' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      Google
                    </span>
                  </button>
                </div>

                {/* GRUPO 5: SISTEMA & ESTATÍSTICAS */}
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono block">
                    Banco de Dados
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectSection('stats')}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      activeSection === 'stats'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4" />
                      <span>Visão Geral & DB</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Cloud SQL</span>
                  </button>
                </div>
              </nav>
              )}

              {/* Sidebar Footer */}
              <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 hidden md:block">
                <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                  <span>Rebeldia Studio Engine</span>
                  <span>v2.6 Pro</span>
                </div>
              </div>
            </aside>

            {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-900/40">
              {/* ======================================================== */}
              {/* SESSÃO 1: GRADE DE PROGRAMAÇÃO (LISTAGEM & VISUALIZAÇÃO) */}
              {/* ======================================================== */}
              {activeSection === 'schedule' && (
                <div className="space-y-5">
                  {/* Top Bar da Sessão de Programas */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-400" />
                        {authRole === 'host' ? 'Meus Programas & Hotsites' : 'Grade de Programação & Hotsites'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {roleScopedScheduleList.length}{' '}
                        {authRole === 'host' ? 'programa(s) vinculado(s) a você' : 'programas cadastrados'} ({activeProgramsCount} ativos no ar, {inactiveProgramsCount} desativados).
                      </p>
                    </div>

                    {authRole === 'admin' ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSyncOfficialContent}
                          disabled={isSyncingOfficial}
                          className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Restaura e publica todos os 24 programas e 17 locutores da ficha cadastral oficial no banco"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>{isSyncingOfficial ? 'Publicando...' : 'Publicar Grade Oficial'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectSection('mixcloud')}
                          className="px-3.5 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Gerenciador Central de Mixcloud para todos os hotsites"
                        >
                          <Disc className="w-4 h-4 text-blue-400" />
                          <span>Mixcloud ({scheduleList.filter((p) => p.mixcloudUser || p.mixcloudUrl).length}/{scheduleList.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenNewProgram}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Cadastrar Novo Programa</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSelectSection('coringa')}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Assumir Coringa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSection('swaps')}
                          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Repeat className="w-4 h-4 text-amber-400" />
                          <span>Trocar Horário</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Destaque: Locutor REB (Curadoria 24h & Locutor Oficial) - Somente Admin Geral */}
                  {authRole === 'admin' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/40 relative overflow-hidden shadow-lg group">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src="/reb_mascot.jpg"
                            alt="REB Oficial"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md group-hover:scale-105 transition"
                          />
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                            24h
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-sm flex items-center gap-1 font-mono font-bold">
                              <Sparkles className="w-3 h-3" />
                              Locutor Oficial 24h
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono">
                              Programação Contínua & Intervalos
                            </span>
                          </div>

                          <h4 className="text-lg font-black text-white font-display flex items-center gap-2">
                            REB
                            <span className="text-xs text-amber-400 font-mono font-normal">(@reb)</span>
                          </h4>
                          
                          <p className="text-xs text-zinc-300 max-w-xl line-clamp-2">
                            {DEFAULT_REB_PROGRAM.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={handleEditRebHotsite}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                          title="Personalizar fotos, bio, playlist e destaques do Hotsite do REB"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar Hotsite do REB</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveSection('hosts')}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Gerenciar conta e credenciais do locutor REB"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Conta Locutor REB</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Barra de Filtros Rápidos, Status & Busca */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Filtro por Status: Todos / Ativos / Desativados */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setScheduleStatusFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            scheduleStatusFilter === 'all'
                              ? 'bg-amber-500 text-black shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Todos ({roleScopedScheduleList.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setScheduleStatusFilter('active')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            scheduleStatusFilter === 'active'
                              ? 'bg-emerald-500 text-black shadow-sm'
                              : 'text-zinc-400 hover:text-emerald-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${scheduleStatusFilter === 'active' ? 'bg-black' : 'bg-emerald-400'}`} />
                          Ativos ({activeProgramsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setScheduleStatusFilter('inactive')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            scheduleStatusFilter === 'inactive'
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-red-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${scheduleStatusFilter === 'inactive' ? 'bg-white' : 'bg-red-400'}`} />
                          Desativados ({inactiveProgramsCount})
                        </button>
                      </div>

                      {/* Filtro por Dias */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setScheduleFilterDay(-2)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            scheduleFilterDay === -2
                              ? 'bg-zinc-800 text-white font-black shadow-sm border border-zinc-700'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                        >
                          Dias: Todos
                        </button>
                        {DAYS_MAP.map((d) => {
                          const count = roleScopedScheduleList.filter((p) => p.dayOfWeek === d.id).length;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setScheduleFilterDay(d.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                scheduleFilterDay === d.id
                                  ? 'bg-zinc-800 text-white font-black shadow-sm border border-zinc-700'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                              }`}
                            >
                              <span>{d.short}</span>
                              {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Busca Rápida */}
                    <div className="relative min-w-[220px]">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={scheduleSearchQuery}
                        onChange={(e) => setScheduleSearchQuery(e.target.value)}
                        placeholder="Buscar por programa, locutor..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Grid de Cards de Programas */}
                  {filteredSchedule.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                      <Radio className="w-10 h-10 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold text-white">
                        {authRole === 'host' && roleScopedScheduleList.length === 0
                          ? 'Nenhum programa fixo vinculado a você'
                          : 'Nenhum programa encontrado'}
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        {authRole === 'host' && roleScopedScheduleList.length === 0
                          ? 'Você ainda pode assumir a programação ao vivo agora mesmo usando o Modo Coringa.'
                          : 'Altere os filtros de busca para localizar o programa desejado.'}
                      </p>
                      {authRole === 'admin' ? (
                        <button
                          type="button"
                          onClick={handleOpenNewProgram}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Programa Agora</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectSection('coringa')}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Assumir Coringa no Ar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredSchedule.map((prog) => {
                        const dayObj = DAYS_MAP.find((d) => d.id === prog.dayOfWeek);
                        const dayLabel = prog.daysLabel || dayObj?.label || 'Todos os Dias';
                        const isProgActive = prog.isActive !== false;
                        
                        let highlightsCount = 0;
                        if (prog.highlightsJson) {
                          try {
                            highlightsCount = JSON.parse(prog.highlightsJson).length;
                          } catch {}
                        }

                        let playlistCount = 0;
                        if (prog.playlistJson) {
                          try {
                            playlistCount = JSON.parse(prog.playlistJson).length;
                          } catch {}
                        }

                        return (
                          <div
                            key={prog.id}
                            className={`border rounded-2xl p-4 transition flex flex-col justify-between gap-3 group relative overflow-hidden shadow-md ${
                              isProgActive
                                ? 'bg-zinc-950 border-zinc-800 hover:border-amber-500/50'
                                : 'bg-zinc-950/70 border-zinc-800/80 border-dashed opacity-80 hover:opacity-100 hover:border-zinc-700'
                            }`}
                          >
                            {/* Card Top: Horário, Dia e Gênero */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0 overflow-hidden relative shadow-inner">
                                  {prog.avatarUrl ? (
                                    <img
                                      src={prog.avatarUrl}
                                      alt={prog.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                  ) : (
                                    <Radio className="w-6 h-6 text-amber-400" />
                                  )}
                                </div>

                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400" />
                                      {prog.startTime} - {prog.endTime}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono">
                                      {dayLabel}
                                    </span>
                                    {isProgActive ? (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        Ativo
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/40 text-red-400 font-mono text-[10px] font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                        Desativado
                                      </span>
                                    )}
                                  </div>
                                  <h4 className={`font-bold text-sm transition truncate ${isProgActive ? 'text-white group-hover:text-amber-300' : 'text-zinc-400'}`}>
                                    {prog.title}
                                  </h4>
                                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                                    <Mic2 className="w-3 h-3 text-zinc-500" />
                                    <span className="font-medium text-zinc-200">{prog.host}</span>
                                    {prog.hostRole && <span className="text-zinc-500 text-[11px]">({prog.hostRole})</span>}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Card Middle: Sinopse & Tags do Hotsite */}
                            {prog.description && (
                              <p className="text-xs text-zinc-400 line-clamp-2 bg-zinc-900/60 p-2.5 rounded-xl border border-white/5">
                                {prog.description}
                              </p>
                            )}

                            {/* Badges de Conteúdo do Hotsite */}
                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                              {prog.genre && (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                                  🎸 {prog.genre}
                                </span>
                              )}
                              {highlightsCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-red-950/40 border border-red-800/40 text-red-300 flex items-center gap-1">
                                  <Flame className="w-2.5 h-2.5" />
                                  {highlightsCount} quadros
                                </span>
                              )}
                              {playlistCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 flex items-center gap-1">
                                  <Music className="w-2.5 h-2.5" />
                                  {playlistCount} faixas
                                </span>
                              )}
                              {prog.bannerUrl && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-1">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  Banner Ativo
                                </span>
                              )}
                              {prog.mixcloudUser ? (
                                <span className="px-2 py-0.5 rounded-md bg-blue-950/50 border border-blue-600/50 text-blue-300 flex items-center gap-1 font-mono">
                                  <Disc className="w-2.5 h-2.5 text-blue-400" />
                                  mixcloud/{prog.mixcloudUser}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center gap-1 font-mono">
                                  <Disc className="w-2.5 h-2.5 text-zinc-600" />
                                  Sem Mixcloud
                                </span>
                              )}
                            </div>

                            {/* Card Bottom: Ações Rápidas */}
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                              <div className="flex items-center gap-1.5">
                                {authRole === 'admin' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateProgram(prog)}
                                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-bold transition flex items-center gap-1 border border-zinc-800 cursor-pointer"
                                      title="Duplicar este programa para outro dia"
                                    >
                                      <Copy className="w-3 h-3" />
                                      <span>Clonar</span>
                                    </button>

                                    {/* Botão Ativar / Desativar Programa */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleProgramActive(prog, e)}
                                      disabled={togglingProgId === prog.id}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                                        isProgActive
                                          ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/40 hover:border-emerald-500/60 shadow-sm'
                                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                                      }`}
                                      title={
                                        isProgActive
                                          ? 'Clique para desativar este programa da grade (fora do ar)'
                                          : 'Clique para ativar este programa na grade da rádio'
                                      }
                                    >
                                      {togglingProgId === prog.id ? (
                                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                      ) : isProgActive ? (
                                        <Power className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <PowerOff className="w-3 h-3 text-red-400" />
                                      )}
                                      <span>{isProgActive ? 'Ativo' : 'Desativado'}</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectSection('swaps')}
                                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 text-[11px] font-bold transition flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
                                    title="Solicitar troca pontual ou permanente de horário"
                                  >
                                    <Repeat className="w-3 h-3" />
                                    <span>Trocar Horário</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickMixcloud(prog)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                                    prog.mixcloudUser || prog.mixcloudUrl
                                      ? 'bg-blue-950/50 hover:bg-blue-900/70 text-blue-300 border-blue-600/40'
                                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                                  }`}
                                  title="Cadastrar endereço Mixcloud deste hotsite"
                                >
                                  <Disc className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Mixcloud</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProgram(prog)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
                                  title="Editar programa e hotsite"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                {authRole === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => promptDeleteProgram({ id: prog.id, title: prog.title })}
                                    className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/60 text-red-400 border border-red-800/30 transition cursor-pointer"
                                    title="Excluir programa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO 2: CADASTRO / EDIÇÃO TOTALMENTE REFORMULADA       */}
              {/* ======================================================== */}
              {activeSection === 'new_program' && editingProgram && (
                <div className="space-y-5">
                  {/* Top Bar do Formulário com Indicador de Passos */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-white font-display">
                            {editingProgram.id ? `Editar: ${editingProgram.title || 'Programa'}` : 'Cadastrar Novo Programa & Hotsite'}
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Preencha as informações da transmissão, perfil do locutor e dados editoriais do Hotsite.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProgram(null);
                            setActiveSection('schedule');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition border border-zinc-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSavingProgram}
                          onClick={handleSaveProgram}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{isSavingProgram ? 'Salvando...' : 'Publicar no Ar'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Step Navigator (4 Etapas Intuitivas) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className={`p-3 rounded-2xl text-left transition border ${
                          formStep === 1
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                            : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                        }`}
                      >
                        <span className={`text-[10px] font-mono block ${formStep === 1 ? 'text-black/70' : 'text-amber-400'}`}>
                          Passo 01
                        </span>
                        <span className="text-xs font-bold block truncate">1. Grade & Horários</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className={`p-3 rounded-2xl text-left transition border ${
                          formStep === 2
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                            : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                        }`}
                      >
                        <span className={`text-[10px] font-mono block ${formStep === 2 ? 'text-black/70' : 'text-amber-400'}`}>
                          Passo 02
                        </span>
                        <span className="text-xs font-bold block truncate">2. Locutor & Perfil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStep(3)}
                        className={`p-3 rounded-2xl text-left transition border ${
                          formStep === 3
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                            : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                        }`}
                      >
                        <span className={`text-[10px] font-mono block ${formStep === 3 ? 'text-black/70' : 'text-amber-400'}`}>
                          Passo 03
                        </span>
                        <span className="text-xs font-bold block truncate">3. Hotsite & Visual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStep(4)}
                        className={`p-3 rounded-2xl text-left transition border ${
                          formStep === 4
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                            : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                        }`}
                      >
                        <span className={`text-[10px] font-mono block ${formStep === 4 ? 'text-black/70' : 'text-amber-400'}`}>
                          Passo 04
                        </span>
                        <span className="text-xs font-bold block truncate">4. Mixcloud & Trilhas</span>
                      </button>
                    </div>
                  </div>

                  {/* Split View: Formulário da Etapa Ativa (Esq) + Live Preview do Card & Hotsite (Dir) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* FORMULÁRIO DE CADASTRO (7 ou 8 colunas) */}
                    <form onSubmit={handleSaveProgram} className="lg:col-span-7 xl:col-span-8 space-y-4">
                      {/* --- ETAPA 1: GRADE & HORÁRIOS --- */}
                      {formStep === 1 && (
                        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-5 animate-in fade-in duration-150">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-amber-400" />
                              Agendamento na Grade da Rádio
                            </h4>
                            <p className="text-xs text-zinc-400">
                              Defina em quais dias da semana e horários este programa entra no ar.
                            </p>
                          </div>

                          {/* Status de Ativação do Programa (No Ar / Desativado) - Somente Admin Geral */}
                          {authRole === 'admin' && (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-2 h-2 rounded-full ${editingProgram.isActive !== false ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">
                                  Status na Programação
                                </span>
                                {editingProgram.isActive !== false ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                                    <Power className="w-3 h-3 text-emerald-400" />
                                    Programa Ativo (No Ar)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-[10px] font-bold flex items-center gap-1">
                                    <PowerOff className="w-3 h-3 text-red-400" />
                                    Programa Desativado (Pausado)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400">
                                {editingProgram.isActive !== false
                                  ? 'Este programa está ativo na grade pública e entrará no ar nos horários agendados.'
                                  : 'Programa pausado. Não será exibido aos ouvintes na grade nem entrará no player ao vivo.'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingProgram({
                                  ...editingProgram,
                                  isActive: editingProgram.isActive === false ? true : false,
                                })
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer shrink-0 shadow-sm ${
                                editingProgram.isActive !== false
                                  ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              {editingProgram.isActive !== false ? (
                                <>
                                  <Power className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Ativo</span>
                                </>
                              ) : (
                                <>
                                  <PowerOff className="w-3.5 h-3.5 text-red-400" />
                                  <span>Desativado</span>
                                </>
                              )}
                            </button>
                          </div>
                          )}

                          {/* Nome do Programa */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                              Título / Nome do Programa *
                            </label>
                            <input
                              type="text"
                              required
                              value={editingProgram.title}
                              onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                              placeholder="Ex: Rebeldia Total, Madrugada Rock, Voz da Periferia..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {authRole === 'host' ? (
                            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Horário Oficial na Grade (Promessa Fixa)</span>
                                </span>
                                <div className="text-xs text-white font-bold font-mono tabular-nums">
                                  {editingProgram.daysLabel} • {editingProgram.startTime} – {editingProgram.endTime}
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                  Para alterar seu dia ou horário com outro programa (por 1 dia ou permanente), utilize a guia de Troca de Horário.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProgram(null);
                                  handleSelectSection('swaps');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <Repeat className="w-3.5 h-3.5" />
                                <span>Precisa trocar de horário?</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Seletor Visual de Dias da Semana */}
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                  Dia da Semana Principal na Grade *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {DAYS_MAP.map((d) => (
                                    <button
                                      key={d.id}
                                      type="button"
                                      onClick={() => {
                                        setEditingProgram({
                                          ...editingProgram,
                                          dayOfWeek: d.id,
                                          daysLabel: d.id === -1 ? 'Todos os Dias' : d.id === 1 ? 'Segunda a Sexta' : d.label
                                        });
                                      }}
                                      className={`p-2.5 rounded-xl text-xs font-bold transition border text-left ${
                                        editingProgram.dayOfWeek === d.id
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                                      }`}
                                    >
                                      {d.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Rótulo de Dias Personalizado */}
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                  Texto de Exibição dos Dias (no Site)
                                </label>
                                <input
                                  type="text"
                                  value={editingProgram.daysLabel}
                                  onChange={(e) => setEditingProgram({ ...editingProgram, daysLabel: e.target.value })}
                                  placeholder="Ex: Segunda a Sexta, Todas as Quintas, Aos Domingos"
                                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              {/* Horários com Presets */}
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                  Horário de Transmissão (Início e Término) *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-[10px] text-zinc-400 block mb-1">Início (HH:MM):</span>
                                    <input
                                      type="text"
                                      required
                                      value={editingProgram.startTime}
                                      onChange={(e) => setEditingProgram({ ...editingProgram, startTime: e.target.value })}
                                      placeholder="08:00"
                                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-center"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-zinc-400 block mb-1">Término (HH:MM):</span>
                                    <input
                                      type="text"
                                      required
                                      value={editingProgram.endTime}
                                      onChange={(e) => setEditingProgram({ ...editingProgram, endTime: e.target.value })}
                                      placeholder="12:00"
                                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-center"
                                    />
                                  </div>
                                </div>

                                {/* Botões de Horários Rápidos */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  <span className="text-[10px] text-zinc-500 font-mono">Faixas rápidas:</span>
                                  {TIME_PRESETS.map((t, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setEditingProgram({ ...editingProgram, startTime: t.start, endTime: t.end })}
                                      className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-800"
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* --- SEÇÃO DE REPRISE DO PROGRAMA NA GRADE --- */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                                  <Repeat className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                      Reprise na Grade da Rádio
                                    </h5>
                                    {editingProgram.hasReprise && (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                                        Ativada
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-400">
                                    Defina o dia e horário alternativo para a reexibição/reprise deste programa.
                                  </p>
                                </div>
                              </div>

                              {/* Toggle Switch */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = !editingProgram.hasReprise;
                                  setEditingProgram({
                                    ...editingProgram,
                                    hasReprise: nextVal,
                                    ...(nextVal
                                      ? {
                                          repriseDayOfWeek: editingProgram.repriseDayOfWeek ?? 6,
                                          repriseStartTime: editingProgram.repriseStartTime || '22:00',
                                          repriseEndTime: editingProgram.repriseEndTime || '00:00',
                                          repriseDaysLabel: editingProgram.repriseDaysLabel || 'Sábado às 22:00',
                                        }
                                      : {
                                          repriseStartTime: '',
                                          repriseEndTime: '',
                                          repriseDaysLabel: '',
                                        }),
                                  });
                                }}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  editingProgram.hasReprise ? 'bg-amber-500' : 'bg-zinc-800'
                                }`}
                                title={editingProgram.hasReprise ? 'Desativar reprise' : 'Ativar reprise'}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    editingProgram.hasReprise ? 'translate-x-5' : 'translate-x-0 bg-zinc-400'
                                  }`}
                                />
                              </button>
                            </div>

                            {editingProgram.hasReprise && (
                              <div className="pt-3 border-t border-zinc-800/80 space-y-3.5 animate-in fade-in duration-200">
                                {/* Seletor de Dia da Reprise */}
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                                    Dia da Semana da Reprise *
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {DAYS_MAP.map((d) => (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => {
                                          const labelTxt = d.id === -1 ? 'Todos os Dias (Reprise)' : `${d.label} (Reprise)`;
                                          setEditingProgram({
                                            ...editingProgram,
                                            repriseDayOfWeek: d.id,
                                            repriseDaysLabel: labelTxt,
                                          });
                                        }}
                                        className={`p-2 rounded-xl text-xs font-bold transition border text-left ${
                                          editingProgram.repriseDayOfWeek === d.id
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                                        }`}
                                      >
                                        {d.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Texto de Exibição da Reprise */}
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                                    Texto de Exibição da Reprise (no Site)
                                  </label>
                                  <input
                                    type="text"
                                    value={editingProgram.repriseDaysLabel || ''}
                                    onChange={(e) => setEditingProgram({ ...editingProgram, repriseDaysLabel: e.target.value })}
                                    placeholder="Ex: Sábado às 22:00, Domingos às 00:00"
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                  />
                                </div>

                                {/* Horário da Reprise */}
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                                    Horário da Reprise (Início e Término) *
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-[10px] text-zinc-400 block mb-1">Início da Reprise (HH:MM):</span>
                                      <input
                                        type="text"
                                        value={editingProgram.repriseStartTime || ''}
                                        onChange={(e) => setEditingProgram({ ...editingProgram, repriseStartTime: e.target.value })}
                                        placeholder="22:00"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-center"
                                      />
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-zinc-400 block mb-1">Término da Reprise (HH:MM):</span>
                                      <input
                                        type="text"
                                        value={editingProgram.repriseEndTime || ''}
                                        onChange={(e) => setEditingProgram({ ...editingProgram, repriseEndTime: e.target.value })}
                                        placeholder="00:00"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-center"
                                      />
                                    </div>
                                  </div>

                                  {/* Presets Rápidos para Reprise */}
                                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="text-[10px] text-zinc-500 font-mono">Faixas rápidas:</span>
                                    {[
                                      { label: '22h - 00h (Noite)', start: '22:00', end: '00:00' },
                                      { label: '00h - 04h (Madrugada)', start: '00:00', end: '04:00' },
                                      { label: '14h - 16h (Tarde)', start: '14:00', end: '16:00' },
                                      { label: '18h - 20h (Fim de Tarde)', start: '18:00', end: '20:00' },
                                    ].map((t, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setEditingProgram({ ...editingProgram, repriseStartTime: t.start, repriseEndTime: t.end })}
                                        className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-800"
                                      >
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Resumo Visual do Fluxo da Grade */}
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                                  <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5" /> Fluxo de Agenda deste Programa:
                                  </span>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs pt-1">
                                    <div className="flex items-center gap-1 text-zinc-200">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                      <span>Transmissão Oficial: <strong>{editingProgram.daysLabel || 'Principal'}</strong> ({editingProgram.startTime} - {editingProgram.endTime})</span>
                                    </div>
                                    <span className="hidden sm:inline text-zinc-600">•</span>
                                    <div className="flex items-center gap-1 text-amber-300">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                      <span>Reprise no Ar: <strong>{editingProgram.repriseDaysLabel || 'Reprise'}</strong> ({editingProgram.repriseStartTime} - {editingProgram.repriseEndTime})</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Gênero Musical & Tags Rápidas */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                              Gênero Musical & Estilo
                            </label>
                            <input
                              type="text"
                              value={editingProgram.genre}
                              onChange={(e) => setEditingProgram({ ...editingProgram, genre: e.target.value })}
                              placeholder="Ex: Rock Clássico, MPB, Indie Rock, Heavy Metal..."
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {GENRE_PRESETS.map((g, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setEditingProgram({ ...editingProgram, genre: g })}
                                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800"
                                >
                                  + {g}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Botão Avançar */}
                          <div className="pt-3 border-t border-zinc-800 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setFormStep(2)}
                              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-1.5"
                            >
                              <span>Avançar: Locutor & Perfil</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* --- ETAPA 2: LOCUTOR & LOGO DO PROGRAMA --- */}
                      {formStep === 2 && (
                        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 animate-in fade-in duration-150">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <User className="w-4 h-4 text-amber-400" />
                              Locutor & Logo do Programa
                            </h4>
                            <p className="text-xs text-zinc-400">
                              O nome e a foto do locutor vêm diretamente do Cadastro de Locutores da rádio.
                            </p>
                          </div>

                          {/* 1. SELEÇÃO DO LOCUTOR VINCULADO (Somente Admin altera titularidade) */}
                          {authRole === 'admin' && (
                          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                                <Mic2 className="w-4 h-4 text-amber-400" />
                                <span>Selecione o Locutor / Apresentador *</span>
                              </label>
                              <span className="text-[10px] text-amber-400/80 font-mono">
                                {hostAccountsList.length} locutores cadastrados
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {hostAccountsList
                                .filter((h) => !isCoringaHost(h))
                                .map((h) => {
                                const isSelected =
                                  (editingProgram.hostAccountId && editingProgram.hostAccountId === h.id) ||
                                  editingProgram.host.toLowerCase() === h.name.toLowerCase();
                                return (
                                  <button
                                    key={h.id}
                                    type="button"
                                    onClick={() => {
                                      setEditingProgram({
                                        ...editingProgram,
                                        host: h.name,
                                        hostAccountId: h.id,
                                        hostRole: h.role || editingProgram.hostRole || 'Locutor & Apresentador',
                                        avatarUrl: h.avatarUrl || '',
                                        hostBio: h.bio || editingProgram.hostBio,
                                        whatsappNumber: h.whatsapp || editingProgram.whatsappNumber || '5548991984678',
                                      });
                                      showToast(`Locutor ${h.name} vinculado com foto e perfil!`);
                                    }}
                                    className={`p-2.5 rounded-xl border flex items-center gap-3 text-left transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/50'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                                    }`}
                                  >
                                    <img
                                      src={h.avatarUrl || '/reb_mascot.jpg'}
                                      alt={h.name}
                                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-700 bg-zinc-950"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold truncate">{h.name}</span>
                                        {h.id === 'host-reb' && (
                                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold">REB</span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-zinc-400 truncate">{h.role || `@${h.username}`}</p>
                                    </div>
                                    {isSelected ? (
                                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                                    ) : (
                                      <span className="text-[10px] text-zinc-500 font-mono">Selecionar</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          )}

                          {/* CARD DO LOCUTOR VINCULADO ATUALMENTE */}
                          {(() => {
                            const linkedHost = hostAccountsList.find(
                              (h) => (editingProgram.hostAccountId && h.id === editingProgram.hostAccountId) || h.name.toLowerCase() === editingProgram.host.toLowerCase()
                            );
                            const currentPhoto = linkedHost?.avatarUrl || editingProgram.avatarUrl || '/reb_mascot.jpg';
                            const currentName = linkedHost?.name || editingProgram.host || 'Locutor não selecionado';
                            const currentRole = linkedHost?.role || editingProgram.hostRole || 'Locutor & Apresentador';

                            return (
                              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Perfil do Comunicador Vinculado ao Programa</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Sincronizado
                                  </span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <img
                                      src={currentPhoto}
                                      alt={currentName}
                                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/80 shadow-md shrink-0 bg-zinc-900"
                                    />
                                    <div className="space-y-0.5 min-w-0">
                                      <h5 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                        <span>{currentName}</span>
                                        {linkedHost?.id === 'host-reb' && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold">Oficial</span>
                                        )}
                                      </h5>
                                      <p className="text-xs text-zinc-400 truncate">{currentRole}</p>
                                      <p className="text-[10px] text-zinc-500 font-mono">
                                        Foto, celular e senha geridos no perfil pessoal do locutor
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                    {authRole === 'host' ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProgram(null);
                                          handleSelectSection('my_profile');
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                      >
                                        <User className="w-3.5 h-3.5" />
                                        <span>Editar Meu Perfil / Celular</span>
                                      </button>
                                    ) : (
                                      <>
                                        {linkedHost && (
                                          <button
                                            type="button"
                                            onClick={() => setEditingHostAccount(linkedHost)}
                                            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                            title="Alterar a foto ou dados cadastrais deste locutor"
                                          >
                                            <Camera className="w-3.5 h-3.5" />
                                            <span>Alterar Foto no Cadastro</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsAddingNewHost(true);
                                            setActiveSection('hosts');
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Novo Locutor</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
                                  ℹ️ <strong>Importante:</strong> Para manter a integridade visual da emissora, a foto, o celular de atendimento e a senha são centralizados no perfil do locutor.
                                </p>
                              </div>
                            );
                          })()}

                          {/* 2. CAMPO PARA LOGO DO PROGRAMA COM UPLOAD */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3.5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <Radio className="w-4 h-4 text-amber-400" />
                                  <span>Logo do Programa (Identidade Visual da Atração)</span>
                                </label>
                                <p className="text-[11px] text-zinc-400">
                                  Faça o upload do logotipo oficial da atração para ser exibido na grade, no player e no hotsite.
                                </p>
                              </div>

                              <label className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto shrink-0">
                                <Upload className="w-4 h-4 stroke-[2.5]" />
                                <span>Fazer Upload do Logo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadLogoFile}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="flex items-center gap-4 pt-1">
                              {editingProgram.logoUrl ? (
                                <div className="relative group shrink-0">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-lg bg-zinc-950 p-1 flex items-center justify-center">
                                    <img
                                      src={editingProgram.logoUrl}
                                      alt="Logo do Programa"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingProgram({ ...editingProgram, logoUrl: '' })}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs shadow-md cursor-pointer"
                                    title="Remover logo do programa"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                                  <Sparkles className="w-6 h-6 text-zinc-600" />
                                  <span className="text-[9px] mt-1 font-bold">Sem Logo</span>
                                </div>
                              )}

                              <div className="flex-1 space-y-1.5">
                                <label className="block text-[11px] font-bold text-zinc-300">
                                  URL Direta do Logo (ou use o botão de Upload acima):
                                </label>
                                <input
                                  type="url"
                                  value={editingProgram.logoUrl}
                                  onChange={(e) => setEditingProgram({ ...editingProgram, logoUrl: e.target.value })}
                                  placeholder="https://... (ou envie um arquivo do seu computador)"
                                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                                />
                                <span className="text-[10px] text-zinc-500 block font-mono">
                                  Formatos suportados: PNG transparente, SVG, JPG ou WEBP.
                                </span>
                              </div>
                            </div>

                            {/* Sugestões de Logos de Rock da Rádio */}
                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                              <span className="text-[10px] text-zinc-400 block font-mono">
                                Ou selecione um logotipo sugerido da rádio:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {STOCK_LOGOS.map((lg, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setEditingProgram({ ...editingProgram, logoUrl: lg.url })}
                                    className={`p-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                                      editingProgram.logoUrl === lg.url
                                        ? 'bg-amber-500/20 border-amber-500 text-white'
                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                                    }`}
                                  >
                                    <img src={lg.url} alt={lg.label} className="w-8 h-8 rounded-lg object-contain bg-zinc-900 p-0.5" />
                                    <span className="text-[10px] font-medium truncate">{lg.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Mini Biografia */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                              Mini Biografia do Apresentador (Exibida no Hotsite)
                            </label>
                            <textarea
                              rows={3}
                              value={editingProgram.hostBio}
                              onChange={(e) => setEditingProgram({ ...editingProgram, hostBio: e.target.value })}
                              placeholder="Descreva a trajetória do locutor no rádio, seu estilo musical e conexão com o público..."
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-y"
                            />
                          </div>

                          {/* Rede Social & Telefone Automático do Locutor */}
                          {(() => {
                            const linkedHostForPhone = hostAccountsList.find(
                              (h) =>
                                (editingProgram.hostAccountId && h.id === editingProgram.hostAccountId) ||
                                h.name.toLowerCase() === editingProgram.host.toLowerCase()
                            );
                            const inheritedWhatsapp = resolveHostWhatsapp(
                              linkedHostForPhone,
                              stationConfig?.whatsappNumber
                            );

                            return (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                      <span>Instagram (@usuario)</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={editingProgram.instagramHandle}
                                      onChange={(e) => setEditingProgram({ ...editingProgram, instagramHandle: e.target.value })}
                                      placeholder="@locutor"
                                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>WhatsApp Ativo (Herdado do Locutor)</span>
                                    </label>
                                    <div className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-2">
                                      <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums truncate">
                                        {inheritedWhatsapp}
                                      </span>
                                      {linkedHostForPhone && (
                                        <button
                                          type="button"
                                          onClick={() => setEditingHostAccount(linkedHostForPhone)}
                                          className="text-[10px] font-bold text-amber-400 hover:underline shrink-0 cursor-pointer"
                                        >
                                          Alterar no Locutor
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <div className="text-xs space-y-1">
                                    <span className="font-bold text-emerald-300 block">
                                      Telefone vinculado ao Locutor (sem telefone por programa):
                                    </span>
                                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                                      A comunicação com os ouvintes utiliza exclusivamente o WhatsApp cadastrado no perfil do locutor responsável (<strong className="text-white font-mono tabular-nums">{inheritedWhatsapp}</strong>). Se o locutor não tiver número pessoal cadastrado, o sistema usa automaticamente o padrão da rádio (<strong className="text-white font-mono">5548991984678</strong>).
                                    </p>
                                  </div>
                                </div>
                              </>
                            );
                          })()}

                          {/* Navegação */}
                          <div className="pt-3 border-t border-zinc-800 flex justify-between">
                            <button
                              type="button"
                              onClick={() => setFormStep(1)}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
                            >
                              Voltar
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormStep(3)}
                              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Avançar: Hotsite & Visual</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* --- ETAPA 3: HOTSITE, GALERIA & VÍDEOS --- */}
                      {formStep === 3 && (
                        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 animate-in fade-in duration-150">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-amber-400" />
                              Hotsite Editorial, Galeria de Fotos (até 10) & Vídeos (até 4)
                            </h4>
                            <p className="text-xs text-zinc-400">
                              Configure o banner panorâmico, acervo de fotos da atração e vídeos dos bastidores/estúdio.
                            </p>
                          </div>

                          {/* Sinopse rica */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                Sinopse do Programa (Texto Editorial)
                              </label>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {editingProgram.description?.length || 0} caracteres
                              </span>
                            </div>
                            <textarea
                              rows={3}
                              value={editingProgram.description}
                              onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                              placeholder="Explique a proposta do programa, história, estilo musical, momentos marcantes e por que o ouvinte não pode perder..."
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-y"
                            />
                          </div>

                          {/* Banner de Capa Panorâmica */}
                          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                Banner de Capa Panorâmica do Hotsite
                              </label>
                              <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto border border-zinc-700">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload do Banner</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadBannerFile}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <input
                              type="url"
                              value={editingProgram.bannerUrl}
                              onChange={(e) => setEditingProgram({ ...editingProgram, bannerUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                            />

                            {/* Sugestões de Banners */}
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] text-zinc-400 block font-mono">
                                Sugestões de Capas de Rádio em Alta Resolução:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {STOCK_BANNERS.map((bn, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setEditingProgram({ ...editingProgram, bannerUrl: bn.url })}
                                    className={`p-1.5 rounded-xl border flex items-center gap-2 transition overflow-hidden ${
                                      editingProgram.bannerUrl === bn.url
                                        ? 'bg-amber-500/20 border-amber-500'
                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                  >
                                    <img src={bn.url} alt={bn.label} className="w-10 h-7 rounded-lg object-cover" />
                                    <span className="text-[10px] text-zinc-300 font-medium truncate">{bn.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* --- SEÇÃO: GALERIA DE ATÉ 10 FOTOS --- */}
                          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                  <Camera className="w-4 h-4 text-amber-400" />
                                  Galeria de Fotos do Programa ({editingProgram.photoGallery?.length || 0}/10)
                                </h5>
                                <p className="text-[11px] text-zinc-400">
                                  Faça upload de até 10 fotos do estúdio, locutor, eventos e bastidores.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {(editingProgram.photoGallery?.length || 0) < 10 && (
                                  <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                                    <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Upload de Fotos</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={handleUploadGalleryPhotos}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>

                            {/* Inserir URL direta de foto */}
                            {(editingProgram.photoGallery?.length || 0) < 10 && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  id="gallery-photo-url-input"
                                  placeholder="Ou cole a URL de uma foto (https://...)"
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.currentTarget as HTMLInputElement;
                                      if (input.value) {
                                        handleAddGalleryPhotoUrl(input.value);
                                        input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('gallery-photo-url-input') as HTMLInputElement;
                                    if (input && input.value) {
                                      handleAddGalleryPhotoUrl(input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center gap-1 border border-zinc-700 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionar</span>
                                </button>
                              </div>
                            )}

                            {/* Miniaturas da Galeria */}
                            {(editingProgram.photoGallery?.length || 0) > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                                {(editingProgram.photoGallery || []).map((photoUrl, idx) => (
                                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-zinc-700 bg-black">
                                    <img
                                      src={photoUrl}
                                      alt={`Foto ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGalleryPhoto(idx)}
                                        className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition shadow"
                                        title="Excluir foto"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-zinc-300">
                                      #{idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-5 text-center rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800">
                                <Camera className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                                <p className="text-xs text-zinc-400">Nenhuma foto adicionada à galeria ainda.</p>
                                <p className="text-[10px] text-zinc-500">Faça upload ou adicione links para enriquecer o Hotsite do programa.</p>
                              </div>
                            )}
                          </div>

                          {/* --- SEÇÃO: GALERIA DE ATÉ 3 VÍDEOS --- */}
                          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                  <Film className="w-4 h-4 text-red-400" />
                                  Galeria de Vídeos & Bastidores ({editingProgram.videoGallery?.length || 0}/4)
                                </h5>
                                <p className="text-[11px] text-zinc-400">
                                  Adicione até 4 vídeos do YouTube, Vimeo ou link MP4 com momentos do programa e estúdio.
                                </p>
                              </div>
                            </div>

                            {/* Form de Inserção de Vídeo */}
                            {(editingProgram.videoGallery?.length || 0) < 4 && (
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                                <div className="sm:col-span-4">
                                  <input
                                    type="text"
                                    id="video-title-input"
                                    placeholder="Título do Vídeo (ex: Bastidores do Estúdio)"
                                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-400"
                                  />
                                </div>
                                <div className="sm:col-span-6">
                                  <input
                                    type="url"
                                    id="video-url-input"
                                    placeholder="Link do YouTube (ex: https://youtube.com/watch?v=...)"
                                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-400"
                                  />
                                </div>
                                <div className="sm:col-span-2 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const titleInput = document.getElementById('video-title-input') as HTMLInputElement;
                                      const urlInput = document.getElementById('video-url-input') as HTMLInputElement;
                                      if (urlInput && urlInput.value) {
                                        handleAddVideoToGallery(urlInput.value, titleInput?.value);
                                        urlInput.value = '';
                                        if (titleInput) titleInput.value = '';
                                      } else {
                                        showToast('Informe o link do vídeo!');
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Adicionar</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Lista de Vídeos */}
                            {(editingProgram.videoGallery?.length || 0) > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {(editingProgram.videoGallery || []).map((vid, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 relative group">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                                          <Play className="w-3 h-3 fill-red-400" />
                                        </div>
                                        <h6 className="text-xs font-bold text-white truncate">
                                          {vid.title || `Vídeo #${idx + 1}`}
                                        </h6>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVideoFromGallery(idx)}
                                        className="p-1 rounded-lg text-red-400 hover:bg-red-950/50 transition"
                                        title="Remover vídeo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-[10px] font-mono text-zinc-400 truncate bg-zinc-900 px-2 py-1 rounded">
                                      {vid.url}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800">
                                <Film className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                                <p className="text-xs text-zinc-400">Nenhum vídeo cadastrado.</p>
                                <p className="text-[10px] text-zinc-500">Cole links do YouTube para os ouvintes assistirem transmissões ao vivo e bastidores.</p>
                              </div>
                            )}
                          </div>

                          {/* --- SEÇÃO DE BANNER PROMOCIONAL VINCULADO AO PROGRAMA --- */}
                          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-amber-400" />
                                <div>
                                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                    Banner Promocional & Sorteio da Atração
                                  </h5>
                                  <p className="text-[11px] text-zinc-400">
                                    Exibe um banner de destaque na Home do app e no Hotsite vinculado ao horário deste programa.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProgram({
                                    ...editingProgram,
                                    promoActive: !editingProgram.promoActive,
                                  })
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                  editingProgram.promoActive
                                    ? 'bg-amber-500 text-black font-black'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                              >
                                {editingProgram.promoActive ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Promoção Ativa</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Ativar Promoção</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {editingProgram.promoActive && (
                              <div className="space-y-3 pt-2 border-t border-zinc-800 animate-in fade-in">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-zinc-300 uppercase">
                                    Título da Promoção / Sorteio
                                  </label>
                                  <input
                                    type="text"
                                    value={editingProgram.promoTitle || ''}
                                    onChange={(e) =>
                                      setEditingProgram({ ...editingProgram, promoTitle: e.target.value })
                                    }
                                    placeholder="Ex: Sorteio Especial: Kit Exclusivo Rebeldia FM"
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold text-zinc-300 uppercase">
                                      Imagem do Banner Promocional
                                    </label>
                                    <label className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                                      <Upload className="w-3 h-3 stroke-[2.5]" />
                                      <span>Upload da Imagem</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleUploadPromoBannerFile}
                                      />
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    value={editingProgram.promoBannerUrl || ''}
                                    onChange={(e) =>
                                      setEditingProgram({
                                        ...editingProgram,
                                        promoBannerUrl: e.target.value,
                                      })
                                    }
                                    placeholder="Cole a URL ou faça upload da imagem..."
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                  />
                                  {editingProgram.promoBannerUrl && (
                                    <div className="relative mt-1.5 rounded-xl overflow-hidden border border-zinc-700 max-h-28 bg-black">
                                      <img
                                        src={editingProgram.promoBannerUrl}
                                        alt="Prévia do Banner"
                                        className="w-full h-28 object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setEditingProgram({ ...editingProgram, promoBannerUrl: '' })}
                                        className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 hover:bg-red-600 text-[10px] text-white font-bold backdrop-blur-sm transition cursor-pointer"
                                      >
                                        Remover
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-zinc-300 uppercase">
                                    Descrição e Como Participar
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editingProgram.promoDescription || ''}
                                    onChange={(e) =>
                                      setEditingProgram({
                                        ...editingProgram,
                                        promoDescription: e.target.value,
                                      })
                                    }
                                    placeholder="Mande sua mensagem durante a transmissão ao vivo pelo WhatsApp..."
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                                      Data/Hora Início
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={editingProgram.promoStartDate || ''}
                                      onChange={(e) =>
                                        setEditingProgram({
                                          ...editingProgram,
                                          promoStartDate: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                                      Data/Hora Término
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={editingProgram.promoEndDate || ''}
                                      onChange={(e) =>
                                        setEditingProgram({
                                          ...editingProgram,
                                          promoEndDate: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Navegação */}
                          <div className="pt-3 border-t border-zinc-800 flex justify-between">
                            <button
                              type="button"
                              onClick={() => setFormStep(2)}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                            >
                              Voltar
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormStep(4)}
                              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-1.5"
                            >
                              <span>Avançar: Mixcloud, Quadros & Trilhas</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* --- ETAPA 4: MIXCLOUD, QUADROS & TRILHAS --- */}
                      {formStep === 4 && (
                        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 animate-in fade-in duration-150">
                          {/* CAIXA DE CADASTRO MIXCLOUD: PROGRAMAS GRAVADOS */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-blue-500/40 space-y-4 shadow-lg relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                                  <Disc className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    Programas Gravados no Mixcloud.com
                                    <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                      Últimos 5 episódios
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-zinc-400">
                                    Vincule o canal ou link do programa no Mixcloud para exibir as gravações no hotsite com player integrado, curtidas e compartilhamento.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Presets Rápidos para Skate About e Surf & Ação */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block">
                                Sugestões Rápidas de Cadastro:
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProgram({
                                      ...editingProgram,
                                      mixcloudUrl: 'https://www.mixcloud.com/skateabout',
                                      mixcloudUser: 'skateabout',
                                    });
                                    showToast('Preenchido: skateABOUT (Mixcloud)');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-300 text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1"
                                >
                                  <span>🛹 Skate About</span>
                                  <span className="text-zinc-500 font-normal">/skateabout</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProgram({
                                      ...editingProgram,
                                      mixcloudUrl: 'https://www.mixcloud.com/SURF E AÇÃO',
                                      mixcloudUser: 'SURF E AÇÃO',
                                    });
                                    showToast('Preenchido: Surf & Ação (Mixcloud)');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-300 text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1"
                                >
                                  <span>🏄 Surf & Ação</span>
                                  <span className="text-zinc-500 font-normal">/SURF E AÇÃO</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProgram({
                                      ...editingProgram,
                                      mixcloudUrl: 'https://www.mixcloud.com/Avoxdobrasil/',
                                      mixcloudUser: 'Avoxdobrasil',
                                    });
                                    showToast('Preenchido: A Voz do Brasil');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition cursor-pointer"
                                >
                                  Avoxdobrasil
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProgram({
                                      ...editingProgram,
                                      mixcloudUrl: 'https://www.mixcloud.com/eletroacordes/',
                                      mixcloudUser: 'eletroacordes',
                                    });
                                    showToast('Preenchido: Eletroacordes');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition cursor-pointer"
                                >
                                  eletroacordes
                                </button>
                              </div>
                            </div>

                            {/* Inputs de URL e Usuário */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-zinc-200">
                                  Endereço do Programa (URL no Mixcloud)
                                </label>
                                <input
                                  type="text"
                                  value={editingProgram.mixcloudUrl || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const extracted = extractMixcloudUserFromUrl(val);
                                    setEditingProgram({
                                      ...editingProgram,
                                      mixcloudUrl: val,
                                      mixcloudUser: editingProgram.mixcloudUser || extracted,
                                    });
                                  }}
                                  placeholder="Ex: https://www.mixcloud.com/skateabout"
                                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                                />
                                <span className="text-[10px] text-zinc-500 block">
                                  Cole o link do canal ou programa no Mixcloud
                                </span>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-zinc-200">
                                  Nome de Usuário / Canal Mixcloud
                                </label>
                                <input
                                  type="text"
                                  value={editingProgram.mixcloudUser || ''}
                                  onChange={(e) =>
                                    setEditingProgram({
                                      ...editingProgram,
                                      mixcloudUser: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: skateabout ou SURF E AÇÃO"
                                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                                />
                                <span className="text-[10px] text-zinc-500 block">
                                  Identificador do canal (slug do perfil)
                                </span>
                              </div>
                            </div>

                            {/* Botão de Testar Conexão / Buscar Gravações */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5">
                              <button
                                type="button"
                                disabled={formMixcloudTesting || (!editingProgram.mixcloudUser && !editingProgram.mixcloudUrl)}
                                onClick={async () => {
                                  const target = editingProgram.mixcloudUser || editingProgram.mixcloudUrl || '';
                                  setFormMixcloudTesting(true);
                                  setFormMixcloudTestResult(null);
                                  const res = await handleTestMixcloudConnection(target);
                                  setFormMixcloudTesting(false);
                                  setFormMixcloudTestResult(res);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start shadow-md shadow-blue-600/20"
                              >
                                {formMixcloudTesting ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Disc className="w-3.5 h-3.5" />
                                )}
                                <span>Testar Conexão & Buscar 5 Gravações</span>
                              </button>

                              {editingProgram.mixcloudUser && (
                                <a
                                  href={editingProgram.mixcloudUrl || `https://www.mixcloud.com/${editingProgram.mixcloudUser}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-center"
                                >
                                  <span>Abrir Perfil no Mixcloud</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {/* Feedback do Teste */}
                            {formMixcloudTestResult && (
                              <div
                                className={`p-3 rounded-xl text-xs space-y-2 border ${
                                  formMixcloudTestResult.success
                                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                                    : 'bg-red-950/40 border-red-500/40 text-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 font-bold">
                                  {formMixcloudTestResult.success ? (
                                    <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                  )}
                                  <span>{formMixcloudTestResult.message}</span>
                                </div>

                                {formMixcloudTestResult.recordings && formMixcloudTestResult.recordings.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                                    {formMixcloudTestResult.recordings.slice(0, 3).map((rec, i) => (
                                      <div
                                        key={i}
                                        className="p-2 rounded-lg bg-black/60 border border-white/10 flex items-center gap-2"
                                      >
                                        <img
                                          src={rec.picture}
                                          alt=""
                                          referrerPolicy="no-referrer"
                                          className="w-9 h-9 rounded object-cover shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11px] font-bold text-white truncate">{rec.name}</p>
                                          <p className="text-[9px] font-mono text-zinc-400">@{rec.user?.username || rec.username || 'mixcloud'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Quadros do Programa */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-red-400" />
                                  Quadros & Atrações do Programa ({editingProgram.highlights?.length || 0})
                                </h4>
                                <p className="text-[11px] text-zinc-400">
                                  Momentos fixos e seções que acontecem durante o horário deste locutor.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddHighlight}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Quadro</span>
                              </button>
                            </div>

                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {(editingProgram.highlights || []).map((hl, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                                        #{idx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={hl.title}
                                        onChange={(e) => handleUpdateHighlight(idx, 'title', e.target.value)}
                                        placeholder="Nome do Quadro (ex: Lado B & Raridades)"
                                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveHighlight(idx)}
                                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/50 transition cursor-pointer"
                                      title="Remover quadro"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={hl.description}
                                    onChange={(e) => handleUpdateHighlight(idx, 'description', e.target.value)}
                                    placeholder="O que toca ou acontece neste quadro..."
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-300 text-xs focus:outline-none focus:border-amber-400 resize-none"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Trilhas / Playlist Frequente */}
                          <div className="space-y-3 pt-3 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <Music className="w-4 h-4 text-cyan-400" />
                                  Trilhas Frequentes ({editingProgram.playlist?.length || 0})
                                </h4>
                                <p className="text-[11px] text-zinc-400">
                                  Músicas e artistas que caracterizam o som deste programa.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddPlaylistItem}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Faixa</span>
                              </button>
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {(editingProgram.playlist || []).map((trk, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2"
                                >
                                  <span className="text-[10px] font-mono text-zinc-500 font-bold w-4">
                                    {idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={trk.title}
                                    onChange={(e) => handleUpdatePlaylistItem(idx, 'title', e.target.value)}
                                    placeholder="Nome da Música"
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                                  />
                                  <input
                                    type="text"
                                    value={trk.artist}
                                    onChange={(e) => handleUpdatePlaylistItem(idx, 'artist', e.target.value)}
                                    placeholder="Artista"
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-300 text-xs focus:outline-none focus:border-cyan-400"
                                  />
                                  <input
                                    type="text"
                                    value={trk.year || ''}
                                    onChange={(e) => handleUpdatePlaylistItem(idx, 'year', e.target.value)}
                                    placeholder="Ano"
                                    className="w-16 px-2 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-400 text-xs text-center font-mono focus:outline-none focus:border-cyan-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlaylistItem(idx)}
                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/50 transition cursor-pointer"
                                    title="Remover música"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Ações Finais */}
                          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setFormStep(3)}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                            >
                              Voltar
                            </button>

                            <button
                              type="submit"
                              disabled={isSavingProgram}
                              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCheck className="w-4 h-4 stroke-[3]" />
                              <span>{isSavingProgram ? 'Salvando...' : 'Salvar & Publicar na Grade'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </form>

                    {/* LIVE PREVIEW COLUNA DIREITA (SIMULADOR DO CARD E DO HOTSITE) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-xl space-y-3 sticky top-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Prévia em Tempo Real
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Como o ouvinte verá</span>
                        </div>

                        {/* Mini Banner do Hotsite Preview */}
                        <div className="h-28 rounded-2xl overflow-hidden relative bg-zinc-900 border border-zinc-800 group">
                          {editingProgram.bannerUrl ? (
                            <img
                              src={editingProgram.bannerUrl}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => ((e.target as any).style.display = 'none')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                              Sem banner de capa
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
                            <span className="text-[9px] font-mono font-black uppercase text-amber-300 bg-black/60 px-1.5 py-0.5 rounded w-fit">
                              {editingProgram.daysLabel || 'Horário de Transmissão'}
                            </span>
                            <h5 className="font-bold text-white text-sm truncate">
                              {editingProgram.title || 'Nome do Programa'}
                            </h5>
                          </div>
                        </div>

                        {/* Mini Card da Grade */}
                        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                              {editingProgram.avatarUrl ? (
                                <img
                                  src={editingProgram.avatarUrl}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                  R
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-mono text-amber-400 font-bold block">
                                🕒 {editingProgram.startTime || '00:00'} - {editingProgram.endTime || '00:00'}
                              </span>
                              <h6 className="font-bold text-white text-xs truncate">
                                {editingProgram.title || 'Título da Atração'}
                              </h6>
                              <p className="text-[11px] text-zinc-400 truncate">
                                Locutor: <strong className="text-zinc-200">{editingProgram.host || 'Nome do DJ'}</strong>
                              </p>
                            </div>
                          </div>

                          {editingProgram.genre && (
                            <div className="text-[10px] font-mono text-zinc-400 bg-black/50 p-1.5 rounded-lg border border-white/5 truncate">
                              🎸 {editingProgram.genre}
                            </div>
                          )}
                        </div>

                        {/* Estatísticas de preenchimento */}
                        <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                            <span>Quadros Cadastrados:</span>
                            <strong className="text-white font-mono">{editingProgram.highlights?.length || 0}</strong>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                            <span>Faixas na Playlist:</span>
                            <strong className="text-white font-mono">{editingProgram.playlist?.length || 0}</strong>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                            <span>Redes & WhatsApp:</span>
                            <strong className="text-emerald-400 font-mono">
                              {[
                                editingProgram.instagramHandle,
                                resolveHostWhatsapp(
                                  hostAccountsList.find(
                                    (h) =>
                                      (editingProgram.hostAccountId && h.id === editingProgram.hostAccountId) ||
                                      h.name.toLowerCase() === editingProgram.host.toLowerCase()
                                  ),
                                  stationConfig?.whatsappNumber
                                ),
                              ].filter(Boolean).length}/2
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO: LOCUTORES & REB OFICIAL                        */}
              {/* ======================================================== */}
              {activeSection === 'hosts' && (
                <div className="space-y-5">
                  {/* Top Bar Locutores */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-amber-400" />
                        Locutores, Apresentadores & REB Oficial
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {hostAccountsList.length} locutores com acesso ao estúdio, hotsites próprios e credenciais de login.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSyncOfficialContent}
                        disabled={isSyncingOfficial}
                        className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Restaura e sincroniza todos os 17 locutores da ficha cadastral oficial no banco"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{isSyncingOfficial ? 'Sincronizando...' : 'Restaurar Oficiais'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAddingNewHost(true)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Cadastrar Novo Locutor</span>
                      </button>
                    </div>
                  </div>

                  {/* Informação sobre os Locutores e Robô REB */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>Gestão Unificada de Comunicadores (Login por Celular)</span>
                          <span className="px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                            Humanos & Robô AutoDJ
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Cada locutor entra no painel usando exclusivamente seu <strong>celular único + senha pessoal</strong>. O celular também direciona todo o WhatsApp quando o programa ou Coringa entra no ar.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Telefones Duplicados ou Padrão Compartilhado */}
                  {(() => {
                    const dupEntries = Object.entries(findDuplicateHostPhones(hostAccountsList));
                    if (dupEntries.length === 0) return null;
                    return (
                      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Atenção: Celulares compartilhados / aguardando cadastro individual ({dupEntries.length} grupo(s))</span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Locutores que ainda compartilham o número padrão ou o mesmo celular não conseguirão fazer login exclusivo por celular até receberem um número individual único:
                        </p>
                        <div className="space-y-1">
                          {dupEntries.map(([phoneKey, hosts]) => (
                            <div key={phoneKey} className="text-[11px] font-mono text-amber-200 bg-black/40 px-3 py-1.5 rounded-lg border border-amber-500/20">
                              <strong>{formatPhoneDisplay(hosts[0]?.whatsapp || phoneKey)}:</strong> {hosts.map((h) => h.name).join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Busca e Lista de Todos os Locutores */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Mic2 className="w-4 h-4 text-amber-400" />
                        Todos os Locutores Cadastrados ({hostAccountsList.length})
                      </h4>

                      <div className="relative min-w-[240px]">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={hostSearchQuery}
                          onChange={(e) => setHostSearchQuery(e.target.value)}
                          placeholder="Buscar por nome, @usuário, programa..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hostAccountsList
                        .filter((h) => {
                          if (!hostSearchQuery.trim()) return true;
                          const q = hostSearchQuery.toLowerCase();
                          return (
                            h.name.toLowerCase().includes(q) ||
                            h.username.toLowerCase().includes(q) ||
                            (h.role && h.role.toLowerCase().includes(q)) ||
                            (h.programTitle && h.programTitle.toLowerCase().includes(q))
                          );
                        })
                        .map((host) => (
                          <div
                            key={host.id}
                            className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                              isProtectedSystemHost(host)
                                ? 'bg-amber-950/20 border-amber-500/40'
                                : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                                  <img
                                    src={host.avatarUrl || '/reb_mascot.jpg'}
                                    alt={host.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-white truncate font-display">
                                      {host.name}
                                    </span>
                                    <span className="text-[10px] text-amber-400 font-mono">
                                      @{host.username}
                                    </span>
                                    {(host.id === 'host-reb' || host.isMascot) && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase font-mono flex items-center gap-1">
                                        <Bot className="w-2.5 h-2.5" />
                                        Robô AutoDJ • 24h
                                      </span>
                                    )}
                                    {isCoringaHost(host) && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase font-mono flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Perfil Fixo • Coringa
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-zinc-400">
                                    {host.role || 'Locutor & Apresentador'}
                                  </p>

                                  {/* Programas Vinculados */}
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {(() => {
                                      const pIds = host.programIds && host.programIds.length > 0
                                        ? host.programIds
                                        : host.programId
                                        ? [host.programId]
                                        : [];
                                      const linkedPrograms = scheduleList.filter((p) => pIds.includes(String(p.id)));

                                      if (linkedPrograms.length > 0) {
                                        return linkedPrograms.map((lp) => (
                                          <span
                                            key={lp.id}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-cyan-300 font-medium truncate max-w-[190px]"
                                          >
                                            📻 {lp.title}
                                          </span>
                                        ));
                                      }

                                      if (host.programTitle) {
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-cyan-300 font-medium truncate max-w-[190px]">
                                            📻 {host.programTitle}
                                          </span>
                                        );
                                      }

                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-800/60 text-[10px] text-zinc-500 font-medium">
                                          Livre (Sem programa fixo)
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                                Ativo
                              </span>
                            </div>

                            {host.bio && (
                              <p className="text-xs text-zinc-400 line-clamp-2 italic bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
                                "{host.bio}"
                              </p>
                            )}

                            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-xs flex-wrap">
                              <div className="text-zinc-400 text-[11px] flex items-center gap-2">
                                <span className="font-mono">WhatsApp: {host.whatsapp || '5548991984678'}</span>
                                {(!host.whatsapp || host.whatsapp === '5548991984678') && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">Padrão</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {host.id === 'host-reb' && (
                                  <button
                                    type="button"
                                    onClick={handleEditRebHotsite}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                                    title="Personalizar hotsite e galeria do REB"
                                  >
                                    <Sparkles className="w-3 h-3 text-black" />
                                    <span>Hotsite</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentProgIds = host.programIds || (host.programId ? [host.programId] : []);
                                    setEditingHostAccount({
                                      ...host,
                                      programIds: currentProgIds,
                                      whatsapp: host.whatsapp || '5548991984678',
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Editar perfil, programas vinculados ou trocar senha"
                                >
                                  <Edit2 className="w-3 h-3 text-amber-400" />
                                  <span>Editar</span>
                                </button>

                                {!isProtectedSystemHost(host) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHostAccount(host)}
                                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/80 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                                    title="Excluir locutor"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* MODAL DE EDIÇÃO DE LOCUTOR */}
                  {editingHostAccount && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-amber-400" />
                            Editar Perfil do Locutor: {editingHostAccount.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setEditingHostAccount(null)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const selectedProgIds = editingHostAccount.programIds || [];
                            const primaryProg = scheduleList.find((p) => selectedProgIds.includes(String(p.id)));
                            const finalAccount: HostAccount = {
                              ...editingHostAccount,
                              programIds: selectedProgIds,
                              programId: selectedProgIds[0] || undefined,
                              programTitle: primaryProg ? primaryProg.title : undefined,
                              whatsapp: editingHostAccount.whatsapp?.trim() || '5548991984678',
                            };
                            handleSaveHostAccount(finalAccount);
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-bold text-zinc-300 mb-1">Nome Completo</label>
                            <input
                              type="text"
                              value={editingHostAccount.name}
                              onChange={(e) => setEditingHostAccount({ ...editingHostAccount, name: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Nome de Usuário (@login)</label>
                              <input
                                type="text"
                                value={editingHostAccount.username}
                                onChange={(e) => setEditingHostAccount({ ...editingHostAccount, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Nova Senha de Acesso</label>
                              <input
                                type="text"
                                value={editingHostAccount.password}
                                onChange={(e) => setEditingHostAccount({ ...editingHostAccount, password: e.target.value })}
                                placeholder="Deixe para manter a atual"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 text-xs focus:border-amber-400 focus:outline-none font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-zinc-300">WhatsApp de Contato</label>
                                <button
                                  type="button"
                                  onClick={() => setEditingHostAccount({ ...editingHostAccount, whatsapp: '5548991984678' })}
                                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                                >
                                  Restaurar Padrão
                                </button>
                              </div>
                              <input
                                type="text"
                                value={editingHostAccount.whatsapp || ''}
                                onChange={(e) => setEditingHostAccount({ ...editingHostAccount, whatsapp: e.target.value })}
                                placeholder="5548991984678"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                              />
                              <p className="text-[10px] text-emerald-400/90 mt-1">
                                Número único do locutor aplicado automaticamente aos seus programas e plantões Coringa (padrão: 5548991984678).
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Cargo / Função na Rádio</label>
                              <input
                                type="text"
                                value={editingHostAccount.role || ''}
                                onChange={(e) => setEditingHostAccount({ ...editingHostAccount, role: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* VÍNCULO DE PROGRAMAS: MULTI-SELEÇÃO */}
                          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                                <Radio className="w-3.5 h-3.5 text-amber-400" />
                                <span>Programas Vinculados a este Locutor ({editingHostAccount.programIds?.length || 0})</span>
                              </label>
                              <span className="text-[10px] text-zinc-400">
                                Marque os programas que ele apresenta
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                              {scheduleList.map((prog) => {
                                const currentSelected = editingHostAccount.programIds || [];
                                const isChecked = currentSelected.includes(String(prog.id));
                                return (
                                  <label
                                    key={prog.id}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                                      isChecked
                                        ? 'bg-amber-500/15 border-amber-400/80 text-white'
                                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const progIdStr = String(prog.id);
                                        if (e.target.checked) {
                                          setEditingHostAccount({
                                            ...editingHostAccount,
                                            programIds: [...currentSelected, progIdStr],
                                          });
                                        } else {
                                          setEditingHostAccount({
                                            ...editingHostAccount,
                                            programIds: currentSelected.filter((id) => id !== progIdStr),
                                          });
                                        }
                                      }}
                                      className="rounded border-zinc-700 text-amber-500 focus:ring-0 focus:outline-none accent-amber-400"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold truncate text-white">{prog.title}</div>
                                      <div className="text-[10px] text-zinc-400 font-mono">
                                        {prog.startTime} - {prog.endTime}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* FOTO DO LOCUTOR COM UPLOAD */}
                          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Foto de Perfil do Locutor (Upload Oficial)</span>
                                </label>
                                <p className="text-[10px] text-zinc-400">
                                  Esta foto será exibida na grade, nos programas apresentados e no hotsite.
                                </p>
                              </div>
                              <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto shrink-0">
                                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Upload da Foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleUploadHostAvatarFile(e, false)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="flex items-center gap-3.5">
                              {editingHostAccount.avatarUrl ? (
                                <div className="relative group shrink-0">
                                  <img
                                    src={editingHostAccount.avatarUrl}
                                    alt={editingHostAccount.name}
                                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md bg-zinc-950"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditingHostAccount({ ...editingHostAccount, avatarUrl: '' })}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs shadow-md cursor-pointer"
                                    title="Remover foto"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                                  <User className="w-6 h-6" />
                                  <span className="text-[9px] mt-1 font-bold">Sem Foto</span>
                                </div>
                              )}

                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={editingHostAccount.avatarUrl || ''}
                                  onChange={(e) => setEditingHostAccount({ ...editingHostAccount, avatarUrl: e.target.value })}
                                  placeholder="Ou cole a URL direta da imagem (https://...)"
                                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                                />
                                <span className="text-[10px] text-zinc-500 block font-mono">
                                  Formatos suportados: JPG, PNG, WEBP.
                                </span>
                              </div>
                            </div>

                            {/* Sugestões Rápidas de Avatares */}
                            <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/80">
                              <span className="text-[10px] text-zinc-400 block font-mono">
                                Ou escolha uma foto sugerida:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {STOCK_AVATARS.map((av, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setEditingHostAccount({ ...editingHostAccount, avatarUrl: av.url })}
                                    className={`p-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                                      editingHostAccount.avatarUrl === av.url
                                        ? 'bg-amber-500/20 border-amber-500 text-white'
                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                                    }`}
                                  >
                                    <img src={av.url} alt={av.label} className="w-7 h-7 rounded-lg object-cover" />
                                    <span className="text-[10px] font-medium truncate">{av.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-300 mb-1">Biografia do Locutor</label>
                            <textarea
                              rows={3}
                              value={editingHostAccount.bio || ''}
                              onChange={(e) => setEditingHostAccount({ ...editingHostAccount, bio: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Pergunta de Segurança</label>
                              <input
                                type="text"
                                value={editingHostAccount.securityQuestion || ''}
                                onChange={(e) => setEditingHostAccount({ ...editingHostAccount, securityQuestion: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Resposta Secreta</label>
                              <input
                                type="text"
                                value={editingHostAccount.securityAnswer || ''}
                                onChange={(e) => setEditingHostAccount({ ...editingHostAccount, securityAnswer: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                            <button
                              type="button"
                              onClick={() => setEditingHostAccount(null)}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingHost}
                              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>{isSavingHost ? 'Salvando...' : 'Salvar Alterações'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* MODAL DE CADASTRO DE NOVO LOCUTOR */}
                  {isAddingNewHost && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-amber-400" />
                            Cadastrar Novo Locutor da Rádio
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewHost(false)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateNewHostAccount} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-300 mb-1">Nome Completo *</label>
                            <input
                              type="text"
                              value={newHostForm.name || ''}
                              onChange={(e) => setNewHostForm({ ...newHostForm, name: e.target.value })}
                              placeholder="Ex: João Silveira"
                              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Nome de Usuário (@login) *</label>
                              <input
                                type="text"
                                value={newHostForm.username || ''}
                                onChange={(e) => setNewHostForm({ ...newHostForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                placeholder="joaosilveira"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Senha Inicial *</label>
                              <input
                                type="text"
                                value={newHostForm.password || ''}
                                onChange={(e) => setNewHostForm({ ...newHostForm, password: e.target.value })}
                                placeholder="senha123"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 text-xs focus:border-amber-400 focus:outline-none font-mono"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">E-mail Profissional</label>
                              <input
                                type="email"
                                value={newHostForm.email || ''}
                                onChange={(e) => setNewHostForm({ ...newHostForm, email: e.target.value })}
                                placeholder="joao@rebeldiafm.com.br"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-zinc-300">WhatsApp de Contato</label>
                                <button
                                  type="button"
                                  onClick={() => setNewHostForm({ ...newHostForm, whatsapp: '5548991984678' })}
                                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                                >
                                  Restaurar Padrão
                                </button>
                              </div>
                              <input
                                type="text"
                                value={newHostForm.whatsapp || ''}
                                onChange={(e) => setNewHostForm({ ...newHostForm, whatsapp: e.target.value })}
                                placeholder="5548991984678"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                              />
                              <p className="text-[10px] text-zinc-500 mt-1">Padrão da rádio: 5548991984678</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">Cargo / Função</label>
                              <input
                                type="text"
                                value={newHostForm.role || ''}
                                onChange={(e) => setNewHostForm({ ...newHostForm, role: e.target.value })}
                                placeholder="Locutor & Produtor"
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-zinc-300 mb-1">URL Direta da Foto</label>
                              <input
                                type="text"
                                value={newHostForm.avatarUrl || ''}
                                onChange={(e) => setNewHostForm({ ...newHostForm, avatarUrl: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* FOTO DO NOVO LOCUTOR COM UPLOAD */}
                          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Foto de Perfil do Comunicador (Upload)</span>
                                </label>
                                <p className="text-[10px] text-zinc-400">
                                  Envie a imagem que ilustrará o apresentador no ar e nos programas.
                                </p>
                              </div>
                              <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto shrink-0">
                                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Upload da Foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleUploadHostAvatarFile(e, true)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="flex items-center gap-3.5">
                              {newHostForm.avatarUrl ? (
                                <div className="relative group shrink-0">
                                  <img
                                    src={newHostForm.avatarUrl}
                                    alt="Novo Locutor"
                                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md bg-zinc-950"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setNewHostForm({ ...newHostForm, avatarUrl: '' })}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs shadow-md cursor-pointer"
                                    title="Remover foto"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                                  <User className="w-5 h-5" />
                                  <span className="text-[9px] mt-0.5 font-bold">Sem Foto</span>
                                </div>
                              )}

                              <div className="flex-1">
                                <span className="text-[10px] text-zinc-400 block font-mono">
                                  Sugestões rápidas de fotos de locutores:
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                                  {STOCK_AVATARS.map((av, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setNewHostForm({ ...newHostForm, avatarUrl: av.url })}
                                      className={`p-1 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                                        newHostForm.avatarUrl === av.url
                                          ? 'bg-amber-500/20 border-amber-500 text-white'
                                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                                      }`}
                                    >
                                      <img src={av.url} alt={av.label} className="w-5 h-5 rounded-md object-cover" />
                                      <span className="text-[9px] truncate">{av.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* VÍNCULO DE MÚLTIPLOS PROGRAMAS NO CADASTRO */}
                          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                                <Radio className="w-3.5 h-3.5 text-amber-400" />
                                <span>Programas Vinculados ({newHostForm.programIds?.length || 0})</span>
                              </label>
                              <span className="text-[10px] text-zinc-400">
                                Selecione os programas deste locutor
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                              {scheduleList.map((prog) => {
                                const currentSelected = newHostForm.programIds || [];
                                const isChecked = currentSelected.includes(String(prog.id));
                                return (
                                  <label
                                    key={prog.id}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                                      isChecked
                                        ? 'bg-amber-500/15 border-amber-400/80 text-white'
                                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const progIdStr = String(prog.id);
                                        if (e.target.checked) {
                                          setNewHostForm({
                                            ...newHostForm,
                                            programIds: [...currentSelected, progIdStr],
                                          });
                                        } else {
                                          setNewHostForm({
                                            ...newHostForm,
                                            programIds: currentSelected.filter((id) => id !== progIdStr),
                                          });
                                        }
                                      }}
                                      className="rounded border-zinc-700 text-amber-500 focus:ring-0 focus:outline-none accent-amber-400"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold truncate text-white">{prog.title}</div>
                                      <div className="text-[10px] text-zinc-400 font-mono">
                                        {prog.startTime} - {prog.endTime}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-300 mb-1">Biografia Resumida</label>
                            <textarea
                              rows={2}
                              value={newHostForm.bio || ''}
                              onChange={(e) => setNewHostForm({ ...newHostForm, bio: e.target.value })}
                              placeholder="Apresentador apaixonado por rock clássico e novidades..."
                              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none resize-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                            <button
                              type="button"
                              onClick={() => setIsAddingNewHost(false)}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingHost}
                              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>{isSavingHost ? 'Cadastrando...' : 'Finalizar Cadastro'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO: BANNERS PROMOCIONAIS & PROMOÇÃO DA HORA        */}
              {/* ======================================================== */}
              {activeSection === 'banners' && (
                <AdminBannersSection
                  banners={bannersList}
                  scheduleList={scheduleList}
                  onSaveBanners={handleSaveBannersList}
                  showToast={showToast}
                  onPreviewBanner={(banner) => {
                    showToast(`Pré-visualizando promoção: ${banner.title}`);
                  }}
                />
              )}

              {/* ======================================================== */}
              {/* SESSÃO 3: MODERAÇÃO DO MURAL DE RECADOS                 */}
              {/* ======================================================== */}
              {activeSection === 'shoutouts' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-amber-400" />
                        Moderação do Mural de Recados
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Aprove ou oculte mensagens dos ouvintes antes ou depois de serem exibidas no site.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadShoutouts}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Recarregar</span>
                      </button>
                    </div>
                  </div>

                  {/* Filtros do Mural */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShoutoutFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        shoutoutFilter === 'all'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Todos ({shoutoutsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShoutoutFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        shoutoutFilter === 'pending'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Ocultos / Pendentes ({shoutoutsList.filter((s) => !s.isApproved).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShoutoutFilter('approved')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        shoutoutFilter === 'approved'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Aprovados no Ar ({shoutoutsList.filter((s) => s.isApproved).length})
                    </button>
                  </div>

                  {/* Lista de Recados */}
                  {isLoadingShoutouts ? (
                    <div className="p-12 text-center text-zinc-400 text-xs">Carregando recados...</div>
                  ) : shoutoutsList.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
                      Nenhum recado cadastrado no banco de dados.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shoutoutsList
                        .filter((item) => {
                          if (shoutoutFilter === 'pending') return !item.isApproved;
                          if (shoutoutFilter === 'approved') return item.isApproved;
                          return true;
                        })
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                              item.isApproved
                                ? 'bg-zinc-950/90 border-zinc-800'
                                : 'bg-amber-950/20 border-amber-500/30'
                            }`}
                          >
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                                    item.isApproved
                                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                                      : 'bg-amber-950 border border-amber-800 text-amber-400'
                                  }`}
                                >
                                  {item.isApproved ? 'NO AR / APROVADO' : 'OCULTO NO MURAL'}
                                </span>
                                <strong className="text-xs text-white">{item.authorName}</strong>
                                {item.authorCity && (
                                  <span className="text-xs text-zinc-400">({item.authorCity})</span>
                                )}
                                <span className="text-[11px] text-zinc-500 font-mono">
                                  • {new Date(item.createdAt).toLocaleString()}
                                </span>
                                <span className="text-[11px] text-zinc-400 font-mono">
                                  • ❤️ {item.likesCount}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-white/5">
                                "{item.content}"
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleApproveShoutout(item.id, item.isApproved)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                  item.isApproved
                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                                }`}
                              >
                                {item.isApproved ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Ocultar</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Aprovar</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => promptDeleteShoutout(item.id, item.authorName)}
                                className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition cursor-pointer"
                                title="Excluir recado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO 4: PEDIDOS MUSICAIS DOS OUVINTES                 */}
              {/* ======================================================== */}
              {activeSection === 'requests' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-400" />
                        Fila de Pedidos Musicais
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Acompanhe o que os ouvintes pediram e atualize o status conforme as músicas tocam no ar.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadRequests}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Atualizar Fila</span>
                    </button>
                  </div>

                  {/* Filtros de Pedidos */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRequestFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        requestFilter === 'all'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Todos ({requestsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        requestFilter === 'pending'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Pendentes ({requestsList.filter((r) => r.status === 'pending').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestFilter('playing')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        requestFilter === 'playing'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Tocando no Ar ({requestsList.filter((r) => r.status === 'playing').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestFilter('played')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        requestFilter === 'played'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Já Tocou ({requestsList.filter((r) => r.status === 'played').length})
                    </button>
                  </div>

                  {/* Lista de Pedidos */}
                  {isLoadingRequests ? (
                    <div className="p-12 text-center text-zinc-400 text-xs">Carregando pedidos...</div>
                  ) : requestsList.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
                      Nenhum pedido musical registrado no momento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requestsList
                        .filter((r) => {
                          if (requestFilter === 'pending') return r.status === 'pending';
                          if (requestFilter === 'playing') return r.status === 'playing';
                          if (requestFilter === 'played') return r.status === 'played';
                          return true;
                        })
                        .map((req) => (
                          <div
                            key={req.id}
                            className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 flex-wrap"
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                                    req.status === 'playing'
                                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                                      : req.status === 'played'
                                      ? 'bg-zinc-800 text-zinc-400'
                                      : 'bg-amber-950 border border-amber-800 text-amber-400'
                                  }`}
                                >
                                  {req.status === 'playing'
                                    ? 'TOCANDO NO AR'
                                    : req.status === 'played'
                                    ? 'JÁ TOCOU'
                                    : 'PENDENTE NA FILA'}
                                </span>
                                <strong className="text-xs text-white">
                                  {req.listenerName} {req.listenerCity ? `(${req.listenerCity})` : ''}
                                </strong>
                                <span className="text-[11px] text-zinc-500 font-mono">
                                  • {new Date(req.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="text-amber-400">🎵</span>
                                <span>{req.songTitle}</span>
                                <span className="text-zinc-400 font-normal">— {req.artist}</span>
                              </div>

                              {req.dedicatedTo && (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                                      🎁 Dedicado para Homenageado(A): <strong className="text-white">{req.dedicatedTo}</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `🎸 *Dedicatória Especial na Rebeldia FM!*\n\nOlá ${req.dedicatedTo || 'Amigo(a)'}! *${req.listenerName}* dedicou a música *${req.songTitle} - ${req.artist}* especialmente para você na Rebeldia FM!\n\n1️⃣ Ouça agora ao vivo: https://www.rebeldiafm.com.br\n2️⃣ Siga e curta a rádio: https://instagram.com/rebeldiafm\n3️⃣ Compartilhe a rádio: https://api.whatsapp.com/send?text=${encodeURIComponent('Ouvindo a Rebeldia FM! Acesse: https://www.rebeldiafm.com.br')}`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-[10px] transition flex items-center gap-1 border border-emerald-500/30"
                                      title="Enviar dedicatória no WhatsApp com os 3 links"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>Enviar no WhatsApp (3 Links)</span>
                                    </button>
                                  </div>
                                  {req.dedication && (
                                    <p className="text-zinc-300 italic text-[11px]">
                                      "{req.dedication}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                value={req.status}
                                onChange={(e) => handleUpdateSongStatus(req.id, e.target.value)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                              >
                                <option value="pending">Pendente</option>
                                <option value="playing">Tocando no Ar</option>
                                <option value="played">Já Tocou</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => promptDeleteSongRequest(req.id, req.songTitle)}
                                className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition cursor-pointer"
                                title="Excluir pedido"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO: INSTITUCIONAL & MANIFESTO REBELDIA              */}
              {/* ======================================================== */}
              {activeSection === 'rebeldia' && (
                <div className="space-y-6">
                  {/* Top Bar da Sessão Institucional */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-400" />
                        Gestor Institucional & Manifesto REBELDIA
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Edite o manifesto da rádio livre, história, contatos oficiais e pilares exibidos na página REBELDIA.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('rebeldia');
                            onClose();
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Abrir a página institucional no front"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ver Página REBELDIA</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleResetInstitutional}
                        className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition border border-zinc-700 cursor-pointer"
                        title="Restaurar dados de fábrica"
                      >
                        Restaurar Padrão
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveInstitutional}
                        disabled={isSavingInstitutional}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{isSavingInstitutional ? 'Salvando...' : 'Salvar Alterações'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 0. UPLOAD E GESTÃO DO LOGOTIPO */}
                  <LogoUploader />

                  {/* SINCRONIA DA FAIXA & RETARDO DO TÍTULO (REGRA FIXA NO PLAYER) */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Sincronia da Faixa & Retardo do Título
                      </h4>
                      <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold">
                        {metadataDelaySeconds === 0 ? '0s (Sem retardo)' : `${metadataDelaySeconds}s de retardo`}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Compensa o buffer de transmissão do streaming na web. Como a transmissão pela internet leva cerca de 10 segundos para chegar ao reprodutor, o retardo garante que o nome da música e a capa entrem em sincronia exata no momento em que o áudio começa a tocar nos alto-falantes.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-mono">0s</span>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          step={1}
                          value={metadataDelaySeconds}
                          onChange={(e) => setMetadataDelaySeconds(Number(e.target.value))}
                          className="flex-1 accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-500 font-mono">30s</span>
                      </div>

                      {/* Presets Rápidos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { sec: 0, label: '0s (Direto)' },
                          { sec: 5, label: '5s' },
                          { sec: 10, label: '10s (Recomendado)' },
                          { sec: 15, label: '15s' },
                        ].map((p) => (
                          <button
                            key={p.sec}
                            type="button"
                            onClick={() => setMetadataDelaySeconds(p.sec)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              metadataDelaySeconds === p.sec
                                ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                                : 'bg-zinc-800/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
                            }`}
                          >
                            <div className="truncate">{p.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 1. DADOS DE IDENTIDADE BÁSICA */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      Identidade & Posicionamento
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Nome da Emissora
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.stationName}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, stationName: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Slogan Institucional
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.slogan}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, slogan: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Ano de Fundação
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.foundedYear}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, foundedYear: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Localização / Sede
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.location}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, location: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. MANIFESTO DA RÁDIO LIVRE */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        Manifesto da Rádio Livre (Filosofia & Propósito)
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">Exibido com destaque</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Título do Manifesto
                      </label>
                      <input
                        type="text"
                        value={institutionalForm.manifestoTitle}
                        onChange={(e) =>
                          setInstitutionalForm({ ...institutionalForm, manifestoTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {institutionalForm.manifestoText.map((paragraph, index) => (
                      <div key={index}>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Parágrafo do Manifesto #{index + 1}
                        </label>
                        <textarea
                          rows={2}
                          value={paragraph}
                          onChange={(e) => {
                            const newText = [...institutionalForm.manifestoText];
                            newText[index] = e.target.value;
                            setInstitutionalForm({ ...institutionalForm, manifestoText: newText });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 leading-relaxed resize-y"
                        />
                      </div>
                    ))}
                  </div>

                  {/* 3. HISTÓRIA & TRAJETÓRIA */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      História da Emissora & Resistência
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Título da Seção de História
                      </label>
                      <input
                        type="text"
                        value={institutionalForm.historyTitle}
                        onChange={(e) =>
                          setInstitutionalForm({ ...institutionalForm, historyTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {institutionalForm.historyText.map((paragraph, index) => (
                      <div key={index}>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Parágrafo da História #{index + 1}
                        </label>
                        <textarea
                          rows={2}
                          value={paragraph}
                          onChange={(e) => {
                            const newText = [...institutionalForm.historyText];
                            newText[index] = e.target.value;
                            setInstitutionalForm({ ...institutionalForm, historyText: newText });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 leading-relaxed resize-y"
                        />
                      </div>
                    ))}
                  </div>

                  {/* 4. CANAIS DE CONTATO INSTITUCIONAL */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contatos Oficiais da Emissora
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          E-mail Oficial (Geral)
                        </label>
                        <input
                          type="email"
                          value={institutionalForm.officialEmail}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, officialEmail: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          E-mail para Demos & Bandas
                        </label>
                        <input
                          type="email"
                          value={institutionalForm.bandsEmail}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, bandsEmail: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          E-mail de Imprensa / Parcerias
                        </label>
                        <input
                          type="email"
                          value={institutionalForm.pressEmail}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, pressEmail: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          WhatsApp Oficial do Estúdio
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.whatsapp}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, whatsapp: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Instagram da Rádio
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.instagram}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, instagram: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Endereço do Estúdio
                        </label>
                        <input
                          type="text"
                          value={institutionalForm.studioAddress}
                          onChange={(e) =>
                            setInstitutionalForm({ ...institutionalForm, studioAddress: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. PILARES DA EMISSORA */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Pilares Institucionais
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {institutionalForm.pillars.map((pillar, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={pillar.title}
                              onChange={(e) => {
                                const newPillars = [...institutionalForm.pillars];
                                newPillars[idx] = { ...newPillars[idx], title: e.target.value };
                                setInstitutionalForm({ ...institutionalForm, pillars: newPillars });
                              }}
                              className="font-bold text-white text-xs bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-700 flex-1 focus:outline-none focus:border-amber-400"
                            />
                            <input
                              type="text"
                              value={pillar.tag}
                              onChange={(e) => {
                                const newPillars = [...institutionalForm.pillars];
                                newPillars[idx] = { ...newPillars[idx], tag: e.target.value };
                                setInstitutionalForm({ ...institutionalForm, pillars: newPillars });
                              }}
                              className="text-[10px] font-mono text-amber-300 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-700 w-24 text-right focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={pillar.description}
                            onChange={(e) => {
                              const newPillars = [...institutionalForm.pillars];
                              newPillars[idx] = { ...newPillars[idx], description: e.target.value };
                              setInstitutionalForm({ ...institutionalForm, pillars: newPillars });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Barra de Salvar Inferior */}
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Todas as alterações são salvas e refletidas instantaneamente na página REBELDIA.</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveInstitutional}
                      disabled={isSavingInstitutional}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{isSavingInstitutional ? 'Salvando...' : 'Salvar Alterações Institucionais'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO 5: VISÃO GERAL & BANCO DE DADOS                  */}
              {/* ======================================================== */}
              {activeSection === 'stats' && (
                <div className="space-y-5">
                  <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                    <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                      <Database className="w-5 h-5 text-amber-400" />
                      Status do Sistema & Banco Cloud SQL
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Métricas da rádio em tempo real sincronizadas com o banco PostgreSQL.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-xs">
                        <span>Programas Ativos</span>
                        <Calendar className="w-4 h-4 text-amber-400" />
                      </div>
                      <h4 className="text-2xl font-black text-white font-mono">{scheduleList.length}</h4>
                      <p className="text-[11px] text-zinc-500">Grade semanal completa</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-xs">
                        <span>Total de Pedidos</span>
                        <Music className="w-4 h-4 text-cyan-400" />
                      </div>
                      <h4 className="text-2xl font-black text-white font-mono">{requestsList.length}</h4>
                      <p className="text-[11px] text-zinc-500">
                        {requestsList.filter((r) => r.status === 'pending').length} aguardando tocar
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-xs">
                        <span>Recados no Mural</span>
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-2xl font-black text-white font-mono">{shoutoutsList.length}</h4>
                      <p className="text-[11px] text-zinc-500">
                        {shoutoutsList.filter((s) => s.isApproved).length} aprovados no ar
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-xs">
                        <span>Status do Banco</span>
                        <Database className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-black text-emerald-400 font-mono flex items-center gap-1.5 pt-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        ONLINE (Cloud SQL)
                      </h4>
                      <p className="text-[11px] text-zinc-500">PostgreSQL Drizzle ORM</p>
                    </div>
                  </div>

                  {/* Informações da Rádio */}
                  <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Resumo da Emissora
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Emissora:</span>
                        <strong className="text-white">Rádio Rebeldia FM — 87.9 MHz</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Slogan:</span>
                        <strong className="text-white">A Voz Sem Filtro do Seu Rádio</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Streaming Principal:</span>
                        <span className="text-zinc-300 font-mono">AAC+ HD Audio 64kbps</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Credenciais do Painel:</span>
                        <span className="text-zinc-300 font-mono">admin@rebeldiafm.com / rebeldia2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEÇÃO 9: GERENCIADOR CENTRAL DE MIXCLOUD DOS HOTSITES */}
              {activeSection === 'mixcloud' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Header Central Mixcloud */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/80 via-zinc-950 to-zinc-950 border border-blue-500/30 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
                          <Disc className="w-6 h-6 animate-spin-slow" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white font-display">
                              Gerenciador Central de Mixcloud dos Hotsites
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              mixcloud.com
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Cadastre o canal e URL de cada programa para alimentar automaticamente a aba "Programas Gravados" com as últimas 5 gravações, player oficial, curtidas e compartilhamento.
                          </p>
                        </div>
                      </div>

                      {/* Métricas Rápidas */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-center min-w-[90px]">
                          <span className="text-[10px] text-zinc-400 block font-mono">Total Hotsites</span>
                          <strong className="text-sm text-white font-bold">{scheduleList.length}</strong>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-blue-950/50 border border-blue-600/40 text-center min-w-[90px]">
                          <span className="text-[10px] text-blue-300 block font-mono">Com Mixcloud</span>
                          <strong className="text-sm text-blue-400 font-bold">
                            {scheduleList.filter((p) => p.mixcloudUser || p.mixcloudUrl).length}
                          </strong>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center min-w-[90px]">
                          <span className="text-[10px] text-zinc-500 block font-mono">Sem Mixcloud</span>
                          <strong className="text-sm text-zinc-400 font-bold">
                            {scheduleList.filter((p) => !p.mixcloudUser && !p.mixcloudUrl).length}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Banner de Cadastro Rápido Solicitado: Skate About e Surf & Ação */}
                    <div className="p-4 rounded-2xl bg-black/70 border border-blue-500/30 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          Vínculo Expresso de Canais em Destaque:
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Skate About Shortcut */}
                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="text-xs text-white block truncate">🛹 Hotsite Skate About</strong>
                            <span className="text-[10px] font-mono text-blue-400 truncate block">
                              https://www.mixcloud.com/skateabout
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const skateProg = scheduleList.find(
                                (p) =>
                                  p.title.toLowerCase().includes('skate') ||
                                  p.host.toLowerCase().includes('ale braga') ||
                                  p.host.toLowerCase().includes('alê braga')
                              );
                              if (skateProg) {
                                await handleInlineSaveMixcloud(
                                  skateProg,
                                  'skateabout',
                                  'https://www.mixcloud.com/skateabout'
                                );
                              } else {
                                showToast('Programa Skate About não encontrado na grade.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow"
                          >
                            Vincular Agora
                          </button>
                        </div>

                        {/* Surf & Ação Shortcut */}
                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="text-xs text-white block truncate">🏄 Hotsite Surf & Ação</strong>
                            <span className="text-[10px] font-mono text-blue-400 truncate block">
                              https://www.mixcloud.com/SURF E AÇÃO
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const surfProg = scheduleList.find(
                                (p) =>
                                  p.title.toLowerCase().includes('surf') ||
                                  p.host.toLowerCase().includes('paulo henrique') ||
                                  p.host.toLowerCase().includes('(ph)')
                              );
                              if (surfProg) {
                                await handleInlineSaveMixcloud(
                                  surfProg,
                                  'SURF E AÇÃO',
                                  'https://www.mixcloud.com/SURF E AÇÃO'
                                );
                              } else {
                                showToast('Programa Surf & Ação não encontrado na grade.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow"
                          >
                            Vincular Agora
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toolbar de Filtro e Busca */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={mixcloudFilterTerm}
                          onChange={(e) => setMixcloudFilterTerm(e.target.value)}
                          placeholder="Buscar programa ou locutor..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-blue-400"
                        />
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMixcloudFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          mixcloudFilterStatus === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        Todos ({scheduleList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMixcloudFilterStatus('configured')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          mixcloudFilterStatus === 'configured'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        Com Mixcloud ({scheduleList.filter((p) => p.mixcloudUser || p.mixcloudUrl).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMixcloudFilterStatus('empty')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          mixcloudFilterStatus === 'empty'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        Sem Mixcloud ({scheduleList.filter((p) => !p.mixcloudUser && !p.mixcloudUrl).length})
                      </button>
                    </div>
                  </div>

                  {/* Lista de Hotsites para Cadastro de Mixcloud */}
                  <div className="space-y-4">
                    {scheduleList
                      .filter((p) => {
                        const term = mixcloudFilterTerm.toLowerCase().trim();
                        if (term && !p.title.toLowerCase().includes(term) && !p.host.toLowerCase().includes(term)) {
                          return false;
                        }
                        if (mixcloudFilterStatus === 'configured') {
                          return Boolean(p.mixcloudUser || p.mixcloudUrl);
                        }
                        if (mixcloudFilterStatus === 'empty') {
                          return !p.mixcloudUser && !p.mixcloudUrl;
                        }
                        return true;
                      })
                      .map((prog) => {
                        const currentLocal = mixcloudInlineValues[prog.id] || {
                          user: prog.mixcloudUser || '',
                          url: prog.mixcloudUrl || '',
                        };
                        const hasMixcloudConfigured = Boolean(prog.mixcloudUser || prog.mixcloudUrl);
                        const isTestingThis = mixcloudInlineTestingId === prog.id;
                        const testResult = mixcloudInlineResults[prog.id];

                        return (
                          <div
                            key={prog.id}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                              hasMixcloudConfigured
                                ? 'bg-zinc-950/80 border-blue-500/30'
                                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              {/* Identificação do Programa */}
                              <div className="flex items-center gap-3.5 min-w-0 lg:w-1/3">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                                  <img
                                    src={
                                      prog.avatarUrl ||
                                      prog.logoUrl ||
                                      prog.bannerUrl ||
                                      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&auto=format&fit=crop&q=80'
                                    }
                                    alt={prog.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-sm font-bold text-white truncate font-display">
                                      {prog.title}
                                    </h4>
                                    {hasMixcloudConfigured ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Ativo
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">
                                        Não cadastrado
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-400 truncate">{prog.host}</p>
                                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                                    {prog.daysOfWeek?.map((d) => (DAYS_MAP.find((m) => m.id === d) || {}).short || d).join(', ') || 'Diário'} • {prog.startTime} - {prog.endTime}
                                  </p>
                                </div>
                              </div>

                              {/* Campos de Cadastro de Endereço Mixcloud */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                    Endereço no Mixcloud (URL)
                                  </label>
                                  <input
                                    type="text"
                                    value={currentLocal.url}
                                    onChange={(e) => {
                                      const urlVal = e.target.value;
                                      const extracted = extractMixcloudUserFromUrl(urlVal);
                                      setMixcloudInlineValues((prev) => ({
                                        ...prev,
                                        [prog.id]: {
                                          ...currentLocal,
                                          url: urlVal,
                                          user: currentLocal.user || extracted,
                                        },
                                      }));
                                    }}
                                    placeholder="https://www.mixcloud.com/..."
                                    className="w-full px-3 py-1.5 rounded-xl bg-black border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                    Canal / Usuário Mixcloud
                                  </label>
                                  <input
                                    type="text"
                                    value={currentLocal.user}
                                    onChange={(e) => {
                                      const userVal = e.target.value;
                                      setMixcloudInlineValues((prev) => ({
                                        ...prev,
                                        [prog.id]: {
                                          ...currentLocal,
                                          user: userVal,
                                        },
                                      }));
                                    }}
                                    placeholder="ex: skateabout ou SURF E AÇÃO"
                                    className="w-full px-3 py-1.5 rounded-xl bg-black border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                                  />
                                </div>
                              </div>

                              {/* Ações: Testar, Salvar, Abrir */}
                              <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                                <button
                                  type="button"
                                  disabled={isTestingThis || (!currentLocal.user && !currentLocal.url)}
                                  onClick={async () => {
                                    const target = currentLocal.user || currentLocal.url;
                                    setMixcloudInlineTestingId(prog.id);
                                    const res = await handleTestMixcloudConnection(target);
                                    setMixcloudInlineTestingId(null);
                                    setMixcloudInlineResults((prev) => ({
                                      ...prev,
                                      [prog.id]: res,
                                    }));
                                  }}
                                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                                  title="Testar conexão com Mixcloud"
                                >
                                  {isTestingThis ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Disc className="w-3.5 h-3.5 text-blue-400" />
                                  )}
                                  <span>Testar</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={currentLocal.isSaving}
                                  onClick={() => handleInlineSaveMixcloud(prog)}
                                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50"
                                >
                                  {currentLocal.isSaving ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Save className="w-3.5 h-3.5" />
                                  )}
                                  <span>Salvar</span>
                                </button>

                                {hasMixcloudConfigured && (
                                  <a
                                    href={prog.mixcloudUrl || `https://www.mixcloud.com/${prog.mixcloudUser}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                                    title="Abrir página no Mixcloud.com"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Resultados do Teste Inline */}
                            {testResult && (
                              <div
                                className={`mt-3 p-3 rounded-xl text-xs space-y-2 border animate-in fade-in duration-150 ${
                                  testResult.success
                                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                                    : 'bg-red-950/40 border-red-500/40 text-red-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 font-bold">
                                    {testResult.success ? (
                                      <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    )}
                                    <span>{testResult.message}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMixcloudInlineResults((prev) => {
                                        const copy = { ...prev };
                                        delete copy[prog.id];
                                        return copy;
                                      })
                                    }
                                    className="text-[10px] text-zinc-400 hover:text-white"
                                  >
                                    Fechar
                                  </button>
                                </div>

                                {testResult.recordings && testResult.recordings.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                    {testResult.recordings.slice(0, 3).map((rec, i) => (
                                      <div
                                        key={i}
                                        className="p-2 rounded-lg bg-black/60 border border-white/10 flex items-center gap-2 min-w-0"
                                      >
                                        <img
                                          src={rec.picture}
                                          alt=""
                                          referrerPolicy="no-referrer"
                                          className="w-8 h-8 rounded object-cover shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11px] font-bold text-white truncate">{rec.name}</p>
                                          <p className="text-[9px] font-mono text-zinc-400">{rec.user_name}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SESSÃO: TROCA DIRETA DE HORÁRIO & REGISTRO DE AVISOS     */}
              {/* ======================================================== */}
              {activeSection === 'swaps' && (
                <AdminScheduleSwapsSection
                  authRole={authRole === 'host' ? 'host' : 'admin'}
                  activeHost={currentLoggedInHost}
                  hostToken={hostToken}
                  scheduleList={scheduleList}
                  hostAccounts={hostAccountsList}
                  swaps={localSwaps}
                  onSwapsUpdated={(nextSwaps) => {
                    setLocalSwaps(nextSwaps);
                    onSwapsUpdated?.(nextSwaps);
                  }}
                  onRefreshSchedule={async () => {
                    await loadSchedule();
                    onRefreshData?.();
                  }}
                  showToast={showToast}
                  stationWhatsapp={stationConfig?.whatsappNumber}
                />
              )}

              {/* ======================================================== */}
              {/* SESSÃO DO LOCUTOR: ASSUMIR CORINGA                       */}
              {/* ======================================================== */}
              {activeSection === 'coringa' && authRole === 'host' && currentLoggedInHost && (
                <AdminHostCoringaSection
                  activeHost={currentLoggedInHost}
                  currentLiveProgram={currentLiveProgram}
                  liveTakeover={liveTakeover}
                  onStartTakeover={onStartTakeover}
                  onStopTakeover={onStopTakeover}
                  stationWhatsapp={stationConfig?.whatsappNumber}
                  showToast={showToast}
                />
              )}

              {/* ======================================================== */}
              {/* SESSÃO DO LOCUTOR: MEU PERFIL, CELULAR & SENHA PESSOAL   */}
              {/* ======================================================== */}
              {activeSection === 'my_profile' && authRole === 'host' && currentLoggedInHost && (
                <AdminHostMyProfileSection
                  activeHost={currentLoggedInHost}
                  hostToken={hostToken}
                  onProfileUpdated={(updatedHost) => {
                    onHostLogin?.(updatedHost, hostToken);
                    setHostAccountsList((prev) =>
                      prev.map((h) => (h.id === updatedHost.id ? updatedHost : h))
                    );
                    onRefreshData?.();
                  }}
                  showToast={showToast}
                />
              )}

              {/* ======================================================== */}
              {/* SESSÃO: GERENCIADOR DE SEO & GEO (PADRÃO YOAST)          */}
              {/* ======================================================== */}
              {activeSection === 'seo' && authRole === 'admin' && <AdminSeoSection />}
            </main>
          </div>
        )}
      </div>

      {/* QUICK MIXCLOUD CONFIGURATION MODAL (CAIXA DE CADASTRO DENTRO DO GERENCIADOR DE HOTSITES) */}
      {quickMixcloudModal.isOpen && quickMixcloudModal.program && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-blue-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Disc className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                    Cadastrar Mixcloud do Hotsite
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {quickMixcloudModal.program.title} • {quickMixcloudModal.program.host}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickMixcloudModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block">
                Atalhos Rápidos de Endereço:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setQuickMixcloudModal((prev) => ({
                      ...prev,
                      mixcloudUrl: 'https://www.mixcloud.com/skateabout',
                      mixcloudUser: 'skateabout',
                    }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-300 text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>🛹 Skate About</span>
                  <span className="text-zinc-500 font-normal">/skateabout</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickMixcloudModal((prev) => ({
                      ...prev,
                      mixcloudUrl: 'https://www.mixcloud.com/SURF E AÇÃO',
                      mixcloudUser: 'SURF E AÇÃO',
                    }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-300 text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>🏄 Surf & Ação</span>
                  <span className="text-zinc-500 font-normal">/SURF E AÇÃO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickMixcloudModal((prev) => ({
                      ...prev,
                      mixcloudUrl: 'https://www.mixcloud.com/Avoxdobrasil/',
                      mixcloudUser: 'Avoxdobrasil',
                    }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition cursor-pointer"
                >
                  Avoxdobrasil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickMixcloudModal((prev) => ({
                      ...prev,
                      mixcloudUrl: 'https://www.mixcloud.com/eletroacordes/',
                      mixcloudUser: 'eletroacordes',
                    }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition cursor-pointer"
                >
                  eletroacordes
                </button>
              </div>
            </div>

            {/* Inputs de Configuração */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-200">
                  Endereço do Programa (URL no Mixcloud)
                </label>
                <input
                  type="text"
                  value={quickMixcloudModal.mixcloudUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const extracted = extractMixcloudUserFromUrl(val);
                    setQuickMixcloudModal((prev) => ({
                      ...prev,
                      mixcloudUrl: val,
                      mixcloudUser: prev.mixcloudUser || extracted,
                    }));
                  }}
                  placeholder="Ex: https://www.mixcloud.com/skateabout"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Link direto do canal ou programa no mixcloud.com
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-200">
                  Nome do Canal / Usuário Mixcloud
                </label>
                <input
                  type="text"
                  value={quickMixcloudModal.mixcloudUser}
                  onChange={(e) =>
                    setQuickMixcloudModal((prev) => ({
                      ...prev,
                      mixcloudUser: e.target.value,
                    }))
                  }
                  placeholder="Ex: skateabout ou SURF E AÇÃO"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Identificador slug do usuário (ex: skateabout, SURF E AÇÃO)
                </span>
              </div>
            </div>

            {/* Botão de Testar Conexão */}
            <div className="pt-1">
              <button
                type="button"
                disabled={
                  quickMixcloudModal.isTesting ||
                  (!quickMixcloudModal.mixcloudUser && !quickMixcloudModal.mixcloudUrl)
                }
                onClick={async () => {
                  const target = quickMixcloudModal.mixcloudUser || quickMixcloudModal.mixcloudUrl;
                  setQuickMixcloudModal((prev) => ({ ...prev, isTesting: true, testResult: null }));
                  const res = await handleTestMixcloudConnection(target);
                  setQuickMixcloudModal((prev) => ({
                    ...prev,
                    isTesting: false,
                    testResult: res,
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {quickMixcloudModal.isTesting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Disc className="w-4 h-4 text-blue-400" />
                )}
                <span>Testar Conexão e Buscar 5 Gravações</span>
              </button>
            </div>

            {/* Feedback do Teste */}
            {quickMixcloudModal.testResult && (
              <div
                className={`p-3 rounded-xl text-xs space-y-2 border ${
                  quickMixcloudModal.testResult.success
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                    : 'bg-red-950/40 border-red-500/40 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {quickMixcloudModal.testResult.success ? (
                    <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{quickMixcloudModal.testResult.message}</span>
                </div>

                {quickMixcloudModal.testResult.recordings && quickMixcloudModal.testResult.recordings.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {quickMixcloudModal.testResult.recordings.slice(0, 4).map((rec, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-black/60 border border-white/10 flex items-center gap-2 min-w-0"
                      >
                        <img
                          src={rec.picture}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-white truncate">{rec.name}</p>
                          <p className="text-[9px] font-mono text-zinc-400">{rec.user_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ações Inferiores: Cancelar & Salvar */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setQuickMixcloudModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={quickMixcloudModal.isSaving}
                onClick={handleSaveQuickMixcloud}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                {quickMixcloudModal.isSaving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Salvar no Hotsite</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL (SAFE FOR IFRAME) */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base font-display">{confirmDialog.title}</h3>
                <p className="text-xs text-zinc-400">Confirmação de exclusão</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 p-3.5 rounded-2xl border border-white/5">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirmDialog.isLoading}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmDialog.isLoading}
                onClick={async () => {
                  if (confirmDialog.isLoading) return;
                  setConfirmDialog((prev) => prev ? { ...prev, isLoading: true } : null);
                  try {
                    await confirmDialog.onConfirm();
                  } finally {
                    setConfirmDialog(null);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-900/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDialog.isLoading ? 'Excluindo...' : (confirmDialog.confirmText || 'Confirmar Exclusão')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
