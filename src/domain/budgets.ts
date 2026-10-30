import type { Category, Cents, MonthKey, Transaction } from '@/models';
import { monthPeriod } from './periods';
import { filterByPeriod } from './summary';

/** A partir deste consumo (80%) a categoria entra em atenção. */
export const BUDGET_WARNING_RATIO = 0.8;

export type BudgetStatus = 'none' | 'ok' | 'warning' | 'exceeded';

export interface CategoryBudget {
  category: Category;
  spent: Cents;
  limit: Cents | null;
  /** Consumo do limite (1 = 100%); `null` sem limite. */
  ratio: number | null;
  /** Limite − gasto (negativo quando excedido); `null` sem limite. */
  remaining: Cents | null;
  status: BudgetStatus;
}

export function budgetStatus(ratio: number | null): BudgetStatus {
  if (ratio === null) return 'none';
  if (ratio > 1) return 'exceeded';
  if (ratio >= BUDGET_WARNING_RATIO) return 'warning';
  return 'ok';
}

export function spendingByCategory(transactions: readonly Transaction[]): Map<string, Cents> {
  const totals = new Map<string, Cents>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  return totals;
}

/** Orçamento de cada categoria de despesa no mês, na ordem original das categorias. */
export function categoryBudgets(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  month: MonthKey,
): CategoryBudget[] {
  const spent = spendingByCategory(filterByPeriod(transactions, monthPeriod(month)));
  return categories
    .filter((c) => c.kind === 'expense')
    .map((category) => {
      const total = spent.get(category.id) ?? 0;
      const limit = category.monthlyLimit && category.monthlyLimit > 0 ? category.monthlyLimit : null;
      const ratio = limit === null ? null : total / limit;
      return {
        category,
        spent: total,
        limit,
        ratio,
        remaining: limit === null ? null : limit - total,
        status: budgetStatus(ratio),
      };
    });
}

export interface GlobalBudget {
  /** Soma dos limites das categorias com limite. */
  limit: Cents;
  /** Despesas do mês nas categorias com limite. */
  spent: Cents;
  available: Cents;
  ratio: number | null;
  status: BudgetStatus;
}

export function globalBudget(budgets: readonly CategoryBudget[]): GlobalBudget {
  let limit = 0;
  let spent = 0;
  for (const b of budgets) {
    if (b.limit === null) continue;
    limit += b.limit;
    spent += b.spent;
  }
  const ratio = limit > 0 ? spent / limit : null;
  return { limit, spent, available: limit - spent, ratio, status: budgetStatus(ratio) };
}
