import type { Cents, IsoDate, Loan, MonthKey, Transaction } from '@/models';
import { addMonths, daysInMonth, monthKeyOf } from '@/utils/dates';

/**
 * AGIOTAGEM — empréstimos a terceiros (DT-026).
 * Registrar um empréstimo NÃO debita o saldo (o valor já tinha saído do bolso antes do registro).
 * Cada parcela (ou o pagamento único) vira uma RECEITA real (`Transaction` com `loanId`) no mês
 * esperado, quando esse mês chega (mesmo padrão de materialização das assinaturas, DT-017, mas
 * finito: `installmentTotal` parcelas, nunca infinito). A geração é idempotente.
 */

export const INSTALLMENT_COUNT_MIN = 1;
export const INSTALLMENT_COUNT_MAX = 60;

/** Último mês esperado de pagamento (inclusive). */
export const lastLoanMonth = (loan: Pick<Loan, 'firstMonth' | 'installmentTotal'>): MonthKey =>
  addMonths(loan.firstMonth, loan.installmentTotal - 1);

/** O mês está entre o primeiro e o último mês esperado de pagamento. */
export const isLoanDueInMonth = (loan: Pick<Loan, 'firstMonth' | 'installmentTotal'>, month: MonthKey): boolean =>
  month >= loan.firstMonth && month <= lastLoanMonth(loan);

/** Data esperada do pagamento no mês: o dia da data do empréstimo, limitado ao último dia do mês. */
export function loanPaymentDate(loan: Pick<Loan, 'loanDate'>, month: MonthKey): IsoDate {
  const day = Math.min(Number(loan.loanDate.slice(8, 10)), daysInMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

const paymentKey = (loanId: string, month: MonthKey) => `${loanId}|${month}`;

const referenceMonth = (t: Transaction): MonthKey => t.loanMonth ?? monthKeyOf(t.date);

function launchedKeys(transactions: readonly Transaction[]): Set<string> {
  const keys = new Set<string>();
  for (const t of transactions) if (t.loanId) keys.add(paymentKey(t.loanId, referenceMonth(t)));
  return keys;
}

export const loanPaymentTransactionId = (loanId: string, month: MonthKey): string => `loan-${loanId}-${month}`;

/** Índice da parcela (1-based) correspondente ao mês, dentro do total do empréstimo. */
function installmentIndexOf(loan: Pick<Loan, 'firstMonth'>, month: MonthKey): number {
  const [fy, fm] = loan.firstMonth.split('-').map(Number);
  const [y, m] = month.split('-').map(Number);
  return ((y ?? 0) - (fy ?? 0)) * 12 + ((m ?? 0) - (fm ?? 0)) + 1;
}

/** Receita correspondente ao pagamento esperado de um mês. */
export function loanPaymentTransaction(loan: Loan, month: MonthKey, timestamp: string): Transaction {
  const index = installmentIndexOf(loan, month);
  const description =
    loan.installmentTotal > 1 ? `Empréstimo — ${loan.borrower} (${index}/${loan.installmentTotal})` : `Empréstimo — ${loan.borrower}`;
  return {
    id: loanPaymentTransactionId(loan.id, month),
    type: 'income',
    description,
    amount: loan.amount,
    date: loanPaymentDate(loan, month),
    categoryId: loan.categoryId,
    loanId: loan.id,
    loanMonth: month,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export interface LoanSyncResult {
  transactions: Transaction[];
  created: Transaction[];
  changed: boolean;
}

/**
 * Materializa os pagamentos cujo mês já chegou (mês ≤ mês de `today`), do `firstMonth` até o
 * último mês do empréstimo. Mês já lançado ou em `skippedMonths` nunca é gerado de novo.
 */
export function syncLoanPayments(loans: readonly Loan[], transactions: readonly Transaction[], today: IsoDate, timestamp: string): LoanSyncResult {
  const keys = launchedKeys(transactions);
  const ids = new Set(transactions.map((t) => t.id));
  const currentMonth = monthKeyOf(today);
  const created: Transaction[] = [];

  for (const loan of loans) {
    const loanLast = lastLoanMonth(loan);
    const last = loanLast < currentMonth ? loanLast : currentMonth;
    for (let month = loan.firstMonth; month <= last; month = addMonths(month, 1)) {
      if (loan.skippedMonths.includes(month) || keys.has(paymentKey(loan.id, month))) continue;
      const transaction = loanPaymentTransaction(loan, month, timestamp);
      if (ids.has(transaction.id)) continue;
      ids.add(transaction.id);
      created.push(transaction);
    }
  }

  return { transactions: created.length > 0 ? [...transactions, ...created] : [...transactions], created, changed: created.length > 0 };
}

/** Registra que o mês não deve ser lançado (ex.: o usuário excluiu o lançamento gerado). */
export function skipLoanMonth(loan: Loan, month: MonthKey): Loan {
  if (loan.skippedMonths.includes(month)) return loan;
  return { ...loan, skippedMonths: [...loan.skippedMonths, month].sort() };
}

export type LoanInstallmentStatus = 'received' | 'pending';

export interface LoanInstallment {
  index: number;
  month: MonthKey;
  date: IsoDate;
  amount: Cents;
  status: LoanInstallmentStatus;
  transactionId?: string;
}

/** Parcelas do empréstimo com o status de cada uma (recebida = já lançada; a receber = ainda não). */
export function loanInstallments(loan: Loan, transactions: readonly Transaction[]): LoanInstallment[] {
  const byMonth = new Map(
    transactions.filter((t) => t.loanId === loan.id).map((t) => [referenceMonth(t), t] as const),
  );
  const installments: LoanInstallment[] = [];
  for (let index = 0; index < loan.installmentTotal; index += 1) {
    const month = addMonths(loan.firstMonth, index);
    const launched = byMonth.get(month);
    installments.push({
      index: index + 1,
      month,
      date: launched?.date ?? loanPaymentDate(loan, month),
      amount: launched?.amount ?? loan.amount,
      status: launched ? 'received' : 'pending',
      transactionId: launched?.id,
    });
  }
  return installments;
}

/** Total já recebido e total ainda a receber de um empréstimo. */
export function loanTotals(loan: Loan, transactions: readonly Transaction[]): { received: Cents; pending: Cents } {
  const installments = loanInstallments(loan, transactions);
  return installments.reduce(
    (totals, i) =>
      i.status === 'received' ? { ...totals, received: totals.received + i.amount } : { ...totals, pending: totals.pending + i.amount },
    { received: 0, pending: 0 },
  );
}

export type LoanStatus = 'pending' | 'partial' | 'settled';

/** Situação geral do empréstimo: nada recebido, algumas parcelas recebidas, ou tudo recebido. */
export function loanStatus(loan: Loan, transactions: readonly Transaction[]): LoanStatus {
  const installments = loanInstallments(loan, transactions);
  const receivedCount = installments.filter((i) => i.status === 'received').length;
  if (receivedCount === 0) return 'pending';
  if (receivedCount === installments.length) return 'settled';
  return 'partial';
}

/** Soma das parcelas esperadas (lançadas ou previstas) no mês informado — "a receber este mês". */
export function loansDueInMonth(loans: readonly Loan[], month: MonthKey): Cents {
  return loans.filter((loan) => isLoanDueInMonth(loan, month)).reduce((sum, loan) => sum + loan.amount, 0);
}

/** Ordem da lista: pendentes/parciais primeiro, depois liquidados; dentro do grupo, pelo mais recente. */
export function sortLoans(loans: readonly Loan[], transactions: readonly Transaction[]): Loan[] {
  const rank: Record<LoanStatus, number> = { pending: 0, partial: 0, settled: 1 };
  return [...loans].sort(
    (a, b) => rank[loanStatus(a, transactions)] - rank[loanStatus(b, transactions)] || b.loanDate.localeCompare(a.loanDate),
  );
}
