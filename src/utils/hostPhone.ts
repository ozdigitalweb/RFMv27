import { HostAccount, LiveTakeover, ProgramItem } from '../types';

export const DEFAULT_STATION_WHATSAPP = '5548991984678';
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
