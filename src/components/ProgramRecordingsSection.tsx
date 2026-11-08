import React, { useState, useEffect } from 'react';
import {
  Radio,
  Disc,
  Play,
  Heart,
  Share2,
  ExternalLink,
  Clock,
  Calendar,
  RotateCw,
  Check,
  Headphones,
  Sparkles,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { ProgramItem } from '../types';
import {
  MixcloudRecording,
  resolveMixcloudUserOrQuery,
  fetchMixcloudRecordings,
  formatDuration,
  formatDate,
  getLocalLikeStatus,
  toggleLocalLike
} from '../utils/mixcloud';

interface ProgramRecordingsSectionProps {
  program: ProgramItem;
  onNavigateToTab?: (tab: 'requests' | 'mural') => void;
}

export const ProgramRecordingsSection: React.FC<ProgramRecordingsSectionProps> = ({
  program,
  onNavigateToTab,
}) => {
  const [recordings, setRecordings] = useState<MixcloudRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceLabel, setSourceLabel] = useState('');
  const [activePlayerKey, setActivePlayerKey] = useState<string | null>(null);
  const [likesState, setLikesState] = useState<Record<string, { liked: boolean; bonus: number }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const target = resolveMixcloudUserOrQuery(program);
      const res = await fetchMixcloudRecordings(target, 5);
      setRecordings(res.recordings);
      setSourceLabel(res.sourceInfo);

      // Carregar curtidas salvas no localStorage
      const initialLikes: Record<string, { liked: boolean; bonus: number }> = {};
      res.recordings.forEach((rec) => {
        const local = getLocalLikeStatus(rec.key);
        initialLikes[rec.key] = {
          liked: local.liked,
          bonus: local.customCountBonus,
        };
      });
      setLikesState(initialLikes);

      // Auto-selecionar o mais recente para facilitar o play, se houver gravações
      if (res.recordings.length > 0 && !activePlayerKey) {
        setActivePlayerKey(res.recordings[0].key);
      }
    } catch (err) {
      console.error('Erro ao carregar gravações do Mixcloud:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [program.id, program.title, program.host, program.mixcloudUser, program.mixcloudUrl]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleLike = (rec: MixcloudRecording) => {
    const updated = toggleLocalLike(rec.key);
    setLikesState((prev) => ({
      ...prev,
      [rec.key]: {
        liked: updated.liked,
        bonus: updated.customCountBonus,
      },
    }));

    if (updated.liked) {
      showToast(`Você curtiu "${rec.name}"!`);
    } else {
      showToast('Curtida removida.');
    }
  };

  const handleShare = async (rec: MixcloudRecording) => {
    const shareTitle = `${rec.name} - ${program.title} | Rebeldia FM`;
    const shareText = `Ouça o programa gravado "${rec.name}" da rádio Rebeldia FM no Mixcloud!`;
    const shareUrl = rec.url;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        showToast('Compartilhado com sucesso!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copiar para a área de transferência
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedKey(rec.key);
      showToast('Link da gravação copiado para a área de transferência!');
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showToast('Não foi possível copiar o link.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Disc className="w-4 h-4 animate-spin-slow" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-display">
              Programas Gravados
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              mixcloud.com
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Últimas 5 edições completas transmitidas na rádio para ouvir na íntegra, curtir e compartilhar
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {sourceLabel && (
            <span className="text-[11px] font-mono text-zinc-500 hidden md:inline-block">
              {sourceLabel}
            </span>
          )}
          <button
            onClick={loadRecordings}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Atualizar lista de gravações"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Player Embutido em Destaque do Mixcloud (se houver gravação selecionada) */}
      {activePlayerKey && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Tocador Mixcloud Oficial</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Controles nativos do Mixcloud
            </span>
          </div>

          <div className="rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
            <iframe
              title="Player Mixcloud Oficial"
              width="100%"
              height="120"
              src={`https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(
                activePlayerKey
              )}&hide_cover=1&light=0&autoplay=1`}
              className="w-full border-0 block"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-xl bg-zinc-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-48" />
                  <div className="h-3 bg-zinc-800/60 rounded w-32" />
                </div>
              </div>
              <div className="h-8 bg-zinc-800/80 rounded-xl w-36 self-end sm:self-center" />
            </div>
          ))}
        </div>
      )}

      {/* Lista das Últimas 5 Gravações */}
      {!loading && recordings.length > 0 && (
        <div className="space-y-3">
          {recordings.map((rec, index) => {
            const isPlayingThis = activePlayerKey === rec.key;
            const likeInfo = likesState[rec.key] || { liked: false, bonus: 0 };
            const totalLikes = (rec.favorite_count || 0) + (likeInfo.bonus || 0);

            return (
              <div
                key={rec.key || index}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group ${
                  isPlayingThis
                    ? 'bg-zinc-900/90 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Info Esquerda: Capa, Título, Metadados */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Botão / Capa com overlay de Play */}
                    <div
                      onClick={() => setActivePlayerKey(rec.key)}
                      className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 group/thumb cursor-pointer shadow-md"
                      title="Clique para tocar esta gravação"
                    >
                      <img
                        src={rec.picture}
                        alt={rec.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition ${
                          isPlayingThis
                            ? 'bg-black/60'
                            : 'bg-black/40 group-hover/thumb:bg-black/60'
                        }`}
                      >
                        {isPlayingThis ? (
                          <Volume2 className="w-6 h-6 text-amber-400 animate-pulse" />
                        ) : (
                          <Play className="w-6 h-6 text-white group-hover/thumb:scale-110 transition fill-white" />
                        )}
                      </div>
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-black/80 text-white border border-white/10">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Texto e Metadados */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {rec.created_time && (
                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            {formatDate(rec.created_time)}
                          </span>
                        )}
                        {rec.audio_length > 0 && (
                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {formatDuration(rec.audio_length)}
                          </span>
                        )}
                        {rec.play_count > 0 && (
                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            <Headphones className="w-3 h-3 text-zinc-500" />
                            {rec.play_count} plays
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => setActivePlayerKey(rec.key)}
                        className={`text-xs sm:text-sm font-bold truncate cursor-pointer transition ${
                          isPlayingThis ? 'text-amber-300' : 'text-white hover:text-amber-300'
                        }`}
                        title={rec.name}
                      >
                        {rec.name}
                      </h4>

                      {/* Tags do Mixcloud */}
                      {rec.tags && rec.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {rec.tags.slice(0, 3).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-white/5 text-zinc-400 border border-white/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações Direita: Ouvir, Curtir, Compartilhar, Mixcloud */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0 justify-end">
                    {/* Botão Play / Ouvir */}
                    <button
                      onClick={() => setActivePlayerKey(rec.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                        isPlayingThis
                          ? 'bg-amber-500 text-black shadow-amber-500/20'
                          : 'bg-white hover:bg-zinc-200 text-black'
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          <span>Tocando</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>Ouvir</span>
                        </>
                      )}
                    </button>

                    {/* Botão Curtir */}
                    <button
                      onClick={() => handleLike(rec)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        likeInfo.liked
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                      title={likeInfo.liked ? 'Descurtir' : 'Curtir gravação'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition ${
                          likeInfo.liked ? 'fill-red-500 text-red-500 scale-110' : 'text-zinc-400'
                        }`}
                      />
                      <span className="font-mono text-[11px]">{totalLikes}</span>
                    </button>

                    {/* Botão Compartilhar */}
                    <button
                      onClick={() => handleShare(rec)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                        copiedKey === rec.key
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                      title="Compartilhar gravação"
                    >
                      {copiedKey === rec.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Link direto Mixcloud.com */}
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Abrir página no Mixcloud.com"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Caso vazio: Nenhuma gravação encontrada */}
      {!loading && recordings.length === 0 && (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-zinc-500 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-white">
              Nenhuma gravação encontrada no Mixcloud para este programa
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              As transmissões e podcasts deste programa são arquivados no Mixcloud oficial da rádio.
              Você também pode buscar diretamente ou ouvir a programação ao vivo.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <a
              href={`https://www.mixcloud.com/search/?q=${encodeURIComponent(program.title)}&type=cloudcast`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <span>Pesquisar no Mixcloud</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Box de Interação: Pedido Musical */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-2">
        <p className="text-xs text-zinc-400">
          Gostou do programa? Peça sua música favorita ou mande um recado para as próximas edições:
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('requests')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Pedir Música para o Próximo Programa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
