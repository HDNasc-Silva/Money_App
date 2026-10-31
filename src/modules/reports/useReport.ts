import { useMemo } from 'react';
import {
  contributionsInPeriod,
  goalForecast,
  goalProgress,
  goalsSummary,
  monthlyContributions,
  savedDistribution,
  savedEvolution,
  totalSaved,
} from '@/domain/goals';
import { monthPeriod, monthsInPeriod, monthsPeriod, previousPeriod } from '@/domain/periods';
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
  const { transactions, categories, goals } = useFinanceData();
  const today = todayIso();

  return useMemo(() => {
    const period = resolvePeriod(interval, month);
    const previous = previousPeriod(period);
    const months = Number(month.slice(5, 7));
    const trendPeriod = interval === 'year' && months >= TREND_MONTHS ? period : monthsPeriod(month, TREND_MONTHS);
    const trendMonths = monthsInPeriod(trendPeriod);
    return {
      period,
      previous,
      /** Metas: estoque atual (guardado, falta, concluídas) e fluxo do período (aportes). */
      goals: {
        count: goals.length,
        summary: goalsSummary(goals),
        totalSaved: totalSaved(goals),
        contributed: contributionsInPeriod(goals, period),
        previousContributed: contributionsInPeriod(goals, previous),
        monthly: monthlyContributions(goals, trendMonths),
        evolution: savedEvolution(goals, trendMonths),
        distribution: savedDistribution(goals),
        items: goals.map((goal) => ({ goal, progress: goalProgress(goal), forecast: goalForecast(goal, today) })),
      },
      comparison: comparePeriods(transactions, period, previous),
      series: monthlySeries(transactions, trendPeriod),
      distribution: expenseDistribution(transactions, categories, period),
      indicators: periodIndicators(transactions, period, today),
      transactionsInPeriod: transactions
        .filter((t) => t.date >= period.start && t.date <= period.end)
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [transactions, categories, goals, interval, month, today]);
}

export type Report = ReturnType<typeof useReport>;
export type GoalsReport = Report['goals'];
