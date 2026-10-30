import type { Category, Cents, IsoDate, MonthKey, Period, Transaction } from '@/models';
import { daysBetweenInclusive, daysInMonth, lastDayOfMonth, monthKeyOf } from '@/utils/dates';
import { spendingByCategory } from './budgets';
import { monthPeriod, monthsInPeriod } from './periods';
import { cumulativeBalance, filterByPeriod, summarize } from './summary';

export interface WeekBucket {
  label: string;
  start: IsoDate;
  end: IsoDate;
  income: Cents;
  expense: Cents;
}

/** Semanas do mês: 1–7, 8–14, 15–21, 22–28 e 29–fim (quando existir). */
export function weeklyBreakdown(transactions: readonly Transaction[], month: MonthKey): WeekBucket[] {
  const totalDays = daysInMonth(month);
  const buckets: WeekBucket[] = [];
  for (let firstDay = 1, index = 1; firstDay <= totalDays; firstDay += 7, index += 1) {
    const lastDay = Math.min(firstDay + 6, totalDays);
    const start = `${month}-${String(firstDay).padStart(2, '0')}`;
    const end = `${month}-${String(lastDay).padStart(2, '0')}`;
    const summary = summarize(filterByPeriod(transactions, { start, end }));
    buckets.push({ label: `Sem ${index}`, start, end, income: summary.income, expense: summary.expense });
  }
  return buckets;
}

export interface MonthPoint {
  month: MonthKey;
  income: Cents;
  expense: Cents;
  saved: Cents;
  savingsRate: number;
  /** Saldo acumulado ao fim do mês. */
  closingBalance: Cents;
}

export function monthlySeries(transactions: readonly Transaction[], period: Period): MonthPoint[] {
  return monthsInPeriod(period).map((month) => {
    const summary = summarize(filterByPeriod(transactions, monthPeriod(month)));
    return {
      month,
      income: summary.income,
      expense: summary.expense,
      saved: summary.savings,
      savingsRate: summary.savingsRate,
      closingBalance: cumulativeBalance(transactions, lastDayOfMonth(month)),
    };
  });
}

export interface CategoryShare {
  categoryId: string;
  name: string;
  icon: string;
  amount: Cents;
  /** Participação no total de despesas (0–1). */
  share: number;
}

/** Despesas por categoria no período, da maior para a menor. */
export function expenseDistribution(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  period: Period,
): CategoryShare[] {
  const totals = spendingByCategory(filterByPeriod(transactions, period));
  const total = [...totals.values()].reduce((sum, v) => sum + v, 0);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = byId.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? 'Sem categoria',
        icon: category?.icon ?? 'help_outline',
        amount,
        share: total > 0 ? amount / total : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface PeriodIndicators {
  days: number;
  /** Dias do período (até hoje) sem nenhuma despesa. */
  noSpendDays: number;
  /** Dias com ao menos um lançamento. */
  daysWithRecords: number;
  largestExpense: Transaction | null;
  averageDailyExpense: Cents;
}

/** Indicadores do período, considerando apenas os dias até `today`. */
export function periodIndicators(
  transactions: readonly Transaction[],
  period: Period,
  today: IsoDate,
): PeriodIndicators {
  const end = period.end < today ? period.end : today;
  if (end < period.start) {
    return { days: 0, noSpendDays: 0, daysWithRecords: 0, largestExpense: null, averageDailyExpense: 0 };
  }
  const inRange = filterByPeriod(transactions, { start: period.start, end });
  const days = daysBetweenInclusive(period.start, end);
  const expenseDays = new Set<IsoDate>();
  const recordDays = new Set<IsoDate>();
  let largestExpense: Transaction | null = null;
  let totalExpense = 0;
  for (const t of inRange) {
    recordDays.add(t.date);
    if (t.type !== 'expense') continue;
    expenseDays.add(t.date);
    totalExpense += t.amount;
    if (!largestExpense || t.amount > largestExpense.amount) largestExpense = t;
  }
  return {
    days,
    noSpendDays: days - expenseDays.size,
    daysWithRecords: recordDays.size,
    largestExpense,
    averageDailyExpense: Math.round(totalExpense / days),
  };
}

export interface PeriodComparison {
  current: ReturnType<typeof summarize>;
  previous: ReturnType<typeof summarize>;
}

export function comparePeriods(
  transactions: readonly Transaction[],
  current: Period,
  previous: Period,
): PeriodComparison {
  return {
    current: summarize(filterByPeriod(transactions, current)),
    previous: summarize(filterByPeriod(transactions, previous)),
  };
}

export const isCurrentMonth = (month: MonthKey, today: IsoDate): boolean => monthKeyOf(today) === month;
