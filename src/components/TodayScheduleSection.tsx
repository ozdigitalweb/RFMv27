import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Radio,
  Repeat,
  ChevronRight,
  Sparkles,
  Bell,
  Check,
  MessageCircle,
  Instagram,
  Volume2,
} from 'lucide-react';
import { ProgramItem, LiveTakeover } from '../types';
import { DEFAULT_REB_PROGRAM } from '../data/initialData';
import {
  formatMainSchedule,
  formatRepriseSchedule,
} from '../utils/scheduleFormatter';

interface TodayScheduleSectionProps {
  programs: ProgramItem[];
  currentLiveProgram: ProgramItem | null;
  onSelectProgram: (program: ProgramItem) => void;
  onOpenFullSchedule: () => void;
  liveTakeover?: LiveTakeover | null;
}

interface DayItem {
  id: number;
  short: string;
  name: string;
}

const WEEK_DAYS: DayItem[] = [
  { id: 1, short: 'Seg', name: 'Segunda-feira' },
  { id: 2, short: 'Ter', name: 'Terça-feira' },
  { id: 3, short: 'Qua', name: 'Quarta-feira' },
  { id: 4, short: 'Qui', name: 'Quinta-feira' },
  { id: 5, short: 'Sex', name: 'Sexta-feira' },
  { id: 6, short: 'Sáb', name: 'Sábado' },
  { id: 0, short: 'Dom', name: 'Domingo' },
];

export const TodayScheduleSection: React.FC<TodayScheduleSectionProps> = ({
  programs,
  currentLiveProgram,
  onSelectProgram,
  onOpenFullSchedule,
  liveTakeover,
}) => {
  // Dia atual da semana (0 = Domingo, 1 = Segunda, etc.)
  const todayDayIndex = useMemo(() => new Date().getDay(), []);
  
  // Estado do dia selecionado (inicia no dia atual)
  const [selectedDay, setSelectedDay] = useState<number>(todayDayIndex);

  // Referência e efeito de auto-scroll suave para o dia selecionado (efeito slide mobile do hotsite)
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

  // Lembretes salvos no LocalStorage
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
    try {
      localStorage.setItem('rebeldia_reminders', JSON.stringify(next));
    } catch {
      // ignore
    }

    if (!reminders.includes(progId) && 'Notification' in window) {
      Notification.requestPermission().catch(() => {});
    }
  };

  const selectedDayObj = useMemo(
    () => WEEK_DAYS.find((d) => d.id === selectedDay) || WEEK_DAYS[0],
    [selectedDay]
  );

  const isSelectedDayToday = selectedDay === todayDayIndex;

  // Separação e ordenação:
  // 1) Programas Principais / Ao Vivo em PRIMEIRO PLANO (ordenados por: no ar agora primeiro, depois horário de início)
  // 2) Reprises em SEGUNDO PLANO (ordenadas cronologicamente pelo horário da reprise)
  const { liveAndMainPrograms, reprisePrograms } = useMemo(() => {
    const mainList: ProgramItem[] = [];
    const repriseList: ProgramItem[] = [];

    programs.forEach((p) => {
      if (p.isActive === false) return;

      const isMainSlot = p.dayOfWeek === selectedDay || p.dayOfWeek === -1;
      const isRepriseSlot =
        Boolean(p.hasReprise) &&
        (p.repriseDayOfWeek === selectedDay || p.repriseDayOfWeek === -1) &&
        p.dayOfWeek !== selectedDay;

      if (isMainSlot) {
        mainList.push(p);
      } else if (isRepriseSlot) {
        repriseList.push(p);
      }
    });

    // Ordena programas principais: quem está no ar AGORA vai para o primeiro lugar, seguido pelo horário de início
    mainList.sort((a, b) => {
      const aIsLive =
        (currentLiveProgram && currentLiveProgram.id === a.id) ||
        (liveTakeover && liveTakeover.programId === a.id);
      const bIsLive =
        (currentLiveProgram && currentLiveProgram.id === b.id) ||
        (liveTakeover && liveTakeover.programId === b.id);

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      return a.startTime.localeCompare(b.startTime);
    });

    // Ordena reprises em segundo plano cronologicamente
    repriseList.sort((a, b) => {
      const timeA = a.repriseStartTime || a.startTime;
      const timeB = b.repriseStartTime || b.startTime;
      return timeA.localeCompare(timeB);
    });

    return { liveAndMainPrograms: mainList, reprisePrograms: repriseList };
  }, [programs, selectedDay, currentLiveProgram, liveTakeover]);

  const hasAnyPrograms = liveAndMainPrograms.length > 0 || reprisePrograms.length > 0;

  // Renderizador de Card de Programa (com diferenciação visual de primeiro plano e segundo plano)
  const renderProgramCard = (prog: ProgramItem, isRepriseSlot: boolean, index: number = 0) => {
    const isLiveNow =
      (currentLiveProgram && currentLiveProgram.id === prog.id) ||
      (liveTakeover && liveTakeover.programId === prog.id);

    const hasReminder = reminders.includes(prog.id);

    const timeDisplay =
      isRepriseSlot && prog.repriseStartTime && prog.repriseEndTime
        ? `${prog.repriseStartTime} - ${prog.repriseEndTime}`
        : `${prog.startTime} - ${prog.endTime}`;

    const cardKey = `${prog.id || prog.title}-${selectedDay}-${isRepriseSlot ? 'reprise' : 'main'}-${index}`;

    return (
      <div
        key={cardKey}
        onClick={() => onSelectProgram(prog)}
        className={`flex flex-col h-full w-full group relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer ${
          isRepriseSlot
            ? 'bg-zinc-950/75 border border-zinc-800/70 hover:border-amber-500/40 shadow-lg hover:shadow-xl opacity-90 hover:opacity-100'
            : isLiveNow
            ? 'bg-zinc-950 border-2 border-amber-500 shadow-amber-500/15 ring-2 ring-amber-500/40 shadow-2xl hover:-translate-y-1'
            : 'bg-zinc-950 border border-zinc-800/90 hover:border-amber-500/50 shadow-xl hover:shadow-2xl hover:-translate-y-1'
        }`}
      >
        {/* Top Banner Cover do Programa */}
        <div className="relative h-44 w-full overflow-hidden bg-zinc-900 shrink-0">
          {prog.bannerUrl ? (
            <img
              src={prog.bannerUrl}
              alt={prog.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                isRepriseSlot ? 'filter brightness-90' : ''
              }`}
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

          {/* Gradiente Escuro sobre a Imagem */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Badges Flutuantes Superiores */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
            {/* Bloco de Horário com AO VIVO abaixo da hora */}
            <div className="flex flex-col items-start gap-1.5">
              {/* Tag Hora do Programa */}
              <span
                className={`px-2.5 py-1 rounded-xl backdrop-blur-md text-[11px] font-bold border flex items-center gap-1.5 font-mono shadow-md ${
                  isRepriseSlot
                    ? 'bg-zinc-950/90 text-zinc-300 border-zinc-700'
                    : 'bg-zinc-950/90 text-white border-white/15'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {timeDisplay}
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

          {/* Badge de Gênero Musical */}
          <div className="absolute bottom-3 left-4">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider font-mono">
              {prog.genre}
            </span>
          </div>
        </div>

        {/* Corpo do Card com Dados do Locutor e Atração */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Bloco do Locutor do Programa */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-800/80">
              <div className="relative shrink-0">
                {prog.avatarUrl ? (
                  <img
                    src={prog.avatarUrl}
                    alt={prog.host}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40 group-hover:border-amber-400 transition shadow-md"
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

            {/* Título e Descrição do Programa */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-display group-hover:text-amber-300 transition leading-tight">
                  {prog.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {prog.description ||
                  'Programação musical de alto nível com os maiores clássicos do rock e novidades.'}
              </p>
            </div>

            {/* Tag de Reprise em Segundo Plano / Transmissão Original */}
            {isRepriseSlot ? (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 space-y-1 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono">
                    <Repeat className="w-3 h-3 text-amber-400" />
                    Transmissão Original:
                  </span>
                  <span className="font-mono text-zinc-300 text-[11px] font-bold">
                    {formatMainSchedule(prog)}
                  </span>
                </div>
              </div>
            ) : (
              prog.hasReprise && (
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Ao Vivo:
                    </span>
                    <span className="font-mono text-zinc-200 text-[11px] font-bold">
                      {formatMainSchedule(prog)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-amber-400 pt-1 border-t border-zinc-800/80">
                    <span className="flex items-center gap-1 text-[11px] font-bold">
                      <Repeat className="w-3 h-3 text-amber-400" />
                      Reprise semanal:
                    </span>
                    <span className="font-mono text-amber-300 text-[11px] font-bold">
                      {formatRepriseSchedule(prog)}
                    </span>
                  </div>
                </div>
              )
            )}

            {/* Contatos do Locutor */}
            {(prog.whatsappNumber || prog.instagramHandle) && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {prog.whatsappNumber && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                    <MessageCircle className="w-3 h-3 text-emerald-400" />
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

          {/* Rodapé do Card com Ação de Abrir Hotsite */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProgram(prog);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isRepriseSlot
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ver Hotsite do Programa</span>
            </button>

            <button
              type="button"
              onClick={(e) => toggleReminder(prog.id, e)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                hasReminder
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title={hasReminder ? 'Lembrete ativado' : 'Ativar lembrete deste programa'}
            >
              {hasReminder ? (
                <Check className="w-4 h-4 text-black" />
              ) : (
                <Bell className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção de Programação do Dia com Imagem de Fundo de Estúdio */}
      <div className="mono-card p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Imagem de Fundo de Estúdio de Rádio com Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none filter brightness-[0.38] saturate-[0.85] scale-105"
          style={{ backgroundImage: `url('/header-box-bg.jpg')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/65 pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              Grade do Dia
            </span>
            {isSelectedDayToday ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hoje no Ar
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[10px] font-bold">
                {selectedDayObj.name}
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
            Programação de {selectedDayObj.name}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            {isSelectedDayToday
              ? 'Confira os programas e locutores que estão no ar hoje na rádio Rebeldia FM.'
              : `Atrações e horários de transmissão agendados para ${selectedDayObj.name.toLowerCase()}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 self-start md:self-auto">
          <button
            type="button"
            onClick={onOpenFullSchedule}
            className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer shrink-0"
          >
            <span>Ver Grade Semanal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra Seletora dos Dias da Semana (Com Efeito Mobile de Correr Suavemente para o Lado) */}
      <div className="relative w-full">
        {/* Gradientes laterais indicadores de overflow no mobile */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-zinc-950 to-transparent z-10 sm:hidden" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-zinc-950 to-transparent z-10 sm:hidden" />

        <div
          ref={mobileDaysContainerRef}
          className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth touch-pan-x px-1 sm:px-0"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            {WEEK_DAYS.map((day) => {
              const isSelected = selectedDay === day.id;
              const isToday = day.id === todayDayIndex;
              
              // Contagem de programas ativos no dia
              const count = programs.filter(
                (p) =>
                  p.isActive !== false &&
                  (p.dayOfWeek === day.id ||
                    p.dayOfWeek === -1 ||
                    (Boolean(p.hasReprise) && (p.repriseDayOfWeek === day.id || p.repriseDayOfWeek === -1)))
              ).length;

              return (
                <button
                  key={day.id}
                  data-active={isSelected ? 'true' : 'false'}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`min-h-[40px] sm:min-h-0 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer relative shrink-0 active:scale-95 select-none ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black scale-102 ring-1 ring-amber-300'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{day.short}</span>
                  {isToday && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-black ${
                        isSelected
                          ? 'bg-black text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Hoje
                    </span>
                  )}
                  {count > 0 && (
                    <span className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-zinc-400'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!isSelectedDayToday && (
            <button
              type="button"
              onClick={() => setSelectedDay(todayDayIndex)}
              className="min-h-[40px] sm:min-h-0 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span>Voltar para Hoje</span>
            </button>
          )}
        </div>
      </div>

      {/* Grade de Programas do Dia: Primeiro Plano (Ao Vivo / Inéditos) e Segundo Plano (Reprises) */}
      {hasAnyPrograms ? (
        <div className="space-y-8">
          {/* PRIMEIRO PLANO: Programas Principais e Ao Vivo */}
          {liveAndMainPrograms.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
                    Programas Ao Vivo & Inéditos
                    <span className="text-[11px] font-bold text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {liveAndMainPrograms.length} {liveAndMainPrograms.length === 1 ? 'atração' : 'atrações'}
                    </span>
                  </h4>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Primeiro Plano • Transmissões Oficiais
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {liveAndMainPrograms.map((prog, idx) => renderProgramCard(prog, false, idx))}
              </div>
            </div>
          )}

          {/* SEGUNDO PLANO: Reprises e Reexibições do Dia */}
          {reprisePrograms.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
                    <Repeat className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
                      Reprises & Reexibições do Dia
                      <span className="text-[11px] font-bold text-amber-400/90 font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {reprisePrograms.length} {reprisePrograms.length === 1 ? 'reprise' : 'reprises'}
                      </span>
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                  Segundo Plano • Acervo & Replay da Semana
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {reprisePrograms.map((prog, idx) => renderProgramCard(prog, true, idx))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Fallback quando não houver atrações exclusivas no dia */
        <div className="mono-card p-8 rounded-3xl border border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400">
            <Radio className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-lg font-bold text-white">Transmissão Contínua 24 Horas</h4>
            <p className="text-xs text-zinc-400">
              Neste dia, a rádio Rebeldia FM segue com a curadoria especial comandada pelo locutor virtual REB com os maiores clássicos do rock e música independente sem intervalos.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectProgram(DEFAULT_REB_PROGRAM)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer"
            >
              Conhecer Locutor REB
            </button>
            <button
              type="button"
              onClick={onOpenFullSchedule}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition cursor-pointer"
            >
              Ver Grade da Semana
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
