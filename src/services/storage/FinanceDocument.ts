import { DEFAULT_SETTINGS, USER_NAME_MAX, type Category, type FinanceData, type Settings, type Subscription } from '@/models';
import { MAX_AMOUNT } from '@/utils/money';
import type { StorageAdapter } from './StorageAdapter';

export const DATA_KEY = 'money-app:data:v1';
export const CORRUPTED_BACKUP_KEY = 'money-app:data:corrupted';
export const SCHEMA_VERSION = 1;

/** Documentos anteriores à v1.6.0 não têm `subscriptions` (migração: lista vazia). */
interface StoredDocument extends Omit<FinanceData, 'subscriptions'> {
  schemaVersion: number;
  subscriptions?: unknown;
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

const SUBSCRIPTION_SHAPE: Shape = { id: 'string', name: 'string', icon: 'string', amount: 'number', billingDay: 'number', categoryId: 'string', startMonth: 'string' };

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const isMonthKey = (value: unknown): value is string => typeof value === 'string' && MONTH_PATTERN.test(value);
const isOptional = (value: unknown, check: (v: unknown) => boolean) => value === undefined || check(value);

const allMatch = (value: unknown, shape: Shape, check: (item: Record<string, unknown>) => boolean = () => true) =>
  Array.isArray(value) && value.every((item) => matches(item, shape) && check(item as Record<string, unknown>));

/** Vínculo opcional com uma assinatura (v1.6.0): se presente, precisa ser coerente. */
const hasValidSubscriptionLink = (t: Record<string, unknown>) =>
  isOptional(t.subscriptionId, (v) => typeof v === 'string') && isOptional(t.subscriptionMonth, isMonthKey);

const isValidSubscription = (s: Record<string, unknown>) =>
  isIntegerCents(s.amount) &&
  (s.amount as number) <= MAX_AMOUNT &&
  Number.isInteger(s.billingDay) &&
  (s.billingDay as number) >= 1 &&
  (s.billingDay as number) <= 31 &&
  isMonthKey(s.startMonth);

/** Validação estrutural de dados vindos do storage ou de um backup importado (não confiáveis). */
function isStoredDocument(value: unknown): value is StoredDocument {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number' || !isRecord(value.settings)) return false;
  return (
    allMatch(value.transactions, TRANSACTION_SHAPE, (t) => isIntegerCents(t.amount) && hasValidSubscriptionLink(t)) &&
    allMatch(value.categories, CATEGORY_SHAPE) &&
    allMatch(value.goals, GOAL_SHAPE, (g) => isIntegerCents(g.targetAmount) && Array.isArray(g.contributions)) &&
    (value.subscriptions === undefined || allMatch(value.subscriptions, SUBSCRIPTION_SHAPE, isValidSubscription))
  );
}

/**
 * Normaliza uma assinatura já validada estruturalmente: campos opcionais ausentes ou inválidos
 * recebem o padrão (ativa, sem fim, sem meses ignorados).
 */
function sanitizeSubscription(raw: Record<string, unknown>): Subscription {
  const startMonth = raw.startMonth as string;
  const endMonth = isMonthKey(raw.endMonth) && raw.endMonth >= startMonth ? raw.endMonth : null;
  const skipped = Array.isArray(raw.skippedMonths) ? raw.skippedMonths.filter(isMonthKey) : [];
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : '';
  return {
    id: raw.id as string,
    name: raw.name as string,
    icon: raw.icon as string,
    amount: raw.amount as number,
    billingDay: raw.billingDay as number,
    categoryId: raw.categoryId as string,
    active: typeof raw.active === 'boolean' ? raw.active : true,
    startMonth,
    endMonth,
    skippedMonths: [...new Set(skipped)].sort(),
    ...(typeof raw.notes === 'string' && raw.notes ? { notes: raw.notes } : {}),
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
}

/**
 * Normaliza uma categoria já validada estruturalmente: documentos salvos antes da v1.12.0 não têm
 * `alertsEnabled` nem `order` (migração aditiva, DT-025). `alertsEnabled` ausente ou inválido vira
 * `true` (alertas ligados por padrão); `order` ausente ou inválido usa a posição original no array,
 * preservando a ordem de quem já tinha categorias salvas.
 */
function sanitizeCategory(raw: Record<string, unknown>, index: number): Category {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: typeof raw.description === 'string' ? raw.description : '',
    icon: raw.icon as string,
    kind: raw.kind as Category['kind'],
    group: raw.group as Category['group'],
    monthlyLimit: isIntegerCents(raw.monthlyLimit) ? (raw.monthlyLimit as number) : null,
    alertsEnabled: typeof raw.alertsEnabled === 'boolean' ? raw.alertsEnabled : true,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : index,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
  };
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
    const categories = (parsed.categories as unknown as Record<string, unknown>[])
      .map((raw, index) => sanitizeCategory(raw, index))
      .sort((a, b) => a.order - b.order);
    return {
      transactions: parsed.transactions,
      categories,
      goals: parsed.goals,
      // Migração da v1.6.0: documentos sem assinaturas recebem uma lista vazia.
      subscriptions: Array.isArray(parsed.subscriptions)
        ? (parsed.subscriptions as Record<string, unknown>[]).map(sanitizeSubscription)
        : [],
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
      this.cache = result.status === 'ok' ? result.data : { transactions: [], categories: [], goals: [], subscriptions: [], settings: DEFAULT_SETTINGS };
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
