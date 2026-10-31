import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { MAX_FUTURE_MONTHS } from '@/domain/periods';
import { DEFAULT_SETTINGS, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { addMonths, formatMonthLabel, monthKeyOf, todayIso } from '@/utils/dates';
import { categories, tx } from './helpers';

function setup(path = '/') {
  const data: FinanceData = {
    transactions: [tx({ type: 'income', amount: 500_000, date: todayIso(), description: 'Salário', categoryId: 'salary' })],
    categories,
    goals: [],
    subscriptions: [],
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

const currentMonth = () => monthKeyOf(todayIso());

describe('navegação para meses futuros', () => {
  it('avança além do mês atual, sinaliza mês futuro e respeita o limite superior', async () => {
    const { user } = setup();
    await screen.findByTestId('balance-value');
    const main = within(screen.getByRole('main'));
    const next = main.getByRole('button', { name: 'Próximo mês' });

    expect(main.getByText(formatMonthLabel(currentMonth()))).toBeInTheDocument();
    expect(main.queryByText('Mês futuro')).not.toBeInTheDocument();
    expect(next).toBeEnabled();

    // Dois meses à frente (ex.: de Outubro para Dezembro de 2026).
    await user.click(next);
    await user.click(next);
    expect(main.getByText(formatMonthLabel(addMonths(currentMonth(), 2)))).toBeInTheDocument();
    expect(main.getByText('Mês futuro')).toBeInTheDocument();
    expect(main.getByText('Saldo previsto ao fim do mês')).toBeInTheDocument();
    expect(screen.getByTestId('balance-value')).toHaveTextContent('5.000,00');
    expect(main.getByText('Nenhuma receita planejada para este mês')).toBeInTheDocument();

    // Avança até o limite: o botão é desabilitado no último mês permitido.
    let clicks = 2;
    while (!(next as HTMLButtonElement).disabled && clicks < MAX_FUTURE_MONTHS + 5) {
      await user.click(next);
      clicks += 1;
    }
    expect(clicks).toBe(MAX_FUTURE_MONTHS);
    expect(main.getByText(formatMonthLabel(addMonths(currentMonth(), MAX_FUTURE_MONTHS)))).toBeInTheDocument();
    expect(next).toBeDisabled();

    // A navegação para trás continua livre.
    await user.click(main.getByRole('button', { name: 'Mês anterior' }));
    expect(main.getByText(formatMonthLabel(addMonths(currentMonth(), MAX_FUTURE_MONTHS - 1)))).toBeInTheDocument();
    expect(next).toBeEnabled();
  }, 30_000);

  it('Categorias e Relatórios funcionam em um mês futuro sem lançamentos', async () => {
    const { user } = setup('/categorias');
    await screen.findByRole('heading', { name: 'Categorias & Orçamentos' });
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Próximo mês' }));
    expect(within(screen.getByRole('main')).getByText('Mês futuro')).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /Gráficos|Relatórios/ })[0]!);
    const main = within(await screen.findByRole('main'));
    await screen.findByRole('heading', { name: 'Relatórios das Metas' });
    expect(main.getByText(formatMonthLabel(addMonths(currentMonth(), 1)))).toBeInTheDocument();
    expect(main.getAllByText('Período ainda não iniciado.').length).toBeGreaterThan(0);
    expect(main.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it('cria lançamento com data futura e ele aparece no mês planejado', async () => {
    const { adapter, user } = setup();
    await screen.findByTestId('balance-value');
    const futureDate = `${addMonths(currentMonth(), 2)}-15`;

    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /Novo Lançamento/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    await user.type(within(dialog).getByLabelText('Valor'), '100000');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Viagem planejada');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'fun');
    fireEvent.change(within(dialog).getByLabelText('Data'), { target: { value: futureDate } });
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions.find((t) => t.description === 'Viagem planejada')?.date).toBe(futureDate);
    // O saldo atual não considera a despesa planejada...
    expect(screen.getByTestId('balance-value')).toHaveTextContent('5.000,00');

    // ...mas o saldo previsto do mês futuro, sim.
    const next = within(screen.getByRole('main')).getByRole('button', { name: 'Próximo mês' });
    await user.click(next);
    await user.click(next);
    expect(screen.getByTestId('balance-value')).toHaveTextContent('4.000,00');
  });

  it('rejeita data de lançamento além do limite de planejamento', async () => {
    const { adapter, user } = setup('/lancamentos');
    await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    await user.type(within(dialog).getByLabelText('Valor'), '1000');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Muito longe');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'fun');
    fireEvent.change(within(dialog).getByLabelText('Data'), {
      target: { value: `${addMonths(currentMonth(), MAX_FUTURE_MONTHS + 1)}-01` },
    });
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));
    expect(within(dialog).getByText(/A data deve ser até/)).toBeInTheDocument();
    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions).toHaveLength(1);
  });
});
