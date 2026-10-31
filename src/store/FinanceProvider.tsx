import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useToast } from '@/components/common/Toast';
import { skipMonth, syncSubscriptionCharges } from '@/domain/subscriptions';
import {
  DEFAULT_SETTINGS,
  EMPTY_DATA,
  type Category,
  type FinanceData,
  type Goal,
  type IsoDate,
  type Settings,
  type Subscription,
  type Transaction,
} from '@/models';
import { createRepositories, type Repositories } from '@/services/repositories';
import { parseFinanceData } from '@/services/storage/FinanceDocument';
import { createDefaultAdapter } from '@/services/storage/StorageAdapter';
import { todayIso } from '@/utils/dates';
import { createId } from '@/utils/id';
import {
  CREATE_SUBSCRIPTIONS_CATEGORY,
  type CategoryDraft,
  type GoalDraft,
  type ProfileDraft,
  type SubscriptionDraft,
  type TransactionDraft,
} from '@/validations';
import {
  buildDefaultCategories,
  findSubscriptionsCategory,
  missingDefaultCategories,
  subscriptionsCategoryToCreate,
} from './defaultCategories';
import { buildDemoData } from './demoData';
import { financeReducer, initialFinanceState, type FinanceState } from './financeReducer';
import { buildInitialData } from './initialData';

/** Erro de regra de negócio, com mensagem pronta para o usuário. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export interface FinanceActions {
  saveTransaction(draft: TransactionDraft, id?: string): Promise<Transaction>;
  duplicateTransaction(id: string): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  saveCategory(draft: CategoryDraft, id?: string): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  /** Adiciona as categorias padrão que faltam (sem duplicar nomes); retorna as que foram criadas. */
  ensureDefaultCategories(): Promise<Category[]>;
  saveGoal(draft: GoalDraft, id?: string): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;
  addContribution(goalId: string, amount: number, date: IsoDate): Promise<Goal>;
  /**
   * Cria ou edita uma assinatura e lança as cobranças cuja data já chegou (DT-017).
   * `draft.categoryId === CREATE_SUBSCRIPTIONS_CATEGORY` cria (ou reutiliza) a categoria "Assinaturas".
   */
  saveSubscription(draft: SubscriptionDraft, id?: string): Promise<Subscription>;
  /** Pausa (`false`) ou retoma (`true`) a assinatura. */
  setSubscriptionActive(id: string, active: boolean): Promise<void>;
  /** Exclui a assinatura; por padrão os lançamentos já gerados são mantidos. */
  deleteSubscription(id: string, options?: { keepTransactions?: boolean }): Promise<void>;
  /** Gera as cobranças de assinaturas que venceram desde a última sincronização (idempotente). */
  syncSubscriptions(): Promise<void>;
  updateSettings(changes: Partial<Settings>): Promise<void>;
  /** Salva o perfil informado na tela de boas-vindas e libera o acesso ao app. */
  completeOnboarding(profile: ProfileDraft): Promise<void>;
  loadDemoData(): Promise<void>;
  clearAllData(): Promise<void>;
  importBackup(json: string): Promise<void>;
  dismissNotice(): void;
}

interface FinanceContextValue {
  state: FinanceState;
  actions: FinanceActions;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

interface FinanceProviderProps {
  children: ReactNode;
  /** Injeção para testes ou para uma futura implementação remota. */
  repositories?: Repositories;
  persistent?: boolean;
}

function defaultRepositories(): { repositories: Repositories; persistent: boolean } {
  const { adapter, persistent } = createDefaultAdapter();
  return { repositories: createRepositories(adapter), persistent };
}

/** Aplica a geração de cobranças de assinaturas a um conjunto de dados (DT-017). */
function withSubscriptionCharges(data: FinanceData): { data: FinanceData; changed: boolean } {
  const result = syncSubscriptionCharges(data.subscriptions, data.transactions, todayIso(), new Date().toISOString());
  if (!result.changed) return { data, changed: false };
  return { data: { ...data, transactions: result.transactions, subscriptions: result.subscriptions }, changed: true };
}

const usedBySubscriptions = (data: FinanceData, categoryId: string) =>
  data.subscriptions.filter((s) => s.categoryId === categoryId).length;

export function FinanceProvider({ children, repositories, persistent = true }: FinanceProviderProps) {
  const [state, dispatch] = useReducer(financeReducer, initialFinanceState);
  const { showToast } = useToast();
  const setupRef = useRef<{ repositories: Repositories; persistent: boolean } | null>(null);
  if (!setupRef.current) {
    setupRef.current = repositories ? { repositories, persistent } : defaultRepositories();
  }
  const repos = setupRef.current.repositories;

  // Referência sempre atualizada ao estado, para as ações não dependerem de re-renderizações.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    const isPersistent = setupRef.current?.persistent ?? true;
    (async () => {
      try {
        const result = await repos.load();
        if (cancelled) return;
        if (result.status === 'ok') {
          // Ao abrir o app, lança as cobranças de assinaturas que venceram desde o último acesso.
          const synced = withSubscriptionCharges(result.data);
          if (synced.changed) {
            try {
              await repos.replaceAll(synced.data);
            } catch {
              // Sem storage, as cobranças ficam em memória e são geradas de novo no próximo acesso.
            }
          }
          if (!cancelled) dispatch({ type: 'loaded', data: synced.data, notice: isPersistent ? null : 'not-persistent' });
          return;
        }
        // Primeiro acesso (ou dados ilegíveis): começa vazio, com as categorias padrão e o onboarding pendente.
        const initial = buildInitialData(new Date().toISOString());
        await repos.replaceAll(initial);
        if (!cancelled) {
          const notice = result.status === 'corrupted' ? 'corrupted' : isPersistent ? null : 'not-persistent';
          dispatch({ type: 'loaded', data: initial, notice });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'loaded', data: EMPTY_DATA, notice: 'load-failed' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repos]);

  /** Persiste uma alteração já aplicada ao estado; falhas viram aviso sem perder o dado em memória. */
  const persist = useCallback(
    async (operation: () => Promise<unknown>) => {
      try {
        await operation();
      } catch {
        showToast({ tone: 'error', message: 'Não foi possível salvar no dispositivo. Os dados ficam disponíveis até fechar o app.' });
      }
    },
    [showToast],
  );

  const actions = useMemo<FinanceActions>(() => {
    const now = () => new Date().toISOString();
    const data = () => stateRef.current.data;

    const replaceData = async (next: FinanceData) => {
      dispatch({ type: 'data/replaced', data: next });
      await persist(() => repos.replaceAll(next));
    };

    const updateSettings = async (changes: Partial<Settings>) => {
      const settings: Settings = { ...data().settings, ...changes };
      dispatch({ type: 'settings/saved', settings });
      await persist(() => repos.settings.save(settings));
    };

    return {
      async saveTransaction(draft, id) {
        const existing = id ? data().transactions.find((t) => t.id === id) : undefined;
        const timestamp = now();
        const transaction: Transaction = {
          ...draft,
          // Editar um lançamento gerado por assinatura mantém o vínculo (e a idempotência do mês).
          ...(existing?.subscriptionId
            ? { subscriptionId: existing.subscriptionId, subscriptionMonth: existing.subscriptionMonth }
            : {}),
          id: existing?.id ?? createId(),
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };
        dispatch({ type: 'transaction/saved', transaction });
        await persist(() => repos.transactions.upsert(transaction));
        return transaction;
      },

      async duplicateTransaction(id) {
        const original = data().transactions.find((t) => t.id === id);
        if (!original) throw new DomainError('Lançamento não encontrado.');
        const timestamp = now();
        // A cópia é um lançamento manual: não carrega o vínculo com a assinatura.
        const copy: Transaction = { ...original, id: createId(), date: todayIso(), createdAt: timestamp, updatedAt: timestamp };
        delete copy.subscriptionId;
        delete copy.subscriptionMonth;
        dispatch({ type: 'transaction/saved', transaction: copy });
        await persist(() => repos.transactions.upsert(copy));
        return copy;
      },

      async deleteTransaction(id) {
        const transaction = data().transactions.find((t) => t.id === id);
        const subscription = transaction?.subscriptionId
          ? data().subscriptions.find((s) => s.id === transaction.subscriptionId)
          : undefined;
        dispatch({ type: 'transaction/removed', id });
        await persist(() => repos.transactions.remove(id));
        // Excluir uma cobrança gerada: o mês não é lançado de novo pela sincronização.
        if (transaction && subscription) {
          const month = transaction.subscriptionMonth ?? transaction.date.slice(0, 7);
          const updated = skipMonth(subscription, month);
          if (updated !== subscription) {
            dispatch({ type: 'subscription/saved', subscription: updated });
            await persist(() => repos.subscriptions.upsert(updated));
          }
        }
      },

      async saveCategory(draft, id) {
        const existing = id ? data().categories.find((c) => c.id === id) : undefined;
        if (existing && existing.kind !== draft.kind && data().transactions.some((t) => t.categoryId === id)) {
          throw new DomainError('Não é possível mudar o tipo de uma categoria que já possui lançamentos.');
        }
        if (existing && existing.kind !== draft.kind && id && usedBySubscriptions(data(), id) > 0) {
          throw new DomainError('Não é possível mudar o tipo de uma categoria usada por assinaturas.');
        }
        const category: Category = {
          ...draft,
          id: existing?.id ?? createId(),
          createdAt: existing?.createdAt ?? now(),
        };
        dispatch({ type: 'category/saved', category });
        await persist(() => repos.categories.upsert(category));
        return category;
      },

      async deleteCategory(id) {
        const used = data().transactions.filter((t) => t.categoryId === id).length;
        if (used > 0) {
          throw new DomainError(
            `Esta categoria possui ${used} lançamento(s). Altere a categoria desses lançamentos antes de excluí-la.`,
          );
        }
        const subscriptions = usedBySubscriptions(data(), id);
        if (subscriptions > 0) {
          throw new DomainError(
            `Esta categoria é usada por ${subscriptions} assinatura(s). Altere a categoria dessas assinaturas antes de excluí-la.`,
          );
        }
        dispatch({ type: 'category/removed', id });
        await persist(() => repos.categories.remove(id));
      },

      async ensureDefaultCategories() {
        const added = missingDefaultCategories(data().categories, now(), createId);
        if (added.length === 0) return [];
        dispatch({ type: 'categories/added', categories: added });
        await persist(async () => {
          for (const category of added) await repos.categories.upsert(category);
        });
        return added;
      },

      async saveGoal(draft, id) {
        const existing = id ? data().goals.find((g) => g.id === id) : undefined;
        const goal: Goal = {
          ...draft,
          id: existing?.id ?? createId(),
          contributions: existing?.contributions ?? [],
          createdAt: existing?.createdAt ?? now(),
        };
        dispatch({ type: 'goal/saved', goal });
        await persist(() => repos.goals.upsert(goal));
        return goal;
      },

      async deleteGoal(id) {
        dispatch({ type: 'goal/removed', id });
        await persist(() => repos.goals.remove(id));
      },

      async addContribution(goalId, amount, date) {
        const goal = data().goals.find((g) => g.id === goalId);
        if (!goal) throw new DomainError('Meta não encontrada.');
        const updated: Goal = { ...goal, contributions: [...goal.contributions, { id: createId(), amount, date }] };
        dispatch({ type: 'goal/saved', goal: updated });
        await persist(() => repos.goals.upsert(updated));
        return updated;
      },

      async saveSubscription(draft, id) {
        const current = data();
        const existing = id ? current.subscriptions.find((s) => s.id === id) : undefined;
        const timestamp = now();
        let categories = current.categories;
        let categoryId = draft.categoryId;
        if (categoryId === CREATE_SUBSCRIPTIONS_CATEGORY) {
          const category = findSubscriptionsCategory(categories) ?? subscriptionsCategoryToCreate(categories, timestamp, createId);
          if (!category) throw new DomainError('Não foi possível criar a categoria Assinaturas.');
          if (!categories.some((c) => c.id === category.id)) categories = [...categories, category];
          categoryId = category.id;
        }
        const subscription: Subscription = {
          ...draft,
          categoryId,
          id: existing?.id ?? createId(),
          skippedMonths: existing?.skippedMonths ?? [],
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };
        if (!subscription.notes) delete subscription.notes;
        const subscriptions = existing
          ? current.subscriptions.map((s) => (s.id === subscription.id ? subscription : s))
          : [...current.subscriptions, subscription];
        // Lançamentos já gerados não mudam: valor, dia e categoria novos valem para os meses ainda não lançados.
        await replaceData(withSubscriptionCharges({ ...current, categories, subscriptions }).data);
        return subscription;
      },

      async setSubscriptionActive(id, active) {
        const current = data();
        const subscription = current.subscriptions.find((s) => s.id === id);
        if (!subscription) throw new DomainError('Assinatura não encontrada.');
        if (subscription.active === active) return;
        // Antes de pausar, garante que as cobranças já vencidas foram lançadas.
        const before = withSubscriptionCharges(current).data;
        const base = before.subscriptions.find((s) => s.id === id) ?? subscription;
        const updated: Subscription = { ...base, active, updatedAt: now() };
        const subscriptions = before.subscriptions.map((s) => (s.id === id ? updated : s));
        await replaceData(withSubscriptionCharges({ ...before, subscriptions }).data);
      },

      async deleteSubscription(id, options) {
        const keepTransactions = options?.keepTransactions ?? true;
        const current = data();
        await replaceData({
          ...current,
          subscriptions: current.subscriptions.filter((s) => s.id !== id),
          transactions: keepTransactions ? current.transactions : current.transactions.filter((t) => t.subscriptionId !== id),
        });
      },

      async syncSubscriptions() {
        const synced = withSubscriptionCharges(data());
        if (!synced.changed) return;
        dispatch({ type: 'subscriptions/synced', transactions: synced.data.transactions, subscriptions: synced.data.subscriptions });
        await persist(() => repos.replaceAll(synced.data));
      },

      updateSettings,

      async completeOnboarding(profile) {
        await updateSettings({ ...profile, onboardingCompleted: true });
      },

      /** Substitui os dados pelos de demonstração, mantendo o perfil e as preferências do usuário. */
      async loadDemoData() {
        const demo = buildDemoData(todayIso());
        await replaceData({ ...demo, settings: { ...data().settings, isDemoData: true, onboardingCompleted: true } });
      },

      /**
       * Apaga lançamentos e metas; recria as categorias padrão para que seja possível lançar em seguida.
       * O perfil (nome e renda mensal) é mantido.
       */
      async clearAllData() {
        const { userName, monthlyIncome } = data().settings;
        await replaceData({
          ...EMPTY_DATA,
          categories: buildDefaultCategories(now()),
          settings: { ...DEFAULT_SETTINGS, userName, monthlyIncome },
        });
      },

      async importBackup(json) {
        const imported = parseFinanceData(json);
        if (!imported) throw new DomainError('Arquivo de backup inválido ou de uma versão incompatível.');
        // A importação acontece em Ajustes, depois do onboarding: nunca volta para a tela de boas-vindas.
        const next = { ...imported, settings: { ...imported.settings, isDemoData: false, onboardingCompleted: true } };
        await replaceData(withSubscriptionCharges(next).data);
      },

      dismissNotice() {
        dispatch({ type: 'notice/dismissed' });
      },
    };
  }, [persist, repos]);

  // Com o app aberto por dias (ex.: instalado no celular), gera as cobranças que vencerem ao voltar para ele.
  const ready = state.status === 'ready';
  useEffect(() => {
    if (!ready) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void actions.syncSubscriptions();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ready, actions]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance deve ser usado dentro de <FinanceProvider>.');
  return context;
}

export const useFinanceData = (): FinanceData => useFinance().state.data;
export const useFinanceActions = (): FinanceActions => useFinance().actions;
