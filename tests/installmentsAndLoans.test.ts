import { describe, expect, it } from 'vitest';
import { buildInstallmentTransactions } from '@/domain/installments';
import {
  isLoanDueInMonth,
  lastLoanMonth,
  loanInstallments,
  loansDueInMonth,
  loanStatus,
  loanTotals,
  skipLoanMonth,
  sortLoans,
  syncLoanPayments,
} from '@/domain/loans';
import type { Loan } from '@/models';
import { validateInstallmentPlan, validateLoan, type LoanFormValues } from '@/validations';

const TODAY = '2026-11-07';

function loan(partial: Partial<Loan> = {}): Loan {
  return {
    id: 'loan-1',
    borrower: 'João',
    amount: 10_000,
    categoryId: 'income-cat',
    loanDate: '2026-11-05',
    firstMonth: '2026-11',
    installmentTotal: 3,
    skippedMonths: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

describe('buildInstallmentTransactions (compra parcelada, DT-026)', () => {
  it('gera uma parcela por mês, com o valor digitado repetido em cada uma e o mesmo dia', () => {
    const transactions = buildInstallmentTransactions(
      { type: 'expense', description: 'Notebook', amount: 50_000, categoryId: 'cat-1', date: '2026-11-15', firstMonth: '2026-11', count: 3 },
      'group-1',
      '2026-11-07T00:00:00.000Z',
      () => 'id',
    );
    expect(transactions).toHaveLength(3);
    expect(transactions.map((t) => t.amount)).toEqual([50_000, 50_000, 50_000]);
    expect(transactions.map((t) => t.date)).toEqual(['2026-11-15', '2026-12-15', '2027-01-15']);
    expect(transactions.map((t) => t.description)).toEqual(['Notebook (1/3)', 'Notebook (2/3)', 'Notebook (3/3)']);
    expect(transactions.every((t) => t.installmentGroupId === 'group-1')).toBe(true);
    expect(transactions.map((t) => t.installmentIndex)).toEqual([1, 2, 3]);
  });

  it('limita o dia da parcela ao último dia de meses mais curtos', () => {
    const transactions = buildInstallmentTransactions(
      { type: 'expense', description: 'Curso', amount: 1_000, categoryId: 'cat-1', date: '2026-01-31', firstMonth: '2026-01', count: 2 },
      'group-2',
      '2026-01-01T00:00:00.000Z',
      () => 'id',
    );
    expect(transactions.map((t) => t.date)).toEqual(['2026-01-31', '2026-02-28']);
  });
});

describe('validateInstallmentPlan', () => {
  it('exige quantidade dentro dos limites e mês válido', () => {
    expect(validateInstallmentPlan('2026-11', '12', TODAY).ok).toBe(true);
    expect(validateInstallmentPlan('2026-11', '1', TODAY).ok).toBe(false);
    expect(validateInstallmentPlan('2026-11', '61', TODAY).ok).toBe(false);
    expect(validateInstallmentPlan('mês-invalido', '12', TODAY).ok).toBe(false);
  });
});

describe('empréstimos (Agiotagem, DT-026)', () => {
  it('lastLoanMonth e isLoanDueInMonth consideram o total de parcelas', () => {
    const l = loan();
    expect(lastLoanMonth(l)).toBe('2027-01');
    expect(isLoanDueInMonth(l, '2026-11')).toBe(true);
    expect(isLoanDueInMonth(l, '2027-01')).toBe(true);
    expect(isLoanDueInMonth(l, '2027-02')).toBe(false);
  });

  it('syncLoanPayments gera as receitas cujo mês já chegou, sem duplicar', () => {
    const l = loan({ firstMonth: '2026-09', installmentTotal: 3 }); // set2026-09, 10, 11
    const first = syncLoanPayments([l], [], TODAY, 'ts');
    // Set, Out e Nov já chegaram (hoje = 07/11/2026)
    expect(first.created).toHaveLength(3);
    expect(first.created.every((t) => t.type === 'income')).toBe(true);
    const second = syncLoanPayments([l], first.transactions, TODAY, 'ts');
    expect(second.changed).toBe(false);
  });

  it('loanInstallments reflete o status recebido/a receber e loanStatus resume o empréstimo', () => {
    const l = loan({ firstMonth: '2026-09', installmentTotal: 3 });
    const synced = syncLoanPayments([l], [], TODAY, 'ts');
    const installments = loanInstallments(l, synced.transactions);
    expect(installments.map((i) => i.status)).toEqual(['received', 'received', 'received']);
    expect(loanStatus(l, synced.transactions)).toBe('settled');
    expect(loanTotals(l, synced.transactions)).toEqual({ received: 30_000, pending: 0 });
  });

  it('empréstimo futuro ainda não gera receita (nada recebido) e fica pendente', () => {
    const l = loan({ firstMonth: '2027-01', installmentTotal: 2 });
    const synced = syncLoanPayments([l], [], TODAY, 'ts');
    expect(synced.created).toHaveLength(0);
    expect(loanStatus(l, synced.transactions)).toBe('pending');
  });

  it('skipLoanMonth evita relançar um mês excluído pelo usuário', () => {
    const l = loan({ firstMonth: '2026-09', installmentTotal: 1 });
    const skipped = skipLoanMonth(l, '2026-09');
    const synced = syncLoanPayments([skipped], [], TODAY, 'ts');
    expect(synced.created).toHaveLength(0);
  });

  it('loansDueInMonth soma as parcelas esperadas no mês, e sortLoans ordena pendentes antes de liquidados', () => {
    const settled = loan({ id: 'a', firstMonth: '2026-09', installmentTotal: 1, amount: 5_000 });
    const pending = loan({ id: 'b', firstMonth: '2026-11', installmentTotal: 1, amount: 7_000 });
    expect(loansDueInMonth([settled, pending], '2026-11')).toBe(7_000);
    const synced = syncLoanPayments([settled], [], TODAY, 'ts');
    const order = sortLoans([settled, pending], synced.transactions);
    expect(order.map((l) => l.id)).toEqual(['b', 'a']);
  });
});

describe('validateLoan', () => {
  const categories = [{ id: 'income-1', name: 'Rendimentos', description: '', icon: 'savings', kind: 'income' as const, group: 'lifestyle' as const, monthlyLimit: null, alertsEnabled: true, order: 0, createdAt: '' }];

  const baseValues: LoanFormValues = {
    borrower: 'Maria',
    amount: '100,00',
    categoryId: 'income-1',
    loanDate: '2026-11-01',
    paymentMode: 'single',
    firstMonth: '2026-11',
    installmentCount: '1',
    notes: '',
  };

  it('aceita pagamento único', () => {
    const result = validateLoan(baseValues, categories, TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.installmentTotal).toBe(1);
  });

  it('exige ao menos 2 parcelas quando parcelado', () => {
    const result = validateLoan({ ...baseValues, paymentMode: 'installments', installmentCount: '1' }, categories, TODAY);
    expect(result.ok).toBe(false);
  });

  it('aceita parcelado com quantidade válida', () => {
    const result = validateLoan({ ...baseValues, paymentMode: 'installments', installmentCount: '5' }, categories, TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.installmentTotal).toBe(5);
  });

  it('rejeita categoria de despesa', () => {
    const expenseCategory = { ...categories[0]!, id: 'exp-1', kind: 'expense' as const };
    const result = validateLoan({ ...baseValues, categoryId: 'exp-1' }, [expenseCategory], TODAY);
    expect(result.ok).toBe(false);
  });
});
