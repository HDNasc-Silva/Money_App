import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData, type Loan, type Transaction } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { categories } from './helpers';

/** Hoje = 07/11/2026 (só o `Date` é falso). */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 7, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderHome(data: Partial<FinanceData>) {
  const adapter = new MemoryStorageAdapter();
  adapter.write(
    DATA_KEY,
    serializeFinanceData({
      transactions: [],
      categories,
      goals: [],
      subscriptions: [],
      loans: [],
      settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
      ...data,
    }),
  );
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
}

function loan(partial: Partial<Loan>): Loan {
  return {
    id: 'loan-x',
    borrower: 'X',
    amount: 100,
    categoryId: 'salary',
    loanDate: '2026-11-07',
    firstMonth: '2026-11',
    installmentTotal: 1,
    skippedMonths: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

/**
 * Cenário reportado pelo usuário (Agiotagem, DT-026): uma despesa manual e dois empréstimos de
 * pagamento único, ambos já vencidos e lançados como receita em novembro/2026.
 * - "dsadas": despesa de -R$ 100,00 em 07/11.
 * - "Empréstimo — X": receita de +R$ 1,00 em 07/11 (gerada automaticamente).
 * - "Empréstimo — Y": receita de +R$ 100,00 em 01/11 (gerada automaticamente).
 * Soma correta: -100 + 1 + 100 = +1 real. O saldo não deve "esquecer" nenhum dos lançamentos
 * gerados por empréstimo, e o card de "a receber este mês" não deve contar o que já foi lançado.
 */
describe('Início com empréstimos já lançados no mês (Agiotagem, DT-026)', () => {
  it('saldo atual soma os três lançamentos (inclusive os gerados por empréstimo)', async () => {
    const loanX = loan({ id: 'loan-x', borrower: 'X', amount: 100, loanDate: '2026-11-07' });
    const loanY = loan({ id: 'loan-y', borrower: 'Y', amount: 10_000, loanDate: '2026-11-01' });
    const manual: Transaction = {
      id: 'manual-1',
      type: 'expense',
      description: 'dsadas',
      amount: 10_000,
      date: '2026-11-07',
      categoryId: 'food',
      createdAt: '2026-11-07T00:00:00.000Z',
      updatedAt: '2026-11-07T00:00:00.000Z',
    };
    renderHome({ transactions: [manual], loans: [loanX, loanY] });

    const balance = await screen.findByTestId('balance-value');
    expect(balance.textContent).toBe('1,00');
  });

  it('"Empréstimo a receber este mês" não conta parcelas já lançadas no Extrato', async () => {
    const loanX = loan({ id: 'loan-x', borrower: 'X', amount: 100, loanDate: '2026-11-07' });
    const loanY = loan({ id: 'loan-y', borrower: 'Y', amount: 10_000, loanDate: '2026-11-01' });
    renderHome({ loans: [loanX, loanY] });

    await screen.findByTestId('balance-value');
    // As duas parcelas já foram lançadas (viraram receita); não há nada pendente este mês.
    expect(screen.queryByText(/de empréstimo a receber esse mês/)).not.toBeInTheDocument();
  });
});
