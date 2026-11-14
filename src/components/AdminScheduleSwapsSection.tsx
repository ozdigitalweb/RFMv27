import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Repeat,
  Trash2,
  XCircle,
} from 'lucide-react';
import { HostAccount, ScheduleSwapRecord, ScheduleSwapType } from '../types';
import { DbScheduleItem, api } from '../utils/api';
import {
  formatPhoneDisplay,
  getLocalTodayYmd,
  isHostOwnerOfProgram,
  resolveHostWhatsapp,
} from '../utils/hostPhone';

interface AdminScheduleSwapsSectionProps {
  authRole: 'host' | 'admin';
  activeHost: HostAccount | null;
  hostToken?: string | null;
  scheduleList: DbScheduleItem[];
  hostAccounts: HostAccount[];
  swaps: ScheduleSwapRecord[];
  onSwapsUpdated: (nextSwaps: ScheduleSwapRecord[]) => void;
  onRefreshSchedule: () => Promise<void> | void;
  showToast: (msg: string) => void;
  stationWhatsapp?: string;
}

const DAY_LABELS: Record<number, string> = {
  [-1]: 'Todos os Dias',
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

function formatDayName(dayOfWeek: number, daysLabel?: string | null): string {
  if (daysLabel && daysLabel.trim()) return daysLabel.trim();
  return DAY_LABELS[dayOfWeek] || 'Programação';
}

export const AdminScheduleSwapsSection: React.FC<AdminScheduleSwapsSectionProps> = ({
  authRole,
  activeHost,
  hostToken,
  scheduleList,
  hostAccounts,
  swaps,
  onSwapsUpdated,
  onRefreshSchedule,
  showToast,
  stationWhatsapp,
}) => {
  const todayYmd = getLocalTodayYmd();

  const activePrograms = useMemo(
    () => scheduleList.filter((p) => p.isActive !== false),
    [scheduleList]
  );

  const ownedPrograms = useMemo(() => {
    if (authRole === 'admin') return activePrograms;
    if (!activeHost) return [];
    return activePrograms.filter((p) =>
      isHostOwnerOfProgram(activeHost, {
        id: String(p.id),
        title: p.title,
        host: p.host,
        hostAccountId: p.hostAccountId || undefined,
      })
    );
  }, [authRole, activeHost, activePrograms]);

  const [sourceProgramId, setSourceProgramId] = useState<string>(() =>
    ownedPrograms[0] ? String(ownedPrograms[0].id) : ''
  );
  const [targetProgramId, setTargetProgramId] = useState<string>('');
  const [swapType, setSwapType] = useState<ScheduleSwapType>('one_time');
  const [targetDate, setTargetDate] = useState<string>(todayYmd);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'active_today' | 'upcoming' | 'all'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const effectiveSourceId =
    sourceProgramId && ownedPrograms.some((p) => String(p.id) === sourceProgramId)
      ? sourceProgramId
      : ownedPrograms[0]
      ? String(ownedPrograms[0].id)
      : '';

  const targetOptions = useMemo(
    () => activePrograms.filter((p) => String(p.id) !== effectiveSourceId),
    [activePrograms, effectiveSourceId]
  );

  const effectiveTargetId =
    targetProgramId && targetOptions.some((p) => String(p.id) === targetProgramId)
      ? targetProgramId
      : targetOptions[0]
      ? String(targetOptions[0].id)
      : '';

  const sourceProg = ownedPrograms.find((p) => String(p.id) === effectiveSourceId) || null;
  const targetProg = targetOptions.find((p) => String(p.id) === effectiveTargetId) || null;

  const getHostPhoneForProgram = (prog: DbScheduleItem | null): string => {
    if (!prog) return stationWhatsapp || '5548991984678';
    const linked = hostAccounts.find(
      (h) =>
        (prog.hostAccountId && h.id === prog.hostAccountId) ||
        (Array.isArray(h.programIds) && h.programIds.includes(String(prog.id))) ||
        h.name.toLowerCase().trim() === prog.host.toLowerCase().trim()
    );
    return resolveHostWhatsapp(linked, stationWhatsapp);
  };

  const handleSubmitSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!sourceProg || !targetProg) {
      setFormError('Selecione os dois programas para realizar a troca.');
      return;
    }

    if (swapType === 'one_time' && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setFormError('Selecione uma data válida para a troca pontual (1 dia).');
      return;
    }

    setIsSubmitting(true);
    try {
      const adminToken =
        authRole === 'admin' && typeof localStorage !== 'undefined'
          ? localStorage.getItem('rebeldia_admin_session')
          : null;

      const res = await api.createScheduleSwap(
        {
          type: swapType,
          targetDate: swapType === 'one_time' ? targetDate : undefined,
          sourceProgramId: sourceProg.id,
          targetProgramId: targetProg.id,
          note: note.trim() || undefined,
        },
        { hostToken, adminToken }
      );

      if (!res.success) {
        setFormError(res.error || 'Não foi possível concluir a troca de horário.');
        return;
      }

      if (res.swaps) {
        onSwapsUpdated(res.swaps);
      }
      if (swapType === 'permanent') {
        await onRefreshSchedule();
      }
      setNote('');
      showToast(
        swapType === 'one_time'
          ? `Troca pontual registrada para ${targetDate.split('-').reverse().join('/')}!`
          : 'Troca permanente aplicada na grade oficial!'
      );
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao executar troca de horário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSwap = async (swap: ScheduleSwapRecord) => {
    setCancellingId(swap.id);
    try {
      const adminToken =
        authRole === 'admin' && typeof localStorage !== 'undefined'
          ? localStorage.getItem('rebeldia_admin_session')
          : null;

      const res = await api.cancelScheduleSwap(swap.id, { hostToken, adminToken });
      if (!res.success) {
        showToast(res.error || 'Erro ao cancelar troca.');
        return;
      }
      if (res.swaps) {
        onSwapsUpdated(res.swaps);
      }
      showToast('Troca pontual cancelada e grade restaurada.');
    } finally {
      setCancellingId(null);
    }
  };

  const visibleSwaps = useMemo(() => {
    const base =
      authRole === 'admin' || !activeHost
        ? swaps
        : swaps.filter(
            (s) =>
              s.initiatedByHostId === activeHost.id ||
              s.sourceHostId === activeHost.id ||
              s.targetHostId === activeHost.id ||
              ownedPrograms.some(
                (p) =>
                  String(p.id) === String(s.sourceProgramId) ||
                  String(p.id) === String(s.targetProgramId)
              )
          );

    return base.filter((s) => {
      if (historyFilter === 'active_today') {
        return s.type === 'one_time' && s.status === 'active' && s.targetDate === todayYmd;
      }
      if (historyFilter === 'upcoming') {
        return s.type === 'one_time' && s.status === 'active' && (s.targetDate || '') >= todayYmd;
      }
      return true;
    });
  }, [authRole, activeHost, swaps, ownedPrograms, historyFilter, todayYmd]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
            <Repeat className="w-5 h-5 text-amber-400" />
            <span>Troca Direta de Horário & Registro de Avisos</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Por padrão vale a promessa fixa da grade. Troque diretamente por <strong>1 dia (pontual)</strong> ou em definitivo (<strong>permanente</strong>) carregando automaticamente o celular de quem entra no ar.
          </p>
        </div>
      </div>

      {/* Swap Form */}
      {ownedPrograms.length === 0 ? (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
          <Calendar className="w-8 h-8 text-zinc-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">Você não possui programas fixos vinculados</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Para trocar horários, é preciso ter ao menos um programa ativo sob sua titularidade. Você ainda pode entrar ao vivo a qualquer momento usando a guia <strong>Assumir Coringa</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitSwap} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Executar Nova Troca Direta
            </span>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setSwapType('one_time')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  swapType === 'one_time'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pontual (1 Dia)
              </button>
              <button
                type="button"
                onClick={() => setSwapType('permanent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  swapType === 'permanent'
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Permanente (Grade Fixa)
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Source Program */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {authRole === 'host' ? '1. Seu Programa' : '1. Programa de Origem'}
              </label>
              <select
                value={effectiveSourceId}
                onChange={(e) => setSourceProgramId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
              >
                {ownedPrograms.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.title} ({formatDayName(p.dayOfWeek, p.daysLabel)} • {p.startTime}–{p.endTime})
                  </option>
                ))}
              </select>
              {sourceProg && (
                <div className="text-[11px] text-zinc-400 flex items-center gap-2 font-mono tabular-nums pt-0.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>
                    {sourceProg.host} • {formatPhoneDisplay(getHostPhoneForProgram(sourceProg))}
                  </span>
                </div>
              )}
            </div>

            {/* Target Program */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                2. Trocar Horário com o Programa
              </label>
              <select
                value={effectiveTargetId}
                onChange={(e) => setTargetProgramId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
              >
                {targetOptions.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.title} — {p.host} ({formatDayName(p.dayOfWeek, p.daysLabel)} • {p.startTime}–{p.endTime})
                  </option>
                ))}
              </select>
              {targetProg && (
                <div className="text-[11px] text-zinc-400 flex items-center gap-2 font-mono tabular-nums pt-0.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>
                    {targetProg.host} • {formatPhoneDisplay(getHostPhoneForProgram(targetProg))}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swapType === 'one_time' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Data da Troca Pontual (1 Dia) *
                </label>
                <input
                  type="date"
                  value={targetDate}
                  min={todayYmd}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white font-mono tabular-nums outline-none"
                  required
                />
              </div>
            )}

            <div className={swapType === 'one_time' ? '' : 'md:col-span-2'}>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Aviso / Observação para o Registro (Opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Combinado entre apresentadores por viagem / cobertura..."
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          </div>

          {/* Live Preview */}
          {sourceProg && targetProg && (
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-zinc-200">
                  {swapType === 'one_time'
                    ? `Prévia para o dia ${targetDate.split('-').reverse().join('/')}:`
                    : 'Prévia da Nova Grade Fixa Permanente:'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Celular no ar acompanha o locutor de cada programa
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono tabular-nums text-[11px]">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-white font-sans font-bold truncate">{sourceProg.title}</span>
                  <span className="text-amber-300 shrink-0 flex items-center gap-1">
                    <span>{sourceProg.startTime}–{sourceProg.endTime}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-emerald-400">{targetProg.startTime}–{targetProg.endTime}</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-white font-sans font-bold truncate">{targetProg.title}</span>
                  <span className="text-amber-300 shrink-0 flex items-center gap-1">
                    <span>{targetProg.startTime}–{targetProg.endTime}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-emerald-400">{sourceProg.startTime}–{sourceProg.endTime}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !sourceProg || !targetProg}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Aplicando Troca...'
                  : swapType === 'one_time'
                  ? 'Confirmar Troca Pontual (1 Dia)'
                  : 'Confirmar Troca Permanente'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Audit & Notification Log */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-black text-white font-display">
              Avisos & Histórico de Trocas ({visibleSwaps.length})
            </h4>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setHistoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                historyFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('active_today')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                historyFilter === 'active_today' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Em Vigor Hoje
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('upcoming')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                historyFilter === 'upcoming' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pontuais Ativas
            </button>
          </div>
        </div>

        {visibleSwaps.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
            <Clock className="w-6 h-6 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-300">Nenhuma troca registrada neste filtro</p>
            <p className="text-[11px] text-zinc-500">
              Toda troca direta (pontual ou permanente) fica registrada aqui automaticamente como aviso para os locutores e diretoria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden">
            {visibleSwaps.map((s) => {
              const isTodayActive = s.type === 'one_time' && s.status === 'active' && s.targetDate === todayYmd;
              const isCancelled = s.status === 'cancelled';

              return (
                <div
                  key={s.id}
                  className="p-3.5 bg-zinc-950 hover:bg-zinc-900/60 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.type === 'one_time' ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono tabular-nums border ${
                            isCancelled
                              ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                              : isTodayActive
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-950/50 text-blue-300 border-blue-700/40'
                          }`}
                        >
                          {isCancelled
                            ? `Cancelada • ${s.targetDate?.split('-').reverse().join('/')}`
                            : isTodayActive
                            ? `Em Vigor Hoje (${s.targetDate?.split('-').reverse().join('/')})`
                            : `Pontual 1 Dia • ${s.targetDate?.split('-').reverse().join('/')}`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Troca Permanente Aplicada
                        </span>
                      )}

                      <span className="text-[11px] text-zinc-400">
                        Registrado por <strong className="text-zinc-200">{s.initiatedByHostName}</strong>
                      </span>
                    </div>

                    <div className="text-xs text-white font-bold flex flex-wrap items-center gap-1.5">
                      <span>{s.sourceProgramTitle}</span>
                      <span className="text-zinc-500 font-normal">({s.sourceHostName})</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{s.targetProgramTitle}</span>
                      <span className="text-zinc-500 font-normal">({s.targetHostName})</span>
                    </div>

                    <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                      Faixas permutadas: {s.sourceSlot.startTime}–{s.sourceSlot.endTime} ⇄ {s.targetSlot.startTime}–{s.targetSlot.endTime}
                    </div>

                    {s.note && (
                      <p className="text-[11px] text-zinc-300 italic">“{s.note}”</p>
                    )}
                  </div>

                  {s.type === 'one_time' && s.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleCancelSwap(s)}
                      disabled={cancellingId === s.id}
                      className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {cancellingId === s.id ? (
                        <span>Cancelando...</span>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelar Troca Pontual</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
