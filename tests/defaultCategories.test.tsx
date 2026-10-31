import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { ToastProvider } from '@/components/common/Toast';
import { DEFAULT_SETTINGS, type Category, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { buildDefaultCategories, missingDefaultCategories } from '@/store/defaultCategories';
import { FinanceProvider, useFinance, type FinanceActions } from '@/store/FinanceProvider';
import { todayIso } from '@/utils/dates';
import { categories, goal, tx } from './helpers';

const DEFAULT_COUNT = buildDefaultCategories('').length;

function storageWith(data: Partial<FinanceData>): MemoryStorageAdapter {
  const adapter = new MemoryStorageAdapter();
  const full: FinanceData = {
    transactions: [],
    categories: [],
    goals: [],
    subscriptions: [],
    settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
    ...data,
  };
  adapter.write(DATA_KEY, serializeFinanceData(full));
  return adapter;
}

const readStored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;

function renderApp(adapter: MemoryStorageAdapter, path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return user;
}

describe('categorias padrão (regra pura)', () => {
  it('não repete nomes existentes, ignorando acentos e maiúsculas, e não reutiliza ids ocupados', () => {
    const existing: Category[] = [
      { ...categories[0]!, id: 'x1', name: 'ALIMENTACAO' },
      { ...categories[0]!, id: 'cat-home', name: 'Casa' },
      { ...categories[3]!, id: 'x2', name: 'salario' },
    ];
    let next = 0;
    const missing = missingDefaultCategories(existing, '2026-10-30T00:00:00.000Z', () => `novo-${(next += 1)}`);

    const names = missing.map((c) => c.name);
    expect(names).not.toContain('Alimentação');
    expect(names).not.toContain('Salário');
    expect(names).toContain('Moradia');
    expect(missing).toHaveLength(DEFAULT_COUNT - 2);
    expect(missing.find((c) => c.name === 'Moradia')?.id).toBe('novo-1');
    expect(new Set(missing.map((c) => c.id)).size).toBe(missing.length);
  });
});

describe('ensureDefaultCategories', () => {
  it('adiciona só as que faltam e não duplica em chamadas repetidas', async () => {
    const adapter = storageWith({ categories });
    const probe: { actions?: FinanceActions } = {};
    function Probe() {
      const finance = useFinance();
      probe.actions = finance.actions;
      return <span>{finance.state.status}</span>;
    }
    render(
      <ToastProvider>
        <FinanceProvider repositories={createRepositories(adapter)}>
          <Probe />
        </FinanceProvider>
      </ToastProvider>,
    );
    await screen.findByText('ready');

    let added: Category[] = [];
    await act(async () => {
      added = await probe.actions!.ensureDefaultCategories();
    });
    // helpers já têm Alimentação, Lazer, Outros e Salário.
    expect(added).toHaveLength(DEFAULT_COUNT - 4);
    expect(readStored(adapter).categories).toHaveLength(DEFAULT_COUNT);

    await act(async () => {
      added = await probe.actions!.ensureDefaultCategories();
    });
    expect(added).toHaveLength(0);
    expect(readStored(adapter).categories).toHaveLength(DEFAULT_COUNT);
  });
});

describe('apagar todos os dados', () => {
  it('zera lançamentos e metas, mantém o nome e recria as categorias padrão', async () => {
    const adapter = storageWith({
      categories,
      transactions: [tx({ type: 'income', amount: 100_000, date: todayIso(), categoryId: 'salary' })],
      goals: [goal()],
    });
    const user = renderApp(adapter, '/ajustes');

    await user.click(await screen.findByRole('button', { name: /Apagar todos os dados/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Apagar todos os dados?' });
    expect(within(dialog).getByText(/categorias padrão serão recriadas/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Apagar tudo/ }));

    await waitFor(() => expect(readStored(adapter).transactions).toHaveLength(0));
    const stored = readStored(adapter);
    expect(stored.goals).toHaveLength(0);
    expect(stored.categories.map((c) => c.name)).toEqual(buildDefaultCategories('').map((c) => c.name));
    expect(stored.settings.userName).toBe('Ana');
    expect(stored.settings.isDemoData).toBe(false);
  });
});

describe('recuperação quando não há categorias', () => {
  it('cria as categorias padrão pelo formulário e salva o lançamento', async () => {
    const adapter = storageWith({ categories: [] });
    const user = renderApp(adapter, '/lancamentos');

    await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    expect(within(dialog).getByText(/ainda não tem categorias de despesa/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Criar categoria personalizada' })).toHaveAttribute('href', '/categorias');

    await user.click(within(dialog).getByRole('button', { name: /Criar categorias padrão/ }));
    await waitFor(() => expect(within(dialog).queryByText(/ainda não tem categorias/)).not.toBeInTheDocument());

    await user.type(within(dialog).getByLabelText('Valor'), '4250');
    expect(within(dialog).getByLabelText('Valor')).toHaveValue('42,50');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Padaria');
    await user.click(within(dialog).getByRole('radio', { name: 'Alimentação' }));
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const stored = readStored(adapter);
    expect(stored.categories).toHaveLength(DEFAULT_COUNT);
    expect(stored.transactions).toHaveLength(1);
    expect(stored.transactions[0]).toMatchObject({ description: 'Padaria', amount: 4250, categoryId: 'cat-food' });
  });

  it('o link de categoria personalizada fecha o formulário e abre Categorias', async () => {
    const adapter = storageWith({ categories: [] });
    const user = renderApp(adapter, '/lancamentos');

    await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    await user.click(within(dialog).getByRole('link', { name: 'Criar categoria personalizada' }));

    expect(await screen.findByRole('heading', { name: 'Categorias & Orçamentos' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Novo lançamento' })).not.toBeInTheDocument());
  });
});
