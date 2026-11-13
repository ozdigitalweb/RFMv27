import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Download,
  Calendar,
  Music,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Share2,
  RefreshCw,
  Smartphone,
  Globe,
  Mail,
  CheckCircle,
  Clock,
  Heart,
  ChevronRight,
  Headphones,
  Signal,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { radioAudio, normalizeStreamUrl, DEMO_TRACKS, DemoTrack } from './utils/audioEngine';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

import {
  DEFAULT_RADIO_CONFIG,
  INITIAL_PROGRAMS,
  INITIAL_REQUESTS,
  INITIAL_MESSAGES,
  INITIAL_PROMO_BANNERS,
  DEFAULT_REB_PROGRAM,
  INITIAL_HOST_ACCOUNTS,
} from './data/initialData';
import {
  ActiveTab,
  EqualizerPreset,
  ProgramItem,
  RadioAlarm,
  RadioStationConfig,
  ShoutoutMessage,
  SongRequest,
  PromoBanner,
  LiveTakeover,
  HostAccount,
  StationLogosConfig,
} from './types';
import { InstallModal } from './components/InstallModal';
import { SongRequestsModal } from './components/SongRequestsModal';
import { ScheduleView } from './components/ScheduleView';
import { MuralBoard } from './components/MuralBoard';
import { SleepTimerModal } from './components/SleepTimerModal';
import { SettingsModal } from './components/SettingsModal';
import { FeaturesSuggestionModal } from './components/FeaturesSuggestionModal';
import { AlarmClockModal } from './components/AlarmClockModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { InstitutionalView } from './components/InstitutionalView';
import { TodayScheduleSection } from './components/TodayScheduleSection';
import { ProgramHotsiteModal } from './components/ProgramHotsiteModal';
import { HostAuthModal } from './components/HostAuthModal';
import { PromoModal } from './components/PromoModal';
import { PromoBannerCard } from './components/PromoBannerCard';
import { LiveProgramHeroCard } from './components/LiveProgramHeroCard';
import { RebeldiaLogo } from './components/RebeldiaLogo';
import { AndroidIcon } from './components/AndroidIcon';
import { AppleIcon } from './components/AppleIcon';
import { GlobalPlayerBar } from './components/GlobalPlayerBar';
import { CardBackgroundVisualizer } from './components/Visualizer';
import { LiveTakeoverModal } from './components/LiveTakeoverModal';
import { MusicModeModal } from './components/MusicModeModal';
import { useAuth } from './context/AuthContext';
import { api, DbStats, StreamMetadata } from './utils/api';
import {
  saveCustomLogo,
  getStationLogos,
  fetchAndSyncServerLogos,
  applyDynamicFavicon,
  applyDynamicWindowsTile,
} from './utils/logo';
import { applyTheme, getSavedPaletteId } from './utils/theme';
import { getSavedInstitutionalData, saveInstitutionalData, InstitutionalData } from './data/institutional';
import { applyClientSeo } from './utils/seo';
import { findProgramBySlug, getProgramLogoSrc, getProgramSlug } from './utils/slug';
import { ensureSystemHosts, findLinkedHostAccount, resolveProgramWhatsapp, isCoringaHost } from './utils/hostPhone';
import { LogIn, LogOut, User as UserIcon, Database, ShieldCheck, KeyRound, Flame, Gift, Sparkles as SparklesIcon, UserCheck } from 'lucide-react';

export default function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [schedulePrograms, setSchedulePrograms] = useState<ProgramItem[]>(INITIAL_PROGRAMS);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    try {
      return Boolean(
        localStorage.getItem('rebeldia_admin_session') ||
        localStorage.getItem('rebeldia_admin_open')
      );
    } catch {
      return false;
    }
  });

  const handleOpenAdmin = useCallback(() => {
    localStorage.setItem('rebeldia_admin_open', 'true');
    setIsAdminOpen(true);
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    applyDynamicFavicon('/reb_mascot.jpg');
    applyClientSeo({
      title: 'Painel Administrativo | Rebeldia FM - Rádio Web',
      description: 'Gerenciador da grade de programação, Hotsites, pedidos musicais, mural e configurações de SEO & GEO.',
      ogImage: '/reb_mascot.jpg',
      faviconUrl: '/reb_mascot.jpg',
    });
  }, []);

  const handleCloseAdmin = useCallback(() => {
    localStorage.removeItem('rebeldia_admin_open');
    setIsAdminOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
      api.getPageSeo('/').then((seo) => {
        if (seo) applyClientSeo(seo);
      });
    }
  }, []);
  const [selectedHotsiteProgram, setSelectedHotsiteProgram] = useState<ProgramItem | null>(null);
  const [institutionalData, setInstitutionalData] = useState<InstitutionalData>(getSavedInstitutionalData);

  // Host Account State & Modal
  const [isHostAuthOpen, setIsHostAuthOpen] = useState(false);
  const [currentLoggedInHost, setCurrentLoggedInHost] = useState<HostAccount | null>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_logged_host');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleHostLogin = (host: HostAccount) => {
    setCurrentLoggedInHost(host);
    localStorage.setItem('rebeldia_logged_host', JSON.stringify(host));
  };

  const handleHostLogout = () => {
    setCurrentLoggedInHost(null);
    localStorage.removeItem('rebeldia_logged_host');
  };

  // Theme & Palette State
  const [currentPaletteId, setCurrentPaletteId] = useState<string>(getSavedPaletteId);

  useEffect(() => {
    applyTheme(currentPaletteId);
  }, [currentPaletteId]);

  // Radio Config State
  const [stationConfig, setStationConfig] = useState<RadioStationConfig>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_station_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.slogan || parsed.slogan.includes('24 horas no ar') || parsed.slogan.includes('mediocridade')) {
          parsed.slogan = 'radio LIVRE';
        }
        if (!parsed.streamUrl || !parsed.streamUrl.includes('hdradios.net:6806')) {
          parsed.streamUrl = 'https://sv11.hdradios.net:6806/;';
        } else if (!parsed.streamUrl.endsWith('/;') && !parsed.streamUrl.includes('/stream') && !parsed.streamUrl.includes('/live')) {
          parsed.streamUrl = parsed.streamUrl.replace(/\/?$/, '/;');
        }
        if (parsed.metadataDelaySeconds === undefined) {
          parsed.metadataDelaySeconds = 10;
        }
        if (!parsed.location || parsed.location.toLowerCase().includes('canoas')) {
          parsed.location = 'Florianópolis / SC, Brasil';
          try {
            localStorage.setItem('rebeldia_station_config', JSON.stringify(parsed));
          } catch {}
        }
        return parsed;
      }
      return DEFAULT_RADIO_CONFIG;
    } catch {
      return DEFAULT_RADIO_CONFIG;
    }
  });

  // Host Accounts (Cadastro de Locutores) State & Programas com WhatsApp resolvido pelo Locutor
  const [hostAccounts, setHostAccounts] = useState<HostAccount[]>(() =>
    ensureSystemHosts(INITIAL_HOST_ACCOUNTS, INITIAL_HOST_ACCOUNTS)
  );

  const resolvedSchedulePrograms = useMemo<ProgramItem[]>(() => {
    const baseList = schedulePrograms.length > 0 ? schedulePrograms : INITIAL_PROGRAMS;
    return baseList.map((prog) => {
      const linkedHost = findLinkedHostAccount(prog, hostAccounts);
      return {
        ...prog,
        hostAccountId: prog.hostAccountId || linkedHost?.id,
        whatsappNumber: resolveProgramWhatsapp(prog, hostAccounts, stationConfig.whatsappNumber),
      };
    });
  }, [schedulePrograms, hostAccounts, stationConfig.whatsappNumber]);

  // Client-side cache migration to permanently purge any stale "Canoas" references
  useEffect(() => {
    try {
      const keysToClean = [
        'rebeldia_station_config',
        'rebeldia_institutional_data_v2',
        'rebeldia_institutional_data',
        'rebeldia_station_logos',
      ];
      for (const k of keysToClean) {
        const val = localStorage.getItem(k);
        if (val && val.toLowerCase().includes('canoas')) {
          const cleaned = val
            .replace(/Canoas(\s*-\s*RS|\s*\/RS|\s*\/ RS)/gi, 'Florianópolis / SC')
            .replace(/Canoas,?\s*(Rio Grande do Sul|RS)/gi, 'Florianópolis, Santa Catarina')
            .replace(/Canoas/gi, 'Florianópolis');
          localStorage.setItem(k, cleaned);
        }
      }
    } catch {}
  }, []);

  // Multi-Slot Station Logos State (Header, Player Center, Footer, Windows Taskbar, Favicon)
  const [stationLogos, setStationLogos] = useState<StationLogosConfig>(getStationLogos);

  useEffect(() => {
    const isOnProgramSlug = () =>
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/programas/') &&
      window.location.pathname.replace(/\/+$/, '') !== '/programas';

    const handleLogosUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StationLogosConfig>;
      if (customEvent.detail) {
        setStationLogos(customEvent.detail);
        if (!isOnProgramSlug()) {
          applyDynamicFavicon('/reb_mascot.jpg');
        }
        if (customEvent.detail.windowsTaskbarIcon) applyDynamicWindowsTile(customEvent.detail.windowsTaskbarIcon);
      }
    };

    window.addEventListener('rebeldia_logos_updated', handleLogosUpdate);
    fetchAndSyncServerLogos().then((logos) => {
      if (logos) {
        setStationLogos(logos);
        if (!isOnProgramSlug()) {
          applyDynamicFavicon('/reb_mascot.jpg');
        }
        if (logos.windowsTaskbarIcon) applyDynamicWindowsTile(logos.windowsTaskbarIcon);
      }
    });

    return () => window.removeEventListener('rebeldia_logos_updated', handleLogosUpdate);
  }, []);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [equalizerPreset, setEqualizerPreset] = useState<EqualizerPreset>('rock');

  // Stream Metadata State (Live song name & artist)
  const [streamMetadata, setStreamMetadata] = useState<StreamMetadata>({
    rawTitle: 'Rebeldia FM - No Ar',
    artist: 'Rebeldia FM',
    song: 'Programação Especial',
    hasLiveMetadata: false,
    listeners: 0,
    bitrate: 128,
    timestamp: Date.now(),
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('player');

  // SPA Navigation and URL deep-linking (HTML5 History API - Item 1.1 e 1.3)
  const navigateTab = useCallback((tab: ActiveTab) => {
    let targetPath = '/';
    if (tab === 'schedule') targetPath = '/programas';
    else if (tab === 'mural') targetPath = '/mural';
    else if (tab === 'requests') targetPath = '/pedidos';
    else if (tab === 'rebeldia') targetPath = '/rebeldia';
    else if (tab === 'player') targetPath = '/';

    setActiveTab(tab);
    setSelectedHotsiteProgram(null);
    applyDynamicFavicon('/reb_mascot.jpg');
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    api.getPageSeo(targetPath).then((seo) => {
      if (seo) applyClientSeo({ ...seo, ogImage: '/reb_mascot.jpg', faviconUrl: '/reb_mascot.jpg' });
    });
  }, []);

  const handleSelectProgramHotsite = useCallback((prog: ProgramItem) => {
    setSelectedHotsiteProgram(prog);
    const slug = getProgramSlug(prog);
    const hotsitePath = `/programas/${slug}`;
    if (typeof window !== 'undefined' && window.location.pathname !== hotsitePath) {
      window.history.pushState({}, '', hotsitePath);
    }
    const programIcon = getProgramLogoSrc(prog);
    const programOgImage = programIcon.startsWith('data:')
      ? `/api/program-og-image/${encodeURIComponent(slug)}?v=${programIcon.length}`
      : programIcon;
    applyClientSeo({
      title: `${prog.title} - Com ${prog.host} | Rebeldia FM`,
      description: prog.description || `Hotsite oficial do programa ${prog.title} na Rebeldia FM.`,
      canonicalUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}${hotsitePath}`
          : `https://rebeldiafm.com.br${hotsitePath}`,
      ogTitle: `${prog.title} - Com ${prog.host}`,
      ogDescription: prog.description || `Ouça ${prog.title} na Rebeldia FM com ${prog.host}.`,
      ogImage: programOgImage,
      faviconUrl: programIcon,
    });
  }, []);

  const handleCloseProgramHotsite = useCallback(() => {
    setSelectedHotsiteProgram(null);
    applyDynamicFavicon('/reb_mascot.jpg');
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/programas/')) {
      window.history.pushState({}, '', '/programas');
      api.getPageSeo('/programas').then((seo) => {
        if (seo) applyClientSeo({ ...seo, ogImage: '/reb_mascot.jpg', faviconUrl: '/reb_mascot.jpg' });
      });
    }
  }, []);

  // Listen to popstate (Back/Forward in browser) and synchronize route & SEO
  useEffect(() => {
    const handlePopState = () => {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
      const clean = pathname.split('?')[0].replace(/\/+$/, '') || '/';

      if (clean === '/admin') {
        setIsAdminOpen(true);
        setSelectedHotsiteProgram(null);
        applyDynamicFavicon('/reb_mascot.jpg');
        return;
      }

      setIsAdminOpen(false);

      if (clean.startsWith('/programas/') && clean !== '/programas') {
        const slug = decodeURIComponent(clean.replace('/programas/', '').trim()).toLowerCase();
        setActiveTab('schedule');
        const found = findProgramBySlug(resolvedSchedulePrograms, slug);
        if (found) {
          setSelectedHotsiteProgram(found);
          const programIcon = getProgramLogoSrc(found);
          const resolvedSlug = getProgramSlug(found) || slug;
          const programOgImage = programIcon.startsWith('data:')
            ? `/api/program-og-image/${encodeURIComponent(resolvedSlug)}?v=${programIcon.length}`
            : programIcon;
          applyClientSeo({
            title: `${found.title} - Com ${found.host} | Rebeldia FM`,
            description: found.description || `Hotsite oficial do programa ${found.title} na Rebeldia FM.`,
            canonicalUrl:
              typeof window !== 'undefined'
                ? `${window.location.origin}${clean}`
                : `https://rebeldiafm.com.br${clean}`,
            ogTitle: `${found.title} - Com ${found.host}`,
            ogDescription: found.description || `Ouça ${found.title} na Rebeldia FM com ${found.host}.`,
            ogImage: programOgImage,
            faviconUrl: programIcon,
          });
          return;
        }
      }

      setSelectedHotsiteProgram(null);
      applyDynamicFavicon('/reb_mascot.jpg');

      if (clean === '/programas') {
        setActiveTab('schedule');
      } else if (clean === '/mural' || clean === '/recados') {
        setActiveTab('mural');
      } else if (clean === '/pedidos' || clean === '/musica') {
        setActiveTab('requests');
      } else if (clean === '/rebeldia' || clean === '/sobre' || clean === '/manifesto') {
        setActiveTab('rebeldia');
      } else {
        setActiveTab('player');
      }

      api.getPageSeo(clean).then((seo) => {
        if (seo) applyClientSeo({ ...seo, ogImage: '/reb_mascot.jpg', faviconUrl: '/reb_mascot.jpg' });
      });
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, [resolvedSchedulePrograms]);

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'android' | 'ios'>('android');
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [isMusicModeOpen, setIsMusicModeOpen] = useState(false);

  const openInstallModal = (platform?: 'android' | 'ios') => {
    if (platform) {
      setInstallPlatform(platform);
    } else {
      const isIOS = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      );
      setInstallPlatform(isIOS ? 'ios' : 'android');
    }
    setIsInstallModalOpen(true);
  };

  // Sleep Timer & Alarm
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number | null>(null);
  const [alarm, setAlarm] = useState<RadioAlarm>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_alarm');
      return saved ? JSON.parse(saved) : { enabled: false, time: '07:00', days: [0, 1, 2, 3, 4, 5, 6], label: 'Despertar Musical' };
    } catch {
      return { enabled: false, time: '07:00', days: [0, 1, 2, 3, 4, 5, 6], label: 'Despertar Musical' };
    }
  });

  // Community Data State
  const [requests, setRequests] = useState<SongRequest[]>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_requests');
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [messages, setMessages] = useState<ShoutoutMessage[]>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // Promo Banners State & Modal
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_promo_banners');
      return saved ? JSON.parse(saved) : INITIAL_PROMO_BANNERS;
    } catch {
      return INITIAL_PROMO_BANNERS;
    }
  });
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  const handleSavePromoBanners = (updated: PromoBanner[]) => {
    setPromoBanners(updated);
    localStorage.setItem('rebeldia_promo_banners', JSON.stringify(updated));
    api.savePromoBanners(updated).catch(() => {});
  };

  // Live Takeover State (Locutor Online / Substituição de Horário de Colega)
  const [liveTakeover, setLiveTakeover] = useState<LiveTakeover | null>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_live_takeover');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isTakeoverModalOpen, setIsTakeoverModalOpen] = useState(false);
  const [takeoverTargetProgram, setTakeoverTargetProgram] = useState<ProgramItem | null>(null);
  const [takeoverInitialCoringa, setTakeoverInitialCoringa] = useState(false);

  const handleStartTakeover = (takeover: LiveTakeover) => {
    setLiveTakeover(takeover);
    localStorage.setItem('rebeldia_live_takeover', JSON.stringify(takeover));
    api.saveLiveTakeover(takeover).catch(() => {});
  };

  const handleStopTakeover = () => {
    setLiveTakeover(null);
    localStorage.removeItem('rebeldia_live_takeover');
    api.clearLiveTakeover().catch(() => {});
  };

  const handleOpenTakeoverForProgram = (prog?: ProgramItem, coringaMode = false) => {
    setTakeoverTargetProgram(prog || null);
    setTakeoverInitialCoringa(Boolean(coringaMode));
    setIsTakeoverModalOpen(true);
  };

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Live Song Artwork state (fetched from iTunes when a real song is on air)
  const [liveSongArtwork, setLiveSongArtwork] = useState<string | null>(null);

  // Sticky Nav state tracking on window scroll
  const [isNavSticky, setIsNavSticky] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      // Header height is ~60px
      setIsNavSticky(window.scrollY > 45);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Horizontal Navigation auto-scroll suave para a aba ativa (efeito deslizar para o lado ao clicar)
  const navScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (navScrollRef.current) {
      const activeEl = navScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl && typeof (activeEl as HTMLElement).scrollIntoView === 'function') {
        (activeEl as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab]);

  // Load Community Data, Schedule, Promo Banners and Live Takeovers from Cloud SQL Backend API
  const loadBackendData = useCallback(async () => {
    try {
      const [backendRequests, backendMessages, backendStats, backendSchedule, backendConfig, backendBanners, backendTakeover, backendHosts, backendInstitutional] = await Promise.allSettled([
        api.getSongRequests(),
        api.getShoutouts(),
        api.getStats(),
        api.getSchedule(),
        api.getStationConfig(),
        api.getPromoBanners(),
        api.getLiveTakeover(),
        api.getHostAccounts(),
        api.getInstitutionalData(),
      ]);

      if (backendInstitutional.status === 'fulfilled' && backendInstitutional.value) {
        setInstitutionalData((prev) => ({ ...prev, ...backendInstitutional.value }));
        saveInstitutionalData(backendInstitutional.value);
      }

      if (backendHosts.status === 'fulfilled' && Array.isArray(backendHosts.value) && backendHosts.value.length > 0) {
        setHostAccounts(ensureSystemHosts(backendHosts.value, INITIAL_HOST_ACCOUNTS));
      }

      if (backendTakeover.status === 'fulfilled' && backendTakeover.value) {
        if (backendTakeover.value.isActive) {
          setLiveTakeover(backendTakeover.value);
          localStorage.setItem('rebeldia_live_takeover', JSON.stringify(backendTakeover.value));
        } else {
          setLiveTakeover(null);
          localStorage.removeItem('rebeldia_live_takeover');
        }
      }

      if (backendBanners.status === 'fulfilled' && backendBanners.value && backendBanners.value.length > 0) {
        setPromoBanners(backendBanners.value);
        localStorage.setItem('rebeldia_promo_banners', JSON.stringify(backendBanners.value));
      }

      if (backendConfig.status === 'fulfilled' && backendConfig.value) {
        const sc = backendConfig.value;
        const rawUrl =
          sc.streamUrl && !sc.streamUrl.includes('zeno.fm')
            ? sc.streamUrl
            : 'https://sv11.hdradios.net:6806/;';
        const validStreamUrl = normalizeStreamUrl(rawUrl, false);
        const cleanLocation =
          sc.location && !sc.location.toLowerCase().includes('canoas')
            ? sc.location
            : 'Florianópolis / SC, Brasil';

        setStationConfig((prev) => {
          const updated = {
            ...prev,
            name: sc.name || prev.name,
            slogan: sc.slogan || prev.slogan,
            streamUrl: validStreamUrl,
            whatsappNumber: sc.whatsappNumber || prev.whatsappNumber,
            instagramHandle: sc.instagramHandle || prev.instagramHandle,
            email: sc.email || prev.email,
            location: cleanLocation,
            frequency: sc.frequency || prev.frequency,
            logoUrl: sc.customLogo || sc.logoUrl || prev.logoUrl,
            metadataDelaySeconds:
              sc.metadataDelaySeconds !== undefined ? Number(sc.metadataDelaySeconds) : (prev.metadataDelaySeconds ?? 10),
          };
          try {
            localStorage.setItem('rebeldia_station_config', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        if (sc.customLogo) {
          saveCustomLogo(sc.customLogo);
        }
      }

      if (backendRequests.status === 'fulfilled' && backendRequests.value.length > 0) {
        const mappedRequests: SongRequest[] = backendRequests.value.map((r) => ({
          id: String(r.id),
          listenerName: r.listenerName,
          city: r.listenerCity || 'Ouvinte Web',
          songTitle: r.songTitle,
          artist: r.artist,
          dedication: r.message || r.dedicatedTo || undefined,
          dedicatedTo: r.dedicatedTo || undefined,
          artworkUrl: r.artworkUrl || undefined,
          previewUrl: r.previewUrl || undefined,
          artistBio: r.artistBio || undefined,
          timestamp: new Date(r.createdAt).getTime(),
          votes: r.votes || 1,
        }));
        setRequests(mappedRequests);
      }

      if (backendMessages.status === 'fulfilled' && backendMessages.value.length > 0) {
        const mappedMessages: ShoutoutMessage[] = backendMessages.value.map((m) => ({
          id: String(m.id),
          author: m.authorName,
          city: m.authorCity || 'Ouvinte Web',
          message: m.content,
          timestamp: new Date(m.createdAt).getTime(),
          likes: m.likesCount,
          avatarColor: 'bg-zinc-800',
        }));
        setMessages(mappedMessages);
      }

      if (backendSchedule.status === 'fulfilled' && backendSchedule.value.length > 0) {
        const daysLabels: Record<number, string> = {
          0: 'Domingos',
          1: 'Segunda a Sexta',
          2: 'Terças',
          3: 'Quartas',
          4: 'Quintas',
          5: 'Sextas',
          6: 'Sábados',
          [-1]: 'Todos os Dias',
        };

        const mappedSchedule: ProgramItem[] = backendSchedule.value.map((item, index) => {
          let highlights = undefined;
          if (item.highlightsJson) {
            try {
              highlights = JSON.parse(item.highlightsJson);
            } catch {}
          }
          let playlist = undefined;
          if (item.playlistJson) {
            try {
              playlist = JSON.parse(item.playlistJson);
            } catch {}
          }
          let photoGallery = undefined;
          if (item.photoGalleryJson) {
            try {
              photoGallery = JSON.parse(item.photoGalleryJson);
            } catch {}
          }
          let videoGallery = undefined;
          if (item.videoGalleryJson) {
            try {
              videoGallery = JSON.parse(item.videoGalleryJson);
            } catch {}
          }
          let finalTitle = item.title;
          if (finalTitle === 'Madrugada Sem Parar') {
            finalTitle = 'inLINE - madrugadão Rebeldia';
          } else if (finalTitle === 'Curadoria 24h Rebeldia') {
            finalTitle = 'REB - 24hs NOAR';
          }

          return {
            id: item.id !== undefined && item.id !== null ? String(item.id) : (item.title ? `prog-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index}` : `prog-${index}`),
            seedKey: (item as any).seedKey || undefined,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            isActive: item.isActive !== false,
            title: finalTitle,
            host: item.host,
            hostRole: item.hostRole || 'Locutor & Apresentador',
            hostAccountId: item.hostAccountId || undefined,
            description: item.description || '',
            genre: item.genre || 'Variedades',
            avatarUrl: item.avatarUrl || undefined,
            bannerUrl: item.bannerUrl || undefined,
            logoUrl: item.logoUrl || undefined,
            hasReprise: Boolean(item.hasReprise),
            repriseDayOfWeek: Boolean(item.hasReprise) && item.repriseDayOfWeek !== null && item.repriseDayOfWeek !== undefined ? item.repriseDayOfWeek : undefined,
            repriseStartTime: Boolean(item.hasReprise) ? (item.repriseStartTime || undefined) : undefined,
            repriseEndTime: Boolean(item.hasReprise) ? (item.repriseEndTime || undefined) : undefined,
            repriseDaysLabel: Boolean(item.hasReprise) ? (item.repriseDaysLabel || undefined) : undefined,
            daysLabel: item.daysLabel || daysLabels[item.dayOfWeek] || 'Todos os Dias',
            hostBio: item.hostBio || undefined,
            instagramHandle: item.instagramHandle || undefined,
            whatsappNumber: item.whatsappNumber || undefined,
            highlights,
            playlist,
            photoGallery,
            videoGallery,
            mixcloudUser: item.mixcloudUser || undefined,
            mixcloudUrl: item.mixcloudUrl || undefined,
          };
        });
        setSchedulePrograms(mappedSchedule);
      }

      if (backendStats.status === 'fulfilled') {
        setDbStats(backendStats.value);
      }
    } catch (err) {
      console.error('Error loading backend data:', err);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Stream Metadata Auto-Polling with Buffer Sync Delay
  // Compensates for the ~10s audio streaming buffer latency so the song title & artwork
  // transition in perfect sync with what the listener is actually hearing.
  const pendingMetaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRawTitleRef = useRef<string | null>(null);
  const displayedRawTitleRef = useRef<string | null>(null);
  const isInitialMetaRef = useRef<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const meta = await api.getStreamMetadata(stationConfig.streamUrl);
        if (!isMounted || !meta) return;

        const delaySeconds =
          stationConfig.metadataDelaySeconds !== undefined ? stationConfig.metadataDelaySeconds : 10;
        const delayMs = Math.max(0, delaySeconds * 1000);

        // 1. Initial Load: show immediately so the user doesn't see a blank/placeholder title
        if (isInitialMetaRef.current) {
          isInitialMetaRef.current = false;
          displayedRawTitleRef.current = meta.rawTitle;
          setStreamMetadata(meta);
          return;
        }

        // 2. Delay disabled (0s): apply changes instantaneously
        if (delayMs === 0) {
          if (pendingMetaTimeoutRef.current) {
            clearTimeout(pendingMetaTimeoutRef.current);
            pendingMetaTimeoutRef.current = null;
            pendingRawTitleRef.current = null;
          }
          displayedRawTitleRef.current = meta.rawTitle;
          setStreamMetadata(meta);
          return;
        }

        // 3. Same track title as currently displayed on screen
        if (meta.rawTitle === displayedRawTitleRef.current) {
          // If a pending track reverted or didn't stick, cancel the pending timer
          if (pendingRawTitleRef.current && pendingRawTitleRef.current !== meta.rawTitle) {
            if (pendingMetaTimeoutRef.current) {
              clearTimeout(pendingMetaTimeoutRef.current);
              pendingMetaTimeoutRef.current = null;
              pendingRawTitleRef.current = null;
            }
          }
          // Update live metrics (listeners, bitrate) without altering title/artwork
          setStreamMetadata((prev) => ({
            ...prev,
            listeners: meta.listeners,
            bitrate: meta.bitrate,
          }));
          return;
        }

        // 4. A new track has been detected from the stream server!
        // If this exact new track is already counting down in the delay queue, don't restart the timer
        if (pendingRawTitleRef.current === meta.rawTitle) {
          return;
        }

        // Queue new track title after the retardo period (default: 10 seconds)
        if (pendingMetaTimeoutRef.current) {
          clearTimeout(pendingMetaTimeoutRef.current);
        }
        pendingRawTitleRef.current = meta.rawTitle;
        pendingMetaTimeoutRef.current = setTimeout(() => {
          displayedRawTitleRef.current = meta.rawTitle;
          pendingRawTitleRef.current = null;
          pendingMetaTimeoutRef.current = null;
          if (isMounted) {
            setStreamMetadata(meta);
          }
        }, delayMs);
      } catch {
        // Retain previous metadata on transient network errors
      }
    };

    fetchMetadata();
    // Poll every 3.5 seconds to capture song changes quickly and minimize timing jitter
    const interval = setInterval(fetchMetadata, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (pendingMetaTimeoutRef.current) {
        clearTimeout(pendingMetaTimeoutRef.current);
      }
    };
  }, [stationConfig.streamUrl, stationConfig.metadataDelaySeconds]);

  // Resolves Album Cover Artwork when music is playing (or clears when not playing music)
  useEffect(() => {
    if (!streamMetadata.hasLiveMetadata || !streamMetadata.song) {
      setLiveSongArtwork(null);
      return;
    }

    if (streamMetadata.artworkUrl) {
      setLiveSongArtwork(streamMetadata.artworkUrl);
      return;
    }

    let isMounted = true;
    const term = `${streamMetadata.artist || ''} ${streamMetadata.song || ''}`.trim();
    if (term && !term.toLowerCase().includes('vinheta') && !term.toLowerCase().includes('comercial')) {
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.results && data.results[0]?.artworkUrl100) {
            const highRes = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            setLiveSongArtwork(highRes);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [streamMetadata.hasLiveMetadata, streamMetadata.song, streamMetadata.artist, streamMetadata.artworkUrl]);

  // Audio HTML element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseRingRef = useRef<HTMLDivElement | null>(null);
  const togglePlayRef = useRef<() => void>(() => {});

  // Audio reactivity for central vinyl circle: 8px translucent border synced directly to the shared rhythmic beat engine
  useEffect(() => {
    const el = pulseRingRef.current;
    if (!el) return;

    const isAudible = isPlaying && !isBuffering && !isMuted && volume > 0;
    if (!isAudible) {
      el.style.transform = 'scale(1)';
      el.style.opacity = '0.23';
      el.style.filter = 'brightness(0.85) drop-shadow(0 0 5px var(--color-primary, #f59e0b))';
      el.style.boxShadow = '0 0 7px 1.3px var(--color-primary, #f59e0b)';
      return;
    }

    let animId: number;

    const tick = () => {
      const { beatPulse } = radioAudio.getBeatMetrics();
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

      if (pulseRingRef.current) {
        const scaleBoost = isMobile ? 0.095 : 0.082;
        const scale = 1 + beatPulse * scaleBoost;

        const opacity = 0.22 + beatPulse * (isMobile ? 0.58 : 0.52);
        const glowSpread = (isMobile ? 6 : 8) + beatPulse * (isMobile ? 24 : 28);
        const innerGlow = (isMobile ? 2 : 3) + beatPulse * (isMobile ? 12 : 14);
        const brightness = 1.0 + beatPulse * 0.85;

        pulseRingRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        pulseRingRef.current.style.opacity = opacity.toFixed(2);
        pulseRingRef.current.style.filter = `brightness(${brightness.toFixed(2)}) drop-shadow(0 0 ${glowSpread.toFixed(1)}px var(--color-primary, #f59e0b))`;
        pulseRingRef.current.style.boxShadow = `0 0 ${glowSpread.toFixed(1)}px ${(2 + beatPulse * 3).toFixed(1)}px var(--color-primary, #f59e0b), inset 0 0 ${innerGlow.toFixed(1)}px var(--color-primary, #f59e0b)`;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isBuffering, isMuted, volume]);

  // Initialize audio element listeners and MediaSession API
  useEffect(() => {
    const audio = radioAudio.getAudioElement();
    audioRef.current = audio;
    audio.src = normalizeStreamUrl(stationConfig.streamUrl);
    radioAudio.setVolumeAndMute(volume, isMuted);
    radioAudio.setEqualizer(equalizerPreset);

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setHasError(false);
      radioAudio.initWebAudio();
      radioAudio.resumeContext();
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
      radioAudio.resetLiveAudioLatch();
    };
    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setHasError(true);
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Setup MediaSession for Android lock screen & notification controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: stationConfig.name,
        artist: 'Transmissão Ao Vivo HD',
        album: stationConfig.slogan,
        artwork: [
          { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512&auto=format&fit=crop&q=80', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlayRef.current();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlayRef.current();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        togglePlayRef.current();
      });
    }

    // PWA Install detection
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [stationConfig.streamUrl]);

  // Alarm Clock Checker Loop
  useEffect(() => {
    const checkAlarm = () => {
      if (!alarm.enabled) return;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay();

      if (currentTimeStr === alarm.time && alarm.days.includes(currentDay)) {
        if (!isPlaying) {
          togglePlayRef.current();
        }
      }
    };

    const interval = setInterval(checkAlarm, 1000 * 30);
    return () => clearInterval(interval);
  }, [alarm, isPlaying]);

  // Sleep Timer countdown handler
  const handleSetSleepTimer = (minutes: number | null) => {
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }

    if (minutes === null) {
      setTimerSecondsRemaining(null);
      setIsSleepTimerOpen(false);
      return;
    }

    const totalSeconds = minutes * 60;
    setTimerSecondsRemaining(totalSeconds);
    setIsSleepTimerOpen(false);

    sleepTimerIntervalRef.current = setInterval(() => {
      setTimerSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (sleepTimerIntervalRef.current) {
            clearInterval(sleepTimerIntervalRef.current);
            sleepTimerIntervalRef.current = null;
          }
          const audio = radioAudio.getAudioElement();
          audio.pause();
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Inicia a transmissão executando sempre um reload forçado do streaming ao vivo
  const startStreamWithReload = useCallback(() => {
    radioAudio.stopSynthTestBeat();
    radioAudio.resetLiveAudioLatch();
    setHasError(false);
    setIsBuffering(true);
    radioAudio.ensureCorsEnabled();
    radioAudio.initWebAudio();
    radioAudio.resumeContext();
    radioAudio.setVolumeAndMute(volume, isMuted);
    radioAudio.setEqualizer(equalizerPreset);

    const audio = radioAudio.getAudioElement();
    const freshStreamUrl = normalizeStreamUrl(stationConfig.streamUrl, true);
    const directPlayableUrl = normalizeStreamUrl(stationConfig.streamUrl, false);

    // Força a recarga imediata do stream com Shoutcast mount válido e descarte de cache
    audio.src = freshStreamUrl;
    audio.load();

    // Atualização imediata dos metadados da música/artista no ar
    api.getStreamMetadata(stationConfig.streamUrl).then((meta) => {
      if (meta) {
        displayedRawTitleRef.current = meta.rawTitle;
        setStreamMetadata(meta);
      }
    }).catch(() => {});

    audio.play().then(() => {
      setIsPlaying(true);
      setIsBuffering(false);
      setHasError(false);
    }).catch((err) => {
      console.warn('Tentativa com cachebuster falhou, tentando reconectar com URL direta do Shoutcast:', err);
      // Fallback: recarga imediata com a URL direta normalizada do streaming
      audio.src = directPlayableUrl;
      audio.load();
      audio.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
        setHasError(false);
      }).catch((fallbackErr) => {
        console.error('Falha na conexão do streaming ao vivo:', fallbackErr);
        // Fallback final: tenta sem crossOrigin caso o navegador tenha bloqueado CORS
        try {
          audio.removeAttribute('crossorigin');
          audio.src = directPlayableUrl;
          audio.load();
          audio.play().then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
            setHasError(false);
          }).catch(() => {
            setIsBuffering(false);
            setIsPlaying(false);
            setHasError(true);
          });
        } catch {
          setIsBuffering(false);
          setIsPlaying(false);
          setHasError(true);
        }
      });
    });
  }, [stationConfig.streamUrl, volume, isMuted, equalizerPreset]);

  // Play / Pause toggle: Toda vez que o play for apertado ele deverá iniciar a música com um reload no streaming
  const togglePlay = useCallback(() => {
    const audio = radioAudio.getAudioElement();
    if (isPlaying) {
      audio.pause();
      radioAudio.stopSynthTestBeat();
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      startStreamWithReload();
    }
  }, [isPlaying, startStreamWithReload]);

  // Mantém a ref sincronizada para atalhos de sistema e MediaSession
  togglePlayRef.current = togglePlay;

  // Reload / Reconnect audio stream (utiliza a mesma recarga forçada)
  const reloadStream = useCallback(() => {
    startStreamWithReload();
  }, [startStreamWithReload]);

  // Volume handler
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
    radioAudio.setVolumeAndMute(newVolume, false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      radioAudio.setVolumeAndMute(volume, false);
    } else {
      setIsMuted(true);
      radioAudio.setVolumeAndMute(volume, true);
    }
  };

  // Equalizer Change
  const handleEqualizerChange = (preset: EqualizerPreset) => {
    setEqualizerPreset(preset);
    radioAudio.setEqualizer(preset);
  };

  // Scheduled Base Program based on streamMetadata (live broadcast detection) or current day and time
  const scheduledBaseProgram = useMemo<ProgramItem>(() => {
    const progList = resolvedSchedulePrograms.length > 0 ? resolvedSchedulePrograms : INITIAL_PROGRAMS;

    // 0. Detecção inteligente: se o streamMetadata contiver o nome de um programa da grade (ex: "REPRISE - - Programa Avox Do Brasil 29...")
    if (streamMetadata?.song) {
      const lowerSong = streamMetadata.song.toLowerCase();
      const metaMatch = progList.find((p) => {
        if (p.isActive === false) return false;
        const pTitleLower = p.title.toLowerCase();
        if (lowerSong.includes(pTitleLower)) return true;
        if (pTitleLower.includes('avox') && lowerSong.includes('avox')) return true;
        if (p.mixcloudUser && lowerSong.includes(p.mixcloudUser.toLowerCase())) return true;
        return false;
      });

      if (metaMatch) {
        return {
          ...metaMatch,
          badge: lowerSong.includes('reprise') ? 'Reprise' : metaMatch.badge || 'No Ar',
        };
      }
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    let isRepriseOnAir = false;
    const matching = progList.find((p) => {
      if (p.isActive === false) return false;

      // 1. Transmissão Principal
      const dayMatches = p.dayOfWeek === -1 || p.dayOfWeek === currentDay;
      if (dayMatches && p.startTime && p.endTime) {
        const [startH] = p.startTime.split(':').map(Number);
        const [endH] = p.endTime.split(':').map(Number);
        const inMainTime = startH <= endH
          ? currentHour >= startH && currentHour < endH
          : currentHour >= startH || currentHour < endH;
        if (inMainTime) return true;
      }

      // 2. Transmissão da Reprise
      if (
        p.hasReprise &&
        p.repriseStartTime &&
        p.repriseEndTime &&
        (p.repriseDayOfWeek === -1 || p.repriseDayOfWeek === currentDay)
      ) {
        const [rStartH] = p.repriseStartTime.split(':').map(Number);
        const [rEndH] = p.repriseEndTime.split(':').map(Number);
        const inRepriseTime = rStartH <= rEndH
          ? currentHour >= rStartH && currentHour < rEndH
          : currentHour >= rStartH || currentHour < rEndH;
        if (inRepriseTime) {
          isRepriseOnAir = true;
          return true;
        }
      }

      return false;
    });

    if (matching) {
      if (isRepriseOnAir) {
        return {
          ...matching,
          badge: 'Reprise',
        };
      }
      return matching;
    }

    return {
      ...DEFAULT_REB_PROGRAM,
      whatsappNumber: resolveProgramWhatsapp(DEFAULT_REB_PROGRAM, hostAccounts, stationConfig.whatsappNumber),
    };
  }, [resolvedSchedulePrograms, streamMetadata.song, hostAccounts, stationConfig.whatsappNumber]);

  // Current Live Program based on base program + active takeover / Modo Coringa
  const currentLiveProgram = useMemo<ProgramItem>(() => {
    const base = scheduledBaseProgram;

    if (liveTakeover && liveTakeover.isActive) {
      const subHostAccount = liveTakeover.substituteHostId
        ? hostAccounts.find((h) => h.id === liveTakeover.substituteHostId)
        : hostAccounts.find(
            (h) =>
              !isCoringaHost(h) &&
              (h.name.toLowerCase().trim() === liveTakeover.substituteHost.toLowerCase().trim() ||
                h.username.toLowerCase().trim() === liveTakeover.substituteHost.toLowerCase().trim())
          );

      const resolvedWhatsapp =
        subHostAccount?.whatsapp?.trim() ||
        liveTakeover.substituteWhatsapp?.trim() ||
        stationConfig.whatsappNumber ||
        '5548991984678';

      // Modo Coringa Avulso: locutor entra no ar usando seu próprio perfil sem associar seu programa
      if (liveTakeover.isCoringa && liveTakeover.coverScheduleProgram === false) {
        return {
          ...base,
          id: 'coringa-live-session',
          title: liveTakeover.coringaProgramTitle?.trim() || 'Plantão Coringa',
          host: liveTakeover.substituteHost,
          hostRole: liveTakeover.substituteHostRole || subHostAccount?.role || 'Apresentação Especial • Modo Coringa',
          hostBio: subHostAccount?.bio || base.hostBio,
          hostAccountId: liveTakeover.substituteHostId || subHostAccount?.id,
          avatarUrl: liveTakeover.substituteAvatarUrl || subHostAccount?.avatarUrl || base.avatarUrl,
          logoUrl: stationLogos.playerCenterLogo || stationLogos.headerLogo || stationConfig.logoUrl || '/reb_mascot.jpg',
          genre: 'Plantão ao Vivo • Modo Coringa',
          description:
            liveTakeover.notes ||
            `Transmissão especial ao vivo conduzida por ${liveTakeover.substituteHost} em Modo Coringa na Rebeldia FM.`,
          whatsappNumber: resolvedWhatsapp,
          isSubstituted: true,
          isCoringaActive: true,
          originalHost: base.host,
          takeoverNotes: liveTakeover.notes,
          hasReprise: false,
          daysLabel: 'Ao Vivo Agora • Modo Coringa',
        };
      }

      return {
        ...base,
        host: liveTakeover.substituteHost,
        hostRole: liveTakeover.substituteHostRole || subHostAccount?.role || 'Apresentação Especial / Plantão',
        hostBio: subHostAccount?.bio || base.hostBio,
        avatarUrl: liveTakeover.substituteAvatarUrl || subHostAccount?.avatarUrl || base.avatarUrl,
        whatsappNumber: resolvedWhatsapp,
        isSubstituted: true,
        isCoringaActive: Boolean(liveTakeover.isCoringa),
        originalHost: base.host,
        takeoverNotes: liveTakeover.notes,
      };
    }

    return base;
  }, [
    scheduledBaseProgram,
    liveTakeover,
    hostAccounts,
    stationConfig.whatsappNumber,
    stationConfig.logoUrl,
    stationLogos.playerCenterLogo,
    stationLogos.headerLogo,
  ]);

  // Hotsite ativo sempre sincronizado com telefone resolvido pelo locutor e status Coringa
  const activeHotsiteProgram = useMemo<ProgramItem | null>(() => {
    if (!selectedHotsiteProgram) return null;
    if (currentLiveProgram && String(currentLiveProgram.id) === String(selectedHotsiteProgram.id)) {
      return currentLiveProgram;
    }
    const found = resolvedSchedulePrograms.find(
      (p) => String(p.id) === String(selectedHotsiteProgram.id)
    );
    if (found) return found;
    return {
      ...selectedHotsiteProgram,
      whatsappNumber: resolveProgramWhatsapp(
        selectedHotsiteProgram,
        hostAccounts,
        stationConfig.whatsappNumber,
        liveTakeover
      ),
    };
  }, [
    selectedHotsiteProgram,
    currentLiveProgram,
    resolvedSchedulePrograms,
    hostAccounts,
    stationConfig.whatsappNumber,
    liveTakeover,
  ]);

  // Current Host Profile from hostAccounts (cadastro de locutores) or currentLiveProgram
  const currentHostProfile = useMemo(() => {
    if (currentLiveProgram) {
      const liveHostName = (currentLiveProgram.host || '').toLowerCase().trim();
      const matched = hostAccounts.find((h) => {
        if (!h.avatarUrl) return false;
        const name = (h.name || '').toLowerCase().trim();
        const user = (h.username || '').toLowerCase().trim();
        if (name === liveHostName || user === liveHostName) return true;
        if (h.programId && String(h.programId) === String(currentLiveProgram.id)) return true;
        if (h.programIds && h.programIds.includes(String(currentLiveProgram.id))) return true;
        if (h.programTitle && h.programTitle.toLowerCase() === currentLiveProgram.title.toLowerCase()) return true;
        return false;
      });

      if (matched?.avatarUrl) {
        return {
          name: matched.name,
          role: matched.role || currentLiveProgram.hostRole || 'Locutor no Ar',
          url: matched.avatarUrl,
        };
      }

      if (currentLiveProgram.avatarUrl) {
        return {
          name: currentLiveProgram.host,
          role: currentLiveProgram.hostRole || 'Locutor no Ar',
          url: currentLiveProgram.avatarUrl,
        };
      }
    }

    const reb = hostAccounts.find((h) => h.id === 'host-reb') || INITIAL_HOST_ACCOUNTS[0];
    return {
      name: reb?.name || 'REB',
      role: reb?.role || 'Locutor 24h Oficial',
      url: reb?.avatarUrl || '/reb_mascot.jpg',
    };
  }, [currentLiveProgram, hostAccounts]);

  // Central Disc Display: Capa disco da música que está tocando no momento, ou LOGOTIPO DO PROGRAMA (e NUNCA a foto do locutor no círculo)
  const discDisplay = useMemo(() => {
    const isSongPlaying = Boolean(streamMetadata.hasLiveMetadata && streamMetadata.song);
    const artwork = streamMetadata.artworkUrl || liveSongArtwork;

    // Se for um anúncio de transmissão de programa ou reprise no streamMetadata, NÃO considerar como música avulsa
    const isProgramAnnouncement =
      streamMetadata.song &&
      (streamMetadata.song.toLowerCase().includes('reprise') ||
        streamMetadata.song.toLowerCase().includes('programa') ||
        (currentLiveProgram && streamMetadata.song.toLowerCase().includes(currentLiveProgram.title.toLowerCase())));

    if (isSongPlaying && artwork && !isProgramAnnouncement) {
      return {
        type: 'song' as const,
        imageUrl: artwork,
        title: `${streamMetadata.song} - ${streamMetadata.artist}`,
        badgeLabel: 'Capa da Música',
        subtext: `${streamMetadata.artist} • ${streamMetadata.song}`,
      };
    }

    // Regra explícita: NUNCA usar a foto do locutor no círculo. Usar SEMPRE o Logotipo do Programa.
    let programLogo = currentLiveProgram?.logoUrl;

    // Se o logo do programa não foi cadastrado ou for idêntico à foto pessoal do locutor (fallback de segurança)
    if (!programLogo || (currentLiveProgram?.avatarUrl && programLogo === currentLiveProgram.avatarUrl)) {
      if (
        currentLiveProgram?.title?.toLowerCase().includes('avox') ||
        currentLiveProgram?.mixcloudUser?.toLowerCase() === 'avoxdobrasil'
      ) {
        programLogo = 'https://thumbnailer.mixcloud.com/unsafe/600x600/profile/1/f/4/3/97e4-9e7a-4868-aa44-a7b5b1e3d2e4';
      } else {
        programLogo = stationLogos.playerCenterLogo || stationLogos.headerLogo || stationConfig.logoUrl || '/reb_mascot.jpg';
      }
    }

    return {
      type: 'program' as const,
      imageUrl: programLogo || stationLogos.playerCenterLogo || stationLogos.headerLogo || stationConfig.logoUrl || '/reb_mascot.jpg',
      title: currentLiveProgram ? currentLiveProgram.title : stationConfig.name,
      badgeLabel: 'Logo do Programa',
      subtext: currentLiveProgram
        ? `${currentLiveProgram.title} • ${currentLiveProgram.genre || 'Programação Oficial'}`
        : 'Rebeldia FM',
    };
  }, [
    streamMetadata.hasLiveMetadata,
    streamMetadata.song,
    streamMetadata.artist,
    streamMetadata.artworkUrl,
    liveSongArtwork,
    currentLiveProgram,
    stationConfig.logoUrl,
    stationConfig.name,
    stationLogos.playerCenterLogo,
    stationLogos.headerLogo,
  ]);

  // Find current promo banner based on active status, program sync, or live dates
  const currentPromoBanner = useMemo(() => {
    const activeBanners = promoBanners.filter((b) => b.isActive);
    if (activeBanners.length === 0) return null;

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Check if there is an active banner linked to current live program
    if (currentLiveProgram) {
      const liveLinked = activeBanners.find(
        (b) =>
          (b.programId && String(b.programId) === String(currentLiveProgram.id)) ||
          (b.programTitle && b.programTitle.toLowerCase() === currentLiveProgram.title.toLowerCase())
      );
      if (liveLinked) return liveLinked;
    }

    // 2. Check for active date-window banners
    const liveDateBanner = activeBanners.find((b) => {
      if (b.startDate && b.endDate) {
        return nowIso >= b.startDate && nowIso <= b.endDate;
      }
      return true;
    });

    return liveDateBanner || activeBanners[0] || null;
  }, [promoBanners, currentLiveProgram]);

  // Verifica se há programa ao vivo na grade neste momento (ou live takeover / atração específica)
  const isSpecificLiveProgramOnAir = useMemo(() => {
    if (!currentLiveProgram) return false;
    if (liveTakeover && liveTakeover.isActive) return true;
    if (currentLiveProgram.id !== DEFAULT_REB_PROGRAM.id) return true;
    if (currentLiveProgram.badge === 'Reprise' || currentLiveProgram.badge === 'No Ar') return true;
    return false;
  }, [currentLiveProgram, liveTakeover]);

  // Handlers for Song Requests
  const handleAddRequest = (newReq: Omit<SongRequest, 'id' | 'timestamp' | 'votes'>) => {
    const item: SongRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      timestamp: Date.now(),
      votes: 1,
    };
    const updated = [item, ...requests];
    setRequests(updated);
    localStorage.setItem('rebeldia_requests', JSON.stringify(updated));
  };

  const handleVoteRequest = (id: string) => {
    const updated = requests.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r));
    setRequests(updated);
    localStorage.setItem('rebeldia_requests', JSON.stringify(updated));
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      api.voteSongRequest(numId).catch(() => {});
    }
  };

  // Handlers for Mural Messages
  const handleAddMessage = (newMsg: Omit<ShoutoutMessage, 'id' | 'timestamp' | 'likes'>) => {
    const item: ShoutoutMessage = {
      ...newMsg,
      id: `msg-${Date.now()}`,
      timestamp: Date.now(),
      likes: 0,
      isPinned: false,
    };
    const updated = [item, ...messages];
    setMessages(updated);
    localStorage.setItem('rebeldia_messages', JSON.stringify(updated));
  };

  const handleLikeMessage = (id: string) => {
    const updated = messages.map((m) => {
      if (m.id === id) {
        const nextLiked = !m.hasLiked;
        return {
          ...m,
          likes: nextLiked ? m.likes + 1 : m.likes - 1,
          hasLiked: nextLiked,
        };
      }
      return m;
    });
    setMessages(updated);
    localStorage.setItem('rebeldia_messages', JSON.stringify(updated));
  };

  const handleSaveConfig = (newConfig: RadioStationConfig) => {
    setStationConfig(newConfig);
    localStorage.setItem('rebeldia_station_config', JSON.stringify(newConfig));
    api.saveStationConfig(newConfig);
  };

  const handleSaveAlarm = (newAlarm: RadioAlarm) => {
    setAlarm(newAlarm);
    localStorage.setItem('rebeldia_alarm', JSON.stringify(newAlarm));
  };

  // PWA Install trigger
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Quick share app link
  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: `${stationConfig.name} - Rádio Web Ao Vivo`,
        text: `Estou ouvindo a ${stationConfig.name}! Acesse e ouça ao vivo:`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link da rádio copiado para a área de transferência!');
    }
  };

  return (
    <div
      className="min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black relative transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-main)' }}
    >
      {/* Monochromatic Subtle Studio Lighting Vignette */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[140px] opacity-30 transition-colors duration-500"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-[120px] opacity-20 transition-colors duration-500"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-[10px] sm:px-[30px] py-3.5 shadow-sm">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 relative z-10">
          {/* Brand Logo (Responsive for Mobile & Desktop) */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-shrink-0">
            <div className="relative group cursor-pointer flex-shrink-0 ml-[5px]" onClick={() => navigateTab('player')}>
              <RebeldiaLogo variant="full" size="md" customLogoUrl={stationLogos.headerLogo} />
            </div>
            {(stationLogos.headerComplementText || stationConfig.slogan) && (
              <div className="hidden md:flex items-center pl-2 sm:pl-3 border-l border-zinc-800 flex-shrink-0">
                <span className="text-xs text-zinc-400 font-medium truncate max-w-[240px] lg:max-w-xs">
                  {stationLogos.headerComplementText || stationConfig.slogan}
                </span>
              </div>
            )}
          </div>

          {/* Action Tools Header */}
          <div className="flex items-center gap-2">
            {/* Google Auth Button */}
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm cursor-pointer"
                title="Entrar com Google"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-4 h-4 rounded-full" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span className="max-w-[100px] truncate text-[11px] font-medium hidden sm:inline">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs transition cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Install Button Unified (Android & Apple / iPhone) */}
            <button
              onClick={() => openInstallModal()}
              className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 group"
              title="Instalar App Oficial (Android & iPhone)"
              aria-label="Instalar App Oficial (Android & iPhone)"
            >
              <AndroidIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform" />
              <div className="w-[1px] h-3.5 bg-zinc-700" />
              <AppleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-200 group-hover:text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Equalizer & Audio Settings button (Copiado para o topo) */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition shadow-sm cursor-pointer flex items-center justify-center"
              title="Configurações & Áudio HD"
              aria-label="Configurações & Áudio HD"
            >
              <Sliders className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation Segmented Switcher with Clear Section Demarcations & Differentiated Theme Background */}
      <nav
        className={`border-y border-amber-500/40 bg-gradient-to-r from-[#111422] via-[#1a1f33] to-[#111422] backdrop-blur-2xl sticky top-0 z-30 px-[10px] sm:px-[30px] transition-all duration-300 ${
          isNavSticky ? 'shadow-2xl shadow-black/90 border-b-amber-500/60' : 'shadow-xl shadow-black/50'
        }`}
      >
        <div className="relative w-full max-w-7xl mx-auto">
          {/* Gradientes Laterais Suaves Indicadores de Rolagem no Mobile (sem setas e sem bloquear cliques) */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#111422] to-transparent z-10 sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#111422] to-transparent z-10 sm:hidden" />

          <div
            ref={navScrollRef}
            className="w-full flex items-center justify-start lg:justify-center gap-2 overflow-x-auto py-2.5 scrollbar-none scroll-smooth touch-pan-x px-1 sm:px-0"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max mx-auto">
            {/* SEÇÃO 1: TRANSMISSÃO AO VIVO (COM LOGOTIPO APENAS QUANDO O MENU TRAVAR NO TOPO) */}
            <div className="flex items-center gap-1.5">
              {isNavSticky && (
                <div
                  className="flex items-center justify-center p-[9px] rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 cursor-pointer transition flex-shrink-0 animate-in fade-in zoom-in-95 duration-200 mr-[10px] active:scale-95 select-none"
                  onClick={() => {
                    navigateTab('player');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title="Rebeldia FM - Voltar ao topo"
                >
                  <RebeldiaLogo variant="icon" size="xs" className="h-5 w-auto" />
                </div>
              )}

              <button
                data-active={activeTab === 'player' ? 'true' : 'false'}
                onClick={() => navigateTab('player')}
                className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 active:scale-95 select-none ${
                  activeTab === 'player'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black scale-102 ring-1 ring-amber-300'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900/90 border border-zinc-800/70'
                }`}
              >
                {/* Bolinha vermelha pulsando no canto do botão quando a rádio está no ar */}
                {isPlaying && (
                  <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5 pointer-events-none z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 shadow-sm" />
                  </span>
                )}
                <span>Rádio Ao Vivo</span>
                {isPlaying && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      activeTab === 'player' ? 'bg-black text-white' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    ON AIR
                  </span>
                )}
              </button>
            </div>

            {/* Separador Visual de Sessão */}
            <div className="h-5 w-px bg-zinc-800/90 mx-1 hidden sm:block" />

            {/* SEÇÃO 2: MANIFESTO & INSTITUCIONAL */}
            <div className="flex items-center">
              <button
                data-active={activeTab === 'rebeldia' ? 'true' : 'false'}
                onClick={() => navigateTab('rebeldia')}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 active:scale-95 select-none ${
                  activeTab === 'rebeldia'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black scale-102 ring-1 ring-amber-300'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900/90 border border-zinc-800/70'
                }`}
              >
                <span>REBELDIA</span>
              </button>
            </div>

            {/* Separador Visual de Sessão */}
            <div className="h-5 w-px bg-zinc-800/90 mx-1 hidden sm:block" />

            {/* SEÇÃO 3: GRADE & CONTEÚDO (PROGRAMAS ENTRE REBELDIA E PEDIR MÚSICA) */}
            <div className="flex items-center">
              <button
                data-active={activeTab === 'schedule' ? 'true' : 'false'}
                onClick={() => navigateTab('schedule')}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 active:scale-95 select-none ${
                  activeTab === 'schedule'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black scale-102 ring-1 ring-amber-300'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900/90 border border-zinc-800/70'
                }`}
              >
                <span>Programas</span>
              </button>
            </div>

            {/* Separador Visual de Sessão */}
            <div className="h-5 w-px bg-zinc-800/90 mx-1 hidden sm:block" />

            {/* SEÇÃO 4: INTERATIVIDADE & OUVINTES (PEDIR MÚSICA & MURAL) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                data-active={activeTab === 'requests' ? 'true' : 'false'}
                onClick={() => navigateTab('requests')}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 active:scale-95 select-none ${
                  activeTab === 'requests'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black scale-102 ring-1 ring-amber-300'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900/90 border border-zinc-800/70'
                }`}
              >
                <Music className={`w-4 h-4 ${activeTab === 'requests' ? 'text-black' : 'text-amber-400'}`} />
                <span>Pedir Música</span>
                {requests.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'requests' ? 'bg-black text-white' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {requests.length}
                  </span>
                )}
              </button>

              <button
                data-active={activeTab === 'mural' ? 'true' : 'false'}
                onClick={() => navigateTab('mural')}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 active:scale-95 select-none ${
                  activeTab === 'mural'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black scale-102 ring-1 ring-amber-300'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900/90 border border-zinc-800/70'
                }`}
              >
                <span>Mural & Recados</span>
                {messages.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'mural' ? 'bg-black text-white' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {messages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </nav>

      {/* Main Content Area - Fullscreen with 10px on mobile, 30px on desktop */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-[10px] sm:px-[30px] py-4 sm:py-6 pb-28 sm:pb-32 relative z-10">
        {/* Tab 1: Live Player Main View */}
        {activeTab === 'player' && (
          <div className="space-y-6">
            {/* Monochromatic Studio Player Card */}
            <div className="mono-card rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-white/10">
              {/* Imagem de Fundo de Estúdio de Rádio */}
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none filter brightness-[0.22] saturate-[0.8] scale-105"
                style={{ backgroundImage: `url('/header-box-bg.jpg')` }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/60 to-zinc-950/90 pointer-events-none" />

              {/* Botão de Atalho para Modo Música (Tela Cheia) */}
              <button
                onClick={() => setIsMusicModeOpen(true)}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-amber-400/40 text-xs font-mono font-bold transition shadow-lg cursor-pointer group active:scale-95"
                title="Abrir MODO MÚSICA em Tela Cheia"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden xs:inline">Modo Música</span>
              </button>

              {/* Animated VU Ondas Background Visualizer */}
              <CardBackgroundVisualizer
                isPlaying={isPlaying}
                isBuffering={isBuffering}
                mode="wave"
                volume={volume}
                isMuted={isMuted}
                className="opacity-80 sm:opacity-85"
              />

              <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto space-y-6">
                {/* Disco Central do Player (+25% maior): Capa do Álbum da Música no Ar ou Foto de Perfil do Locutor Cadastrado */}
                <div className="relative group cursor-pointer flex flex-col items-center" onClick={togglePlay}>
                  <div className="relative flex items-center justify-center">
                    {/* Borda translúcida de 8px com fade, na cor do esquema do site, pulsando de acordo com a música */}
                    <div
                      ref={pulseRingRef}
                      className="absolute -inset-2 sm:-inset-2.5 rounded-full pointer-events-none border-[8px] will-change-transform"
                      style={{
                        borderColor: 'var(--color-primary, #f59e0b)',
                        opacity: 0.23,
                        boxShadow: '0 0 7.5px 1.3px var(--color-primary, #f59e0b)',
                      }}
                    />

                    {/* Círculo Central com capa expandida até a marca e borda preta de vinil preservada */}
                    <div
                      className="w-[175px] h-[175px] sm:w-[220px] sm:h-[220px] rounded-full p-1.5 sm:p-2 vinyl-grooves shadow-2xl border border-zinc-700/70 relative shadow-black/90"
                    >
                      <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-black/60 shadow-inner">
                        {discDisplay.imageUrl ? (
                          <img
                            src={discDisplay.imageUrl}
                            alt={discDisplay.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-full object-cover shadow-inner"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center p-4">
                            <RebeldiaLogo
                              variant="icon"
                              size="md"
                              customLogoUrl={stationLogos.playerCenterLogo || stationLogos.headerLogo}
                              className="drop-shadow-2xl"
                            />
                          </div>
                        )}

                        {/* Center vinyl spindle (Pino central do disco de vinil - SOMENTE NO PLAYER MAIOR) */}
                        <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-950/95 border border-zinc-500/80 flex items-center justify-center shadow-2xl backdrop-blur-sm pointer-events-none overflow-hidden p-1">
                          <img
                            src={stationLogos.playerCenterLogo || stationLogos.headerLogo || '/reb_mascot.jpg'}
                            alt="Centro do Player Maior"
                            className="w-full h-full rounded-full object-cover drop-shadow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Play/Pause Overlay Icon on hover / when stopped */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/75 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition shadow-xl ${
                        isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-85 group-hover:opacity-100'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
                    </div>
                  </div>
                </div>

                {/* Nome da Música Que Está Tocando - Logo Abaixo do Primeiro Botão Redondo */}
                <div className="w-full max-w-lg px-2 flex flex-col items-center space-y-1.5">

                  {/* Nome da Faixa Principal */}
                  <h2
                    className="text-[22px] sm:text-[28px] font-black text-white font-display tracking-tight leading-snug drop-shadow"
                    title={
                      streamMetadata.hasLiveMetadata
                        ? `${streamMetadata.song} - ${streamMetadata.artist}`
                        : currentLiveProgram
                        ? currentLiveProgram.title
                        : stationConfig.name
                    }
                  >
                    {streamMetadata.hasLiveMetadata
                      ? streamMetadata.song
                      : currentLiveProgram
                      ? currentLiveProgram.title
                      : stationConfig.name}
                  </h2>

                  {/* Nome do Artista ou Apresentador */}
                  <p className="text-sm sm:text-base font-semibold text-amber-300/90">
                    {streamMetadata.hasLiveMetadata ? (
                      <>
                        <span className="text-zinc-400 font-normal">Artista: </span>
                        <strong className="text-amber-200 font-bold">{streamMetadata.artist}</strong>
                      </>
                    ) : currentLiveProgram?.isSubstituted ? (
                      <>
                        {currentLiveProgram.isCoringaActive ? 'Coringa no Ar: ' : 'Apresentação no Ar: '}
                        <strong className="text-white bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
                          {currentLiveProgram.host}
                        </strong>{' '}
                        <span className="text-xs text-zinc-400">
                          {currentLiveProgram.id === 'coringa-live-session'
                            ? '(Plantão Coringa sem programa titular)'
                            : `(cumprindo horário de ${currentLiveProgram.originalHost})`}
                        </span>
                      </>
                    ) : (
                      <>
                        Apresentação:{' '}
                        <strong className="text-zinc-200">
                          {currentLiveProgram ? currentLiveProgram.host : 'Equipe Rebeldia'}
                        </strong>
                      </>
                    )}
                  </p>

                  {/* Informações do Programa no Ar quando metadados de música estão ativos */}
                  {streamMetadata.hasLiveMetadata && currentLiveProgram && (
                    <p className="text-xs text-zinc-400 pt-0.5">
                      Programa:{' '}
                      <strong className="text-zinc-300">{currentLiveProgram.title}</strong>
                      {currentLiveProgram.host && (
                        <span> • Apresentação: <strong className="text-zinc-300">{currentLiveProgram.host}</strong></span>
                      )}
                    </p>
                  )}

                  {currentLiveProgram?.isSubstituted && currentLiveProgram.takeoverNotes && (
                    <p className="text-xs text-amber-300/90 italic bg-amber-950/20 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-1">
                      💬 {currentLiveProgram.takeoverNotes}
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {hasError && (
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-white/20 text-zinc-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg w-full">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Não foi possível conectar ao link de áudio do stream. Verifique sua conexão ou tente reconectar.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={reloadStream}
                        className="px-3 py-1.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-black" />
                        <span>Reconectar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold hover:bg-zinc-700 transition text-[11px] cursor-pointer"
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card do Programa No Ar ou Card de Promoção (caso contrário) */}
            {isSpecificLiveProgramOnAir && currentLiveProgram ? (
              <div className="w-full max-w-md mx-auto">
                <div className="flex items-center justify-between gap-2 mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-white font-mono">
                      {currentLiveProgram.isCoringaActive ? 'CORINGA AO VIVO NO AR' : 'PROGRAMA AO VIVO NO AR'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {currentLiveProgram.isCoringaActive ? 'Modo Coringa' : 'Transmissão Oficial'}
                  </span>
                </div>
                <LiveProgramHeroCard
                  program={currentLiveProgram}
                  onOpenHotsite={() => handleSelectProgramHotsite(currentLiveProgram)}
                  stationConfig={stationConfig}
                  promoBanner={currentPromoBanner}
                  onOpenPromoModal={() => setIsPromoModalOpen(true)}
                />
              </div>
            ) : (
              currentPromoBanner && (
                <PromoBannerCard
                  banner={currentPromoBanner}
                  onOpenPromoModal={() => setIsPromoModalOpen(true)}
                  stationConfig={stationConfig}
                />
              )
            )}

            {/* Quick Action Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Request Music Card */}
              <div
                onClick={() => navigateTab('requests')}
                className="mono-card mono-card-hover p-5 rounded-2xl cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-white/10 text-white flex items-center justify-center group-hover:scale-105 transition shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">Pedir Música</h3>
                    <p className="text-xs text-zinc-400 truncate">No WhatsApp do estúdio</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition shrink-0 ml-1" />
              </div>

              {/* Promoção da Hora Card */}
              <div
                onClick={() => setIsPromoModalOpen(true)}
                className="mono-card mono-card-hover p-5 rounded-2xl cursor-pointer group flex items-center justify-between border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-black flex items-center justify-center group-hover:scale-105 transition shrink-0 shadow-lg shadow-amber-500/20">
                    <Gift className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-white text-sm truncate">Promoção da Hora</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-black">
                        NO AR
                      </span>
                    </div>
                    <p className="text-xs text-amber-300/80 truncate">Sorteios & Brindes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-white transition shrink-0 ml-1" />
              </div>

              {/* Unified Install App Card (Android & Apple) */}
              <div
                onClick={() => openInstallModal()}
                className="mono-card mono-card-hover p-5 rounded-2xl cursor-pointer group flex items-center justify-between border-white/10 hover:border-emerald-500/40 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-emerald-950/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Dual distinct badges with overlap & micro-interaction */}
                  <div className="flex items-center -space-x-2.5 shrink-0 pl-0.5 py-0.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-emerald-500/40 flex items-center justify-center shadow-md shadow-black/40 z-10 group-hover:-translate-x-0.5 group-hover:scale-105 transition-all">
                      <AndroidIcon className="w-5 h-5 drop-shadow" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/20 flex items-center justify-center shadow-md shadow-black/40 z-0 group-hover:translate-x-0.5 group-hover:scale-105 transition-all">
                      <AppleIcon className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-white text-sm truncate">Instalar Aplicativo</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        GRÁTIS
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-400/90 font-medium">Android</span>
                      <span className="text-zinc-600 font-bold">•</span>
                      <span className="text-zinc-300 font-medium">Apple (iPhone)</span>
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800/80 group-hover:bg-emerald-500 group-hover:text-black text-zinc-400 flex items-center justify-center transition-colors shrink-0 ml-2 shadow-sm">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Program Schedule of the Day / Weekday */}
            <TodayScheduleSection
              programs={resolvedSchedulePrograms}
              currentLiveProgram={currentLiveProgram}
              onSelectProgram={handleSelectProgramHotsite}
              onOpenFullSchedule={() => {
                navigateTab('schedule');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              liveTakeover={liveTakeover}
            />
          </div>
        )}

        {/* Tab 2: Song Requests */}
        {activeTab === 'requests' && (
          <SongRequestsModal
            requests={requests}
            onAddRequest={handleAddRequest}
            onVoteRequest={handleVoteRequest}
            stationConfig={stationConfig}
            currentLiveProgram={currentLiveProgram}
          />
        )}

        {/* Tab 3: Schedule View */}
        {activeTab === 'schedule' && (
          <ScheduleView
            programs={resolvedSchedulePrograms}
            currentLiveProgram={currentLiveProgram}
            onSelectProgram={handleSelectProgramHotsite}
            onOpenTakeoverModal={handleOpenTakeoverForProgram}
            liveTakeover={liveTakeover}
          />
        )}

        {/* Tab 4: Mural & Shoutouts */}
        {activeTab === 'mural' && (
          <MuralBoard
            messages={messages}
            onAddMessage={handleAddMessage}
            onLikeMessage={handleLikeMessage}
            stationConfig={stationConfig}
          />
        )}

        {/* Tab 5: Features & Suggestions */}
        {activeTab === 'features' && (
          <FeaturesSuggestionModal onNavigateTab={(tab) => navigateTab(tab)} />
        )}

        {/* Tab 6: Institucional REBELDIA */}
        {activeTab === 'rebeldia' && (
          <InstitutionalView
            data={institutionalData}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onOpenRequests={() => navigateTab('requests')}
            onOpenSchedule={() => navigateTab('schedule')}
            onOpenMural={() => navigateTab('mural')}
            onOpenAdmin={handleOpenAdmin}
            onOpenSettings={() => setIsSettingsOpen(true)}
            programs={resolvedSchedulePrograms}
            onSelectProgram={handleSelectProgramHotsite}
          />
        )}
      </main>

      {/* Persistent Global Player Bar across the ENTIRE site */}
      <GlobalPlayerBar
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        hasError={hasError}
        volume={volume}
        isMuted={isMuted}
        currentLiveProgram={currentLiveProgram}
        streamMetadata={streamMetadata}
        artworkUrl={discDisplay.imageUrl}
        stationConfig={stationConfig}
        equalizerPreset={equalizerPreset}
        timerSecondsRemaining={timerSecondsRemaining}
        alarm={alarm}
        onTogglePlay={togglePlay}
        onReloadStream={reloadStream}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenAlarm={() => setIsAlarmOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRequests={() => navigateTab('requests')}
        onGoToPlayerTab={() => navigateTab('player')}
        onOpenMusicMode={() => setIsMusicModeOpen(true)}
        isPlayerTabActive={activeTab === 'player'}
      />

      {/* Studio Monochromatic Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 pb-36 px-[8px] sm:px-[30px] text-center text-xs text-zinc-400">
        <div className="w-full flex flex-col items-center space-y-4">
          <RebeldiaLogo
            variant="full"
            size="sm"
            showSlogan
            customLogoUrl={stationLogos.footerLogo || stationLogos.headerLogo}
            className="items-center"
          />
          <p className="text-zinc-400">
            © {new Date().getFullYear()} {stationConfig.name} • {stationConfig.slogan}
          </p>
          {/* Links & Information */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-zinc-500 flex-wrap">
            <button
              onClick={() => navigateTab('rebeldia')}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
              title="Abrir página institucional REBELDIA"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Institucional REBELDIA</span>
            </button>
            <span>•</span>
            <span className="flex items-center gap-1.5 flex-wrap justify-center">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <a href="mailto:radio@rebeldiafm.com.br" className="hover:text-white transition">radio@rebeldiafm.com.br</a>
              <span className="text-zinc-600">/</span>
              <a href="mailto:rebeldiaFM@gmail.com" className="hover:text-white transition">rebeldiaFM@gmail.com</a>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              {stationConfig.location && !stationConfig.location.toLowerCase().includes('canoas')
                ? stationConfig.location
                : 'Florianópolis / SC, Brasil'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud SQL Conectado
            </span>
          </div>

          {/* Gerenciador / Painel Admin, Recursos & Área de Locutores */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {/* Área do Locutor / Modo Coringa */}
            <button
              onClick={() => setIsHostAuthOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer group ${
                currentLoggedInHost
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700 hover:border-zinc-500'
              }`}
              title="Acessar Área do Locutor, Editar Hotsite ou Entrar no Ar como Coringa"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{currentLoggedInHost ? `Locutor: ${currentLoggedInHost.name}` : 'Área do Locutor / Coringa'}</span>
            </button>

            {/* Recursos da Plataforma */}
            <button
              onClick={() => {
                setActiveTab('features');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer group ${
                activeTab === 'features'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-amber-500/20 font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700 hover:border-zinc-500'
              }`}
              title="Acessar Recursos da Plataforma & Sugestões"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Recursos</span>
            </button>

            {/* Painel Admin */}
            <button
              onClick={handleOpenAdmin}
              className="inline-flex items-center gap-2 text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-2xl border border-zinc-700 hover:border-zinc-500 text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer group"
              title="Acessar Gerenciador e Painel de Controle da Rádio (Admin)"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Painel Gerenciador (Admin)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallClick={handleInstallClick}
        isInstalled={isAppInstalled}
        initialPlatform={installPlatform}
      />

      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        timerMinutesRemaining={timerSecondsRemaining}
        onSetTimer={handleSetSleepTimer}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={stationConfig}
        onSaveConfig={handleSaveConfig}
        equalizerPreset={equalizerPreset}
        onChangeEqualizer={handleEqualizerChange}
        onReloadStream={reloadStream}
        currentPaletteId={currentPaletteId}
        onSelectPalette={(id) => setCurrentPaletteId(id)}
      />

      <AlarmClockModal
        isOpen={isAlarmOpen}
        onClose={() => setIsAlarmOpen(false)}
        alarm={alarm}
        onSaveAlarm={handleSaveAlarm}
        onTriggerPlay={togglePlay}
      />

      <AdminManagerModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        onRefreshData={() => {
          loadBackendData();
          setInstitutionalData(getSavedInstitutionalData());
        }}
        onNavigateToTab={(tab) => {
          handleCloseAdmin();
          navigateTab(tab);
        }}
        promoBanners={promoBanners}
        onSavePromoBanners={handleSavePromoBanners}
        stationConfig={stationConfig}
        onSaveStationConfig={handleSaveConfig}
      />

      {/* Promoção da Hora & Banners Modal */}
      <PromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        banners={promoBanners}
        currentLiveProgram={currentLiveProgram}
        stationConfig={stationConfig}
      />

      {/* Program Hotsite Modal */}
      <ProgramHotsiteModal
        program={activeHotsiteProgram}
        isOpen={!!activeHotsiteProgram}
        onClose={handleCloseProgramHotsite}
        isLiveNow={currentLiveProgram?.id === activeHotsiteProgram?.id}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNavigateToTab={(tab) => {
          navigateTab(tab);
          setSelectedHotsiteProgram(null);
        }}
        stationConfig={stationConfig}
        onUpdateProgram={async (updated) => {
          const next = schedulePrograms.map((p) => (p.id === updated.id ? updated : p));
          setSchedulePrograms(next);
          localStorage.setItem('rebeldia_schedule', JSON.stringify(next));
          const numId = typeof updated.id === 'number' ? updated.id : parseInt(String(updated.id).replace(/\D/g, ''), 10);
          if (!isNaN(numId) && numId > 0) {
            try {
              await api.updateScheduleItem(numId, {
                title: updated.title,
                host: updated.host,
                hostRole: updated.hostRole || null,
                avatarUrl: updated.avatarUrl || null,
                logoUrl: updated.logoUrl || null,
                hostBio: updated.hostBio || null,
                instagramHandle: updated.instagramHandle || null,
                description: updated.description || null,
                genre: updated.genre || null,
                bannerUrl: updated.bannerUrl || null,
                playlistJson: updated.playlist ? JSON.stringify(updated.playlist) : null,
                highlightsJson: updated.highlights ? JSON.stringify(updated.highlights) : null,
                photoGalleryJson: updated.photoGallery ? JSON.stringify(updated.photoGallery) : null,
              });
            } catch {
              // fallback to local state
            }
          }
          setSelectedHotsiteProgram(updated);
          const updatedIcon = getProgramLogoSrc(updated);
          const updatedSlug = getProgramSlug(updated);
          const updatedOgImage = updatedIcon.startsWith('data:')
            ? `/api/program-og-image/${encodeURIComponent(updatedSlug)}?v=${updatedIcon.length}`
            : updatedIcon;
          applyClientSeo({
            ogImage: updatedOgImage,
            faviconUrl: updatedIcon,
          });
        }}
        currentLoggedInHost={currentLoggedInHost}
        onOpenHostAuth={() => {
          setSelectedHotsiteProgram(null);
          setIsHostAuthOpen(true);
        }}
        onOpenTakeoverModal={(prog) => {
          setSelectedHotsiteProgram(null);
          handleOpenTakeoverForProgram(prog || currentLiveProgram, false);
        }}
      />

      {/* Host Auth & Profile Modal (Locutor Cadastro / Login / Recuperação / Entrar no Ar / Virar Coringa) */}
      <HostAuthModal
        isOpen={isHostAuthOpen}
        onClose={() => setIsHostAuthOpen(false)}
        programs={resolvedSchedulePrograms}
        currentLoggedInHost={currentLoggedInHost}
        onHostLogin={handleHostLogin}
        onHostLogout={handleHostLogout}
        onSelectProgram={(prog) => {
          setIsHostAuthOpen(false);
          setSelectedHotsiteProgram(prog);
        }}
        onOpenTakeoverModal={(prog, coringaMode) => {
          handleOpenTakeoverForProgram(prog || currentLiveProgram, Boolean(coringaMode));
        }}
        liveTakeover={liveTakeover}
        onStopTakeover={handleStopTakeover}
        stationConfig={stationConfig}
      />

      {/* Live Takeover Modal (Locutor Online / Substituição de Horário de Colega / Modo Coringa) */}
      <LiveTakeoverModal
        isOpen={isTakeoverModalOpen}
        onClose={() => {
          setIsTakeoverModalOpen(false);
          setTakeoverTargetProgram(null);
          setTakeoverInitialCoringa(false);
        }}
        currentScheduledProgram={takeoverTargetProgram || scheduledBaseProgram}
        programs={resolvedSchedulePrograms}
        hostAccounts={hostAccounts}
        currentLoggedInHost={currentLoggedInHost}
        initialCoringaMode={takeoverInitialCoringa}
        liveTakeover={liveTakeover}
        onStartTakeover={handleStartTakeover}
        onStopTakeover={handleStopTakeover}
        stationConfig={stationConfig}
      />

      {/* MODO MÚSICA Fullscreen Modal */}
      <MusicModeModal
        isOpen={isMusicModeOpen}
        onClose={() => setIsMusicModeOpen(false)}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        onTogglePlay={togglePlay}
        onReload={reloadStream}
        songTitle={streamMetadata.hasLiveMetadata ? streamMetadata.song : (currentLiveProgram ? currentLiveProgram.title : stationConfig.name)}
        artist={streamMetadata.hasLiveMetadata ? streamMetadata.artist : (currentLiveProgram ? currentLiveProgram.host : undefined)}
        artworkUrl={discDisplay.imageUrl}
        programTitle={currentLiveProgram?.title}
        host={currentLiveProgram?.host}
        volume={volume}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
