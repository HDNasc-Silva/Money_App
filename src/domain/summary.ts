import type { Cents, IsoDate, Period, Transaction } from '@/models';
import { isInPeriod } from './periods';

export interface PeriodSummary {
  income: Cents;
  expense: Cents;
  /** Receitas − despesas (pode ser negativo). */
  balance: Cents;
  /** Parte positiva do saldo. */
  savings: Cents;
  /** Poupança ÷ receitas (0 quando não há receitas). */
  savingsRate: number;
  count: number;
}

export const filterByPeriod = (transactions: readonly Transaction[], period: Period): Transaction[] =>
  transactions.filter((t) => isInPeriod(t.date, period));

export function summarize(transactions: readonly Transaction[]): PeriodSummary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  const balance = income - expense;
  const savings = Math.max(balance, 0);
  return {
    income,
    expense,
    balance,
    savings,
    savingsRate: income > 0 ? savings / income : 0,
    count: transactions.length,
  };
}

export const summarizePeriod = (transactions: readonly Transaction[], period: Period): PeriodSummary =>
  summarize(filterByPeriod(transactions, period));

/** Saldo acumulado de todos os lançamentos até `date` (inclusive). */
export function cumulativeBalance(transactions: readonly Transaction[], date: IsoDate): Cents {
  return transactions.reduce((total, t) => {
    if (t.date > date) return total;
    return total + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
}

/**
 * Variação relativa entre dois valores. Retorna `null` quando não há base de comparação.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
