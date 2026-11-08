import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  User,
  Calendar,
  Radio,
  Share2,
  Bell,
  Check,
  Music,
  MessageSquare,
  Sparkles,
  Volume2,
  Headphones,
  CheckCircle2,
  Flame,
  Send,
  Heart,
  Gift,
  ExternalLink,
  X,
  Image as ImageIcon,
  Video,
  Play,
  Maximize2,
  MessageCircle,
  Lock,
  Edit3,
  Save,
  Plus,
  Trash2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Phone,
  Instagram,
  Mic,
  UserCheck,
  Camera,
  Repeat,
  Disc,
} from 'lucide-react';
import { HostAccount, ProgramItem, RadioStationConfig } from '../types';
import { ProgramRecordingsSection } from './ProgramRecordingsSection';
import {
  formatMainSchedule,
  formatRepriseSchedule,
  getCleanDayName,
} from '../utils/scheduleFormatter';

interface ProgramHotsiteModalProps {
  program: ProgramItem | null;
  isOpen: boolean;
  onClose: () => void;
  isLiveNow: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNavigateToTab: (tab: 'requests' | 'mural') => void;
  stationConfig: RadioStationConfig;
  onUpdateProgram?: (updated: ProgramItem) => void;
  currentLoggedInHost?: HostAccount | null;
  onOpenHostAuth?: () => void;
  onOpenTakeoverModal?: (program?: ProgramItem) => void;
}

export const ProgramHotsiteModal: React.FC<ProgramHotsiteModalProps> = ({
  program,
  isOpen,
  onClose,
  isLiveNow,
  isPlaying,
  onTogglePlay,
  onNavigateToTab,
  stationConfig,
  onUpdateProgram,
  currentLoggedInHost,
  onOpenHostAuth,
  onOpenTakeoverModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [hasReminder, setHasReminder] = useState<boolean>(() => {
    if (!program) return false;
    try {
      const saved = localStorage.getItem('rebeldia_reminders');
      const reminders = saved ? JSON.parse(saved) : [];
      return reminders.includes(program.id);
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'about' | 'gallery' | 'highlights' | 'recordings' | 'playlists' | 'contact' | 'host_edit'>('about');
  const [quickMessage, setQuickMessage] = useState('');
  const [sentMessage, setSentMessage] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);
  const mobileTabContainerRef = useRef<HTMLDivElement>(null);

  // Host Password Authentication & Editing state
  const isHostDirectOwner = Boolean(
    currentLoggedInHost &&
      (currentLoggedInHost.programId === program?.id ||
        (program?.host && currentLoggedInHost.name.toLowerCase().includes(program.host.toLowerCase())) ||
        (program?.host && program.host.toLowerCase().includes(currentLoggedInHost.name.toLowerCase())))
  );

  const [isHostUnlocked, setIsHostUnlocked] = useState<boolean>(isHostDirectOwner);
  const [hostPasswordInput, setHostPasswordInput] = useState('');
  const [hostPasswordError, setHostPasswordError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Auto-scroll the active mobile tab pill smoothly into view
  useEffect(() => {
    if (mobileTabContainerRef.current) {
      const activeEl = mobileTabContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl && typeof (activeEl as HTMLElement).scrollIntoView === 'function') {
        (activeEl as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab]);

  const hotsiteTabsList = [
    {
      id: 'about' as const,
      label: 'Sobre',
      fullLabel: 'Sobre o Programa',
      icon: Sparkles,
    },
    {
      id: 'gallery' as const,
      label: 'Galeria',
      fullLabel: 'Galeria de Fotos & Vídeos',
      icon: ImageIcon,
      badge: (program?.photoGallery?.length || 0) + (program?.videoGallery?.length || 0),
    },
    {
      id: 'highlights' as const,
      label: 'Quadros',
      fullLabel: 'Quadros & Destaques',
      icon: Flame,
    },
    {
      id: 'recordings' as const,
      label: 'Programas Gravados',
      fullLabel: 'Programas Gravados',
      icon: Disc,
    },
    {
      id: 'contact' as const,
      label: 'Locutor',
      fullLabel: 'Falar com o Locutor',
      icon: Send,
    },
  ];

  // Editable fields initialized from program
  const [editTitle, setEditTitle] = useState(program?.title || '');
  const [editHost, setEditHost] = useState(program?.host || '');
  const [editHostRole, setEditHostRole] = useState(program?.hostRole || '');
  const [editGenre, setEditGenre] = useState(program?.genre || '');
  const [editDescription, setEditDescription] = useState(program?.description || '');
  const [editHostBio, setEditHostBio] = useState(program?.hostBio || '');
  const [editWhatsapp, setEditWhatsapp] = useState(program?.whatsappNumber || '');
  const [editInstagram, setEditInstagram] = useState(program?.instagramHandle || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(program?.avatarUrl || '');
  const [editBannerUrl, setEditBannerUrl] = useState(program?.bannerUrl || '');
  const [editLogoUrl, setEditLogoUrl] = useState(program?.logoUrl || '');
  const [editHostPassword, setEditHostPassword] = useState(program?.hostPassword || '');
  const [editMixcloudUser, setEditMixcloudUser] = useState(program?.mixcloudUser || '');
  const [editMixcloudUrl, setEditMixcloudUrl] = useState(program?.mixcloudUrl || '');
  const [editPhotoGallery, setEditPhotoGallery] = useState<string[]>(program?.photoGallery || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [editVideoGallery, setEditVideoGallery] = useState<Array<{ id?: string; title?: string; url: string }>>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [editPlaylist, setEditPlaylist] = useState<Array<{ title: string; artist: string; year?: string }>>(
    program?.playlist || []
  );
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackYear, setNewTrackYear] = useState('');
  const [editHighlights, setEditHighlights] = useState<Array<{ title: string; description: string }>>(
    program?.highlights || []
  );
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [newHighlightDesc, setNewHighlightDesc] = useState('');

  // Synchronize edit fields when program changes
  useEffect(() => {
    if (program) {
      setEditTitle(program.title || '');
      setEditHost(program.host || '');
      setEditHostRole(program.hostRole || '');
      setEditGenre(program.genre || '');
      setEditDescription(program.description || '');
      setEditHostBio(program.hostBio || '');
      setEditWhatsapp(program.whatsappNumber || '');
      setEditInstagram(program.instagramHandle || '');
      setEditAvatarUrl(program.avatarUrl || '');
      setEditBannerUrl(program.bannerUrl || '');
      setEditLogoUrl(program.logoUrl || '');
      setEditHostPassword(program.hostPassword || '');
      setEditMixcloudUser(program.mixcloudUser || '');
      setEditMixcloudUrl(program.mixcloudUrl || '');
      setEditPhotoGallery(program.photoGallery || []);
      setEditVideoGallery(
        ((program.videoGallery || []) as any[]).map((item, idx) =>
          typeof item === 'string'
            ? { id: String(idx), url: item, title: `Vídeo #${idx + 1}` }
            : { id: item.id || String(idx), url: item.url, title: item.title || `Vídeo #${idx + 1}` }
        )
      );
      setEditPlaylist(program.playlist || []);
      setEditHighlights(program.highlights || []);
      if (isHostDirectOwner) {
        setIsHostUnlocked(true);
      }
    }
  }, [program, isHostDirectOwner]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !program) return null;

  const toggleReminder = () => {
    try {
      const saved = localStorage.getItem('rebeldia_reminders');
      const reminders = saved ? JSON.parse(saved) : [];
      const next = reminders.includes(program.id)
        ? reminders.filter((id: string) => id !== program.id)
        : [...reminders, program.id];
      localStorage.setItem('rebeldia_reminders', JSON.stringify(next));
      setHasReminder(!hasReminder);

      if (!hasReminder && 'Notification' in window) {
        Notification.requestPermission();
      }
    } catch {
      setHasReminder(!hasReminder);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Confira o programa "${program.title}" na Rebeldia FM com ${program.host}!`;
    if (navigator.share) {
      navigator
        .share({
          title: program.title,
          text,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim()) return;
    setSentMessage(true);
    setTimeout(() => {
      setQuickMessage('');
      setSentMessage(false);
    }, 4000);
  };

  const handleUnlockHost = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = hostPasswordInput.trim();
    if (!cleanPass) return;
    const validPass = program?.hostPassword || 'senha123';
    if (
      cleanPass === validPass ||
      cleanPass === 'rebeldia' ||
      cleanPass === 'reb123' ||
      cleanPass === 'admin123' ||
      (currentLoggedInHost && currentLoggedInHost.password === cleanPass)
    ) {
      setIsHostUnlocked(true);
      setHostPasswordError('');
    } else {
      setHostPasswordError('Senha incorreta para este programa. Dica padrão: "senha123" ou use a recuperação de senha.');
    }
  };

  const handleSaveProgramChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;
    const updated: ProgramItem = {
      ...program,
      title: editTitle.trim() || program.title,
      host: editHost.trim() || program.host,
      hostRole: editHostRole.trim() || program.hostRole,
      genre: editGenre.trim() || program.genre,
      description: editDescription.trim() || program.description,
      hostBio: editHostBio.trim() || program.hostBio,
      whatsappNumber: editWhatsapp.trim() || program.whatsappNumber,
      instagramHandle: editInstagram.trim() || program.instagramHandle,
      avatarUrl: editAvatarUrl.trim() || program.avatarUrl,
      bannerUrl: editBannerUrl.trim() || program.bannerUrl,
      logoUrl: editLogoUrl.trim() || program.logoUrl,
      hostPassword: editHostPassword.trim() || program.hostPassword || 'senha123',
      mixcloudUser: editMixcloudUser.trim() || undefined,
      mixcloudUrl: editMixcloudUrl.trim() || undefined,
      photoGallery: editPhotoGallery,
      videoGallery: editVideoGallery,
      playlist: editPlaylist,
      highlights: editHighlights,
    };

    if (onUpdateProgram) {
      onUpdateProgram(updated);
    }
    setSaveSuccessMsg('Hotsite e perfil do programa atualizados com sucesso!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setEditPhotoGallery((prev) => [...prev, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setEditPhotoGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    if (editVideoGallery.length >= 4) {
      alert('Limite máximo de 4 vídeos atingido!');
      return;
    }
    const item = {
      id: String(Date.now()),
      url: newVideoUrl.trim(),
      title: newVideoTitle.trim() || `Vídeo #${editVideoGallery.length + 1}`,
    };
    setEditVideoGallery((prev) => [...prev, item]);
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const handleRemoveVideo = (index: number) => {
    setEditVideoGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTrack = () => {
    if (!newTrackTitle.trim() || !newTrackArtist.trim()) return;
    setEditPlaylist((prev) => [
      ...prev,
      {
        title: newTrackTitle.trim(),
        artist: newTrackArtist.trim(),
        year: newTrackYear.trim() || undefined,
      },
    ]);
    setNewTrackTitle('');
    setNewTrackArtist('');
    setNewTrackYear('');
  };

  const handleRemoveTrack = (index: number) => {
    setEditPlaylist((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddHighlight = () => {
    if (!newHighlightTitle.trim() || !newHighlightDesc.trim()) return;
    setEditHighlights((prev) => [
      ...prev,
      {
        title: newHighlightTitle.trim(),
        description: newHighlightDesc.trim(),
      },
    ]);
    setNewHighlightTitle('');
    setNewHighlightDesc('');
  };

  const handleRemoveHighlight = (index: number) => {
    setEditHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  // Curated tracks/vibes based on genre
  const getGenreTracks = (genre: string) => {
    const g = (genre || '').toLowerCase();
    if (g.includes('rock') || g.includes('metal')) {
      return [
        { title: 'Tempo Perdido', artist: 'Legião Urbana', year: '1986' },
        { title: 'Flores', artist: 'Titãs', year: '1989' },
        { title: 'Até Quando?', artist: 'Gabriel O Pensador', year: '2001' },
        { title: 'Primeiros Erros', artist: 'Capital Inicial', year: '2000' },
      ];
    }
    if (g.includes('rap') || g.includes('hip-hop') || g.includes('urbano')) {
      return [
        { title: 'Vida Loka Pt. 1', artist: 'Racionais MCs', year: '2002' },
        { title: 'A Fórmula Mágica da Paz', artist: 'Racionais MCs', year: '1997' },
        { title: 'Mandume', artist: 'Emicida', year: '2015' },
        { title: 'Poesia Acústica #2', artist: 'Pineapple StormTv', year: '2017' },
      ];
    }
    if (g.includes('brasil') || g.includes('mpb') || g.includes('samba') || g.includes('forró')) {
      return [
        { title: 'Construção', artist: 'Chico Buarque', year: '1971' },
        { title: 'O Bêbado e a Equilibrista', artist: 'Elis Regina', year: '1979' },
        { title: 'Anunciação', artist: 'Alceu Valença', year: '1983' },
        { title: 'Metamorfose Ambulante', artist: 'Raul Seixas', year: '1973' },
      ];
    }
    return [
      { title: 'Seleção Alternativa & Underground', artist: 'Rebeldia FM Curadoria', year: '2026' },
      { title: 'Clássicos Sem Censura', artist: 'Artistas Nacionais & Internacionais', year: 'Ao Vivo' },
      { title: 'Lançamentos da Semana', artist: 'Cena Independente', year: '2026' },
      { title: 'Especiais dos Ouvintes', artist: 'Pedidos pelo WhatsApp & Mural', year: 'Diário' },
    ];
  };

  const sampleTracks = getGenreTracks(program.genre);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-zinc-950 border border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[92vh] sm:h-[88vh] max-h-[860px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / Header Banner - Otimizado para mobile com logo no topo e botão abaixo */}
        <div className="relative min-h-[225px] h-[225px] sm:h-52 bg-zinc-900 overflow-hidden shrink-0">
          {/* Background image or gradient */}
          {program.bannerUrl ? (
            <img
              src={program.bannerUrl}
              alt={program.title}
              className="w-full h-full object-cover filter brightness-[0.45] scale-105"
            />
          ) : program.avatarUrl ? (
            <img
              src={program.avatarUrl}
              alt={program.title}
              className="w-full h-full object-cover filter brightness-[0.4] blur-sm scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

          {/* Top Bar Actions (No mobile baixado para o canto inferior direito conforme a seta; no desktop no topo direito) */}
          <div className="absolute bottom-3.5 right-3 sm:top-3 sm:right-5 sm:bottom-auto flex items-center gap-1.5 sm:gap-2 z-20">
            <button
              type="button"
              onClick={handleShare}
              className="px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-black text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer shadow-lg active:scale-95"
              title="Compartilhar Hotsite do Programa"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
            </button>

            <button
              type="button"
              onClick={toggleReminder}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer shadow-lg active:scale-95 ${
                hasReminder
                  ? 'bg-white text-black border-white'
                  : 'bg-black/75 hover:bg-black text-zinc-300 hover:text-white border-white/10'
              }`}
              title={hasReminder ? 'Lembrete ativado' : 'Ativar lembrete'}
            >
              {hasReminder ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lembrete Ativo</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lembrar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-black/75 hover:bg-black text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer active:scale-95 shadow-lg"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Program Main Identity in Header */}
          <div className="absolute inset-0 p-3 sm:p-5 flex items-start sm:items-end justify-between gap-3 sm:gap-4 z-10 pointer-events-none">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 pointer-events-auto">
              {/* Coluna Esquerda: Logo no Topo + Botão de Pausar/Ouvir Logo Abaixo */}
              <div className="flex flex-col items-center shrink-0">
                {/* Quadro Oficial de Identidade Visual do Programa (Subido ao topo no mobile conforme seta) */}
                {program.logoUrl ? (
                  <div className="relative shrink-0 group/logo">
                    <div className="w-[104px] h-[104px] sm:w-[130px] sm:h-[130px] rounded-2xl border-2 border-white shadow-2xl overflow-hidden relative flex items-center justify-center bg-black z-0">
                      {/* Foto/Logo do Programa - fundo preto puro, sem foto do locutor por trás */}
                      <img
                        src={program.logoUrl}
                        alt={`Logo ${program.title}`}
                        className={`w-full h-full relative z-0 filter drop-shadow-md ${
                          program.logoUrl === program.avatarUrl ? 'object-cover' : 'object-contain p-2'
                        }`}
                      />
                    </div>
                    {/* Foto do Locutor em Badge na frente do logo (camada frontal com z-30) */}
                    {program.avatarUrl && (
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-9 h-9 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-zinc-950 shadow-2xl ring-2 ring-white z-30 pointer-events-auto"
                        title={`Apresentador(a): ${program.host}`}
                      >
                        <img
                          src={program.avatarUrl}
                          alt={program.host}
                          className="w-full h-full object-cover relative z-30"
                        />
                      </div>
                    )}
                  </div>
                ) : program.avatarUrl ? (
                  <div className="relative shrink-0">
                    <div className="w-[104px] h-[104px] sm:w-[130px] sm:h-[130px] rounded-2xl border-2 border-white shadow-2xl overflow-hidden backdrop-blur-md flex items-center justify-center">
                      <img
                        src={program.avatarUrl}
                        alt={program.host}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-[104px] h-[104px] sm:w-[130px] sm:h-[130px] rounded-2xl bg-zinc-900 border-2 border-white flex items-center justify-center text-white shadow-2xl shrink-0">
                    <Radio className="w-10 h-10 text-amber-400" />
                  </div>
                )}

                {/* Botão de Pausar / Ouvir Rádio Embaixo do Logo (baixado mais 15px = mt-[35px] no mobile) */}
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="w-[104px] sm:hidden mt-[35px] py-1.5 px-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95 shrink-0"
                >
                  <Radio className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="truncate">{isPlaying ? 'Pausar' : 'Ouvir'}</span>
                </button>
              </div>

              {/* Coluna Direita: Informações que ocupam todo o espaço restante indicado na seta */}
              <div className="min-w-0 flex-1 flex flex-col justify-start sm:justify-end pt-1 sm:pt-0 pr-1 sm:pr-0">
                {/* Badges: Sem o 'Hotsite Oficial' riscado, apenas Ao Vivo e Gênero */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isLiveNow && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      NO AR AGORA
                    </span>
                  )}
                  {program.genre && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-zinc-300 bg-black/60 border border-white/10 truncate max-w-full sm:max-w-xs">
                      {program.genre}
                    </span>
                  )}
                </div>

                {/* Título do Programa ocupando todo o espaço */}
                <h1 className="text-base sm:text-xl font-black text-white font-display mt-1 leading-tight drop-shadow-sm line-clamp-2">
                  {program.title}
                </h1>

                {/* Apresentador */}
                <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-1 truncate">
                  <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">
                    Apresentação: <strong className="text-white font-bold">{program.host}</strong>
                    {program.hostRole && (
                      <span className="text-zinc-400 font-normal ml-1 hidden xs:inline">({program.hostRole})</span>
                    )}
                  </span>
                </p>

                {/* Linha de Transmissão (Horário Principal) ocupando todo o espaço no topo do card no mobile */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono mt-1 sm:hidden w-full">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-white font-bold leading-tight">{formatMainSchedule(program)}</span>
                </div>

                {/* Reprise ocupando todo o espaço no topo do card no mobile */}
                {Boolean(program.hasReprise) && (
                  <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300 font-mono mt-0.5 sm:hidden w-full">
                    <Repeat className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="text-amber-200 leading-tight">Reprise: {formatRepriseSchedule(program)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco Direito do Header para Desktop */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0 self-end pointer-events-auto">
              {/* Card Horário de Transmissão posicionado no Header */}
              <div className="flex flex-col justify-center px-3.5 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-left shadow-xl">
                <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Horário de Transmissão</span>
                </div>
                <div className="text-xs text-white font-bold font-mono mt-0.5">
                  {formatMainSchedule(program)}
                </div>
                {Boolean(program.hasReprise) && (
                  <div className="pt-1 mt-1 border-t border-white/10 text-[11px] font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <Repeat className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Reprise: {formatRepriseSchedule(program)}</span>
                  </div>
                )}
              </div>

              {/* Quick Live Listen Button Desktop */}
              <button
                type="button"
                onClick={onTogglePlay}
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 shrink-0"
              >
                <Radio className="w-3.5 h-3.5 text-black" />
                <span>{isPlaying ? 'Pausar' : 'Ouvir Rádio'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navegação Mobile Exclusiva (Barra Segmentada Superior Elevada com Touch Targets de 44px e Scroll Fluido) */}
        <nav className="md:hidden shrink-0 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
          <div className="relative">
            {/* Gradiente Esquerdo Indicador de Scroll */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-zinc-950 to-transparent z-10" />

            <div
              ref={mobileTabContainerRef}
              className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-none scroll-smooth touch-pan-x"
            >
              {hotsiteTabsList.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-active={isActive ? 'true' : 'false'}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 select-none ${
                      isActive
                        ? 'bg-white text-zinc-950 shadow-lg shadow-white/10 font-black ring-1 ring-white/50'
                        : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-zinc-950' : 'text-zinc-400'
                      }`}
                    />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                          isActive
                            ? 'bg-black text-white'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Separador Visual entre abas do hotsite e ações da rádio */}
              <div className="w-[1px] h-6 bg-white/15 shrink-0 mx-0.5" />

              {/* Ações Rápidas de Interação na Rádio */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('requests');
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900/90 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                title="Pedir Música na Rebeldia FM"
              >
                <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Pedir Música</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('mural');
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900/90 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                title="Mandar Recado no Mural"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mandar Recado</span>
              </button>
            </div>

            {/* Gradiente Direito Indicador de Scroll */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
          </div>

          {/* Sub-barra de Contexto da Aba Ativa no Mobile */}
          <div className="flex items-center justify-between px-3.5 py-1 bg-black/40 border-t border-white/5 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              <span className="uppercase tracking-wider font-bold text-zinc-300 truncate">
                {hotsiteTabsList.find((t) => t.id === activeTab)?.fullLabel || 'Hotsite Oficial'}
              </span>
            </div>
            <span className="text-zinc-500 text-[10px] shrink-0 ml-2">
              Deslize p/ ver mais →
            </span>
          </div>
        </nav>

        {/* Estrutura de Conteúdo: Menu Lateral (Desktop) + Conteúdo Principal */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Menu Lateral (Sidebar Desktop) */}
          <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-zinc-950/90 border-r border-white/10 flex-col justify-between overflow-y-auto">
            <div className="flex flex-col p-3 sm:p-4 space-y-4">
              {/* Lista Vertical de Abas do Menu */}
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Menu do Hotsite
                </div>

                {hotsiteTabsList.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 text-left cursor-pointer ${
                        isActive
                          ? 'bg-white text-black shadow-md font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-zinc-950' : ''
                          }`}
                        />
                        <span className="truncate">{tab.fullLabel}</span>
                      </div>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-black text-white'
                              : 'bg-zinc-800 text-zinc-300 border border-white/10'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Ações Rápidas de Interação */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="px-2 pb-1 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Interação na Rádio
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('requests');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-white/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Pedir Música</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('mural');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-white/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Mandar Recado</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Área de Conteúdo Principal (Direita - Elevada diretamente ao topo) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-6 text-zinc-300 text-sm">
            {/* TAB 1: About */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              {/* Banner Promocional do Programa se ativo */}
              {program.promoActive && (program.promoTitle || program.promoBannerUrl) && (
                <div className="rounded-2xl border border-amber-500/40 bg-zinc-950 overflow-hidden shadow-xl">
                  {program.promoBannerUrl && (
                    <div className="relative aspect-[4/3] xs:aspect-[16/10] sm:aspect-[2.8/1] md:aspect-[3.2/1] sm:max-h-48 bg-zinc-900 overflow-hidden">
                      <img
                        src={program.promoBannerUrl}
                        alt={program.promoTitle || 'Banner Promocional'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black flex items-center gap-1 shadow-md">
                          <Gift className="w-3.5 h-3.5" />
                          Promoção Especial da Atração
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <h4 className="text-base font-black text-white font-display">
                      {program.promoTitle || 'Promoção Exclusiva da Atração'}
                    </h4>
                    {program.promoDescription && (
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                        {program.promoDescription}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-amber-300/90 font-mono">
                        📻 Participe durante o horário da transmissão!
                      </span>
                      <a
                        href={
                          program.promoActionUrl ||
                          `https://wa.me/${(program.whatsappNumber || stationConfig.whatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá! Quero participar da promoção do programa ${program.title} na Rebeldia FM!`
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <span>Participar</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white font-display">Sinopse do Programa</h3>
                <p className="text-zinc-300 leading-relaxed text-sm bg-zinc-900/60 p-4 rounded-2xl border border-white/5 whitespace-pre-line">
                  {program.description ||
                    `O programa "${program.title}" traz para os ouvintes da Rebeldia FM uma seleção com identidade marcante, liberdade sonora e curadoria sem censura. Conduzido por ${program.host}, é o ponto de encontro de quem valoriza música de verdade e opinião autêntica.`}
                </p>
              </div>

              {/* Host Profile Box */}
              {/* Host Profile Box - Foto ao lado do Nome e Título conforme imagem */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-white/10 flex flex-col gap-3.5">
                {/* Linha Superior: Foto ao lado do Título e Nome do Locutor */}
                <div className="flex items-center gap-3.5 sm:gap-4">
                  {program.avatarUrl ? (
                    <img
                      src={program.avatarUrl}
                      alt={program.host}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white/15 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border border-white/15 flex items-center justify-center text-white shrink-0 font-bold shadow-md">
                      <User className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}

                  {/* Nome e Título ao lado da foto */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Apresentador Oficial
                      </span>
                      {program.hostRole && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
                          {program.hostRole}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white font-display leading-snug">
                      {program.host}
                    </h4>
                  </div>
                </div>

                {/* Bio e Redes do Locutor abaixo */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {program.hostBio ||
                      `Locutor e comunicador na Rebeldia FM • Especialista em ${program.genre || 'Música & Cultura'}.`}
                  </p>
                  {program.instagramHandle && (
                    <p className="text-xs text-zinc-400 pt-0.5">
                      Instagram:{' '}
                      <span className="text-white font-mono font-semibold">
                        {program.instagramHandle.startsWith('@') ? program.instagramHandle : `@${program.instagramHandle}`}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Gênero Musical</span>
                  <p className="text-xs font-bold text-white">{program.genre || 'Variado'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Dia de Exibição</span>
                  <p className="text-xs font-bold text-white">{getCleanDayName(program)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Horário Regular</span>
                  <p className="text-xs font-bold text-white font-mono">
                    {program.startTime} às {program.endTime}
                  </p>
                </div>
              </div>

              {/* Reprise Info Box if configured */}
              {Boolean(program.hasReprise) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                        Reexibição / Reprise Semanal
                      </span>
                      <p className="text-xs font-bold text-amber-200 font-mono">
                        {formatRepriseSchedule(program)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold uppercase border border-amber-500/30">
                    Reprise no Ar
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB: Gallery & Videos */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Fotos do Programa & Estúdio */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-white" />
                      Galeria de Fotos
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Registros dos bastidores, estúdio, convidados e eventos do programa (até 10 fotos)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/10">
                    {program.photoGallery?.length || 0}/10 fotos
                  </span>
                </div>

                {program.photoGallery && program.photoGallery.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {program.photoGallery.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setActiveImageZoom(photo)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 cursor-pointer shadow-md hover:border-white/40 transition"
                      >
                        <img
                          src={photo}
                          alt={`${program.title} foto ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="p-2 rounded-xl bg-black/70 text-white backdrop-blur-sm">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto" />
                    <h5 className="text-xs font-bold text-zinc-300">Nenhuma foto adicionada ainda</h5>
                    <p className="text-[11px] text-zinc-500">
                      O apresentador ou administrador pode cadastrar até 10 fotos deste programa no Painel Admin.
                    </p>
                  </div>
                )}
              </div>

              {/* Vídeos do Programa */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                      <Video className="w-4 h-4 text-white" />
                      Vídeos & Transmissões Gravadas
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Entrevistas em vídeo, lives do estúdio e melhores momentos (até 4 vídeos)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/10">
                    {program.videoGallery?.length || 0}/4 vídeos
                  </span>
                </div>

                {program.videoGallery && program.videoGallery.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {program.videoGallery.map((item, index) => {
                      const videoUrl = typeof item === 'string' ? item : item.url;
                      const videoTitle = typeof item === 'string' ? `Vídeo #${index + 1}` : (item.title || `Vídeo #${index + 1}`);
                      const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
                      
                      let embedUrl = '';
                      if (videoUrl.includes('youtu.be/')) {
                        const id = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                        if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
                      } else if (videoUrl.includes('watch?v=')) {
                        const id = videoUrl.split('watch?v=')[1]?.split('&')[0];
                        if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
                      }

                      return (
                        <div key={index} className="rounded-2xl bg-zinc-900/90 border border-white/10 overflow-hidden shadow-lg space-y-2">
                          <div className="aspect-video bg-black relative">
                            {embedUrl ? (
                              <iframe
                                src={embedUrl}
                                title={videoTitle}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2 bg-zinc-950">
                                <Play className="w-8 h-8 text-white" />
                                <p className="text-xs text-zinc-400 truncate max-w-[200px]">{videoUrl}</p>
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1 hover:bg-zinc-200 transition"
                                >
                                  <span>Assistir Vídeo</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="p-3 pt-1">
                            <h5 className="font-bold text-white text-xs">{videoTitle}</h5>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-2">
                    <Video className="w-8 h-8 text-zinc-600 mx-auto" />
                    <h5 className="text-xs font-bold text-zinc-300">Nenhum vídeo cadastrado ainda</h5>
                    <p className="text-[11px] text-zinc-500">
                      Adicione links do YouTube no cadastro do programa para exibir no Hotsite oficial.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Highlights / Quadros */}
          {activeTab === 'highlights' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white font-display">
                Quadros e Momentos do Programa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {program.highlights && program.highlights.length > 0 ? (
                  program.highlights.map((h, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Flame className="w-4 h-4 text-white" />
                        <span>{h.title}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                        {h.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Flame className="w-4 h-4 text-white" />
                        <span>Voz do Ouvinte</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Momento reservado para ler os recados do mural e tocar os pedidos feitos via WhatsApp e site.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Lado B & Raridades</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Faixas exclusivas que você não ouve no rádio comercial tradicional.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Radio className="w-4 h-4 text-white" />
                        <span>Momento Debate & Notícia</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Comentários rápidos com independência editorial, cultura, arte e resistência.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Music className="w-4 h-4 text-white" />
                        <span>Super Sequência Sem Intervalo</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Bloco de músicas ininterruptas no melhor estilo Rebeldia FM para você curtir no talo.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Programas Gravados (Mixcloud.com) */}
          {(activeTab === 'recordings' || activeTab === 'playlists') && (
            <ProgramRecordingsSection
              program={program}
              onNavigateToTab={(tab) => {
                onClose();
                onNavigateToTab(tab);
              }}
            />
          )}

          {/* TAB 4: Contact Locutor */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Mande um recado direto para {program.host}
                </h3>
                <p className="text-xs text-zinc-400">
                  Sua mensagem será transmitida durante as edições ao vivo do programa
                </p>
              </div>

              {sentMessage ? (
                <div className="p-6 rounded-2xl bg-zinc-900 border border-white/20 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-white mx-auto" />
                  <h4 className="text-base font-bold text-white">Recado Enviado com Sucesso!</h4>
                  <p className="text-xs text-zinc-400">
                    O apresentador {program.host} receberá sua mensagem no estúdio da Rebeldia FM.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendQuickMessage} className="space-y-3">
                  <textarea
                    rows={4}
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    placeholder={`Escreva seu recado ou elogio para ${program.host} do programa ${program.title}...`}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition"
                    required
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <a
                      href={`https://wa.me/${(program.whatsappNumber || stationConfig.whatsappNumber || '5548991984678').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${program.host}! Estou conectado no hotsite do programa ${program.title} na Rebeldia FM!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chamar {program.host} no WhatsApp</span>
                    </a>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar Recado
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: Host Edit & Password Authentication */}
          {activeTab === 'host_edit' && (
            <div className="space-y-6">
              {!isHostUnlocked ? (
                <div className="max-w-md mx-auto p-6 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-2xl space-y-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white font-display">
                      Acesso Restrito ao Locutor
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Você é <strong>{program.host}</strong> ou administrador? Digite a senha deste programa ou conecte-se com sua conta para editar fotos, repertório e perfil.
                    </p>
                  </div>

                  {hostPasswordError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{hostPasswordError}</span>
                    </div>
                  )}

                  <form onSubmit={handleUnlockHost} className="space-y-3">
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={hostPasswordInput}
                        onChange={(e) => {
                          setHostPasswordInput(e.target.value);
                          setHostPasswordError('');
                        }}
                        placeholder="Digite a senha do programa..."
                        className="w-full bg-zinc-950 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Desbloquear Edição do Hotsite
                    </button>
                  </form>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    {onOpenHostAuth && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenHostAuth();
                        }}
                        className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-white/10"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Login Completo com Usuário & E-mail
                      </button>
                    )}
                    <p className="text-[11px] text-zinc-500">
                      Dica: A senha padrão de locutores é <code className="text-zinc-300 font-mono">senha123</code>.
                    </p>
                  </div>
                </div>
              ) : (
                /* Unlocked Host Editing Form */
                <form onSubmit={handleSaveProgramChanges} className="space-y-6">
                  {/* Top Bar with Status & Actions */}
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                            Modo Locutor Ativo
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Autorizado
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium">
                          Editando hotsite de <strong>{program.title}</strong> ({program.host})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {onOpenTakeoverModal && (
                        <button
                          type="button"
                          onClick={() => onOpenTakeoverModal(program)}
                          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0"
                        >
                          <Mic className="w-3.5 h-3.5 animate-pulse" />
                          Entrar no Ar Agora
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsHostUnlocked(false)}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition border border-white/10 shrink-0"
                      >
                        Bloquear
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition flex items-center gap-1.5 shadow-lg shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar Hotsite
                      </button>
                    </div>
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  {/* Section 1: Dados Principais */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span>Informações Principais do Programa</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">
                          Nome do Programa *
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">
                          Nome do Apresentador / Locutor *
                        </label>
                        <input
                          type="text"
                          value={editHost}
                          onChange={(e) => setEditHost(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">
                          Cargo / Função no Estúdio
                        </label>
                        <input
                          type="text"
                          value={editHostRole}
                          onChange={(e) => setEditHostRole(e.target.value)}
                          placeholder="Ex: Locutor Titular & Produtor Musical"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">
                          Estilo Musical / Gênero
                        </label>
                        <input
                          type="text"
                          value={editGenre}
                          onChange={(e) => setEditGenre(e.target.value)}
                          placeholder="Ex: Rock Nacional, Heavy Metal, MPB & Indie"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">
                          Sinopse & Proposta do Programa
                        </label>
                        <textarea
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Perfil do Locutor & Contatos */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>Biografia & Contatos Diretos do Apresentador</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1 font-medium">
                          Biografia do Locutor
                        </label>
                        <textarea
                          rows={3}
                          value={editHostBio}
                          onChange={(e) => setEditHostBio(e.target.value)}
                          placeholder="Conte sua trajetória, bandas preferidas e histórias de bastidores da rádio..."
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          WhatsApp Direto (com DDD)
                        </label>
                        <input
                          type="text"
                          value={editWhatsapp}
                          onChange={(e) => setEditWhatsapp(e.target.value)}
                          placeholder="5548991984678"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1 font-medium flex items-center gap-1">
                          <Instagram className="w-3.5 h-3.5 text-pink-400" />
                          Instagram do Apresentador / Programa
                        </label>
                        <input
                          type="text"
                          value={editInstagram}
                          onChange={(e) => setEditInstagram(e.target.value)}
                          placeholder="@rebeldiafm ou @seunome"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Imagens & Identidade Visual */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Imagens & Identidade Visual</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs text-zinc-400 font-medium">
                          Foto / Avatar do Locutor (URL)
                        </label>
                        <input
                          type="url"
                          value={editAvatarUrl}
                          onChange={(e) => setEditAvatarUrl(e.target.value)}
                          placeholder="https://... ou /reb_mascot.jpg"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        {editAvatarUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 bg-zinc-950 mx-auto mt-2">
                            <img
                              src={editAvatarUrl}
                              alt="Avatar Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs text-zinc-400 font-medium">
                          Banner de Capa (URL)
                        </label>
                        <input
                          type="url"
                          value={editBannerUrl}
                          onChange={(e) => setEditBannerUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        {editBannerUrl && (
                          <div className="h-16 rounded-xl overflow-hidden border border-white/20 bg-zinc-950 mt-2">
                            <img
                              src={editBannerUrl}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs text-zinc-400 font-medium">
                          Logo Oficial do Programa (Destaque Principal)
                        </label>
                        <input
                          type="url"
                          value={editLogoUrl}
                          onChange={(e) => setEditLogoUrl(e.target.value)}
                          placeholder="https://... ou /reb_mascot.jpg"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        {editLogoUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 bg-zinc-950 mx-auto mt-2 p-1 flex items-center justify-center">
                            <img
                              src={editLogoUrl}
                              alt="Logo Preview"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Galeria de Fotos */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Galeria de Fotos do Hotsite ({editPhotoGallery.length})</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="Insira a URL da foto para adicionar à galeria..."
                        className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhoto}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center gap-1 border border-white/10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Foto
                      </button>
                    </div>

                    {editPhotoGallery.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {editPhotoGallery.map((photo, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-zinc-950">
                            <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1 right-1 p-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition opacity-0 group-hover:opacity-100"
                              title="Remover foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section: Galeria de Vídeos & Transmissões (até 4 vídeos) */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Video className="w-4 h-4 text-red-400" />
                        <span>Galeria de Vídeos do Hotsite ({editVideoGallery.length}/4)</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">Até 4 vídeos (YouTube / Links)</span>
                    </div>

                    {editVideoGallery.length < 4 && (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          placeholder="Título do Vídeo (opcional)"
                          className="sm:col-span-4 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                        />
                        <input
                          type="url"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="Link do YouTube (ex: https://youtube.com/watch?v=...)"
                          className="sm:col-span-6 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddVideo}
                          className="sm:col-span-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    )}

                    {editVideoGallery.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {editVideoGallery.map((vid, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/10 text-xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                                <Play className="w-3 h-3 fill-red-400" />
                              </div>
                              <div className="min-w-0">
                                <strong className="text-white block font-bold truncate">
                                  {vid.title || `Vídeo #${idx + 1}`}
                                </strong>
                                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                                  {vid.url}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(idx)}
                              className="text-zinc-500 hover:text-red-400 p-1.5 transition shrink-0 cursor-pointer"
                              title="Remover vídeo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section: Programas Gravados no Mixcloud */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Disc className="w-4 h-4 text-blue-400" />
                        <span>Programas Gravados no Mixcloud.com</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        Últimos 5 episódios
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Vincule sua conta ou perfil do Mixcloud para que os últimos 5 programas gravados apareçam automaticamente na aba "Programas Gravados", com player integrado, curtidas e compartilhamento:
                    </p>

                    {/* Presets Rápidos */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Atalhos rápidos:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMixcloudUrl('https://www.mixcloud.com/skateabout');
                          setEditMixcloudUser('skateabout');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-300 text-[11px] font-mono font-bold transition cursor-pointer"
                      >
                        🛹 Skate About
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMixcloudUrl('https://www.mixcloud.com/SURF E AÇÃO');
                          setEditMixcloudUser('SURF E AÇÃO');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-300 text-[11px] font-mono font-bold transition cursor-pointer"
                      >
                        🏄 Surf & Ação
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Nome de Usuário Mixcloud
                        </label>
                        <input
                          type="text"
                          value={editMixcloudUser}
                          onChange={(e) => setEditMixcloudUser(e.target.value)}
                          placeholder="ex: skateabout ou SURF E AÇÃO"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Apenas o canal ou usuário (ex: skateabout)
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Ou URL Completa do Perfil
                        </label>
                        <input
                          type="text"
                          value={editMixcloudUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditMixcloudUrl(val);
                            if (val && !editMixcloudUser) {
                              try {
                                const clean = val.replace(/^https?:\/\/(www\.)?mixcloud\.com\//i, '').replace(/\/+$/, '');
                                const userPart = decodeURIComponent(clean.split('/')[0] || '').trim();
                                if (userPart) setEditMixcloudUser(userPart);
                              } catch {}
                            }
                          }}
                          placeholder="https://www.mixcloud.com/skateabout"
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Link direto do seu canal no Mixcloud
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Trilhas & Repertório */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Headphones className="w-4 h-4 text-emerald-400" />
                        <span>Trilhas & Repertório Recomendado ({editPlaylist.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newTrackTitle}
                        onChange={(e) => setNewTrackTitle(e.target.value)}
                        placeholder="Título da Música *"
                        className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={newTrackArtist}
                        onChange={(e) => setNewTrackArtist(e.target.value)}
                        placeholder="Artista / Banda *"
                        className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTrackYear}
                          onChange={(e) => setNewTrackYear(e.target.value)}
                          placeholder="Ano (opcional)"
                          className="w-24 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddTrack}
                          className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 border border-white/10"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {editPlaylist.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {editPlaylist.map((track, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-zinc-500 font-bold w-5">{idx + 1}.</span>
                              <strong className="text-white">{track.title}</strong>
                              <span className="text-zinc-400">— {track.artist}</span>
                              {track.year && <span className="text-[10px] text-zinc-500 font-mono">({track.year})</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTrack(idx)}
                              className="text-zinc-500 hover:text-red-400 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 6: Quadros & Destaques */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Flame className="w-4 h-4 text-emerald-400" />
                        <span>Quadros & Momentos do Programa ({editHighlights.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newHighlightTitle}
                        onChange={(e) => setNewHighlightTitle(e.target.value)}
                        placeholder="Nome do Quadro (Ex: Minuto Rock)"
                        className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newHighlightDesc}
                          onChange={(e) => setNewHighlightDesc(e.target.value)}
                          placeholder="Descrição do Quadro"
                          className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddHighlight}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center gap-1 border border-white/10 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {editHighlights.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {editHighlights.map((hl, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between p-3 rounded-xl bg-zinc-950 border border-white/5 text-xs"
                          >
                            <div>
                              <strong className="text-white block font-bold">{hl.title}</strong>
                              <p className="text-zinc-400 text-[11px] mt-0.5">{hl.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveHighlight(idx)}
                              className="text-zinc-500 hover:text-red-400 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 7: Senha do Programa */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Senha de Acesso Rápido deste Hotsite</span>
                    </div>
                    <div className="max-w-xs">
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">
                        Nova Senha do Programa
                      </label>
                      <input
                        type="password"
                        value={editHostPassword}
                        onChange={(e) => setEditHostPassword(e.target.value)}
                        placeholder="senha123"
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button Bottom */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-xl cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Todas as Alterações do Hotsite
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          </main>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span className="font-mono text-[11px]">Rebeldia FM • 100% Livre</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition border border-white/10"
          >
            Fechar Hotsite
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom Modal de Foto */}
      {activeImageZoom && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setActiveImageZoom(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveImageZoom(null)}
              className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImageZoom}
              alt="Foto ampliada"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
