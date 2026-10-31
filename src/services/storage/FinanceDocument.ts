import { DEFAULT_SETTINGS, USER_NAME_MAX, type FinanceData, type Settings } from '@/models';
import { MAX_AMOUNT } from '@/utils/money';
import type { StorageAdapter } from './StorageAdapter';

export const DATA_KEY = 'money-app:data:v1';
export const CORRUPTED_BACKUP_KEY = 'money-app:data:corrupted';
export const SCHEMA_VERSION = 1;

interface StoredDocument extends FinanceData {
  schemaVersion: number;
}

export type LoadResult =
  | { status: 'empty' }
  | { status: 'ok'; data: FinanceData }
  | { status: 'corrupted' };

type Shape = Record<string, 'string' | 'number' | 'object'>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const matches = (value: unknown, shape: Shape): boolean =>
  isRecord(value) && Object.entries(shape).every(([field, type]) => typeof value[field] === type);

const isIntegerCents = (value: unknown): boolean => Number.isSafeInteger(value) && (value as number) >= 0;

const TRANSACTION_SHAPE: Shape = { id: 'string', type: 'string', description: 'string', amount: 'number', date: 'string', categoryId: 'string' };
const CATEGORY_SHAPE: Shape = { id: 'string', name: 'string', icon: 'string', kind: 'string', group: 'string' };
const GOAL_SHAPE: Shape = { id: 'string', name: 'string', icon: 'string', targetAmount: 'number', initialAmount: 'number', monthlyContribution: 'number', contributions: 'object' };

const allMatch = (value: unknown, shape: Shape, check: (item: Record<string, unknown>) => boolean = () => true) =>
  Array.isArray(value) && value.every((item) => matches(item, shape) && check(item as Record<string, unknown>));

/** Validação estrutural de dados vindos do storage ou de um backup importado (não confiáveis). */
function isStoredDocument(value: unknown): value is StoredDocument {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number' || !isRecord(value.settings)) return false;
  return (
    allMatch(value.transactions, TRANSACTION_SHAPE, (t) => isIntegerCents(t.amount)) &&
    allMatch(value.categories, CATEGORY_SHAPE) &&
    allMatch(value.goals, GOAL_SHAPE, (g) => isIntegerCents(g.targetAmount) && Array.isArray(g.contributions))
  );
}

const pick = <T>(value: unknown, isValid: (v: unknown) => boolean, fallback: T): T => (isValid(value) ? (value as T) : fallback);
const isBoolean = (v: unknown) => typeof v === 'boolean';
const isMonthlyIncome = (v: unknown) => isIntegerCents(v) && (v as number) <= MAX_AMOUNT;

/**
 * Normaliza as preferências salvas: campos ausentes (documentos de versões anteriores) ou inválidos
 * recebem o padrão. Migração da v1.4.0: sem `onboardingCompleted`, o documento é de quem já usava o
 * app e o onboarding é considerado concluído (padrão `true`); `monthlyIncome` ausente vira 0.
 * Migração da v1.5.0: o antigo `savingsTarget` (meta de poupança em %) é descartado — como o objeto
 * é montado campo a campo, campos desconhecidos nunca chegam ao estado (DT-016).
 */
function sanitizeSettings(raw: Record<string, unknown>): Settings {
  const d = DEFAULT_SETTINGS;
  return {
    userName: pick(raw.userName, (v) => typeof v === 'string', d.userName).trim().slice(0, USER_NAME_MAX),
    monthlyIncome: pick(raw.monthlyIncome, isMonthlyIncome, d.monthlyIncome),
    hideBalances: pick(raw.hideBalances, isBoolean, d.hideBalances),
    isDemoData: pick(raw.isDemoData, isBoolean, d.isDemoData),
    onboardingCompleted: pick(raw.onboardingCompleted, isBoolean, d.onboardingCompleted),
  };
}

/** Converte um JSON desconhecido (backup importado ou storage) em `FinanceData`, ou `null` se inválido. */
export function parseFinanceData(raw: string): FinanceData | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredDocument(parsed) || parsed.schemaVersion > SCHEMA_VERSION) return null;
    return {
      transactions: parsed.transactions,
      categories: parsed.categories,
      goals: parsed.goals,
      settings: sanitizeSettings(parsed.settings as unknown as Record<string, unknown>),
    };
  } catch {
    return null;
  }
}

export function serializeFinanceData(data: FinanceData): string {
  const doc: StoredDocument = { schemaVersion: SCHEMA_VERSION, ...data };
  return JSON.stringify(doc);
}

/**
 * Documento único versionado com todos os dados do app.
 * Mantém uma cópia em memória para que os repositórios façam leitura-modificação-gravação consistente.
 */
export class FinanceDocument {
  private cache: FinanceData | null = null;

  constructor(private readonly adapter: StorageAdapter) {}

  load(): LoadResult {
    const raw = this.adapter.read(DATA_KEY);
    if (raw === null) return { status: 'empty' };
    const data = parseFinanceData(raw);
    if (!data) {
      // Preserva o conteúdo ilegível para recuperação manual em vez de descartá-lo.
      this.adapter.write(CORRUPTED_BACKUP_KEY, raw);
      this.adapter.remove(DATA_KEY);
      return { status: 'corrupted' };
    }
    this.cache = data;
    return { status: 'ok', data };
  }

  get(): FinanceData {
    if (!this.cache) {
      const result = this.load();
      this.cache = result.status === 'ok' ? result.data : { transactions: [], categories: [], goals: [], settings: DEFAULT_SETTINGS };
    }
    return this.cache;
  }

  save(data: FinanceData): void {
    this.adapter.write(DATA_KEY, serializeFinanceData(data));
    this.cache = data;
  }

  update(change: (data: FinanceData) => FinanceData): FinanceData {
    const next = change(this.get());
    this.save(next);
    return next;
  }

  clear(): void {
    this.adapter.remove(DATA_KEY);
    this.cache = null;
  }
}
