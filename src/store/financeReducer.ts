import { EMPTY_DATA, type Category, type FinanceData, type Goal, type Settings, type Transaction } from '@/models';

export type LoadNotice = 'corrupted' | 'not-persistent' | 'load-failed' | null;

export interface FinanceState {
  status: 'loading' | 'ready';
  data: FinanceData;
  notice: LoadNotice;
}

export const initialFinanceState: FinanceState = { status: 'loading', data: EMPTY_DATA, notice: null };

export type FinanceAction =
  | { type: 'loaded'; data: FinanceData; notice: LoadNotice }
  | { type: 'data/replaced'; data: FinanceData }
  | { type: 'transaction/saved'; transaction: Transaction }
  | { type: 'transaction/removed'; id: string }
  | { type: 'category/saved'; category: Category }
  | { type: 'category/removed'; id: string }
  | { type: 'goal/saved'; goal: Goal }
  | { type: 'goal/removed'; id: string }
  | { type: 'settings/saved'; settings: Settings }
  | { type: 'notice/dismissed' };

function upsert<T extends { id: string }>(items: readonly T[], item: T): T[] {
  return items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
}

const withoutId = <T extends { id: string }>(items: readonly T[], id: string): T[] => items.filter((i) => i.id !== id);

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  const { data } = state;
  switch (action.type) {
    case 'loaded':
      return { status: 'ready', data: action.data, notice: action.notice };
    case 'data/replaced':
      return { ...state, data: action.data };
    case 'transaction/saved':
      return { ...state, data: { ...data, transactions: upsert(data.transactions, action.transaction) } };
    case 'transaction/removed':
      return { ...state, data: { ...data, transactions: withoutId(data.transactions, action.id) } };
    case 'category/saved':
      return { ...state, data: { ...data, categories: upsert(data.categories, action.category) } };
    case 'category/removed':
      return { ...state, data: { ...data, categories: withoutId(data.categories, action.id) } };
    case 'goal/saved':
      return { ...state, data: { ...data, goals: upsert(data.goals, action.goal) } };
    case 'goal/removed':
      return { ...state, data: { ...data, goals: withoutId(data.goals, action.id) } };
    case 'settings/saved':
      return { ...state, data: { ...data, settings: action.settings } };
    case 'notice/dismissed':
      return { ...state, notice: null };
  }
}
