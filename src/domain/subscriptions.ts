import type { Cents, IsoDate, MonthKey, Subscription, Transaction } from '@/models';
import { addMonths, daysInMonth, monthKeyOf } from '@/utils/dates';

/**
 * ASSINATURAS (DT-017).
 * Cada assinatura ativa gera, para cada mês desde `startMonth`, uma despesa real (`Transaction` com
 * `subscriptionId`) no dia de cobrança — mas só quando essa data chega (data ≤ hoje). Cobranças
 * futuras são apenas previsões (não materializadas). A geração é idempotente: um mês já lançado
 * (mesmo `subscriptionId` + `subscriptionMonth`) ou registrado em `skippedMonths` nunca é gerado de novo.
 */

/** Quantos meses para trás o primeiro mês de cobrança pode estar (evita gerar históricos enormes por engano). */
export const SUBSCRIPTION_BACKFILL_MONTHS = 12;

export const BILLING_DAY_MIN = 1;
export const BILLING_DAY_MAX = 31;

/** Data de cobrança no mês: o dia de cobrança, limitado ao último dia do mês (31 → 28/29 em fevereiro). */
export function chargeDate(subscription: Pick<Subscription, 'billingDay'>, month: MonthKey): IsoDate {
  const day = Math.min(Math.max(subscription.billingDay, BILLING_DAY_MIN), daysInMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

/** O mês está entre o primeiro e o último mês de cobrança da assinatura. */
export const isBilledInMonth = (subscription: Pick<Subscription, 'startMonth' | 'endMonth'>, month: MonthKey): boolean =>
  month >= subscription.startMonth && (subscription.endMonth === null || month <= subscription.endMonth);

const chargeKey = (subscriptionId: string, month: MonthKey) => `${subscriptionId}|${month}`;

/** Mês de referência de um lançamento gerado (o usuário pode ter editado a data). */
const referenceMonth = (t: Transaction): MonthKey => t.subscriptionMonth ?? monthKeyOf(t.date);

/** Chaves `assinatura|mês` dos lançamentos já gerados. */
function launchedKeys(transactions: readonly Transaction[]): Set<string> {
  const keys = new Set<string>();
  for (const t of transactions) if (t.subscriptionId) keys.add(chargeKey(t.subscriptionId, referenceMonth(t)));
  return keys;
}

/** Id determinístico do lançamento gerado: reforça a idempotência (um upsert repetido nunca duplica). */
export const chargeTransactionId = (subscriptionId: string, month: MonthKey): string => `sub-${subscriptionId}-${month}`;

/** Lançamento de despesa correspondente à cobrança de um mês. */
export function chargeTransaction(subscription: Subscription, month: MonthKey, timestamp: string): Transaction {
  return {
    id: chargeTransactionId(subscription.id, month),
    type: 'expense',
    description: subscription.name,
    amount: subscription.amount,
    date: chargeDate(subscription, month),
    categoryId: subscription.categoryId,
    subscriptionId: subscription.id,
    subscriptionMonth: month,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export interface SubscriptionSyncResult {
  transactions: Transaction[];
  subscriptions: Subscription[];
  /** Lançamentos criados nesta sincronização. */
  created: Transaction[];
  changed: boolean;
}

/**
 * Materializa as cobranças cuja data já chegou (≤ `today`), do `startMonth` até o mês de `today`.
 * - Mês já lançado ou em `skippedMonths`: ignorado (idempotente; exclusões do usuário são respeitadas).
 * - Assinatura pausada: o mês cuja cobrança chegou durante a pausa entra em `skippedMonths`, para que
 *   retomar a assinatura não gere cobranças retroativas.
 */
export function syncSubscriptionCharges(
  subscriptions: readonly Subscription[],
  transactions: readonly Transaction[],
  today: IsoDate,
  timestamp: string,
): SubscriptionSyncResult {
  const keys = launchedKeys(transactions);
  const ids = new Set(transactions.map((t) => t.id));
  const currentMonth = monthKeyOf(today);
  const created: Transaction[] = [];
  let subscriptionsChanged = false;

  const nextSubscriptions = subscriptions.map((subscription) => {
    const skipped = new Set(subscription.skippedMonths);
    const newlySkipped: MonthKey[] = [];
    const last = subscription.endMonth !== null && subscription.endMonth < currentMonth ? subscription.endMonth : currentMonth;
    for (let month = subscription.startMonth; month <= last; month = addMonths(month, 1)) {
      if (chargeDate(subscription, month) > today) continue;
      if (skipped.has(month) || keys.has(chargeKey(subscription.id, month))) continue;
      if (!subscription.active) {
        newlySkipped.push(month);
        continue;
      }
      const transaction = chargeTransaction(subscription, month, timestamp);
      if (ids.has(transaction.id)) continue;
      ids.add(transaction.id);
      created.push(transaction);
    }
    if (newlySkipped.length === 0) return subscription;
    subscriptionsChanged = true;
    return { ...subscription, skippedMonths: [...subscription.skippedMonths, ...newlySkipped].sort() };
  });

  return {
    transactions: created.length > 0 ? [...transactions, ...created] : [...transactions],
    subscriptions: subscriptionsChanged ? nextSubscriptions : [...subscriptions],
    created,
    changed: created.length > 0 || subscriptionsChanged,
  };
}

/** Registra que o mês não deve ser lançado (ex.: o usuário excluiu o lançamento gerado). */
export function skipMonth(subscription: Subscription, month: MonthKey): Subscription {
  if (subscription.skippedMonths.includes(month)) return subscription;
  return { ...subscription, skippedMonths: [...subscription.skippedMonths, month].sort() };
}

/** Cobrança ainda não lançada e prevista para depois de hoje. */
function isForecast(subscription: Subscription, month: MonthKey, today: IsoDate, keys: Set<string>): boolean {
  return (
    subscription.active &&
    isBilledInMonth(subscription, month) &&
    !subscription.skippedMonths.includes(month) &&
    !keys.has(chargeKey(subscription.id, month)) &&
    chargeDate(subscription, month) > today
  );
}

export type ChargeStatus = 'launched' | 'forecast';

export interface MonthCharge {
  key: string;
  subscriptionId: string;
  name: string;
  icon: string;
  amount: Cents;
  date: IsoDate;
  status: ChargeStatus;
  transactionId?: string;
}

const FALLBACK_ICON = 'subscriptions';

/**
 * Cobranças de assinaturas que caem no mês: as já lançadas (inclusive de assinaturas excluídas cujos
 * lançamentos foram mantidos) e as previstas (ativas, ainda não lançadas, com data depois de hoje).
 */
export function monthSubscriptionCharges(
  subscriptions: readonly Subscription[],
  transactions: readonly Transaction[],
  month: MonthKey,
  today: IsoDate,
): MonthCharge[] {
  const byId = new Map(subscriptions.map((s) => [s.id, s]));
  const keys = launchedKeys(transactions);
  const launched: MonthCharge[] = transactions
    .filter((t) => t.subscriptionId && referenceMonth(t) === month)
    .map((t) => {
      const subscription = byId.get(t.subscriptionId ?? '');
      return {
        key: t.id,
        subscriptionId: t.subscriptionId ?? '',
        name: subscription?.name ?? t.description,
        icon: subscription?.icon ?? FALLBACK_ICON,
        amount: t.amount,
        date: t.date,
        status: 'launched',
        transactionId: t.id,
      };
    });
  const forecast: MonthCharge[] = subscriptions
    .filter((s) => isForecast(s, month, today, keys))
    .map((s) => ({
      key: chargeKey(s.id, month),
      subscriptionId: s.id,
      name: s.name,
      icon: s.icon,
      amount: s.amount,
      date: chargeDate(s, month),
      status: 'forecast',
    }));
  return [...launched, ...forecast].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

export interface ChargesSummary {
  total: Cents;
  launched: Cents;
  forecast: Cents;
}

export function summarizeCharges(charges: readonly MonthCharge[]): ChargesSummary {
  let launched = 0;
  let forecast = 0;
  for (const c of charges) {
    if (c.status === 'launched') launched += c.amount;
    else forecast += c.amount;
  }
  return { total: launched + forecast, launched, forecast };
}

/**
 * Total das cobranças previstas (não lançadas) com data depois de `today` e até `until`.
 * Entra no "saldo previsto ao fim do mês" de meses futuros; é zero no mês atual e em meses passados.
 */
export function projectedSubscriptionExpenses(
  subscriptions: readonly Subscription[],
  transactions: readonly Transaction[],
  today: IsoDate,
  until: IsoDate,
): Cents {
  if (until <= today) return 0;
  const keys = launchedKeys(transactions);
  const lastMonth = monthKeyOf(until);
  let total = 0;
  for (let month = monthKeyOf(today); month <= lastMonth; month = addMonths(month, 1)) {
    for (const s of subscriptions) {
      if (isForecast(s, month, today, keys) && chargeDate(s, month) <= until) total += s.amount;
    }
  }
  return total;
}

export type SubscriptionStatus = 'active' | 'paused' | 'ended';

/** Encerrada quando o último mês de cobrança já passou (ou a última cobrança já aconteceu). */
export function subscriptionStatus(subscription: Subscription, today: IsoDate): SubscriptionStatus {
  const { endMonth } = subscription;
  const currentMonth = monthKeyOf(today);
  if (endMonth !== null && (endMonth < currentMonth || (endMonth === currentMonth && chargeDate(subscription, endMonth) <= today))) {
    return 'ended';
  }
  return subscription.active ? 'active' : 'paused';
}

/** Próxima cobrança depois de hoje; `null` se pausada ou encerrada. */
export function nextChargeDate(subscription: Subscription, today: IsoDate): IsoDate | null {
  if (subscriptionStatus(subscription, today) !== 'active') return null;
  const currentMonth = monthKeyOf(today);
  let month = subscription.startMonth > currentMonth ? subscription.startMonth : currentMonth;
  // Mês atual + 12 meses cobre qualquer combinação de dia de cobrança e meses ignorados recentes.
  for (let i = 0; i <= 12; i += 1, month = addMonths(month, 1)) {
    if (!isBilledInMonth(subscription, month)) return null;
    const date = chargeDate(subscription, month);
    if (date > today && !subscription.skippedMonths.includes(month)) return date;
  }
  return null;
}

export interface SubscriptionTotals {
  /** Soma mensal das assinaturas ativas. */
  monthly: Cents;
  /** Estimativa anual (mensal × 12). */
  yearly: Cents;
  activeCount: number;
}

export function subscriptionTotals(subscriptions: readonly Subscription[], today: IsoDate): SubscriptionTotals {
  const active = subscriptions.filter((s) => subscriptionStatus(s, today) === 'active');
  const monthly = active.reduce((sum, s) => sum + s.amount, 0);
  return { monthly, yearly: monthly * 12, activeCount: active.length };
}

/** Ordem da lista: ativas primeiro, depois pausadas e encerradas; dentro do grupo, por nome. */
export function sortSubscriptions(subscriptions: readonly Subscription[], today: IsoDate): Subscription[] {
  const rank: Record<SubscriptionStatus, number> = { active: 0, paused: 1, ended: 2 };
  return [...subscriptions].sort(
    (a, b) => rank[subscriptionStatus(a, today)] - rank[subscriptionStatus(b, today)] || a.name.localeCompare(b.name, 'pt-BR'),
  );
}
