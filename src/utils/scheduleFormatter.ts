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
