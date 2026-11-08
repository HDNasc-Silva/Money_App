import { EMPTY_DATA, type Category, type FinanceData, type Goal, type Loan, type Settings, type Subscription, type Transaction } from '@/models';

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
  | { type: 'categories/added'; categories: Category[] }
  | { type: 'goal/saved'; goal: Goal }
  | { type: 'goal/removed'; id: string }
  | { type: 'subscription/saved'; subscription: Subscription }
  | { type: 'subscription/removed'; id: string }
  /**
   * Resultado da geração de cobranças: só os lançamentos CRIADOS nesta sincronização (não o array
   * inteiro recalculado) — assim o merge soma sobre o estado mais atual, em vez de substituí-lo por
   * uma leitura que pode estar desatualizada (ex.: duas sincronizações automáticas concorrentes,
   * uma de assinaturas e outra de empréstimos, DT-027).
   */
  | { type: 'subscriptions/synced'; created: Transaction[]; subscriptions: Subscription[] }
  | { type: 'loan/saved'; loan: Loan }
  | { type: 'loan/removed'; id: string }
  /** Resultado da geração de pagamentos de empréstimos: só as parcelas CRIADAS nesta sincronização (DT-027). */
  | { type: 'loans/synced'; created: Transaction[] }
  | { type: 'settings/saved'; settings: Settings }
  | { type: 'notice/dismissed' };

function upsert<T extends { id: string }>(items: readonly T[], item: T): T[] {
  return items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
}

const withoutId = <T extends { id: string }>(items: readonly T[], id: string): T[] => items.filter((i) => i.id !== id);

/** Insere os itens criados que ainda não existem (por id) — idempotente, soma sobre o estado atual. */
function appendNew<T extends { id: string }>(items: readonly T[], created: readonly T[]): T[] {
  if (created.length === 0) return [...items];
  const ids = new Set(items.map((i) => i.id));
  const additions = created.filter((i) => !ids.has(i.id));
  return additions.length === 0 ? [...items] : [...items, ...additions];
}

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
    case 'categories/added':
      return { ...state, data: { ...data, categories: action.categories.reduce<Category[]>((items, category) => upsert(items, category), data.categories) } };
    case 'goal/saved':
      return { ...state, data: { ...data, goals: upsert(data.goals, action.goal) } };
    case 'goal/removed':
      return { ...state, data: { ...data, goals: withoutId(data.goals, action.id) } };
    case 'subscription/saved':
      return { ...state, data: { ...data, subscriptions: upsert(data.subscriptions, action.subscription) } };
    case 'subscription/removed':
      return { ...state, data: { ...data, subscriptions: withoutId(data.subscriptions, action.id) } };
    case 'subscriptions/synced':
      return { ...state, data: { ...data, transactions: appendNew(data.transactions, action.created), subscriptions: action.subscriptions } };
    case 'loan/saved':
      return { ...state, data: { ...data, loans: upsert(data.loans, action.loan) } };
    case 'loan/removed':
      return { ...state, data: { ...data, loans: withoutId(data.loans, action.id) } };
    case 'loans/synced':
      return { ...state, data: { ...data, transactions: appendNew(data.transactions, action.created) } };
    case 'settings/saved':
      return { ...state, data: { ...data, settings: action.settings } };
    case 'notice/dismissed':
      return { ...state, notice: null };
  }
}
