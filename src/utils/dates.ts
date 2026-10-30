import type { IsoDate, MonthKey } from '@/models';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

const pad = (value: number): string => String(value).padStart(2, '0');

/** Cria a data local (meio-dia evita problemas de horário de verão). */
export function parseIso(date: IsoDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

export const toIso = (date: Date): IsoDate =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayIso = (): IsoDate => toIso(new Date());

export function isValidIso(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return toIso(parseIso(date)) === date;
}

export const monthKeyOf = (date: IsoDate): MonthKey => date.slice(0, 7);

export function addMonths(month: MonthKey, amount: number): MonthKey {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year ?? 1970, (monthIndex ?? 1) - 1 + amount, 1, 12);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function addDays(date: IsoDate, amount: number): IsoDate {
  const result = parseIso(date);
  result.setDate(result.getDate() + amount);
  return toIso(result);
}

export function daysInMonth(month: MonthKey): number {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year ?? 1970, monthIndex ?? 1, 0).getDate();
}

export const firstDayOfMonth = (month: MonthKey): IsoDate => `${month}-01`;
export const lastDayOfMonth = (month: MonthKey): IsoDate => `${month}-${pad(daysInMonth(month))}`;

/** Quantidade de meses de `from` até `to` (pode ser negativa). */
export function monthsBetween(from: MonthKey, to: MonthKey): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return ((ty ?? 0) - (fy ?? 0)) * 12 + ((tm ?? 0) - (fm ?? 0));
}

/** Dias corridos entre duas datas (inclusive). */
export function daysBetweenInclusive(start: IsoDate, end: IsoDate): number {
  const ms = parseIso(end).getTime() - parseIso(start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function monthName(month: MonthKey): string {
  const index = Number(month.slice(5, 7)) - 1;
  return MONTH_NAMES[index] ?? '';
}

/** "Outubro 2026" */
export const formatMonthLabel = (month: MonthKey): string => `${monthName(month)} ${month.slice(0, 4)}`;

/** "Out" */
export const formatMonthShort = (month: MonthKey): string => monthName(month).slice(0, 3);

/** "Out/2026" */
export const formatMonthYearShort = (month: MonthKey): string =>
  `${formatMonthShort(month)}/${month.slice(0, 4)}`;

/** "24 de Outubro" */
export function formatDayMonth(date: IsoDate): string {
  return `${Number(date.slice(8, 10))} de ${monthName(monthKeyOf(date))}`;
}

/** "24/10/2026" */
export const formatDateBr = (date: IsoDate): string =>
  `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
