import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link2,
  Trash2,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Disc,
  LayoutTemplate,
  Layers,
  Monitor,
  Globe,
  Type,
} from 'lucide-react';
import { StationLogosConfig } from '../types';
import {
  getStationLogos,
  saveStationLogos,
  DEFAULT_STATION_LOGOS,
  applyDynamicFavicon,
  applyDynamicWindowsTile,
} from '../utils/logo';
import { RebeldiaLogo } from './RebeldiaLogo';

interface LogoUploaderProps {
  onLogoChange?: (logos: StationLogosConfig) => void;
  className?: string;
}

type SlotKey = keyof Omit<StationLogosConfig, 'headerComplementText'>;

interface SlotDefinition {
  key: SlotKey;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  recommendation: string;
  icon: React.ReactNode;
}

const SLOTS: SlotDefinition[] = [
  {
    key: 'headerLogo',
    title: '1. Logotipo Acima do Menu & Cabeçalho',
    badge: 'Topo / Menu',
    badgeColor: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
    description: 'Logotipo exibido no topo do site, logo acima dos botões de menu e navegação principal.',
    recommendation: 'Formato horizontal ou mascote vetorial (PNG transparente ou SVG, altura máx. 80px).',
    icon: <LayoutTemplate className="w-4 h-4 text-amber-400" />,
  },
  {
    key: 'playerCenterLogo',
    title: '2. Logotipo Central do Círculo do Player (Somente o Maior)',
    badge: 'Player Hero Central',
    badgeColor: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400',
    description: 'Exibido exclusivamente no centro do disco giratório (vinil / spindle) do reprodutor principal no topo da tela.',
    recommendation: 'Formato circular ou quadrado centralizado (PNG transparente ou JPG 250x250).',
    icon: <Disc className="w-4 h-4 text-emerald-400" />,
  },
  {
    key: 'footerLogo',
    title: '3. Logotipo para o Rodapé',
    badge: 'Rodapé Oficial',
    badgeColor: 'bg-sky-400/10 border-sky-400/30 text-sky-400',
    description: 'Logotipo exibido na base da página junto aos direitos autorais e links institucionais.',
    recommendation: 'Versão monocromática ou colorida reduzida para fundo escuro (PNG transparente).',
    icon: <Layers className="w-4 h-4 text-sky-400" />,
  },
  {
    key: 'windowsTaskbarIcon',
    title: '4. Ícone para Barra de Link Inferior do Windows (Atalho / PWA)',
    badge: 'Windows & Barra de Tarefas',
    badgeColor: 'bg-blue-400/10 border-blue-400/30 text-blue-400',
    description: 'Ícone utilizado para a barra de links inferior do Windows, atalhos fixados na barra de tarefas e aplicativo web (PWA).',
    recommendation: 'Ícone quadrado em alta definição (PNG ou ICO de 192x192 ou 512x512 pixels).',
    icon: <Monitor className="w-4 h-4 text-blue-400" />,
  },
  {
    key: 'faviconIcon',
    title: '5. Ícone Favicon (Fiveicon da Aba do Navegador)',
    badge: 'Aba do Navegador',
    badgeColor: 'bg-purple-400/10 border-purple-400/30 text-purple-400',
    description: 'Ícone exibido diretamente na aba do navegador (Chrome, Edge, Firefox, Safari) e marcadores.',
    recommendation: 'Ícone quadrado compacto e nítido (PNG, ICO ou SVG de 32x32 ou 64x64 pixels).',
    icon: <Globe className="w-4 h-4 text-purple-400" />,
  },
];

export const LogoUploader: React.FC<LogoUploaderProps> = ({ onLogoChange, className = '' }) => {
  const [logos, setLogos] = useState<StationLogosConfig>(getStationLogos);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [complementTextInput, setComplementTextInput] = useState<string>(
    () => logos.headerComplementText ?? 'Florianópolis / SC • 87.9 MHz'
  );
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const handleLogosUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StationLogosConfig>;
      if (customEvent.detail) {
        setLogos(customEvent.detail);
        if (customEvent.detail.headerComplementText !== undefined) {
          setComplementTextInput(customEvent.detail.headerComplementText || '');
        }
      }
    };

    window.addEventListener('rebeldia_logos_updated', handleLogosUpdate);
    return () => window.removeEventListener('rebeldia_logos_updated', handleLogosUpdate);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const updateSingleLogo = (key: SlotKey, value: string | null) => {
    const updated = {
      ...logos,
      [key]: value,
      headerComplementText: complementTextInput,
    };
    setLogos(updated);
    saveStationLogos(updated);
    onLogoChange?.(updated);
  };

  const handleFileUpload = (slotKey: SlotKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      showFeedback('Por favor selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP ou ICO).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingSlot(slotKey);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateSingleLogo(slotKey, dataUrl);
        showFeedback(`Logotipo de "${slotKey}" carregado com sucesso!`);
      }
      setUploadingSlot(null);
    };
    reader.onerror = () => {
      showFeedback('Erro ao ler arquivo de imagem.');
      setUploadingSlot(null);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (slotKey: SlotKey) => {
    const url = urlInputs[slotKey]?.trim();
    if (!url) return;

    updateSingleLogo(slotKey, url);
    setUrlInputs((prev) => ({ ...prev, [slotKey]: '' }));
    showFeedback(`Logotipo de "${slotKey}" atualizado via link!`);
  };

  const handleResetSlot = (slotKey: SlotKey) => {
    const defaultValue = DEFAULT_STATION_LOGOS[slotKey] || '/reb_mascot.jpg';
    updateSingleLogo(slotKey, defaultValue);
    showFeedback(`Logotipo restaurado para o padrão original.`);
  };

  const handleSaveComplementText = () => {
    const updated = {
      ...logos,
      headerComplementText: complementTextInput.trim(),
    };
    setLogos(updated);
    saveStationLogos(updated);
    onLogoChange?.(updated);
    showFeedback('Texto complementar do logotipo do cabeçalho salvo com sucesso!');
  };

  const handleResetAllToDefault = () => {
    setLogos(DEFAULT_STATION_LOGOS);
    setComplementTextInput(DEFAULT_STATION_LOGOS.headerComplementText || '');
    saveStationLogos(DEFAULT_STATION_LOGOS);
    onLogoChange?.(DEFAULT_STATION_LOGOS);
    showFeedback('Todos os 5 logotipos e o texto complementar foram restaurados para os padrões de fábrica!');
  };

  return (
    <div className={`p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 shadow-xl ${className}`}>
      {/* Header Central de Gestão Multi-Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white font-display uppercase tracking-wider">
                Central de Logotipos & Identidade Visual
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/10 border border-amber-400/30 text-amber-400">
                5 Posições Exclusivas
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Campos dedicados e independentes para cada área: Cabeçalho, Círculo Maior do Player, Rodapé, Barra do Windows e Favicon.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetAllToDefault}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          title="Restaurar todos os 5 logotipos e texto para os padrões"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Restaurar Todos os Padrões</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Grid com os 5 Campos Dedicados (Um campo para cada um) */}
      <div className="space-y-6">
        {SLOTS.map((slot) => {
          const currentVal = logos[slot.key] || DEFAULT_STATION_LOGOS[slot.key] || '/reb_mascot.jpg';
          const isCustom = logos[slot.key] && logos[slot.key] !== DEFAULT_STATION_LOGOS[slot.key];
          const isSlotUploading = uploadingSlot === slot.key;

          return (
            <div
              key={slot.key}
              className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition space-y-4"
            >
              {/* Título & Descrição do Slot */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                      {slot.icon}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      {slot.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${slot.badgeColor}`}>
                      {slot.badge}
                    </span>
                    {isCustom && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {slot.description}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    💡 {slot.recommendation}
                  </p>
                </div>

                {/* Botão Restaurar Slot */}
                <button
                  type="button"
                  onClick={() => handleResetSlot(slot.key)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title={`Restaurar ${slot.title} para o padrão`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>
              </div>

              {/* Área de Preview Visual do Slot */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Preview Específico por tipo */}
                  {slot.key === 'headerLogo' && (
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                      <img
                        src={currentVal}
                        alt="Preview Cabeçalho"
                        className="h-10 w-auto max-w-[140px] object-contain rounded"
                      />
                      {complementTextInput && (
                        <div className="pl-3 border-l border-zinc-800 text-left">
                          <span className="text-[10px] font-mono text-zinc-500 block uppercase">Texto ao lado:</span>
                          <span className="text-xs text-zinc-300 font-bold">{complementTextInput}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {slot.key === 'playerCenterLogo' && (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-700/80 flex items-center justify-center p-1 relative shadow-inner">
                        <img
                          src={currentVal}
                          alt="Preview Centro do Player"
                          className="w-full h-full rounded-full object-cover"
                        />
                        <div className="absolute w-5 h-5 rounded-full bg-zinc-950 border border-zinc-500 flex items-center justify-center">
                          <span className="w-1 h-1 rounded-full bg-amber-400" />
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        Centro do Vinil (Player Maior)
                      </span>
                    </div>
                  )}

                  {slot.key === 'footerLogo' && (
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-1.5 min-w-[140px]">
                      <img
                        src={currentVal}
                        alt="Preview Rodapé"
                        className="h-7 w-auto object-contain"
                      />
                      <span className="text-[9px] text-zinc-500 font-mono">Visualização Rodapé</span>
                    </div>
                  )}

                  {slot.key === 'windowsTaskbarIcon' && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-zinc-950 border border-blue-500/30 flex items-center justify-center shadow-lg">
                        <img
                          src={currentVal}
                          alt="Preview Barra Windows"
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                      </div>
                      <div className="text-left text-[11px] font-mono text-zinc-400">
                        <strong className="text-white block">Rebeldia FM</strong>
                        <span className="text-[10px] text-blue-400">Atalho na Barra do Windows / PWA</span>
                      </div>
                    </div>
                  )}

                  {slot.key === 'faviconIcon' && (
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-t-lg bg-zinc-800 border-t border-x border-zinc-700 flex items-center gap-2 shadow">
                        <img
                          src={currentVal}
                          alt="Preview Favicon"
                          className="w-4 h-4 object-contain rounded"
                        />
                        <span className="text-xs text-zinc-200 font-medium">Rebeldia FM - Rádio Web</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Aba do Navegador (Favicon)
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-zinc-400 text-right truncate max-w-[200px]">
                  {currentVal.startsWith('data:') ? 'Imagem carregada (Base64)' : currentVal}
                </span>
              </div>

              {/* Campo especial: Texto Complementar exclusivo do Cabeçalho */}
              {slot.key === 'headerLogo' && (
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-400/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-amber-400" />
                      <span>Texto Complementar do Cabeçalho (Ao lado do Logotipo)</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Exibido no Topo</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Florianópolis / SC • 87.9 MHz"
                      value={complementTextInput}
                      onChange={(e) => setComplementTextInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveComplementText}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition cursor-pointer shadow"
                    >
                      Salvar Texto
                    </button>
                  </div>
                </div>
              )}

              {/* Controles de Upload de Arquivo & URL para este Slot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                {/* 1. Upload de Arquivo Direto */}
                <div>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot.key] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon"
                    onChange={(e) => handleFileUpload(slot.key, e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                    disabled={isSlotUploading}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSlotUploading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isSlotUploading ? 'Enviando Imagem...' : `Upload de Arquivo (${slot.badge})`}</span>
                  </button>
                </div>

                {/* 2. Inserção por URL Direta */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem.png"
                      value={urlInputs[slot.key] || ''}
                      onChange={(e) =>
                        setUrlInputs({ ...urlInputs, [slot.key]: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-white"
                    />
                    <Link2 className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyUrl(slot.key)}
                    disabled={!urlInputs[slot.key]?.trim()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer disabled:opacity-40"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
