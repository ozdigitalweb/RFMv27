import { HostAccount, LiveTakeover, ProgramItem, ScheduleSwapRecord } from '../types';
import {
  DEFAULT_STATION_PHONE,
  formatPhoneDisplay,
  getCanonicalPhoneKey,
  isValidCellPhone,
  normalizePhoneDigits,
  phonesMatch,
} from './phoneMatch';

export {
  formatPhoneDisplay,
  getCanonicalPhoneKey,
  isValidCellPhone,
  normalizePhoneDigits,
  phonesMatch,
};

export const DEFAULT_STATION_WHATSAPP = DEFAULT_STATION_PHONE;
export const REB_HOST_ID = 'host-reb';
export const CORINGA_HOST_ID = 'host-coringa';

export function isProtectedSystemHost(host?: Partial<HostAccount> | null): boolean {
  if (!host) return false;
  return (
    host.id === REB_HOST_ID ||
    host.id === CORINGA_HOST_ID ||
    host.username?.toLowerCase() === 'coringa' ||
    Boolean(host.isMascot) ||
    Boolean(host.isFixedCoringa)
  );
}

export function isCoringaHost(host?: Partial<HostAccount> | null): boolean {
  if (!host) return false;
  return (
    host.id === CORINGA_HOST_ID ||
    host.username?.toLowerCase() === 'coringa' ||
    Boolean(host.isFixedCoringa)
  );
}

/**
 * Garante que os perfis fixos do sistema (REB e Coringa) estejam sempre presentes
 * mesmo quando a lista vem de um banco ou cache anterior.
 */
export function ensureSystemHosts(accounts: HostAccount[], defaults: HostAccount[]): HostAccount[] {
  const list = Array.isArray(accounts) ? [...accounts] : [];
  const fixedIds = [REB_HOST_ID, CORINGA_HOST_ID];

  for (const fixedId of fixedIds) {
    const exists = list.some(
      (h) => h.id === fixedId || (fixedId === CORINGA_HOST_ID && h.username?.toLowerCase() === 'coringa')
    );
    if (!exists) {
      const def = defaults.find((d) => d.id === fixedId);
      if (def) {
        if (fixedId === CORINGA_HOST_ID) {
          const rebIndex = list.findIndex((h) => h.id === REB_HOST_ID);
          if (rebIndex >= 0) {
            list.splice(rebIndex + 1, 0, def);
          } else {
            list.unshift(def);
          }
        } else {
          list.unshift(def);
        }
      }
    }
  }

  return list;
}

/**
 * Encontra a conta de locutor vinculada a um programa (por hostAccountId, vínculo programIds ou nome).
 */
export function findLinkedHostAccount(
  program: Partial<ProgramItem> | null | undefined,
  hostAccounts: HostAccount[]
): HostAccount | undefined {
  if (!program || !Array.isArray(hostAccounts) || hostAccounts.length === 0) return undefined;

  if (program.hostAccountId) {
    const byId = hostAccounts.find((h) => h.id === program.hostAccountId);
    if (byId) return byId;
  }

  if (program.id) {
    const progIdStr = String(program.id);
    const byProgId = hostAccounts.find(
      (h) =>
        (Array.isArray(h.programIds) && h.programIds.includes(progIdStr)) ||
        (h.programId && String(h.programId) === progIdStr)
    );
    if (byProgId) return byProgId;
  }

  const progHostLower = (program.host || '').toLowerCase().trim();
  if (progHostLower) {
    const exactMatch = hostAccounts.find(
      (h) =>
        (h.name || '').toLowerCase().trim() === progHostLower ||
        (h.username || '').toLowerCase().trim() === progHostLower
    );
    if (exactMatch) return exactMatch;

    const partialMatch = hostAccounts.find((h) => {
      if (isCoringaHost(h)) return false;
      const hName = (h.name || '').toLowerCase().trim();
      return Boolean(hName) && (progHostLower.includes(hName) || hName.includes(progHostLower));
    });
    if (partialMatch) return partialMatch;
  }

  return undefined;
}

/**
 * Verifica se uma conta de locutor é titular/responsável por um programa específico.
 */
export function isHostOwnerOfProgram(
  host: Partial<HostAccount> | null | undefined,
  program: Partial<ProgramItem> | null | undefined
): boolean {
  if (!host || !program) return false;
  if (isCoringaHost(host)) return false;

  const progIdStr = program.id !== undefined && program.id !== null ? String(program.id) : '';

  if (program.hostAccountId && host.id && String(program.hostAccountId) === String(host.id)) {
    return true;
  }
  if (progIdStr && Array.isArray(host.programIds) && host.programIds.map(String).includes(progIdStr)) {
    return true;
  }
  if (progIdStr && host.programId && String(host.programId) === progIdStr) {
    return true;
  }

  const hostName = (host.name || '').toLowerCase().trim();
  const hostUser = (host.username || '').toLowerCase().trim();
  const progHost = (program.host || '').toLowerCase().trim();

  if (!progHost) return false;
  if (hostName && (progHost === hostName || progHost.includes(hostName) || hostName.includes(progHost))) {
    return true;
  }
  if (hostUser && progHost === hostUser) {
    return true;
  }

  return false;
}

/**
 * Identifica telefones duplicados entre locutores ativos (ex.: contas antigas ainda com o número genérico da rádio).
 */
export function findDuplicateHostPhones(accounts: HostAccount[]): Record<string, HostAccount[]> {
  const byPhone = new Map<string, HostAccount[]>();
  accounts.forEach((acc) => {
    if (acc.status === 'pending' || isCoringaHost(acc)) return;
    const key = getCanonicalPhoneKey(acc.whatsapp);
    if (!key) return;
    const existing = byPhone.get(key) || [];
    existing.push(acc);
    byPhone.set(key, existing);
  });

  const duplicates: Record<string, HostAccount[]> = {};
  byPhone.forEach((list, key) => {
    if (list.length > 1) {
      duplicates[key] = list;
    }
  });
  return duplicates;
}

/**
 * Retorna data local no formato YYYY-MM-DD para verificação de trocas pontuais de 1 dia.
 */
export function getLocalTodayYmd(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Aplica trocas pontuais ativas para a data de hoje sobre os programas da grade,
 * permutando exclusivamente a janela de horário (dia, início, fim e rótulo) entre os dois programas
 * e preservando o locutor e celular de quem realmente entra naquela faixa horária.
 */
export function applyEffectiveSwapsToPrograms(
  programs: ProgramItem[],
  swaps: ScheduleSwapRecord[],
  todayYmd: string = getLocalTodayYmd()
): ProgramItem[] {
  if (!Array.isArray(programs) || programs.length === 0) return programs;
  if (!Array.isArray(swaps) || swaps.length === 0) return programs;

  const activeToday = swaps
    .filter((s) => s.type === 'one_time' && s.status === 'active' && s.targetDate === todayYmd)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (activeToday.length === 0) return programs;

  const result = programs.map((p) => ({ ...p }));

  for (const swap of activeToday) {
    const idxA = result.findIndex((p) => String(p.id) === String(swap.sourceProgramId));
    const idxB = result.findIndex((p) => String(p.id) === String(swap.targetProgramId));
    if (idxA === -1 || idxB === -1 || idxA === idxB) continue;

    const progA = result[idxA];
    const progB = result[idxB];

    const slotA = {
      dayOfWeek: progA.dayOfWeek,
      startTime: progA.startTime,
      endTime: progA.endTime,
      daysLabel: progA.daysLabel,
    };
    const slotB = {
      dayOfWeek: progB.dayOfWeek,
      startTime: progB.startTime,
      endTime: progB.endTime,
      daysLabel: progB.daysLabel,
    };

    result[idxA] = {
      ...progA,
      dayOfWeek: slotB.dayOfWeek,
      startTime: slotB.startTime,
      endTime: slotB.endTime,
      daysLabel: `Troca Pontual Hoje (${slotB.startTime}–${slotB.endTime})`,
      swappedNotice: `Horário trocado hoje com ${progB.title}`,
      swappedWithTitle: progB.title,
      swappedDate: todayYmd,
    };

    result[idxB] = {
      ...progB,
      dayOfWeek: slotA.dayOfWeek,
      startTime: slotA.startTime,
      endTime: slotA.endTime,
      daysLabel: `Troca Pontual Hoje (${slotA.startTime}–${slotA.endTime})`,
      swappedNotice: `Horário trocado hoje com ${progA.title}`,
      swappedWithTitle: progA.title,
      swappedDate: todayYmd,
    };
  }

  return result;
}

/**
 * Resolve o WhatsApp oficial de um locutor (ou padrão da emissora).
 */
export function resolveHostWhatsapp(
  host: Partial<HostAccount> | null | undefined,
  stationWhatsapp?: string
): string {
  const hostPhone = host?.whatsapp?.trim();
  if (hostPhone) return hostPhone;
  return stationWhatsapp?.trim() || DEFAULT_STATION_WHATSAPP;
}

/**
 * Resolve o WhatsApp de comunicação com o ouvinte SEMPRE a partir do locutor:
 * 1. Se houver substituição/Coringa ativa para o programa, usa o WhatsApp do locutor no ar.
 * 2. Caso contrário, busca o WhatsApp do HostAccount vinculado ao programa.
 * 3. Fallback final: WhatsApp geral da emissora.
 */
export function resolveProgramWhatsapp(
  program: Partial<ProgramItem> | null | undefined,
  hostAccounts: HostAccount[],
  stationWhatsapp?: string,
  liveTakeover?: LiveTakeover | null
): string {
  const stationFallback = stationWhatsapp?.trim() || DEFAULT_STATION_WHATSAPP;

  if (
    liveTakeover?.isActive &&
    program &&
    (program.isSubstituted ||
      program.isCoringaActive ||
      (liveTakeover.targetProgramId && String(liveTakeover.targetProgramId) === String(program.id)))
  ) {
    if (liveTakeover.substituteHostId) {
      const subHost = hostAccounts.find((h) => h.id === liveTakeover.substituteHostId);
      if (subHost?.whatsapp?.trim()) return subHost.whatsapp.trim();
    }
    if (liveTakeover.substituteWhatsapp?.trim()) {
      return liveTakeover.substituteWhatsapp.trim();
    }
    return stationFallback;
  }

  const linkedHost = findLinkedHostAccount(program, hostAccounts);
  if (linkedHost?.whatsapp?.trim()) {
    return linkedHost.whatsapp.trim();
  }

  return stationFallback;
}
