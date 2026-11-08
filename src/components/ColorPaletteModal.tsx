import React, { useEffect } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  X,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
  Layers,
  Flame,
  Radio
} from 'lucide-react';
import { COLOR_PALETTES, ColorPalette } from '../utils/theme';

interface ColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPaletteId: string;
  onSelectPalette: (paletteId: string) => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({
  isOpen,
  onClose,
  currentPaletteId,
  onSelectPalette,
}) => {
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

  const currentPalette = COLOR_PALETTES.find((p) => p.id === currentPaletteId) || COLOR_PALETTES[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[10px] sm:p-[30px] bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[calc(100vh-20px)] sm:max-h-[calc(100vh-60px)] flex flex-col shadow-2xl overflow-hidden text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="px-5 sm:px-7 py-4 border-b border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-500 to-blue-500 p-0.5 shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Palette className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-display tracking-tight">
                  Paletas de Cores do Front-End
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Personalização
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Escolha o esquema cromático da rádio. Mude a qualquer momento com 1 clique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectPalette('default-rock')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition cursor-pointer"
              title="Restaurar paleta padrão"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Padrão Rock</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer border border-zinc-700/60"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Palette Summary Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Paleta em Uso Agora:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-black">
                  {currentPalette.name}
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl">
                {currentPalette.description}
              </p>
            </div>

            {/* Swatch Strip of Active Theme */}
            <div className="flex items-center gap-1 p-1.5 bg-black/60 rounded-xl border border-zinc-800 shrink-0">
              {currentPalette.colors.map((c, i) => (
                <div
                  key={i}
                  className="w-6 h-8 rounded-lg shadow-inner border border-white/20"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Grid of 5 Palettes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COLOR_PALETTES.map((palette) => {
              const isSelected = palette.id === currentPaletteId;

              return (
                <div
                  key={palette.id}
                  onClick={() => onSelectPalette(palette.id)}
                  className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-zinc-900/95 border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            palette.isDefault
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {palette.tag}
                        </span>
                        <h3 className="font-black text-white text-sm group-hover:text-amber-300 transition">
                          {palette.name}
                        </h3>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition opacity-0 group-hover:opacity-100">
                          Clique para ativar
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {palette.subtitle}
                    </p>
                  </div>

                  {/* Vertical / Horizontal Swatches Strip simulating the image source */}
                  <div className="my-2 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40">
                    <div className="flex h-14 w-full">
                      {palette.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-full flex flex-col justify-end p-1.5 transition-transform duration-200 group-hover:brightness-110 relative"
                          style={{ backgroundColor: color }}
                        >
                          <span
                            className="text-[9px] font-mono font-bold px-1 rounded bg-black/70 text-white backdrop-blur-sm truncate text-center block shadow-sm border border-white/10"
                            style={{
                              color: '#FFFFFF',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                            }}
                          >
                            {color}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Swatches Details List */}
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {palette.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-3 h-3 rounded-full border border-white/20 inline-block shadow-sm"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                      <span className="text-zinc-500 font-mono text-[10px] ml-1">
                        ({palette.colors.length} tons)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPalette(palette.id);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Selecionado</span>
                        </>
                      ) : (
                        <span>Escolher</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="px-5 sm:px-7 py-3.5 border-t border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>As cores são salvas automaticamente no seu navegador.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition cursor-pointer"
          >
            Concluir
          </button>
        </footer>
      </div>
    </div>
  );
};
