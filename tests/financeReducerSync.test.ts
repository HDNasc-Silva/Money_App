import { describe, expect, it } from 'vitest';
import { EMPTY_DATA, type Transaction } from '@/models';
import { financeReducer, initialFinanceState, type FinanceState } from '@/store/financeReducer';

function tx(id: string, amount: number): Transaction {
  return {
    id,
    type: 'income',
    description: id,
    amount,
    date: '2026-11-01',
    categoryId: 'cat',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

const ready = (data: FinanceState['data']): FinanceState => ({ ...initialFinanceState, status: 'ready', data });

describe('financeReducer — sincronização de assinaturas e empréstimos (DT-027)', () => {
  it('"loans/synced" soma o criado sobre o estado mais atual, sem perder um lançamento salvo por outra ação no meio do caminho', () => {
    // Estado inicial: só o lançamento manual "dsadas".
    const base = ready({ ...EMPTY_DATA, transactions: [tx('dsadas', -10_000)] });

    // Uma ação "saveTransaction"/"saveLoan" qualquer adiciona um lançamento (ex.: o pagamento do
    // empréstimo X) ANTES da sincronização de empréstimos processar.
    const afterX = financeReducer(base, { type: 'transaction/saved', transaction: tx('loan-x', 100) });

    // A sincronização de empréstimos (ex.: disparada por "visibilitychange") tinha sido calculada a
    // partir de um snapshot ANTERIOR (sem o X), mas gerou o pagamento do empréstimo Y — ela não deve
    // apagar o X que entrou nesse meio tempo.
    const afterY = financeReducer(afterX, { type: 'loans/synced', created: [tx('loan-y', 10_000)] });

    expect(afterY.data.transactions.map((t) => t.id).sort()).toEqual(['dsadas', 'loan-x', 'loan-y']);
  });

  it('"subscriptions/synced" e "loans/synced" concorrentes (mesmo tick, a partir do mesmo snapshot) não se sobrescrevem', () => {
    const base = ready({ ...EMPTY_DATA, transactions: [tx('dsadas', -10_000)] });

    // As duas sincronizações automáticas (onVisible) leem o MESMO estado-base e calculam seus
    // "created" de forma independente — o merge deve preservar as duas contribuições.
    const afterSubs = financeReducer(base, {
      type: 'subscriptions/synced',
      created: [tx('sub-charge', -500)],
      subscriptions: [],
    });
    const afterLoans = financeReducer(afterSubs, { type: 'loans/synced', created: [tx('loan-y', 10_000)] });

    expect(afterLoans.data.transactions.map((t) => t.id).sort()).toEqual(['dsadas', 'loan-y', 'sub-charge']);
  });

  it('é idempotente: reaplicar o mesmo "created" não duplica o lançamento', () => {
    const base = ready({ ...EMPTY_DATA, transactions: [tx('dsadas', -10_000), tx('loan-y', 10_000)] });
    const result = financeReducer(base, { type: 'loans/synced', created: [tx('loan-y', 10_000)] });
    expect(result.data.transactions.map((t) => t.id).sort()).toEqual(['dsadas', 'loan-y']);
  });
});
