import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Radio,
  User,
  Bell,
  Check,
  ExternalLink,
  Sparkles,
  Mic,
  Flame,
  MessageCircle,
  Instagram,
  Volume2,
  Play,
  Heart,
  ChevronRight,
  Headphones,
  Music,
  Repeat,
} from 'lucide-react';
import { ProgramItem, LiveTakeover } from '../types';
import { DEFAULT_REB_PROGRAM } from '../data/initialData';
import {
  formatMainSchedule,
  formatRepriseSchedule,
  getCleanDayName,
} from '../utils/scheduleFormatter';

interface ScheduleViewProps {
  programs: ProgramItem[];
  currentLiveProgram: ProgramItem | null;
  onSelectProgram?: (program: ProgramItem) => void;
  onOpenTakeoverModal?: (program?: ProgramItem) => void;
  liveTakeover?: LiveTakeover | null;
}

const DAYS_OF_WEEK = [
  { id: -1, label: 'Todos os Dias' },
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  programs,
  currentLiveProgram,
  onSelectProgram,
  onOpenTakeoverModal,
  liveTakeover,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Referência e efeito de auto-scroll suave para o dia selecionado (efeito slide mobile igual ao hotsite)
  const mobileDaysContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mobileDaysContainerRef.current) {
      const activeEl = mobileDaysContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl && typeof (activeEl as HTMLElement).scrollIntoView === 'function') {
        (activeEl as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedDay]);
  const [reminders, setReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rebeldia_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleReminder = (progId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = reminders.includes(progId)
      ? reminders.filter((id) => id !== progId)
      : [...reminders, progId];
    setReminders(next);
    localStorage.setItem('rebeldia_reminders', JSON.stringify(next));

    if (!reminders.includes(progId) && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const filteredPrograms = useMemo(() => {
    const list = programs.filter((p) => {
      if (p.isActive === false) return false;
      const matchesDay =
        selectedDay === -1 ||
        p.dayOfWeek === selectedDay ||
        p.dayOfWeek === -1 ||
        (Boolean(p.hasReprise) && (p.repriseDayOfWeek === selectedDay || p.repriseDayOfWeek === -1));
      const matchesSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genre.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDay && matchesSearch;
    });

    return list.sort((a, b) => {
      // Se um dia específico estiver selecionado, ordenamos programas principais primeiro, reprises depois
      if (selectedDay !== -1) {
        const isAReprise =
          Boolean(a.hasReprise) &&
          (a.repriseDayOfWeek === selectedDay || a.repriseDayOfWeek === -1) &&
          a.dayOfWeek !== selectedDay;
        const isBReprise =
          Boolean(b.hasReprise) &&
          (b.repriseDayOfWeek === selectedDay || b.repriseDayOfWeek === -1) &&
          b.dayOfWeek !== selectedDay;

        if (!isAReprise && isBReprise) return -1;
        if (isAReprise && !isBReprise) return 1;

        const aLive = currentLiveProgram?.id === a.id ? 1 : 0;
        const bLive = currentLiveProgram?.id === b.id ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive;

        const timeA = isAReprise && a.repriseStartTime ? a.repriseStartTime : a.startTime;
        const timeB = isBReprise && b.repriseStartTime ? b.repriseStartTime : b.startTime;
        return timeA.localeCompare(timeB);
      }

      // Visão geral de todos os dias
      const aLive = currentLiveProgram?.id === a.id ? 1 : 0;
      const bLive = currentLiveProgram?.id === b.id ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;

      return a.startTime.localeCompare(b.startTime);
    });
  }, [programs, selectedDay, searchQuery, currentLiveProgram]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Barra de Filtro de Dias no topo da página com Imagem de Fundo de Estúdio */}
      <div className="w-full rounded-2xl sm:rounded-3xl bg-zinc-950/90 border border-white/10 p-3 sm:p-4 shadow-2xl flex items-center gap-3 sm:gap-4 relative overflow-hidden">
        {/* Imagem de Fundo de Estúdio de Rádio com Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none filter brightness-[0.38] saturate-[0.85] scale-105"
          style={{ backgroundImage: `url('/header-box-bg.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/65 pointer-events-none" />

        {/* Ícone Calendário */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 relative z-10" title="Filtrar por dia">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        </div>

        {/* Gradientes de fade para indicar scroll lateral no mobile */}
        <div className="relative max-w-full flex-1 overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-zinc-950 to-transparent z-10 md:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-zinc-950 to-transparent z-10 md:hidden" />

          <div
            ref={mobileDaysContainerRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth touch-pan-x px-1 md:px-0"
          >
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day.id;
              // Quantidade de atrações no dia
              const count = programs.filter(
                (p) =>
                  p.isActive !== false &&
                  (day.id === -1 ||
                    p.dayOfWeek === day.id ||
                    (Boolean(p.hasReprise) && (p.repriseDayOfWeek === day.id || p.repriseDayOfWeek === -1)))
              ).length;

              return (
                <button
                  key={day.id}
                  data-active={isSelected ? 'true' : 'false'}
                  onClick={() => setSelectedDay(day.id)}
                  className={`min-h-[38px] sm:min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 select-none flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-black scale-102 ring-1 ring-amber-300'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{day.label}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-black/25 text-black font-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grade de Boxes Verticais em Modo Masonry */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
        {filteredPrograms.map((prog, index) => {
          const isLiveNow = currentLiveProgram?.id === prog.id;
          const hasReminder = reminders.includes(prog.id);
          const isRepriseSlot =
            selectedDay !== -1 &&
            Boolean(prog.hasReprise) &&
            (prog.repriseDayOfWeek === selectedDay || prog.repriseDayOfWeek === -1) &&
            prog.dayOfWeek !== selectedDay;

          const cardKey = `${prog.id || prog.title}-${prog.dayOfWeek}-${index}`;

          return (
            <div
              key={cardKey}
              onClick={() => onSelectProgram && onSelectProgram(prog)}
              className={`break-inside-avoid mb-6 inline-block w-full align-top group relative rounded-3xl overflow-hidden bg-zinc-950 border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 ${
                isLiveNow
                  ? 'border-amber-500 shadow-amber-500/10'
                  : 'border-zinc-800/90 hover:border-amber-500/50'
              }`}
            >
              {/* Box Top Banner Cover */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-zinc-900">
                {prog.bannerUrl ? (
                  <img
                    src={prog.bannerUrl}
                    alt={prog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : prog.avatarUrl ? (
                  <img
                    src={prog.avatarUrl}
                    alt={prog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
                    <Radio className="w-12 h-12 text-zinc-700" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                {/* Top Floating Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                  {/* Bloco de Horário com AO VIVO abaixo da hora */}
                  <div className="flex flex-col items-start gap-1.5">
                    {/* Tag Hora do Programa */}
                    <span className="px-2.5 py-1 rounded-xl bg-zinc-950/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/15 flex items-center gap-1.5 font-mono shadow-md">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {isRepriseSlot && prog.repriseStartTime && prog.repriseEndTime
                        ? `${prog.repriseStartTime} - ${prog.repriseEndTime}`
                        : `${prog.startTime} - ${prog.endTime}`}
                    </span>

                    {/* Tag AO VIVO posicionada abaixo da tag hora do programa */}
                    {isLiveNow && (
                      <span className="px-2.5 py-1 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Ao Vivo
                      </span>
                    )}

                    {/* Palavra Reprise embaixo do horário */}
                    {isRepriseSlot && !isLiveNow && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md font-mono">
                        <Repeat className="w-3 h-3 text-amber-400" />
                        Reprise
                      </span>
                    )}
                  </div>

                  {/* Logo Oficial do Programa ampliado no canto superior direito */}
                  {prog.logoUrl && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950/90 backdrop-blur-md p-1.5 sm:p-2 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-amber-400/60 transition">
                      <img
                        src={prog.logoUrl}
                        alt={`Logo ${prog.title}`}
                        className="w-full h-full object-contain filter drop-shadow-md rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Genre Floating Badge */}
                <div className="absolute bottom-3 left-4">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                    {prog.genre}
                  </span>
                </div>
              </div>

              {/* Box Content Body */}
              <div className="p-5 flex flex-col space-y-4">
                <div className="space-y-3">
                  {/* Host Info Section inside Vertical Box */}
                  <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-800/80">
                    <div className="relative shrink-0">
                      {prog.avatarUrl ? (
                        <img
                          src={prog.avatarUrl}
                          alt={prog.host}
                          className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40 group-hover:border-amber-400 transition"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold font-display">
                          {prog.host.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {prog.hostRole || 'Locutor(a) do Programa'}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                        {prog.host}
                      </h4>
                      {prog.hostBio && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1">
                          {prog.hostBio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Program Title & Synopsis */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white font-display group-hover:text-amber-300 transition leading-tight">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {prog.description || 'Programação musical de alto nível com os maiores clássicos do rock e novidades.'}
                    </p>
                  </div>

                  {/* Program Schedule Details with Reprise Box */}
                  {prog.hasReprise && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Principal:
                        </span>
                        <span className="font-mono text-zinc-200 text-[11px] font-bold">
                          {formatMainSchedule(prog)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-amber-400 pt-1 border-t border-zinc-800/80">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold">
                          <Repeat className="w-3 h-3 text-amber-400" />
                          Reprise:
                        </span>
                        <span className="font-mono text-amber-300 text-[11px] font-bold">
                          {formatRepriseSchedule(prog)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Additional Host Highlights / Contacts if available */}
                  {(prog.whatsappNumber || prog.instagramHandle) && (
                    <div className="flex items-center gap-2 pt-1">
                      {prog.whatsappNumber && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                          <MessageCircle className="w-3 h-3 text-amber-400" />
                          WhatsApp no Ar
                        </span>
                      )}
                      {prog.instagramHandle && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                          <Instagram className="w-3 h-3 text-amber-400" />
                          @{prog.instagramHandle.replace('@', '')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Box Action Footer */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProgram && onSelectProgram(prog);
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Ver Página do Programa</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => toggleReminder(prog.id, e)}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      hasReminder
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                    }`}
                    title={hasReminder ? 'Lembrete ativado' : 'Ativar lembrete deste programa'}
                  >
                    {hasReminder ? <Check className="w-4 h-4 text-black" /> : <Bell className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Destaque do REB • Locutor & Curador 24h */}
      <div
        onClick={() => onSelectProgram && onSelectProgram(DEFAULT_REB_PROGRAM)}
        className="rounded-3xl p-6 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/40 relative overflow-hidden cursor-pointer group hover:border-amber-400 transition shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="relative shrink-0">
              <img
                src="/reb_mascot.jpg"
                alt="REB Oficial"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 group-hover:scale-105 transition shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase font-mono">
                24H
              </span>
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                Locutor & Curador Oficial
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display group-hover:text-amber-300 transition">
                REB • A Voz do Rock
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300">
                Curadoria contínua 24 horas por dia, clássicos eternos, vinhetas personalizadas e história da Rebeldia FM.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProgram && onSelectProgram(DEFAULT_REB_PROGRAM);
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0 self-end md:self-center"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Ver Perfil do REB</span>
          </button>
        </div>
      </div>
    </div>
  );
};
