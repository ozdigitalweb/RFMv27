import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Radio,
  Users,
  Cpu,
  Mail,
  Phone,
  Instagram,
  MapPin,
  Headphones,
  Sparkles,
  Disc,
  Mic2,
  Calendar,
  MessageSquare,
  Music,
  Sliders,
  Send,
  Download,
  Activity,
  Volume2,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  ExternalLink,
  Check,
  Copy,
  Layers,
  Clock,
  Zap,
  Globe
} from 'lucide-react';
import { InstitutionalData } from '../data/institutional';
import { downloadBrandManifestoFile } from '../utils/downloadManifesto';
import { ProgramItem } from '../types';
import { INITIAL_PROGRAMS } from '../data/initialData';

interface InstitutionalViewProps {
  data: InstitutionalData;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onOpenRequests?: () => void;
  onOpenSchedule?: () => void;
  onOpenMural?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  programs?: ProgramItem[];
  onSelectProgram?: (program: ProgramItem) => void;
}

type InstitutionalSectionTab = 'all' | 'manifesto' | 'pillars' | 'team' | 'history' | 'bands' | 'contact';

export const InstitutionalView: React.FC<InstitutionalViewProps> = ({
  data,
  isPlaying,
  onTogglePlay,
  onOpenRequests,
  onOpenSchedule,
  onOpenMural,
  onOpenAdmin,
  onOpenSettings,
  programs,
  onSelectProgram,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InstitutionalSectionTab>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lista de programas ativos para o banner randômico
  const activePrograms = useMemo(() => {
    const list = programs && programs.length > 0 ? programs : INITIAL_PROGRAMS;
    return list.filter((p) => p.isActive !== false);
  }, [programs]);

  // Inicia com um índice randômico entre os programas disponíveis
  const [currentProgIndex, setCurrentProgIndex] = useState(() => {
    const total = activePrograms.length;
    return total > 0 ? Math.floor(Math.random() * total) : 0;
  });

  const [isBannerPaused, setIsBannerPaused] = useState(false);

  // Rotação randômica automática a cada 6 segundos (pausa quando o usuário coloca o mouse sobre o banner)
  useEffect(() => {
    if (activePrograms.length <= 1 || isBannerPaused) return;

    const timer = setInterval(() => {
      setCurrentProgIndex((prev) => {
        if (activePrograms.length <= 1) return 0;
        let next = Math.floor(Math.random() * activePrograms.length);
        if (next === prev) {
          next = (prev + 1) % activePrograms.length;
        }
        return next;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [activePrograms.length, isBannerPaused]);

  const handleNextProgram = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentProgIndex((prev) => (prev + 1) % activePrograms.length);
  };

  const handlePrevProgram = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentProgIndex((prev) => (prev - 1 + activePrograms.length) % activePrograms.length);
  };

  const handleRandomProgram = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activePrograms.length <= 1) return;
    let next = Math.floor(Math.random() * activePrograms.length);
    if (next === currentProgIndex) {
      next = (currentProgIndex + 1) % activePrograms.length;
    }
    setCurrentProgIndex(next);
  };

  const currentProg = activePrograms[currentProgIndex] || activePrograms[0];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const getPillarIcon = (name: string) => {
    switch (name) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Radio':
        return <Radio className="w-5 h-5 text-orange-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-emerald-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO INSTITUCIONAL COM IMAGEM DE FUNDO DE ESTÚDIO */}
      <section className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
        {/* Imagem de Fundo de Estúdio de Rádio com Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none filter brightness-[0.35] saturate-[0.85] scale-105"
          style={{ backgroundImage: `url('/header-box-bg.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/65 pointer-events-none" />

        {/* Glow atmosférico suave */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Coluna Esquerda: Texto, Manifesto Resumido e Ações Principais */}
          <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-none">
                REBELDIA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">FM</span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 font-medium font-sans">
                {data.slogan}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              A Rebeldia FM nasceu com o propósito de defender a liberdade de expressão e valorizar a música como uma das mais importantes formas de arte e manifestação humana.
            </p>

            {/* Ações Rápidas: Play Ao Vivo & Kit de Mídia Oficial (PDF) */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              {onTogglePlay && (
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-xl shadow-white/10 cursor-pointer active:scale-95"
                  title={isPlaying ? 'Pausar Transmissão' : 'Iniciar Transmissão Ao Vivo'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-black text-black" />
                      <span>Pausar Rádio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black text-black" />
                      <span>Ouvir Rádio Ao Vivo</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={downloadBrandManifestoFile}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 group"
                title="Baixar Kit de Mídia Oficial da Rebeldia FM em formato PDF"
              >
                <Download className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Kit de Mídia (PDF)</span>
              </button>

              {onOpenMural && (
                <button
                  type="button"
                  onClick={onOpenMural}
                  className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Mural</span>
                </button>
              )}
            </div>
          </div>

          {/* Coluna Direita: Card do Estúdio com Banner Randômico de Programas (Sem bordas internas e sem texto de topo) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div
              className="w-full max-w-md rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl overflow-hidden group hover:border-amber-500/40 transition flex flex-col justify-between"
              onMouseEnter={() => setIsBannerPaused(true)}
              onMouseLeave={() => setIsBannerPaused(false)}
            >
              {/* Banner Randômico de Programas */}
              {currentProg && (
                <div className="flex flex-col h-full">
                  {/* Imagem de Capa do Banner (Preenche topo, esquerda e direita rente às bordas externas) */}
                  <div
                    onClick={() => onSelectProgram && onSelectProgram(currentProg)}
                    className="relative h-36 sm:h-40 w-full overflow-hidden bg-zinc-900 cursor-pointer group/image"
                    title={`Ver detalhes do programa ${currentProg.title}`}
                  >
                    {currentProg.bannerUrl ? (
                      <img
                        src={currentProg.bannerUrl}
                        alt={currentProg.title}
                        className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500"
                      />
                    ) : currentProg.avatarUrl ? (
                      <img
                        src={currentProg.avatarUrl}
                        alt={currentProg.title}
                        className="w-full h-full object-cover opacity-70 group-hover/image:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Radio className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}

                    {/* Gradiente Escuro sobre a Imagem */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                    {/* Badge de Horário no canto superior esquerdo */}
                    <div className="absolute top-2.5 left-2.5 pointer-events-none z-10 max-w-[calc(100%-6.5rem)] sm:max-w-[calc(100%-7.5rem)]">
                      <span className="px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 flex items-center gap-1 font-mono shadow-md">
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{currentProg.daysLabel || `${currentProg.startTime} - ${currentProg.endTime}`}</span>
                      </span>
                    </div>

                    {/* Badge de Gênero na parte inferior esquerda */}
                    {currentProg.genre && (
                      <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10 max-w-[calc(100%-6.5rem)] sm:max-w-[calc(100%-7.5rem)]">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider font-mono backdrop-blur-sm truncate block shadow">
                          {currentProg.genre}
                        </span>
                      </div>
                    )}

                    {/* Logo do Programa (Lado Direito, centralizado verticalmente) */}
                    {(currentProg.logoUrl || currentProg.avatarUrl) && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-950/90 backdrop-blur-md p-1.5 sm:p-2 border border-white/20 shadow-2xl overflow-hidden flex items-center justify-center shrink-0 z-10 group-hover/image:border-amber-400/60 transition-all duration-300">
                        <img
                          src={currentProg.logoUrl || currentProg.avatarUrl}
                          alt={`Logo ${currentProg.title}`}
                          className="w-full h-full object-contain filter drop-shadow-md rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Informações Principais do Programa & Ações (Área Inferior com Padding) */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div
                      onClick={() => onSelectProgram && onSelectProgram(currentProg)}
                      className="space-y-1.5 cursor-pointer group/info"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-base font-black text-white font-display truncate group-hover/info:text-amber-400 transition-colors">
                            {currentProg.title}
                          </h4>
                          <p className="text-xs text-zinc-300 flex items-center gap-1 font-medium truncate pt-0.5">
                            <Mic2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{currentProg.host}</span>
                            {currentProg.hostRole && (
                              <span className="text-[10px] text-zinc-500 truncate">
                                • {currentProg.hostRole}
                              </span>
                            )}
                          </p>
                        </div>

                        <span className="shrink-0 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-400 group-hover/info:text-amber-400 group-hover/info:border-amber-400/50 transition">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      {currentProg.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {currentProg.description}
                        </p>
                      )}
                    </div>

                    {/* Controles de Navegação e Ação do Banner */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePrevProgram}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition active:scale-95 cursor-pointer"
                          title="Programa anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRandomProgram}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-xs font-mono transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Sortear outro programa aleatório da rádio"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sortear</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextProgram}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition active:scale-95 cursor-pointer"
                          title="Próximo programa"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectProgram && onSelectProgram(currentProg)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs tracking-wide transition flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
                      >
                        <span>Ver Programa</span>
                        <ChevronRight className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. SUB-NAVEGAÇÃO REDIMENSIONADA POR ABAS TEMÁTICAS */}
      <nav aria-label="Seções Institucionais" className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Visão Completa', icon: Layers },
          { id: 'history', label: '1. Nossa História', icon: Clock },
          { id: 'manifesto', label: 'Música, Cultura & Liberdade', icon: Flame },
          { id: 'pillars', label: 'Pilares', icon: Zap },
          { id: 'team', label: 'Vozes & Equipe', icon: Users },
          { id: 'bands', label: 'Espaço para Bandas', icon: Disc },
          { id: 'contact', label: 'Contatos Oficiais', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as InstitutionalSectionTab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                  : 'bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. BLOCO: 1. NOSSA HISTÓRIA */}
      {(activeSubTab === 'all' || activeSubTab === 'history') && (
        <section className="rounded-3xl border border-white/10 bg-zinc-950/90 p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                {data.historyTitle}
              </h2>
              <p className="text-xs text-zinc-400">Origens, propósito e compromisso com o ouvinte</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-3.5 text-zinc-300 text-xs sm:text-sm leading-relaxed">
              {data.historyText.map((paragraph, idx) => (
                <p key={idx} className="relative z-10 pl-4 sm:pl-6 border-l-2 border-amber-500/40 font-sans text-xs sm:text-sm text-zinc-300">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="md:col-span-5 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Infraestrutura de Streaming
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <ul className="text-xs text-zinc-400 space-y-2 font-mono">
                <li className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                  <span>Qualidade / Bitrate:</span>
                  <span className="text-white font-bold">{data.transmissionTech.bitrate}</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                  <span>Formato de Áudio:</span>
                  <span className="text-white font-bold">{data.transmissionTech.codec}</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                  <span>SLA & Uptime:</span>
                  <span className="text-emerald-400 font-bold">{data.transmissionTech.uptime}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Cobertura:</span>
                  <span className="text-white font-bold">{data.transmissionTech.availability}</span>
                </li>
              </ul>

              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-snug">
                <span className="text-amber-300 font-bold block mb-0.5 font-mono">Licença & Princípios:</span>
                {data.licenseInfo}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. BLOCO: MÚSICA, CULTURA E LIBERDADE */}
      {(activeSubTab === 'all' || activeSubTab === 'manifesto') && (
        <section className="rounded-3xl border border-white/10 bg-zinc-950/90 p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                  {data.manifestoTitle}
                </h2>
                <p className="text-xs text-zinc-400">Nossa declaração de princípios e compromisso editorial</p>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadBrandManifestoFile}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar em PDF</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3.5 text-zinc-300 text-sm sm:text-base leading-relaxed font-serif italic relative">
            <span className="text-5xl text-amber-500/20 font-display absolute top-2 left-3 select-none leading-none">“</span>
            {data.manifestoText.map((paragraph, idx) => (
              <p key={idx} className="relative z-10 pl-4 sm:pl-6 border-l-2 border-amber-500/40 not-italic font-sans text-xs sm:text-sm text-zinc-300">
                {paragraph}
              </p>
            ))}
            <div className="pt-3 flex items-center justify-between text-xs font-sans not-italic text-zinc-400 font-bold border-t border-white/10">
              <span>Diretoria Coletiva de Programação</span>
              <span className="text-amber-400 font-mono">REBELDIA FM • Dial Livre</span>
            </div>
          </div>
        </section>
      )}

      {/* 4. BLOCO: OS 4 PILARES DA EMISSORA (BENTO GRID REDIMENSIONADO) */}
      {(activeSubTab === 'all' || activeSubTab === 'pillars') && (
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Pilares da Nossa Emissora
            </h2>
            <p className="text-xs text-zinc-400">
              Diretrizes que orientam cada transmissão, programa e seleção musical
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {data.pillars.map((pillar, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-zinc-900/85 border border-white/10 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3 shadow-lg group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-black/60 border border-zinc-800 group-hover:scale-105 transition">
                      {getPillarIcon(pillar.iconName)}
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {pillar.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. BLOCO: VOZES & EQUIPE DA RÁDIO */}
      {(activeSubTab === 'all' || activeSubTab === 'team') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Vozes & Diretoria Artística
              </h2>
              <p className="text-xs text-zinc-400">
                Locutores, radialistas e profissionais que constroem a identidade sonora
              </p>
            </div>
            {onOpenSchedule && (
              <button
                type="button"
                onClick={onOpenSchedule}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Ver Grade Completa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {data.team.map((member, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-900/85 border border-white/10 hover:border-amber-500/40 transition flex flex-col items-center text-center space-y-2.5 shadow-lg group"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-700 group-hover:border-amber-400 transition shadow-md shrink-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-amber-300 transition">
                    {member.name}
                  </h3>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {member.role}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. BLOCO: ESPAÇO DO ARTISTA INDEPENDENTE & MÚSICOS */}
      {(activeSubTab === 'all' || activeSubTab === 'bands') && (
        <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black uppercase">
                <Disc className="w-3.5 h-3.5" />
                <span>Espaço do Artista Independente</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                Quer sua música tocando na Rebeldia FM?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Temos compromisso direto com o rock autoral e novos compositores. Envie seu single, EP, álbum ou release para audição gratuita de nossa curadoria artística.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
              <a
                href={`mailto:${data.bandsEmail}?subject=Envio de Material Musical - Banda Independente`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Material ({data.bandsEmail})</span>
              </a>
              <span className="text-[10px] text-zinc-400 font-mono">
                Curadoria colaborativa por nossa equipe de locutores
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 8. BLOCO: CANAIS OFICIAIS & ESTÚDIO */}
      {(activeSubTab === 'all' || activeSubTab === 'contact') && (
        <section className="rounded-3xl border border-white/10 bg-zinc-950/90 p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                Contatos Oficiais & Canais do Estúdio
              </h2>
              <p className="text-xs text-zinc-400">
                Fale com a curadoria, locução ao vivo, imprensa ou parcerias culturais
              </p>
            </div>

            {onOpenMural && (
              <button
                type="button"
                onClick={onOpenMural}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Mural de Recados</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* E-mails Oficiais */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>E-mails Oficiais</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`${data.officialEmail} / ${data.pressEmail}`, 'email')}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'email' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="space-y-0.5">
                <a
                  href={`mailto:${data.officialEmail}`}
                  className="block text-xs font-bold text-white hover:text-amber-400 transition font-mono truncate"
                >
                  {data.officialEmail}
                </a>
                <a
                  href={`mailto:${data.pressEmail}`}
                  className="block text-xs text-zinc-400 hover:text-amber-300 transition font-mono truncate"
                >
                  {data.pressEmail}
                </a>
              </div>
              <p className="text-[10px] text-zinc-500">Geral, redação e estúdio</p>
            </div>

            {/* WhatsApp do Estúdio */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>WhatsApp do Estúdio</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(data.whatsapp, 'whatsapp')}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  {copiedField === 'whatsapp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'whatsapp' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <span className="block text-sm font-bold text-white font-mono">
                {data.whatsapp}
              </span>
              <p className="text-[10px] text-zinc-500">Pedidos musicais e interações</p>
            </div>

            {/* Redes & Presença Digital */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <Instagram className="w-4 h-4 text-amber-400" />
                  <span>Redes Sociais</span>
                </div>
              </div>
              <span className="block text-sm font-bold text-white font-mono">
                {data.instagram}
              </span>
              <p className="text-[10px] text-zinc-500">Instagram, Podcasts e YouTube</p>
            </div>
          </div>

          {/* Endereço & Sede do Estúdio */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-zinc-800/80 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-zinc-200 block">{data.studioAddress}</span>
                <span className="text-zinc-500 text-[11px]">{data.location}</span>
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Rebeldia FM • Frequência Digital
            </span>
          </div>
        </section>
      )}
    </div>
  );
};
