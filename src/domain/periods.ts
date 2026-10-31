import type { IsoDate, MonthKey, Period } from '@/models';
import { addDays, addMonths, firstDayOfMonth, lastDayOfMonth, monthKeyOf } from '@/utils/dates';

export const monthPeriod = (month: MonthKey): Period => ({
  start: firstDayOfMonth(month),
  end: lastDayOfMonth(month),
});

/** Período de `count` meses terminando em `endMonth` (inclusive). */
export const monthsPeriod = (endMonth: MonthKey, count: number): Period => ({
  start: firstDayOfMonth(addMonths(endMonth, -(count - 1))),
  end: lastDayOfMonth(endMonth),
});

export const yearPeriod = (year: number): Period => ({
  start: `${year}-01-01`,
  end: `${year}-12-31`,
});

/** Últimos `days` dias até `today` (inclusive). */
export const lastDaysPeriod = (today: IsoDate, days: number): Period => ({
  start: addDays(today, -(days - 1)),
  end: today,
});

export const isInPeriod = (date: IsoDate, period: Period): boolean =>
  date >= period.start && date <= period.end;

/** Período imediatamente anterior, com a mesma quantidade de meses. */
export function previousPeriod(period: Period): Period {
  const startMonth = monthKeyOf(period.start);
  const endMonth = monthKeyOf(period.end);
  const [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  const months = ((ey ?? 0) - (sy ?? 0)) * 12 + ((em ?? 0) - (sm ?? 0)) + 1;
  return monthsPeriod(addMonths(startMonth, -1), months);
}

/**
 * Quantos meses à frente do mês atual o usuário pode navegar e planejar lançamentos
 * (5 anos). Limita erros de digitação (ex.: ano 20266) sem impedir o planejamento.
 */
export const MAX_FUTURE_MONTHS = 60;

/** Último mês permitido para navegação e para datas de lançamentos. */
export const maxPlanningMonth = (today: IsoDate): MonthKey => addMonths(monthKeyOf(today), MAX_FUTURE_MONTHS);

/** Último dia permitido para datas de lançamentos. */
export const maxPlanningDate = (today: IsoDate): IsoDate => lastDayOfMonth(maxPlanningMonth(today));

export const isFutureMonth = (month: MonthKey, today: IsoDate): boolean => month > monthKeyOf(today);

/** Lista de meses (YYYY-MM) cobertos pelo período. */
export function monthsInPeriod(period: Period): MonthKey[] {
  const months: MonthKey[] = [];
  let current = monthKeyOf(period.start);
  const last = monthKeyOf(period.end);
  while (current <= last) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}
