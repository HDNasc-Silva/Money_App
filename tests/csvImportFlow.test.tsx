import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { categories, tx } from './helpers';

function setup() {
  const data: FinanceData = {
    transactions: [tx({ type: 'expense', amount: 4_000, date: '2026-10-10', description: 'Cinema', categoryId: 'fun' })],
    categories,
    goals: [],
    subscriptions: [],
    settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
  };
  const adapter = new MemoryStorageAdapter();
  adapter.write(DATA_KEY, serializeFinanceData(data));
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/ajustes']}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { adapter, user };
}

describe('Ajustes → Planilha (CSV)', () => {
  it('importa lançamentos de uma planilha com prévia, ignorando linhas inválidas e já existentes', async () => {
    const { adapter, user } = setup();
    expect(await screen.findByText(/Leve seus dados para a planilha quando quiser/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar para planilha/ })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Importar de planilha/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Importar de planilha' }));
    const csv = ['Data;Descrição;Valor;Categoria', '10/10/2026;Cinema;-40,00;Lazer', '12/10/2026;Mercado;-150,00;Alimentação', 'xx;Ruim;-1,00;Lazer'].join('\n');
    const file = new File([csv], 'minha-planilha.csv', { type: 'text/csv' });
    fireEvent.change(dialog.getByTestId('csv-file-input'), { target: { files: [file] } });

    const preview = within(await screen.findByRole('region', { name: 'Prévia da importação' }));
    expect(preview.getByText(/1 lançamento pronto para importar · 1 linha com problema · 1 já existente \(ignorado\)/)).toBeInTheDocument();
    expect(preview.getByText('Mercado')).toBeInTheDocument();
    expect(preview.getByText('Data inválida (use DD/MM/AAAA).')).toBeInTheDocument();

    await user.click(preview.getByRole('button', { name: 'Importar 1 lançamento' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions.map((t) => [t.description, t.amount, t.categoryId])).toEqual([
      ['Cinema', 4_000, 'fun'],
      ['Mercado', 15_000, 'food'],
    ]);
  });

  it('mostra o erro de um arquivo sem as colunas esperadas', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: /Importar de planilha/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Importar de planilha' }));
    fireEvent.change(dialog.getByTestId('csv-file-input'), { target: { files: [new File(['Nome;Preço\nA;1'], 'x.csv')] } });
    expect(await dialog.findByRole('alert')).toHaveTextContent(/Cabeçalho não reconhecido/);
  });
});
