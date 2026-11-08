import type { IsoDate, MonthKey, Settings, Transaction } from '@/models';
import { addMonths, monthKeyOf } from '@/utils/dates';

/**
 * RENDA MENSAL AUTOMÁTICA (DT-028).
 * Quando o perfil tem renda mensal (> 0), cada mês desde `incomeStartMonth` vira uma RECEITA real
 * (`Transaction` com `incomeMonth`) no dia 1º — mesmo padrão idempotente de materialização das
 * assinaturas (DT-017) e dos empréstimos (DT-026):
 * - id determinístico por mês (`income-AAAA-MM`): reabrir o app nunca duplica;
 * - mês excluído pelo usuário entra em `incomeSkippedMonths` e não é gerado de novo;
 * - mudar o valor vale só para os meses ainda não lançados (os gerados não são tocados);
 * - zerar a renda limpa `incomeStartMonth` e a geração para; voltar a preencher recomeça no mês atual.
 */

export const INCOME_DESCRIPTION = 'Renda mensal';

/** Dia do mês em que a renda é lançada. */
export const INCOME_DAY = '01';

export const incomeTransactionId = (month: MonthKey): string => `income-${month}`;

/** Receita da renda mensal de um mês. */
export function incomeTransaction(amount: number, categoryId: string, month: MonthKey, timestamp: string): Transaction {
  return {
    id: incomeTransactionId(month),
    type: 'income',
    description: INCOME_DESCRIPTION,
    amount,
    date: `${month}-${INCOME_DAY}`,
    categoryId,
    incomeMonth: month,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Ajusta o agendamento da renda depois de uma mudança no perfil:
 * - renda zerada/apagada: `incomeStartMonth` vira `null` (para de gerar);
 * - renda preenchida sem agendamento (recém-definida, ou documento salvo antes da v1.14.0): começa no
 *   mês atual;
 * - caso contrário, mantém o mês inicial (mudar o valor não muda o histórico).
 */
export function scheduleIncome(settings: Settings, today: IsoDate): Settings {
  if (settings.monthlyIncome <= 0) {
    return settings.incomeStartMonth === null ? settings : { ...settings, incomeStartMonth: null };
  }
  if (settings.incomeStartMonth !== null) return settings;
  return { ...settings, incomeStartMonth: monthKeyOf(today) };
}

export interface IncomeSyncResult {
  /** Preferências com o agendamento ajustado (ver `scheduleIncome`). */
  settings: Settings;
  /** Receitas criadas nesta sincronização. */
  created: Transaction[];
  changed: boolean;
}

/**
 * Materializa a renda dos meses de `incomeStartMonth` até o mês de `today` (o dia 1º de cada um
 * sempre já chegou). Não gera nada com dados de demonstração (que já trazem o próprio salário).
 * `categoryId` é resolvido pelo chamador (categoria "Salário").
 */
export function syncMonthlyIncome(
  current: Settings,
  transactions: readonly Transaction[],
  categoryId: string,
  today: IsoDate,
  timestamp: string,
): IncomeSyncResult {
  const settings = scheduleIncome(current, today);
  const settingsChanged = settings !== current;
  const start = settings.incomeStartMonth;
  if (start === null || settings.monthlyIncome <= 0 || settings.isDemoData) {
    return { settings, created: [], changed: settingsChanged };
  }
  // Mês de referência do lançamento gerado (o usuário pode ter editado a data).
  const launched = new Set<MonthKey>();
  for (const t of transactions) if (t.incomeMonth) launched.add(t.incomeMonth);
  const ids = new Set(transactions.map((t) => t.id));
  const skipped = new Set(settings.incomeSkippedMonths);
  const currentMonth = monthKeyOf(today);
  const created: Transaction[] = [];
  for (let month = start; month <= currentMonth; month = addMonths(month, 1)) {
    if (skipped.has(month) || launched.has(month)) continue;
    const transaction = incomeTransaction(settings.monthlyIncome, categoryId, month, timestamp);
    if (ids.has(transaction.id)) continue;
    ids.add(transaction.id);
    created.push(transaction);
  }
  return { settings, created, changed: settingsChanged || created.length > 0 };
}

/** O agendamento precisa gerar algo agora? (evita criar a categoria "Salário" à toa). */
export function hasPendingIncome(settings: Settings, transactions: readonly Transaction[], today: IsoDate): boolean {
  return syncMonthlyIncome(settings, transactions, '', today, '').created.length > 0;
}

/** Registra que a renda do mês não deve ser lançada de novo (o usuário excluiu o lançamento gerado). */
export function skipIncomeMonth(settings: Settings, month: MonthKey): Settings {
  if (settings.incomeSkippedMonths.includes(month)) return settings;
  return { ...settings, incomeSkippedMonths: [...settings.incomeSkippedMonths, month].sort() };
}
