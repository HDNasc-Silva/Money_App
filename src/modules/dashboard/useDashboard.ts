import { useMemo } from 'react';
import { buildAlerts } from '@/domain/alerts';
import { categoryBudgets } from '@/domain/budgets';
import { isFutureMonth, monthPeriod } from '@/domain/periods';
import { periodIndicators, weeklyBreakdown } from '@/domain/reports';
import { cumulativeBalance, percentChange, summarizePeriod } from '@/domain/summary';
import { useFinanceData } from '@/store/FinanceProvider';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { addMonths, lastDayOfMonth, todayIso } from '@/utils/dates';

/** Dados derivados da Visão Geral para o mês selecionado (sem estado próprio). */
export function useDashboard() {
  const { transactions, categories, goals } = useFinanceData();
  const { month } = useSelectedMonth();
  const today = todayIso();

  return useMemo(() => {
    const summary = summarizePeriod(transactions, monthPeriod(month));
    const previous = summarizePeriod(transactions, monthPeriod(addMonths(month, -1)));
    const isFuture = isFutureMonth(month, today);
    // Mês passado: saldo ao fim do mês. Mês atual: saldo até hoje.
    // Mês futuro: saldo previsto ao fim do mês, incluindo lançamentos planejados.
    const balanceDate = isFuture || lastDayOfMonth(month) < today ? lastDayOfMonth(month) : today;
    return {
      month,
      isFuture,
      summary,
      incomeChange: percentChange(summary.income, previous.income),
      balance: cumulativeBalance(transactions, balanceDate),
      weeks: weeklyBreakdown(transactions, month),
      budgets: categoryBudgets(transactions, categories, month),
      alerts: buildAlerts({ transactions, categories, goals, month, today }),
      indicators: periodIndicators(transactions, monthPeriod(month), today),
    };
  }, [transactions, categories, goals, month, today]);
}
