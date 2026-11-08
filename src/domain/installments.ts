import type { Cents, IsoDate, MonthKey, Transaction, TransactionType } from '@/models';
import { addMonths, daysInMonth } from '@/utils/dates';

/**
 * COMPRA PARCELADA (DT-026).
 * Ao marcar um lançamento como parcelado, o valor digitado é o valor de CADA parcela (não o total):
 * geramos `count` lançamentos independentes, um por mês a partir de `firstMonth`, todos no mesmo dia
 * do mês da primeira parcela (o dia da data informada no lançamento). Cada parcela é um `Transaction`
 * normal — editar ou excluir uma não afeta as demais (sem conceito de "assinatura" recorrente).
 */

export const INSTALLMENT_COUNT_MIN = 2;
export const INSTALLMENT_COUNT_MAX = 60;

export interface InstallmentPlanInput {
  type: TransactionType;
  description: string;
  amount: Cents;
  categoryId: string;
  note?: string;
  /** Data da primeira parcela: o dia do mês é reaproveitado para as parcelas seguintes. */
  date: IsoDate;
  firstMonth: MonthKey;
  count: number;
}

/** Gera as `count` parcelas de uma compra parcelada, todas vinculadas pelo mesmo `installmentGroupId`. */
export function buildInstallmentTransactions(
  plan: InstallmentPlanInput,
  groupId: string,
  timestamp: string,
  idFactory: () => string,
): Transaction[] {
  const day = Number(plan.date.slice(8, 10));
  const transactions: Transaction[] = [];
  for (let index = 0; index < plan.count; index += 1) {
    const month = addMonths(plan.firstMonth, index);
    const dueDay = Math.min(day, daysInMonth(month));
    const date = `${month}-${String(dueDay).padStart(2, '0')}`;
    transactions.push({
      id: idFactory(),
      type: plan.type,
      description: `${plan.description} (${index + 1}/${plan.count})`,
      amount: plan.amount,
      date,
      categoryId: plan.categoryId,
      note: plan.note,
      installmentGroupId: groupId,
      installmentIndex: index + 1,
      installmentTotal: plan.count,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  return transactions;
}
