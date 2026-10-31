import { useMemo } from 'react';
import { monthPeriod, monthsPeriod, previousPeriod } from '@/domain/periods';
import { comparePeriods, expenseDistribution, monthlySeries, periodIndicators } from '@/domain/reports';
import type { MonthKey, Period } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { formatMonthLabel, formatMonthShort, todayIso } from '@/utils/dates';

export type ReportInterval = 'month' | 'six-months' | 'year';

/** Quantidade mínima de meses exibida nos gráficos de evolução. */
const TREND_MONTHS = 6;

function resolvePeriod(interval: ReportInterval, month: MonthKey): Period {
  if (interval === 'month') return monthPeriod(month);
  if (interval === 'six-months') return monthsPeriod(month, 6);
  // Ano até o mês selecionado (inclui lançamentos planejados quando o mês é futuro).
  return { start: `${month.slice(0, 4)}-01-01`, end: monthPeriod(month).end };
}

export function intervalLabel(interval: ReportInterval, month: MonthKey): string {
  if (interval === 'month') return formatMonthLabel(month);
  if (interval === 'six-months') return `6 meses até ${formatMonthShort(month)}/${month.slice(0, 4)}`;
  return `${month.slice(0, 4)} até ${formatMonthShort(month)}`;
}

export function useReport(interval: ReportInterval, month: MonthKey) {
  const { transactions, categories } = useFinanceData();
  const today = todayIso();

  return useMemo(() => {
    const period = resolvePeriod(interval, month);
    const previous = previousPeriod(period);
    const months = Number(month.slice(5, 7));
    const trendPeriod = interval === 'year' && months >= TREND_MONTHS ? period : monthsPeriod(month, TREND_MONTHS);
    return {
      period,
      previous,
      comparison: comparePeriods(transactions, period, previous),
      series: monthlySeries(transactions, trendPeriod),
      distribution: expenseDistribution(transactions, categories, period),
      indicators: periodIndicators(transactions, period, today),
      transactionsInPeriod: transactions
        .filter((t) => t.date >= period.start && t.date <= period.end)
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [transactions, categories, interval, month, today]);
}
