export const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

/**
 * Remove horários redundantes embutidos dentro de strings de dias (ex: "Terça-feira às 22:00" vira "Terça-feira")
 */
export function cleanDayString(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/\s*(às|das)\s*\d{1,2}:\d{2}.*$/i, '')
    .replace(/\s*\(\s*\d{1,2}:\d{2}.*\)/i, '')
    .replace(/\s*-\s*\d{1,2}:\d{2}.*$/i, '')
    .trim();
}

/**
 * Retorna apenas o nome do dia do programa principal sem duplicação de horário
 */
export function getCleanDayName(program: {
  dayOfWeek?: number;
  daysLabel?: string | null;
}): string {
  const cleaned = cleanDayString(program.daysLabel);
  if (cleaned) return cleaned;

  if (program.dayOfWeek === -1) return 'Diariamente';
  if (
    program.dayOfWeek !== undefined &&
    program.dayOfWeek >= 0 &&
    program.dayOfWeek <= 6
  ) {
    return DAY_NAMES[program.dayOfWeek];
  }
  return 'Todos os dias';
}

/**
 * Retorna a linha completa do horário de transmissão principal sem redundâncias
 * Ex: "Terça-feira • 22:00 às 23:00" ou "Segunda a Sexta • 08:00 às 12:00"
 */
export function formatMainSchedule(program: {
  dayOfWeek?: number;
  daysLabel?: string | null;
  startTime?: string;
  endTime?: string;
}): string {
  const day = getCleanDayName(program);
  if (program.startTime && program.endTime) {
    return `${day} • ${program.startTime} às ${program.endTime}`;
  }
  if (program.startTime) {
    return `${day} às ${program.startTime}`;
  }
  return day;
}

/**
 * Retorna apenas o nome do dia da reprise sem duplicação de horário
 */
export function getCleanRepriseDayName(program: {
  repriseDayOfWeek?: number;
  repriseDaysLabel?: string | null;
}): string {
  const cleaned = cleanDayString(program.repriseDaysLabel);
  if (cleaned) return cleaned;

  if (program.repriseDayOfWeek === -1) return 'Diariamente';
  if (
    program.repriseDayOfWeek !== undefined &&
    program.repriseDayOfWeek >= 0 &&
    program.repriseDayOfWeek <= 6
  ) {
    return DAY_NAMES[program.repriseDayOfWeek];
  }
  return 'Sábado';
}

/**
 * Retorna a linha da reprise formatada sem repetição de horário
 * Ex: "Sexta-feira • 16:00 às 17:00"
 */
export function formatRepriseSchedule(program: {
  hasReprise?: boolean;
  repriseDayOfWeek?: number;
  repriseDaysLabel?: string | null;
  repriseStartTime?: string | null;
  repriseEndTime?: string | null;
}): string {
  if (!program.hasReprise) return '';
  const day = getCleanRepriseDayName(program);
  if (program.repriseStartTime && program.repriseEndTime) {
    return `${day} • ${program.repriseStartTime} às ${program.repriseEndTime}`;
  }
  if (program.repriseStartTime) {
    return `${day} às ${program.repriseStartTime}`;
  }
  if (program.repriseDaysLabel) {
    return program.repriseDaysLabel;
  }
  return day;
}

/**
 * Converte horário "HH:MM" para minutos desde 00:00 (0..1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const hours = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const minutes = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return hours * 60 + minutes;
}

/**
 * Calcula a distância em minutos a partir de agora (`now`) até a execução mais próxima do slot:
 * - 0 se estiver em execução agora (ao vivo no ar ou dentro do horário atual)
 * - > 0 para execuções futuras da mais próxima até a mais distante no ciclo semanal (até 7 dias)
 */
export function getSlotExecutionDistanceMinutes(
  slotDayOfWeek: number,
  startTimeStr?: string | null,
  endTimeStr?: string | null,
  isLiveOverride = false,
  now: Date = new Date()
): number {
  if (isLiveOverride) return 0;

  const todayDay = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMins = parseTimeToMinutes(startTimeStr);
  const rawEndMins = parseTimeToMinutes(endTimeStr);
  const wrapsMidnight = rawEndMins <= startMins;
  const effectiveEndMins = wrapsMidnight ? rawEndMins + 1440 : rawEndMins;

  if (slotDayOfWeek === -1) {
    if (nowMinutes >= startMins && nowMinutes < effectiveEndMins) {
      return 0;
    }
    if (wrapsMidnight && nowMinutes < rawEndMins) {
      return 0;
    }
    if (startMins > nowMinutes) {
      return startMins - nowMinutes;
    }
    return 1440 - nowMinutes + startMins;
  }

  if (slotDayOfWeek >= 0 && slotDayOfWeek <= 6) {
    const prevDay = (todayDay + 6) % 7;
    if (
      (slotDayOfWeek === todayDay && nowMinutes >= startMins && nowMinutes < effectiveEndMins) ||
      (wrapsMidnight && slotDayOfWeek === prevDay && nowMinutes < rawEndMins)
    ) {
      return 0;
    }

    const daysAhead = (slotDayOfWeek - todayDay + 7) % 7;
    let delta = daysAhead * 1440 + (startMins - nowMinutes);
    if (delta < 0) {
      delta += 7 * 1440;
    }
    return delta;
  }

  return Number.MAX_SAFE_INTEGER;
}

