import type { Category, Cents, IsoDate, Period, Transaction, TransactionType } from '@/models';
import { addMonths, monthKeyOf } from '@/utils/dates';
import { normalizeText } from '@/utils/format';
import { lastDaysPeriod, monthPeriod } from './periods';

export type PeriodFilter = 'this-month' | 'last-7-days' | 'previous-month' | 'all';
export type TypeFilter = 'all' | TransactionType;

export interface TransactionFilters {
  search: string;
  period: PeriodFilter;
  type: TypeFilter;
  /** `null` = todas as categorias. */
  categoryId: string | null;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  period: 'this-month',
  type: 'all',
  categoryId: null,
};

export function resolvePeriodFilter(filter: PeriodFilter, today: IsoDate): Period | null {
  const month = monthKeyOf(today);
  switch (filter) {
    case 'this-month':
      return monthPeriod(month);
    case 'last-7-days':
      return lastDaysPeriod(today, 7);
    case 'previous-month':
      return monthPeriod(addMonths(month, -1));
    case 'all':
      return null;
  }
}

/** Ordena do mais recente para o mais antigo (desempate pela criação). */
export const sortByDateDesc = (a: Transaction, b: Transaction): number =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export function filterTransactions(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  filters: TransactionFilters,
  today: IsoDate,
): Transaction[] {
  const period = resolvePeriodFilter(filters.period, today);
  const query = normalizeText(filters.search);
  const categoryNames = new Map(categories.map((c) => [c.id, normalizeText(c.name)]));

  return transactions
    .filter((t) => {
      if (period && (t.date < period.start || t.date > period.end)) return false;
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
      if (query) {
        const haystack = `${normalizeText(t.description)} ${categoryNames.get(t.categoryId) ?? ''} ${normalizeText(t.note ?? '')}`;
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort(sortByDateDesc);
}

export interface DayGroup {
  date: IsoDate;
  /** Receitas − despesas do dia. */
  net: Cents;
  items: Transaction[];
}

/** Agrupa por dia mantendo a ordem recebida. */
export function groupByDay(transactions: readonly Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const t of transactions) {
    let group = groups[groups.length - 1];
    if (!group || group.date !== t.date) {
      group = { date: t.date, net: 0, items: [] };
      groups.push(group);
    }
    group.items.push(t);
    group.net += t.type === 'income' ? t.amount : -t.amount;
  }
  return groups;
}

/** Os `limit` lançamentos mais recentes do período (do mais novo para o mais antigo). */
export function latestTransactions(transactions: readonly Transaction[], period: Period, limit: number): Transaction[] {
  return transactions
    .filter((t) => t.date >= period.start && t.date <= period.end)
    .sort(sortByDateDesc)
    .slice(0, limit);
}

export const signedAmount =(t: Transaction): Cents => (t.type === 'income' ? t.amount : -t.amount);
