import React, { useState, useEffect } from 'react';
import { Sliders, Radio, Check, RefreshCw, X, Volume2, Palette, Sparkles, RotateCcw, Trash2, Sun, Moon, Clock } from 'lucide-react';
import { RadioStationConfig, EqualizerPreset } from '../types';
import { COLOR_PALETTES, getPaletteById, togglePaletteMode } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RadioStationConfig;
  onSaveConfig: (updated: RadioStationConfig) => void;
  equalizerPreset: EqualizerPreset;
  onChangeEqualizer: (preset: EqualizerPreset) => void;
  onReloadStream: () => void;
  currentPaletteId?: string;
  onSelectPalette?: (paletteId: string) => void;
}

const EQUALIZER_PRESETS: { id: EqualizerPreset; label: string; desc: string }[] = [
  { id: 'flat', label: 'Padrão (Flat)', desc: 'Áudio limpo e original da transmissão' },
  { id: 'bass', label: 'Mega Graves (Bass Boost)', desc: 'Reforço de frequências baixas para fones e caixas de som' },
  { id: 'rock', label: 'Rock & Guitarras', desc: 'Realce nos médios e agudos brilhantes' },
  { id: 'pop', label: 'Voz & Pop', desc: 'Destaque nos vocais dos artistas e locutores' },
  { id: 'electronic', label: 'Eletrônica & Club', desc: 'Batidas fortes e agudos cristalinos' },
  { id: 'vocal', label: 'Locução & Notícias', desc: 'Claridade máxima na voz dos apresentadores' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  equalizerPreset,
  onChangeEqualizer,
  onReloadStream,
  currentPaletteId,
  onSelectPalette,
}) => {
  const [streamUrl, setStreamUrl] = useState(config.streamUrl);
  const [metadataDelaySeconds, setMetadataDelaySeconds] = useState<number>(
    config.metadataDelaySeconds !== undefined ? config.metadataDelaySeconds : 10
  );
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSaveConfig({
      ...config,
      streamUrl,
      metadataDelaySeconds,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const currentPalette = getPaletteById(currentPaletteId || 'default-rock');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'all' | 'dark' | 'light'>(
    currentPalette.mode || 'dark'
  );

  useEffect(() => {
    setStreamUrl(config.streamUrl);
    setMetadataDelaySeconds(config.metadataDelaySeconds !== undefined ? config.metadataDelaySeconds : 10);
  }, [config.streamUrl, config.metadataDelaySeconds]);

  // Keep filter aligned if current palette mode changes externally
  useEffect(() => {
    if (selectedModeFilter !== 'all' && currentPalette.mode !== selectedModeFilter) {
      setSelectedModeFilter(currentPalette.mode);
    }
  }, [currentPalette.mode]);

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

  if (!isOpen) return null;

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // 2. Clear Cache Storage API
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
      // 3. Clear session storage
      sessionStorage.clear();

      setCacheClearedSuccess(true);
      // 4. Force hard reload bypassing cache with timestamp
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('nocache', Date.now().toString());
        window.location.href = url.toString();
      }, 750);
    } catch (err) {
      console.error('Falha ao limpar cache:', err);
      window.location.reload();
    }
  };

  const selectAlternative = (url: string) => {
    setStreamUrl(url);
    onSaveConfig({
      ...config,
      streamUrl: url,
    });
    onReloadStream();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/15 rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-zinc-200 max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
            title="Salvar configurações"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Salvo!' : 'Salvar'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-zinc-300 hover:text-white rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/20 transition cursor-pointer shadow-lg active:scale-95"
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 relative z-10 pr-28 sm:pr-32">
          <div className="w-11 h-11 rounded-2xl bg-white/10 text-white border border-white/10 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-white font-display">Configurações & Áudio HD</h2>
            <p className="text-xs text-zinc-400">Equalizador de áudio e conexões do servidor</p>
          </div>
        </div>

        {/* Section 1: Equalizer */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-white" />
              Equalizador Digital de Áudio
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {EQUALIZER_PRESETS.map((preset) => {
              const isSelected = equalizerPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onChangeEqualizer(preset.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-full cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/20 font-bold'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-1.5">
                    <span className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-zinc-200'}`}>
                      {preset.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />}
                  </div>
                  <p className={`text-[10px] mt-1 line-clamp-2 ${isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-500'}`}>
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Sincronia de Música & Retardo do Título (Compensação de Buffer) */}
        <div className="mb-6 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Sincronia da Faixa & Retardo do Título
            </h3>
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

        {/* Section: Color Palette Themes */}
        {onSelectPalette && (
          <div className="mb-6 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-white" />
                  Tema & Paleta de Cores do Front-End
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Escolha entre os modos Claro e Escuro com os tons originais da Rebeldia FM
                </p>
              </div>

              {/* Seletor Segmentado Claro / Escuro */}
              <div className="inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 self-start sm:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModeFilter('dark');
                    if (currentPalette.mode === 'light' && onSelectPalette) {
                      onSelectPalette(togglePaletteMode(currentPalette.id, 'dark'));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedModeFilter === 'dark' || (selectedModeFilter === 'all' && currentPalette.mode === 'dark')
                      ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700 font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Ativar Modo Escuro"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Escuro</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModeFilter('light');
                    if (currentPalette.mode === 'dark' && onSelectPalette) {
                      onSelectPalette(togglePaletteMode(currentPalette.id, 'light'));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedModeFilter === 'light' || (selectedModeFilter === 'all' && currentPalette.mode === 'light')
                      ? 'bg-amber-400 text-black shadow-sm font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Ativar Modo Claro"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Claro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModeFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    selectedModeFilter === 'all'
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Mostrar todas as paletas claras e escuras"
                >
                  Todos ({COLOR_PALETTES.length})
                </button>
              </div>
            </div>

            {/* Grid de Paletas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {COLOR_PALETTES.filter((p) => selectedModeFilter === 'all' || p.mode === selectedModeFilter).map((palette) => {
                const isSelected = currentPaletteId === palette.id;
                const isLight = palette.mode === 'light';

                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => onSelectPalette(palette.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/60 shadow-lg text-zinc-100'
                          : 'bg-zinc-900 border-amber-400 ring-2 ring-amber-400/60 shadow-lg text-white'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold truncate pr-2 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          {isLight ? (
                            <Sun className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          ) : (
                            <Moon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          )}
                          <span className="truncate">{palette.name}</span>
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-amber-400 text-black flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-zinc-400 truncate mb-2">
                        {palette.subtitle}
                      </p>
                    </div>

                    <div>
                      {/* Mini Swatches Strip */}
                      <div className="flex h-4 w-full rounded-md overflow-hidden border border-white/15 mb-1.5 shadow-inner">
                        {palette.colors.map((c, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full transition-transform hover:scale-110"
                            style={{ backgroundColor: c }}
                            title={`${palette.colorNames[i] || c} (${c})`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isLight
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {isLight ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
                        </span>
                        <span className="text-zinc-500 text-[10px] truncate max-w-[110px]">
                          {palette.tag.replace(/^☀️\s*|^🌙\s*/, '')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Alternative Streaming Links (Servidores Rápidos) */}
        <div className="mb-6 space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-white" />
            Servidores de Streaming (Portas Rápidas)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {config.alternativeStreams?.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => selectAlternative(alt.url)}
                className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                  streamUrl === alt.url
                    ? 'bg-zinc-800 border-amber-400 text-white font-bold ring-1 ring-amber-400/50'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-white/10 text-zinc-400'
                }`}
              >
                <div className="font-mono flex items-center justify-between">
                  <span>{alt.label}</span>
                  {streamUrl === alt.url && <Check className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{alt.url}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Ferramenta de Limpeza de Cache (Desenvolvimento) */}
        <div className="mb-6 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">Limpeza de Cache (Desenvolvimento)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">PWA / Browser</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Elimina versões antigas em cache, desregistra Service Workers obsoletos do PWA e força o recarregamento imediato dos arquivos e dados mais recentes da emissora.
          </p>
          <button
            type="button"
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isClearingCache ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Limpando Caches e Recarregando...</span>
              </>
            ) : cacheClearedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Cache Limpo com Sucesso! Recarregando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Cache & Forçar Recarregamento</span>
              </>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onReloadStream}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Testar Conexão de Áudio</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
            title="Salvar configurações"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
