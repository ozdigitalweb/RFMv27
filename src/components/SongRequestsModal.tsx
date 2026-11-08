import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Send,
  Heart,
  MessageCircle,
  Sparkles,
  User,
  MapPin,
  CheckCircle2,
  LogIn,
  Database,
  Search,
  Play,
  Pause,
  X,
  Check,
  Disc3,
  Globe2,
  Instagram,
  Share2,
  BookOpen,
  Gift,
  Phone,
  Copy,
  ExternalLink,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SongRequest, RadioStationConfig, ProgramItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { searchMusicDatabase, getArtistReleaseBio, MusicTrackResult } from '../services/musicApi';

interface SongRequestsModalProps {
  requests: SongRequest[];
  onAddRequest: (req: Omit<SongRequest, 'id' | 'timestamp' | 'votes'>) => void;
  onVoteRequest: (id: string) => void;
  stationConfig: RadioStationConfig;
  currentLiveProgram?: ProgramItem | null;
}

interface SubmittedDedicationData {
  listenerName: string;
  city: string;
  songTitle: string;
  artist: string;
  dedicatedTo: string;
  recipientPhone: string;
  dedication: string;
  recipientWhatsappUrl: string;
  studioWhatsappUrl: string;
  fullMessageText: string;
}

export const SongRequestsModal: React.FC<SongRequestsModalProps> = ({
  requests,
  onAddRequest,
  onVoteRequest,
  stationConfig,
  currentLiveProgram,
}) => {
  const { user, idToken, signInWithGoogle } = useAuth();
  const [listenerName, setListenerName] = useState('');
  const [city, setCity] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');

  // Dedication State
  const [isDedicationActive, setIsDedicationActive] = useState(true);
  const [dedicatedTo, setDedicatedTo] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [dedication, setDedication] = useState('');
  const [sendToRecipientWhatsapp, setSendToRecipientWhatsapp] = useState(true);
  const [sendToStudioWhatsapp, setSendToStudioWhatsapp] = useState(true);

  // Success and feedback state
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedDedication, setLastSubmittedDedication] = useState<SubmittedDedicationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDedicationText, setCopiedDedicationText] = useState(false);
  const [sharingRequestId, setSharingRequestId] = useState<string | null>(null);

  // Music Database API Search State
  const [musicResults, setMusicResults] = useState<MusicTrackResult[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrackResult | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewSecondsPlayed, setPreviewSecondsPlayed] = useState(0);
  const [artistBioText, setArtistBioText] = useState<string>('');
  const [isLoadingBio, setIsLoadingBio] = useState(false);
  const [enrichedMap, setEnrichedMap] = useState<Record<string, { artworkUrl?: string; previewUrl?: string; artistBio?: string }>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const previewTimerRef = useRef<any>(null);
  const playDurationTarget = 90; // 1 min 30 seconds (90s)

  // Auto-enrich requests from database that might be missing previewUrl or artworkUrl
  useEffect(() => {
    requests.forEach(async (req) => {
      if ((!req.previewUrl || !req.artworkUrl || !req.artistBio) && !enrichedMap[req.id]) {
        try {
          const results = await searchMusicDatabase(`${req.artist} ${req.songTitle}`);
          if (results && results.length > 0) {
            const best = results[0];
            let bio = req.artistBio;
            if (!bio) {
              bio = await getArtistReleaseBio(best.artist || req.artist);
            }
            setEnrichedMap((prev) => ({
              ...prev,
              [req.id]: {
                artworkUrl: req.artworkUrl || best.artworkLargeUrl || best.artworkUrl,
                previewUrl: req.previewUrl || best.previewUrl,
                artistBio: bio || undefined,
              },
            }));
          }
        } catch {
          // ignore lookup errors
        }
      }
    });
  }, [requests]);

  useEffect(() => {
    if (user?.displayName && !listenerName) {
      setListenerName(user.displayName);
    }
  }, [user]);

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio preview playback handler with 1m30s (90s) continuous looped playback
  useEffect(() => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    if (!previewAudioUrl) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setIsPlayingPreview(false);
      setPreviewSecondsPlayed(0);
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const audio = new Audio(previewAudioUrl);
    audioPreviewRef.current = audio;
    audio.volume = 0.7;
    setPreviewSecondsPlayed(0);

    let seconds = 0;
    previewTimerRef.current = setInterval(() => {
      seconds += 1;
      setPreviewSecondsPlayed(seconds);
      if (seconds >= playDurationTarget) {
        // Reached 1:30 (90 seconds limit)
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          audioPreviewRef.current = null;
        }
        setIsPlayingPreview(false);
        setPreviewAudioUrl(null);
        setPreviewSecondsPlayed(0);
        if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      }
    }, 1000);

    audio.play().then(() => {
      setIsPlayingPreview(true);
    }).catch(() => {
      setIsPlayingPreview(false);
    });

    audio.onended = () => {
      // Loop smoothly until 90 seconds (1m30s) are completed
      if (seconds < playDurationTarget) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setIsPlayingPreview(false);
        setPreviewAudioUrl(null);
        setPreviewSecondsPlayed(0);
      }
    };

    return () => {
      audio.pause();
      audioPreviewRef.current = null;
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current);
      }
    };
  }, [previewAudioUrl]);

  const togglePlayAudioPreview = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!url) return;
    if (previewAudioUrl === url && isPlayingPreview) {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
      setPreviewAudioUrl(null);
      setPreviewSecondsPlayed(0);
    } else {
      setPreviewAudioUrl(url);
    }
  };

  // Live search as user types song title
  const handleSongTitleChange = (val: string) => {
    setSongTitle(val);
    if (selectedTrack && val !== selectedTrack.title) {
      setSelectedTrack(null);
      setArtistBioText('');
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearchingMusic(true);
      setShowSuggestions(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchMusicDatabase(val);
          setMusicResults(results);
        } catch (err) {
          console.warn('Error searching music database:', err);
        } finally {
          setIsSearchingMusic(false);
        }
      }, 300);
    } else {
      setMusicResults([]);
      setIsSearchingMusic(false);
      setShowSuggestions(false);
    }
  };

  const handleSelectTrack = async (track: MusicTrackResult) => {
    setSongTitle(track.title);
    setArtist(track.artist);
    setSelectedTrack(track);
    setShowSuggestions(false);

    // Fetch band / artist release bio
    setIsLoadingBio(true);
    try {
      const bio = await getArtistReleaseBio(track.artist);
      setArtistBioText(bio);
    } catch (e) {
      setArtistBioText('');
    } finally {
      setIsLoadingBio(false);
    }
  };

  const handleClearSelectedTrack = () => {
    setSelectedTrack(null);
    setArtistBioText('');
    if (previewAudioUrl) {
      setPreviewAudioUrl(null);
    }
  };

  const handleShareRadio = async () => {
    const shareData = {
      title: `${stationConfig.name} - Ouvindo ao Vivo!`,
      text: `Estou sintonizado na ${stationConfig.name}! Peça seu som favorito e ouça o melhor do rock agora:`,
      url: 'https://www.rebeldiafm.com.br',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText('https://www.rebeldiafm.com.br');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (err) {
        console.warn('Failed to copy link', err);
      }
    }
  };

  const instagramUser = (stationConfig.instagramHandle || 'rebeldiafm').replace('@', '');
  const instagramLink = `https://instagram.com/${instagramUser}`;
  const radioWebsiteUrl = 'https://www.rebeldiafm.com.br';

  const formatCleanPhone = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('55')) return digits;
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return digits;
  };

  const generateDedicationWhatsappText = (params: {
    recipientName: string;
    senderName: string;
    songTitle: string;
    artist: string;
    dedicationMsg?: string;
  }) => {
    const shareText = encodeURIComponent(`🎸 Ouça a Rádio ${stationConfig.name} ao vivo comigo! Acesse: https://www.rebeldiafm.com.br`);
    const shareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

    return (
      `🎸 *SURPRESA MUSICAL NA ${stationConfig.name.toUpperCase()}!* 🎁\n\n` +
      `Olá, *${params.recipientName || 'Amigo(a)'}*!\n` +
      `*${params.senderName || 'Alguém especial'}* acabou de pedir uma música especialmente dedicada para você na rádio *${stationConfig.name}*!\n\n` +
      `🎵 *Música:* ${params.songTitle}\n` +
      `🎤 *Banda / Artista:* ${params.artist}\n` +
      (params.dedicationMsg ? `💬 *Mensagem da Dedicatória:*\n"${params.dedicationMsg}"\n\n` : '\n') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📻 *ACOMPANHE AO VIVO:* \n\n` +
      `1️⃣ *Link da rádio para ouvir a dedicatória:*\n👉 ${radioWebsiteUrl}\n\n` +
      `2️⃣ *Link para curtir e seguir a rádio:*\n👉 ${instagramLink}\n\n` +
      `3️⃣ *Link para compartilhar a rádio:*\n👉 ${shareUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Sintonize agora no site www.rebeldiafm.com.br e aumente o volume!_ 🤘📻`
    );
  };

  const generateStudioWhatsappText = (params: {
    listenerName: string;
    city: string;
    songTitle: string;
    artist: string;
    dedicatedTo?: string;
    recipientPhone?: string;
    dedicationMsg?: string;
    album?: string;
    year?: string;
    bio?: string;
  }) => {
    return (
      `📻 *PEDIDO DE MÚSICA - ${stationConfig.name}*\n` +
      (currentLiveProgram ? `🎙️ *Programa:* ${currentLiveProgram.title} (${currentLiveProgram.host})\n\n` : `\n`) +
      `👤 *Ouvinte:* ${params.listenerName}\n` +
      `📍 *Cidade:* ${params.city}\n` +
      `🎵 *Música:* ${params.songTitle}\n` +
      `🎤 *Artista / Banda:* ${params.artist}\n` +
      (params.dedicatedTo ? `🎁 *Dedicado para:* ${params.dedicatedTo}${params.recipientPhone ? ` (WhatsApp: ${params.recipientPhone})` : ''}\n` : '') +
      (params.dedicationMsg ? `💬 *Recado da Dedicatória:* "${params.dedicationMsg}"\n` : '') +
      (params.year ? `💿 *Ano / Álbum:* ${params.year} - ${params.album || ''}\n` : '') +
      (params.bio ? `📖 *Release:* ${params.bio.slice(0, 120)}...\n` : '') +
      `\n🔗 *Link da Rádio:* ${radioWebsiteUrl}\n` +
      `_Enviado e registrado no banco de dados da rádio_`
    );
  };

  const handleCopyDedicationText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDedicationText(true);
      setTimeout(() => setCopiedDedicationText(false), 2500);
    } catch (err) {
      console.warn('Failed to copy dedication text', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedArtist = selectedTrack?.artist || artist.trim() || (songTitle.includes('-') ? songTitle.split('-')[0].trim() : 'Artista a confirmar');
    const resolvedTitle = selectedTrack?.title || (songTitle.includes('-') ? songTitle.split('-').slice(1).join('-').trim() : songTitle.trim());

    if (!resolvedTitle || !listenerName.trim()) return;

    setIsSubmitting(true);
    try {
      let finalArtwork = selectedTrack?.artworkLargeUrl || selectedTrack?.artworkUrl;
      let finalPreview = selectedTrack?.previewUrl;
      let finalBio = artistBioText;

      // If user typed manually without clicking a suggestion, try a quick lookup to enrich
      if (!finalPreview && (!finalArtwork || !finalBio)) {
        try {
          const autoResults = await searchMusicDatabase(`${resolvedArtist} ${resolvedTitle}`);
          if (autoResults && autoResults.length > 0) {
            const best = autoResults[0];
            if (!finalArtwork) finalArtwork = best.artworkLargeUrl || best.artworkUrl;
            if (!finalPreview) finalPreview = best.previewUrl;
            if (!finalBio) {
              finalBio = await getArtistReleaseBio(best.artist || resolvedArtist);
            }
          }
        } catch {
          // ignore fallback lookup errors
        }
      }

      const cleanRecipient = formatCleanPhone(recipientPhone);
      const effectiveDedicatedTo = dedicatedTo.trim() || (cleanRecipient ? 'Homenageado(a)' : undefined);
      const effectiveDedication = dedication.trim() || undefined;

      // Save to Cloud SQL database via backend API
      await api.createSongRequest(
        {
          listenerName: listenerName.trim(),
          listenerCity: city.trim() || 'Ouvinte Web',
          artist: resolvedArtist,
          songTitle: resolvedTitle,
          dedicatedTo: effectiveDedicatedTo,
          message: effectiveDedication,
          artworkUrl: finalArtwork || undefined,
          previewUrl: finalPreview || undefined,
          artistBio: finalBio || undefined,
        },
        idToken
      );

      // Local optimistic update with artwork, audio preview and artist bio if available
      onAddRequest({
        listenerName: listenerName.trim(),
        city: city.trim() || 'Ouvinte Web',
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedication: effectiveDedication,
        dedicatedTo: effectiveDedicatedTo,
        recipientPhone: cleanRecipient || undefined,
        artworkUrl: finalArtwork || undefined,
        previewUrl: finalPreview || undefined,
        artistBio: finalBio || undefined,
      });

      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#fbbf24', '#f43f5e', '#10b981'],
      });

      // Prepare WhatsApp messages
      const recipientMsgText = generateDedicationWhatsappText({
        recipientName: effectiveDedicatedTo || 'Amigo(a)',
        senderName: listenerName.trim(),
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedicationMsg: effectiveDedication,
      });

      const recipientWhatsappUrl = cleanRecipient
        ? `https://api.whatsapp.com/send?phone=${cleanRecipient}&text=${encodeURIComponent(recipientMsgText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(recipientMsgText)}`;

      // WhatsApp target calculation for studio
      const rawTargetPhone = currentLiveProgram?.whatsappNumber || stationConfig.whatsappNumber || '5548991984678';
      const cleanStudioPhone = formatCleanPhone(rawTargetPhone);
      const studioMsgText = generateStudioWhatsappText({
        listenerName: listenerName.trim(),
        city: city.trim() || 'Ouvinte Web',
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedicatedTo: effectiveDedicatedTo,
        recipientPhone: cleanRecipient,
        dedicationMsg: effectiveDedication,
        album: selectedTrack?.album,
        year: selectedTrack?.year,
        bio: artistBioText,
      });
      const studioWhatsappUrl = `https://api.whatsapp.com/send?phone=${cleanStudioPhone}&text=${encodeURIComponent(studioMsgText)}`;

      // Save submitted state for the rich confirmation card
      setLastSubmittedDedication({
        listenerName: listenerName.trim(),
        city: city.trim() || 'Ouvinte Web',
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedicatedTo: effectiveDedicatedTo || '',
        recipientPhone: cleanRecipient || recipientPhone,
        dedication: effectiveDedication || '',
        recipientWhatsappUrl,
        studioWhatsappUrl,
        fullMessageText: recipientMsgText,
      });

      // Automated opening if configured
      if (sendToRecipientWhatsapp && cleanRecipient) {
        window.open(recipientWhatsappUrl, '_blank');
      } else if (sendToStudioWhatsapp) {
        window.open(studioWhatsappUrl, '_blank');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit song request:', err);
      // Fallback local update
      const cleanRecipient = formatCleanPhone(recipientPhone);
      const effectiveDedicatedTo = dedicatedTo.trim() || undefined;
      const effectiveDedication = dedication.trim() || undefined;

      onAddRequest({
        listenerName: listenerName.trim(),
        city: city.trim() || 'Ouvinte Web',
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedication: effectiveDedication,
        dedicatedTo: effectiveDedicatedTo,
        recipientPhone: cleanRecipient || undefined,
        artworkUrl: selectedTrack?.artworkLargeUrl || selectedTrack?.artworkUrl,
        previewUrl: selectedTrack?.previewUrl,
        artistBio: artistBioText || undefined,
      });

      const recipientMsgText = generateDedicationWhatsappText({
        recipientName: effectiveDedicatedTo || 'Amigo(a)',
        senderName: listenerName.trim(),
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedicationMsg: effectiveDedication,
      });

      setLastSubmittedDedication({
        listenerName: listenerName.trim(),
        city: city.trim() || 'Ouvinte Web',
        songTitle: resolvedTitle,
        artist: resolvedArtist,
        dedicatedTo: effectiveDedicatedTo || '',
        recipientPhone: cleanRecipient || recipientPhone,
        dedication: effectiveDedication || '',
        recipientWhatsappUrl: cleanRecipient
          ? `https://api.whatsapp.com/send?phone=${cleanRecipient}&text=${encodeURIComponent(recipientMsgText)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(recipientMsgText)}`,
        studioWhatsappUrl: `https://api.whatsapp.com/send?phone=5548991984678&text=${encodeURIComponent(recipientMsgText)}`,
        fullMessageText: recipientMsgText,
      });

      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSongTitle('');
    setArtist('');
    setDedicatedTo('');
    setRecipientPhone('');
    setDedication('');
    setSelectedTrack(null);
    setArtistBioText('');
    setSubmitted(false);
    setLastSubmittedDedication(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner com Imagem de Fundo de Estúdio de Rádio */}
      <div className="mono-card p-6 rounded-2xl relative overflow-hidden border border-white/10 shadow-2xl">
        {/* Imagem de Fundo de Estúdio de Rádio com Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none filter brightness-[0.38] saturate-[0.85] scale-105"
          style={{ backgroundImage: `url('/header-box-bg.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/65 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <Music className="w-6 h-6 text-white" />
              <span>Faça seu Pedido Musical</span>
            </h2>
            <p className="text-xs text-zinc-300 max-w-lg">
              Peça seu som favorito conectado à base global com autocompletar, prévia estendida de 1:30s e release da banda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar com Google</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full" />
                ) : (
                  <User className="w-3.5 h-3.5 text-white" />
                )}
                <span className="font-semibold text-white">{user.displayName || user.email}</span>
              </div>
            )}

            <a
              href={`https://api.whatsapp.com/send?phone=${stationConfig.whatsappNumber}&text=${encodeURIComponent(`Olá ${stationConfig.name}, gostaria de pedir uma música no ar!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5">
          <div className="mono-card p-6 rounded-2xl sticky top-28 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                <span>Enviar Novo Pedido</span>
              </h3>
            </div>

            {submitted && lastSubmittedDedication ? (
              <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-left space-y-4 shadow-2xl animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-1.5">
                      <span>Pedido Musical Registrado!</span>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Sua música e dedicatória foram salvas no banco da Rebeldia FM.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-400">Música:</span>
                    <strong className="text-white text-right">{lastSubmittedDedication.songTitle} — {lastSubmittedDedication.artist}</strong>
                  </div>
                  {lastSubmittedDedication.dedicatedTo && (
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-400">Dedicado para:</span>
                      <span className="text-amber-400 font-bold text-right flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" />
                        {lastSubmittedDedication.dedicatedTo}
                      </span>
                    </div>
                  )}
                  {lastSubmittedDedication.recipientPhone && (
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-400">WhatsApp Destinatário:</span>
                      <span className="text-emerald-400 font-mono font-bold text-right">
                        {lastSubmittedDedication.recipientPhone}
                      </span>
                    </div>
                  )}
                  {lastSubmittedDedication.dedication && (
                    <div className="pt-2 border-t border-white/5 text-zinc-300 italic">
                      "{lastSubmittedDedication.dedication}"
                    </div>
                  )}
                </div>

                {/* Bloco de 3 Links Oficiais da Rádio */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    3 Links Oficiais Incluídos na Mensagem:
                  </span>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-amber-400 font-bold font-mono text-[11px]">1️⃣</span>
                        <span className="text-zinc-300 truncate font-semibold">Ouvir Dedicatória:</span>
                      </div>
                      <a
                        href="https://www.rebeldiafm.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:text-white font-mono text-[11px] flex items-center gap-1 shrink-0 underline"
                      >
                        www.rebeldiafm.com.br
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-pink-400 font-bold font-mono text-[11px]">2️⃣</span>
                        <span className="text-zinc-300 truncate font-semibold">Curtir a Rádio:</span>
                      </div>
                      <a
                        href={instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 font-mono text-[11px] flex items-center gap-1 shrink-0 underline"
                      >
                        @{instagramUser}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-cyan-400 font-bold font-mono text-[11px]">3️⃣</span>
                        <span className="text-zinc-300 truncate font-semibold">Compartilhar Rádio:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleShareRadio}
                        className="text-cyan-300 hover:text-white font-mono text-[11px] flex items-center gap-1 shrink-0 underline cursor-pointer"
                      >
                        WhatsApp / Redes
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas de Envio */}
                <div className="space-y-2 pt-1">
                  {lastSubmittedDedication.recipientWhatsappUrl && (
                    <a
                      href={lastSubmittedDedication.recipientWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-black text-emerald-500" />
                      <span>
                        {lastSubmittedDedication.dedicatedTo 
                          ? `Enviar Dedicatória para ${lastSubmittedDedication.dedicatedTo} no WhatsApp` 
                          : 'Enviar Dedicatória no WhatsApp'}
                      </span>
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={lastSubmittedDedication.studioWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 border border-zinc-700"
                    >
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">Notificar Estúdio</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyDedicationText(lastSubmittedDedication.fullMessageText)}
                      className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer"
                    >
                      {copiedDedicationText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 truncate">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate">Copiar Mensagem</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-semibold transition border border-white/10 mt-2 cursor-pointer"
                  >
                    🎵 Fazer Outro Pedido de Música
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={listenerName}
                      onChange={(e) => setListenerName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full px-3.5 py-2.5 rounded-xl mono-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Sua Cidade / Estado
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Canoas - RS"
                      className="w-full px-3.5 py-2.5 rounded-xl mono-input text-xs"
                    />
                  </div>
                </div>

                {/* Song Title with Live Database API Autocomplete */}
                <div className="space-y-1.5" ref={searchContainerRef}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Nome da Música *
                    </label>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                      <Globe2 className="w-3 h-3 text-cyan-400" />
                      Banco Global (iTunes API)
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={songTitle}
                      onChange={(e) => handleSongTitleChange(e.target.value)}
                      onFocus={() => {
                        if (musicResults.length > 0) setShowSuggestions(true);
                      }}
                      placeholder="Ex: Tom Sawyer, Bohemian Rhapsody, Time..."
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl mono-input text-xs"
                      autoComplete="off"
                    />
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    {isSearchingMusic && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    {!isSearchingMusic && songTitle && (
                      <button
                        type="button"
                        onClick={() => {
                          setSongTitle('');
                          setArtist('');
                          setSelectedTrack(null);
                          setArtistBioText('');
                          setShowSuggestions(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Autocomplete Dropdown List */}
                    {showSuggestions && musicResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-zinc-950/95 backdrop-blur-xl border border-white/15 shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin">
                        <div className="px-3 py-1.5 bg-zinc-900/90 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10">
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Database className="w-3 h-3" />
                            Músicas Encontradas no Banco ({musicResults.length})
                          </span>
                          <span className="text-[9px] text-zinc-500 font-normal">Clique para selecionar</span>
                        </div>

                        {musicResults.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => handleSelectTrack(track)}
                            className="p-2.5 hover:bg-white/10 transition cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {track.artworkUrl ? (
                                <img
                                  src={track.artworkUrl}
                                  alt={track.title}
                                  className="w-10 h-10 rounded-lg object-cover bg-zinc-900 shrink-0 border border-white/10 shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10">
                                  <Music className="w-5 h-5 text-zinc-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition">
                                  {track.title}
                                </h5>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {track.artist}
                                  {track.year && <span className="text-zinc-500 ml-1">({track.year})</span>}
                                </p>
                                {track.album && (
                                  <p className="text-[10px] text-zinc-500 truncate">{track.album}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {track.previewUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => togglePlayAudioPreview(e, track.previewUrl)}
                                  className={`p-2 rounded-lg border transition ${
                                    previewAudioUrl === track.previewUrl && isPlayingPreview
                                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-md animate-pulse'
                                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-white/10'
                                  }`}
                                  title="Ouvir prévia estendida de 1:30s"
                                >
                                  {previewAudioUrl === track.previewUrl && isPlayingPreview ? (
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  )}
                                </button>
                              )}
                              <div className="p-1.5 text-zinc-500 group-hover:text-white transition">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Track Badge & Band Release Card */}
                {selectedTrack && (
                  <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/30 p-3.5 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedTrack.artworkUrl ? (
                          <img
                            src={selectedTrack.artworkUrl}
                            alt={selectedTrack.title}
                            className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30 shrink-0 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-cyan-900/40 flex items-center justify-center shrink-0">
                            <Disc3 className="w-6 h-6 text-cyan-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Faixa Verificada
                            </span>
                            {selectedTrack.genre && (
                              <span className="text-[9px] text-zinc-400 font-mono">
                                {selectedTrack.genre}
                              </span>
                            )}
                            {selectedTrack.year && (
                              <span className="text-[9px] text-zinc-400 font-mono">
                                • {selectedTrack.year}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-white truncate">
                            {selectedTrack.title}
                          </h5>
                          <p className="text-[11px] text-cyan-200 font-medium truncate">
                            🎤 Banda / Artista: <strong className="text-white">{selectedTrack.artist}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedTrack.previewUrl && (
                          <button
                            type="button"
                            onClick={(e) => togglePlayAudioPreview(e, selectedTrack.previewUrl)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                              previewAudioUrl === selectedTrack.previewUrl && isPlayingPreview
                                ? 'bg-cyan-400 text-black border-cyan-300 shadow-md animate-pulse'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border-cyan-500/30'
                            }`}
                            title="Tocar / Pausar prévia de 1:30s"
                          >
                            {previewAudioUrl === selectedTrack.previewUrl && isPlayingPreview ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span className="font-mono text-[10px]">{formatSeconds(previewSecondsPlayed)} / 1:30</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Ouvir 1:30s</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleClearSelectedTrack}
                          className="p-1.5 text-zinc-400 hover:text-white"
                          title="Desvincular faixa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Small Release / Bio of the Band */}
                    <div className="pt-2 border-t border-cyan-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-cyan-400" />
                          Release da Banda / Artista
                        </span>
                        {isLoadingBio && (
                          <span className="text-[9px] text-zinc-400 flex items-center gap-1 animate-pulse">
                            Carregando histórico...
                          </span>
                        )}
                      </div>

                      {artistBioText ? (
                        <p className="text-[11px] text-zinc-300 leading-relaxed italic bg-black/30 p-2.5 rounded-lg border border-white/5">
                          "{artistBioText}"
                        </p>
                      ) : isLoadingBio ? (
                        <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
                      ) : (
                        <p className="text-[10px] text-zinc-400 italic">
                          Banda selecionada com sucesso no catálogo musical da Rebeldia FM.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bloco de Engajamento: Curta e Compartilhe a Rebeldia FM */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900/60 p-3.5 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">
                        Curta & Fortaleça a Rebeldia FM
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      Rede Rebelde
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 leading-snug">
                    📸 Siga no Instagram, marque a <strong className="text-white">@{instagramUser}</strong> nos Stories quando seu som tocar e compartilhe a rádio com os amigos!
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* Botão Instagram */}
                    <a
                      href={instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/15 hover:brightness-110 active:scale-98 group cursor-pointer"
                    >
                      <Instagram className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="truncate">Siga no Instagram</span>
                    </a>

                    {/* Botão Compartilhar Rádio */}
                    <button
                      type="button"
                      onClick={handleShareRadio}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-white/10 font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 truncate">Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate">Compartilhar Rádio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bloco de Dedicatória Especial com WhatsApp e os 3 Links */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-900/80 p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Dedicar Música & Enviar no WhatsApp
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Homenagem Especial
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 leading-snug">
                    Coloque o WhatsApp de quem vai receber a homenagem! A pessoa receberá uma mensagem personalizada com os <strong className="text-amber-300">3 links oficiais</strong> da rádio para curtir ao vivo.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-400" />
                        Nome do Homenageado(A)
                      </label>
                      <input
                        type="text"
                        value={dedicatedTo}
                        onChange={(e) => setDedicatedTo(e.target.value)}
                        placeholder="Ex: Ana Clara, Meu Amor..."
                        className="w-full px-3 py-2 rounded-xl mono-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        WhatsApp do Homenageado(A)
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="Ex: (48) 99198-4678"
                        className="w-full px-3 py-2 rounded-xl mono-input text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Mensagem / Recado da Dedicatória
                    </label>
                    <textarea
                      rows={2}
                      value={dedication}
                      onChange={(e) => setDedication(e.target.value)}
                      placeholder="Escreva sua dedicatória especial para a pessoa ouvir no ar..."
                      className="w-full px-3.5 py-2 rounded-xl mono-input text-xs resize-none"
                    />
                  </div>

                  {/* Informação visual dos 3 links que a pessoa receberá */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[10px] text-zinc-400">
                    <span className="font-bold text-zinc-200 block text-[11px] mb-0.5">
                      ✨ 3 Links Oficiais que irão na mensagem do WhatsApp:
                    </span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-amber-400 font-bold">1.</span>
                      <span>Link para ouvir ao vivo: <strong className="text-white font-mono">www.rebeldiafm.com.br</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-pink-400 font-bold">2.</span>
                      <span>Link para curtir a rádio: <strong className="text-white font-mono">instagram.com/{instagramUser}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-cyan-400 font-bold">3.</span>
                      <span>Link para compartilhar a rádio com amigos</span>
                    </div>
                  </div>

                  {/* Checkbox Opções */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="recipient-whatsapp-check"
                        checked={sendToRecipientWhatsapp}
                        onChange={(e) => setSendToRecipientWhatsapp(e.target.checked)}
                        className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                      />
                      <label htmlFor="recipient-whatsapp-check" className="text-xs text-zinc-300 cursor-pointer">
                        Abrir WhatsApp para enviar a dedicatória para o homenageado
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="studio-whatsapp-check"
                        checked={sendToStudioWhatsapp}
                        onChange={(e) => setSendToStudioWhatsapp(e.target.checked)}
                        className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-white focus:ring-0 cursor-pointer accent-white"
                      />
                      <label htmlFor="studio-whatsapp-check" className="text-xs text-zinc-400 cursor-pointer">
                        Notificar também a equipe / locutor no ar no WhatsApp
                      </label>
                    </div>
                  </div>
                </div>

                {/* Indicador de destino do WhatsApp */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-emerald-500/20 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] leading-tight space-y-0.5">
                    <span className="font-bold text-zinc-200 block">
                      {currentLiveProgram ? (
                        <>🎙️ No ar: <span className="text-white font-black">{currentLiveProgram.title}</span> ({currentLiveProgram.host})</>
                      ) : (
                        <>📻 Central Geral Rebeldia FM</>
                      )}
                    </span>
                    <p className="text-zinc-400">
                      {currentLiveProgram?.whatsappNumber ? (
                        <>Pedido enviado ao WhatsApp do apresentador: <strong className="text-emerald-400 font-mono">{currentLiveProgram.whatsappNumber}</strong></>
                      ) : (
                        <>Pedido enviado ao WhatsApp padrão: <strong className="text-emerald-400 font-mono">{stationConfig.whatsappNumber || '48 99198-4678'}</strong></>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl cursor-pointer"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span className="text-center leading-tight">
                    {isSubmitting ? 'Gravando Pedido & Dedicatória...' : 'Enviar Pedido Musical e Dedicatória'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Requests Feed Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-zinc-400" />
              Pedidos dos Ouvintes ({requests.length})
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              Sincronizado com Banco SQL
            </span>
          </div>

          <div className="space-y-3">
            {requests.map((req) => {
              const effectiveArtwork = req.artworkUrl || enrichedMap[req.id]?.artworkUrl;
              const effectivePreview = req.previewUrl || enrichedMap[req.id]?.previewUrl;
              const effectiveBio = req.artistBio || enrichedMap[req.id]?.artistBio;
              const hasDedication = !!req.dedication || !!req.dedicatedTo;

              return (
                <div
                  key={req.id}
                  className="mono-card mono-card-hover p-4 sm:p-5 rounded-2xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-zinc-300 font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
                          MÚSICA
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <strong className="text-zinc-200">{req.listenerName}</strong>
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.city}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {effectiveArtwork ? (
                          <img
                            src={effectiveArtwork}
                            alt={req.songTitle}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <Music className="w-6 h-6 text-zinc-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-white truncate font-display">
                              {req.songTitle}
                            </h4>
                            {effectivePreview && (
                              <button
                                type="button"
                                onClick={(e) => togglePlayAudioPreview(e, effectivePreview)}
                                className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[10px] font-mono ${
                                  previewAudioUrl === effectivePreview && isPlayingPreview
                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md animate-pulse'
                                    : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-white/10'
                                }`}
                                title="Ouvir amostra estendida de 1:30s"
                              >
                                {previewAudioUrl === effectivePreview && isPlayingPreview ? (
                                  <>
                                    <Pause className="w-3 h-3 fill-current" />
                                    <span>{formatSeconds(previewSecondsPlayed)}</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>1:30s</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-zinc-400 truncate">
                            {req.artist}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={() => onVoteRequest(req.id)}
                        className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-white hover:text-black text-zinc-300 border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
                        title="Apoiar este pedido"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold font-mono">{req.votes}</span>
                      </button>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                        Votos
                      </span>
                    </div>
                  </div>

                  {/* Dedication Message Box with 3 Links action */}
                  {hasDedication && (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                          <Gift className="w-3.5 h-3.5" />
                          <span>
                            {req.dedicatedTo ? `Dedicado para: ${req.dedicatedTo}` : 'Dedicatória Especial'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const dedicationMsg = generateDedicationWhatsappText({
                                recipientName: req.dedicatedTo || 'Amigo(a)',
                                senderName: req.listenerName,
                                songTitle: req.songTitle,
                                artist: req.artist,
                                dedicationMsg: req.dedication,
                              });
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(dedicationMsg)}`, '_blank');
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-[10px] transition flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                            title="Enviar dedicatória no WhatsApp com os 3 links"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const dedicationMsg = generateDedicationWhatsappText({
                                recipientName: req.dedicatedTo || 'Amigo(a)',
                                senderName: req.listenerName,
                                songTitle: req.songTitle,
                                artist: req.artist,
                                dedicationMsg: req.dedication,
                              });
                              handleCopyDedicationText(dedicationMsg);
                            }}
                            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] transition flex items-center gap-1 border border-white/10 cursor-pointer"
                            title="Copiar texto da dedicatória com os 3 links"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </button>
                        </div>
                      </div>

                      {req.dedication && (
                        <p className="text-zinc-300 italic bg-black/40 p-2 rounded-lg border border-white/5">
                          "{req.dedication}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Artist Bio Release (if attached) */}
                  {effectiveBio && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-zinc-300 leading-relaxed flex items-start gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-cyan-300 block mb-0.5 text-[10px] uppercase tracking-wider">
                          Release do Artista ({req.artist})
                        </span>
                        <p className="text-zinc-400 italic">{effectiveBio}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
