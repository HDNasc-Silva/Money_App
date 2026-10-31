import type { Category, FinanceData, Goal, Settings, Subscription, Transaction } from '@/models';
import { FinanceDocument, type LoadResult } from '../storage/FinanceDocument';
import type { StorageAdapter } from '../storage/StorageAdapter';

/**
 * Contratos assíncronos: hoje gravam no storage local; no futuro podem chamar uma API
 * sem alterar o restante do app (ver DT-005).
 */
export interface CollectionRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  upsert(item: T): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<Settings>;
}

export interface Repositories {
  load(): Promise<LoadResult>;
  replaceAll(data: FinanceData): Promise<void>;
  clear(): Promise<void>;
  transactions: CollectionRepository<Transaction>;
  categories: CollectionRepository<Category>;
  goals: CollectionRepository<Goal>;
  subscriptions: CollectionRepository<Subscription>;
  settings: SettingsRepository;
}

type CollectionKey = 'transactions' | 'categories' | 'goals' | 'subscriptions';

function createCollectionRepository<K extends CollectionKey>(
  doc: FinanceDocument,
  key: K,
): CollectionRepository<FinanceData[K][number]> {
  type Item = FinanceData[K][number];
  return {
    async list() {
      return [...doc.get()[key]] as Item[];
    },
    async upsert(item) {
      doc.update((data) => {
        const items = data[key] as Item[];
        const exists = items.some((i) => i.id === item.id);
        const next = exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
        return { ...data, [key]: next };
      });
      return item;
    },
    async remove(id) {
      doc.update((data) => ({ ...data, [key]: (data[key] as Item[]).filter((i) => i.id !== id) }));
    },
  };
}

export function createRepositories(adapter: StorageAdapter): Repositories {
  const doc = new FinanceDocument(adapter);
  return {
    async load() {
      return doc.load();
    },
    async replaceAll(data) {
      doc.save(data);
    },
    async clear() {
      doc.clear();
    },
    transactions: createCollectionRepository(doc, 'transactions'),
    categories: createCollectionRepository(doc, 'categories'),
    goals: createCollectionRepository(doc, 'goals'),
    subscriptions: createCollectionRepository(doc, 'subscriptions'),
    settings: {
      async get() {
        return doc.get().settings;
      },
      async save(settings) {
        doc.update((data) => ({ ...data, settings }));
        return settings;
      },
    },
  };
}
