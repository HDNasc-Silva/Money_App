import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { todayIso } from '@/utils/dates';
import { categories, tx } from './helpers';

function setup(path = '/') {
  const today = todayIso();
  const data: FinanceData = {
    transactions: [tx({ type: 'income', amount: 500_000, date: today, description: 'Salário', categoryId: 'salary' })],
    categories,
    goals: [],
    settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
  };
  const adapter = new MemoryStorageAdapter();
  adapter.write(DATA_KEY, serializeFinanceData(data));
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { adapter, user };
}

describe('integração entre módulos', () => {
  it('uma nova despesa atualiza Visão Geral, Categorias, Relatórios e o armazenamento', async () => {
    const { adapter, user } = setup();

    expect(await screen.findByTestId('balance-value')).toHaveTextContent('5.000,00');
    expect(screen.getByText(/Olá, Ana/)).toBeInTheDocument();

    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /Novo Lançamento/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    await user.type(within(dialog).getByLabelText('Valor'), '150000');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Mercado do mês');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'food');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('balance-value')).toHaveTextContent('3.500,00');
    expect(screen.getAllByText('Alerta de Orçamento').length).toBeGreaterThan(0);

    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions.map((t) => t.description)).toContain('Mercado do mês');

    await user.click(screen.getAllByRole('link', { name: /Gastos|Categorias/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Categorias & Orçamentos' })).toBeInTheDocument();
    expect(screen.getByText(/Teto ultrapassado/)).toBeInTheDocument();
    expect(screen.getByText('Alerta de Compensação')).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /Gráficos|Relatórios/ })[0]!);
    expect(await screen.findByRole('heading', { name: 'Relatórios das Metas' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Alimentação 100,0%/ })).toBeInTheDocument();
  });

  it('valida o formulário e não salva lançamento inválido', async () => {
    const { adapter, user } = setup('/lancamentos');
    await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));
    expect(within(dialog).getByText('Informe um valor válido.')).toBeInTheDocument();
    expect(within(dialog).getByText('Descrição é obrigatório.')).toBeInTheDocument();
    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions).toHaveLength(1);
  });

  it('aplica a máscara de valor enquanto o usuário digita', async () => {
    const { adapter, user } = setup('/lancamentos');
    await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    const amount = within(dialog).getByLabelText('Valor');
    expect(amount).toHaveAttribute('inputmode', 'numeric');

    const shown: string[] = [];
    for (const key of '15000') {
      await user.type(amount, key);
      shown.push((amount as HTMLInputElement).value);
    }
    expect(shown).toEqual(['0,01', '0,15', '1,50', '15,00', '150,00']);

    await user.type(amount, 'abc,.');
    expect(amount).toHaveValue('150,00');
    await user.type(amount, '0');
    expect(amount).toHaveValue('1.500,00');
    expect((amount as HTMLInputElement).selectionStart).toBe('1.500,00'.length);
    await user.type(amount, '{Backspace}');
    expect(amount).toHaveValue('150,00');

    await user.clear(amount);
    await user.paste('R$ 1234,56');
    expect(amount).toHaveValue('1.234,56');

    await user.type(within(dialog).getByLabelText('Descrição'), 'Lazer');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'fun');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions.find((t) => t.description === 'Lazer')?.amount).toBe(123456);
  });

  it('busca, edita e exclui lançamentos', async () => {
    const { adapter, user } = setup('/lancamentos');
    await screen.findByRole('heading', { name: 'Lançamentos' });

    await user.type(screen.getByLabelText('Buscar lançamentos'), 'inexistente');
    expect(screen.getByText('Nenhum lançamento encontrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    await user.click(screen.getByRole('button', { name: 'Ações do lançamento Salário' }));
    await user.click(await screen.findByRole('button', { name: /Editar informações/ }));
    const form = await screen.findByRole('dialog', { name: 'Editar lançamento' });
    const amount = within(form).getByLabelText('Valor');
    expect(amount).toHaveValue('5.000,00');
    await user.clear(amount);
    await user.type(amount, '600000');
    expect(amount).toHaveValue('6.000,00');
    await user.click(within(form).getByRole('button', { name: /Salvar alterações/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByText(/6\.000,00/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Ações do lançamento Salário' }));
    await user.click(await screen.findByRole('button', { name: /Excluir lançamento/ }));
    await user.click(await screen.findByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(screen.getByText('Nenhum lançamento encontrado')).toBeInTheDocument());
    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions).toHaveLength(0);
  });

  it('impede excluir categoria com lançamentos', async () => {
    const { user } = setup('/categorias');
    await screen.findByRole('heading', { name: 'Categorias & Orçamentos' });
    await user.click(screen.getByRole('radio', { name: 'Receitas' }));
    await user.click(screen.getByRole('button', { name: /Editar/ }));
    await user.click(await screen.findByRole('button', { name: /Excluir categoria/ }));
    await user.click(await screen.findByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText(/possui 1 lançamento/)).toBeInTheDocument();
  });

  it('não carrega dados de demonstração na primeira execução (ver tests/onboarding.test.tsx)', async () => {
    const adapter = new MemoryStorageAdapter();
    render(
      <MemoryRouter>
        <AppProviders repositories={createRepositories(adapter)}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Como prefere ser chamado?' })).toBeInTheDocument();
    expect(screen.queryByText(/dados de demonstração/)).not.toBeInTheDocument();
    expect(adapter.read(DATA_KEY)).not.toBeNull();
  });
});
