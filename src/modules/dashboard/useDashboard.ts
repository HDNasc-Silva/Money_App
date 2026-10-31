import { useMemo } from 'react';
import { buildAlerts } from '@/domain/alerts';
import { categoryBudgets } from '@/domain/budgets';
import { contributionsInPeriod, contributionsUntil } from '@/domain/goals';
import { isFutureMonth, monthPeriod } from '@/domain/periods';
import { periodIndicators, weeklyBreakdown } from '@/domain/reports';
import { projectedSubscriptionExpenses } from '@/domain/subscriptions';
import { cumulativeBalance, percentChange, summarizePeriod } from '@/domain/summary';
import { useFinanceData } from '@/store/FinanceProvider';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { addMonths, lastDayOfMonth, todayIso } from '@/utils/dates';

/** Dados derivados da Visão Geral para o mês selecionado (sem estado próprio). */
export function useDashboard() {
  const { transactions, categories, goals, subscriptions } = useFinanceData();
  const { month } = useSelectedMonth();
  const today = todayIso();

  return useMemo(() => {
    const previousMonth = addMonths(month, -1);
    const summary = summarizePeriod(transactions, monthPeriod(month));
    const previous = summarizePeriod(transactions, monthPeriod(previousMonth));
    // Poupança do mês = aportes em metas com data no mês (DT-016).
    const saved = contributionsInPeriod(goals, monthPeriod(month));
    const previousSaved = contributionsInPeriod(goals, monthPeriod(previousMonth));
    const isFuture = isFutureMonth(month, today);
    // Mês passado: saldo ao fim do mês. Mês atual: saldo até hoje.
    // Mês futuro: saldo previsto ao fim do mês, incluindo lançamentos planejados.
    const balanceDate = isFuture || lastDayOfMonth(month) < today ? lastDayOfMonth(month) : today;
    // Cobranças de assinaturas previstas (ainda não lançadas) até a data do saldo; só existem em meses futuros (DT-017).
    const projectedSubscriptions = projectedSubscriptionExpenses(subscriptions, transactions, today, balanceDate);
    return {
      month,
      isFuture,
      summary,
      saved,
      savedChange: percentChange(saved, previousSaved),
      incomeChange: percentChange(summary.income, previous.income),
      // Saldo disponível: o dinheiro aportado em metas já não está disponível (DT-016).
      balance: cumulativeBalance(transactions, balanceDate) - contributionsUntil(goals, balanceDate) - projectedSubscriptions,
      projectedSubscriptions,
      weeks: weeklyBreakdown(transactions, month),
      budgets: categoryBudgets(transactions, categories, month),
      alerts: buildAlerts({ transactions, categories, goals, month, today }),
      indicators: periodIndicators(transactions, monthPeriod(month), today),
    };
  }, [transactions, categories, goals, subscriptions, month, today]);
}
