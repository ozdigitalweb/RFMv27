import React, { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  ArrowLeft,
  X,
  Radio,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';
import { CardBackgroundVisualizer } from './Visualizer';

interface MusicModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  isBuffering: boolean;
  onTogglePlay: () => void;
  onReload: () => void;
  songTitle: string;
  artist?: string;
  artworkUrl?: string;
  programTitle?: string;
  host?: string;
  volume?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const MusicModeModal: React.FC<MusicModeModalProps> = ({
  isOpen,
  onClose,
  isPlaying,
  isBuffering,
  onTogglePlay,
  onReload,
  songTitle,
  artist,
  artworkUrl,
  programTitle,
  host,
  volume = 0.85,
  isMuted = false,
  onToggleMute,
}) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  // Trava scroll da página de fundo e escuta ESC
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isOpen, onClose]);

  // Alterna fullscreen nativo apenas através de clique explícito do usuário (gesture válido)
  const toggleNativeFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignora restrições de iframe
    }
  }, []);

  // Temporizador para esconder suavemente o cursor e controles secundários se o mouse parar
  useEffect(() => {
    if (!isOpen) return;

    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible((prev) => (prev ? prev : true));
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 5000);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displaySong = songTitle || 'Rebeldia FM';
  const displayArtist = artist || (programTitle ? `Programa: ${programTitle}` : 'Ao Vivo');

  return (
    <div
      className="fixed inset-0 z-[100] w-full h-full overflow-hidden select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-bg-base, #09090B)', color: 'var(--color-text-main, #F4F4F5)' }}
    >
      {/* Monochromatic Subtle Studio Lighting Vignette exatamente no padrão de cor do site */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[140px] opacity-35 transition-colors duration-500"
          style={{ backgroundColor: 'var(--color-primary, #F59E0B)' }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[120px] opacity-25 transition-colors duration-500"
          style={{ backgroundColor: 'var(--color-secondary, #EF4444)' }}
        />
      </div>

      {/* Visualizador de Linhas Onduladas em Toda a Tela */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <CardBackgroundVisualizer
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          mode="wave"
          volume={volume}
          isMuted={isMuted}
          className="rounded-none opacity-90 sm:opacity-95"
        />
        {/* Vinheta atmosférica suave nas bordas para profundidade cinematográfica */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(9,9,11,0.85)_100%)] pointer-events-none" />
      </div>

      {/* Barra Superior Absoluta: Título "MODO MÚSICA", Botão Fullscreen e Botão "Voltar/Fechar" */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 px-5 sm:px-10 py-5 sm:py-7 flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
          controlsVisible ? 'opacity-100' : 'opacity-30 hover:opacity-100'
        }`}
      >
        {/* Identificação do Modo */}
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-md"
            style={{
              backgroundColor: 'var(--color-primary, #F59E0B)',
              boxShadow: '0 0 12px var(--color-glow, rgba(245,158,11,0.5))',
            }}
          />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white/90 font-mono">
            MODO MÚSICA
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Tela Cheia Nativa (Opcional do Navegador) */}
          <button
            onClick={toggleNativeFullscreen}
            className="p-2 sm:p-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-xl border border-white/15 hover:border-amber-400/40 transition-all shadow-xl active:scale-95 cursor-pointer"
            title={isNativeFullscreen ? 'Sair da Tela Cheia Nativa' : 'Expandir para Tela Cheia Nativa'}
          >
            {isNativeFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
            )}
          </button>

          {/* Botão de Voltar / Fechar */}
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-white/90 hover:text-white backdrop-blur-xl border border-white/15 hover:border-amber-400/40 transition-all shadow-2xl active:scale-95 cursor-pointer"
            title="Voltar / Fechar Modo Música (ESC)"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs sm:text-sm font-bold tracking-wide">Voltar</span>
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 group-hover:text-white transition-colors ml-0.5" />
          </button>
        </div>
      </header>

      {/* Centro Estável e Perfeitamente Alinhado: Nome da Música & Controles */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-4 sm:px-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 pointer-events-auto">
        {/* Nome da Música & Artista */}
        <div className="space-y-2.5 sm:space-y-3 px-2 max-w-3xl shrink-0">
          <h1
            className="text-2xl sm:text-4xl md:text-6xl font-black text-white font-display tracking-tight leading-tight drop-shadow-[0_6px_30px_rgba(0,0,0,0.9)] line-clamp-2"
            title={displaySong}
          >
            {displaySong}
          </h1>

          {/* Nome do Artista com padrão de cor do site */}
          {displayArtist && (
            <p className="text-base sm:text-xl md:text-2xl font-bold tracking-wide drop-shadow-lg line-clamp-1">
              <span className="text-zinc-400 font-normal text-xs sm:text-base">Artista: </span>
              <span className="font-bold text-amber-400" style={{ color: 'var(--color-primary, #F59E0B)' }}>
                {displayArtist}
              </span>
            </p>
          )}

          {/* Programa no Ar (se aplicável) */}
          {programTitle && artist && (
            <p className="text-xs sm:text-sm font-medium text-zinc-400 pt-0.5">
              Programa: <span className="text-zinc-200 font-semibold">{programTitle}</span>
              {host && <span> • Apresentação: <span className="text-zinc-200 font-semibold">{host}</span></span>}
            </p>
          )}
        </div>

        {/* Botões do Player: Recarregar, Disco com Capa e Mutar */}
        <div className="pt-2 sm:pt-4 flex items-center justify-center gap-5 sm:gap-8 shrink-0">
          {/* Botão Recarregar / Reconectar Stream */}
          <button
            onClick={onReload}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 hover:border-amber-400/40 text-zinc-300 hover:text-white transition-all transform active:scale-95 backdrop-blur-xl shadow-xl flex items-center justify-center cursor-pointer shrink-0"
            title="Recarregar streaming ao vivo"
          >
            <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${isBuffering ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Botão do Player: Disco com a Capa do Álbum da Música no Ar */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Anel de brilho pulsante quando ativo */}
            {isPlaying && (
              <div className="absolute -inset-2.5 sm:-inset-3 rounded-full pointer-events-none border border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.35)] animate-pulse will-change-transform" />
            )}

            <button
              onClick={onTogglePlay}
              className={`group relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full flex items-center justify-center cursor-pointer p-1.5 sm:p-2 vinyl-grooves shadow-2xl border-2 shrink-0 select-none outline-none transition-colors duration-200 ${
                isPlaying
                  ? 'border-amber-400/80 ring-2 ring-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                  : 'border-zinc-700/80 hover:border-amber-400/60 shadow-[0_0_30px_rgba(0,0,0,0.85)]'
              }`}
              aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir rádio'}
              title={isPlaying ? 'Pausar reprodução' : 'Tocar rádio ao vivo'}
            >
              {/* Círculo Interno com a Imagem da Capa do Disco */}
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-black/80 shadow-inner pointer-events-none">
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt={displaySong}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover select-none pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center p-4 pointer-events-none">
                    <Radio className="w-12 h-12 text-amber-400 drop-shadow" />
                  </div>
                )}

                {/* Overlay translúcido suave sobre a capa para contraste */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-200 pointer-events-none" />

                {/* Pino central do disco / Botão de Play/Pause integrado */}
                <div className="absolute w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-zinc-950/90 backdrop-blur-md border border-white/30 group-hover:border-amber-400 flex items-center justify-center text-white shadow-2xl transition-all duration-200 group-hover:scale-105 pointer-events-none">
                  {isBuffering ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-white text-white drop-shadow" />
                  ) : (
                    <Play className="w-6 h-6 fill-white text-white ml-0.5 drop-shadow" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Botão Mudo / Desmutar Rápido */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 hover:border-amber-400/40 text-zinc-300 hover:text-white transition-all transform active:scale-95 backdrop-blur-xl shadow-xl flex items-center justify-center cursor-pointer shrink-0"
              title={isMuted || volume === 0 ? 'Desmutar áudio' : 'Mutar áudio'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              ) : (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          )}
        </div>
      </main>

      {/* Rodapé Absoluto Discreto com Instrução de Atalho */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-20 px-5 py-4 text-center text-[11px] sm:text-xs text-zinc-500 font-mono transition-opacity duration-300 pointer-events-none ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span>Dica: Pressione <strong className="text-zinc-300">ESC</strong> ou o botão <strong className="text-zinc-300">Voltar</strong> para sair do Modo Música</span>
      </footer>
    </div>
  );
};
