import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData, type Goal } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { addMonths, formatMonthYearShort, monthKeyOf, todayIso } from '@/utils/dates';
import { categories, goal, tx } from './helpers';

const currentMonth = () => monthKeyOf(todayIso());

/** Reserva: R$ 1.000 guardados antes + R$ 300 no mês passado + R$ 200 neste mês. Viagem: concluída. */
function sampleGoals(): Goal[] {
  const month = currentMonth();
  return [
    goal({
      id: 'reserve',
      name: 'Reserva',
      targetAmount: 1_000_000,
      initialAmount: 100_000,
      monthlyContribution: 100_000,
      contributions: [
        { id: 'c1', amount: 30_000, date: `${addMonths(month, -1)}-01` },
        { id: 'c2', amount: 20_000, date: `${month}-01` },
      ],
    }),
    goal({ id: 'trip', name: 'Viagem', icon: 'flight_takeoff', targetAmount: 50_000, initialAmount: 50_000, monthlyContribution: 0 }),
  ];
}

function setup(path: string, goals: Goal[] = sampleGoals()) {
  const data: FinanceData = {
    transactions: [tx({ type: 'income', amount: 500_000, date: todayIso(), description: 'Salário', categoryId: 'salary' })],
    categories,
    goals,
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

describe('Gráficos centrados nas metas', () => {
  it('mostra resumo, aportes por mês, evolução, distribuição e progresso de cada meta', async () => {
    const { user } = setup('/relatorios');
    expect(await screen.findByRole('heading', { name: 'Relatórios das Metas' })).toBeInTheDocument();

    const overview = within(screen.getByRole('region', { name: 'Resumo das metas' }));
    expect(overview.getByText('R$ 2.000,00')).toBeInTheDocument(); // total guardado
    expect(overview.getByText('R$ 200')).toBeInTheDocument(); // aportado no mês
    expect(overview.getByText('R$ 8.500')).toBeInTheDocument(); // falta para concluir
    expect(overview.getByText('1 de 2')).toBeInTheDocument(); // concluídas
    expect(overview.getByText(/−33,3% vs anterior/)).toBeInTheDocument();

    // Aportes por mês (empilhado por meta) e evolução acumulada.
    expect(screen.getByRole('group', { name: 'Aportes mensais em metas' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /total R\$ 200,00: Reserva R\$ 200,00/ })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /total R\$ 300,00: Reserva R\$ 300,00/ })).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Evolução do total guardado em metas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Fim de .*: R\$ 2\.000,00$/ })).toBeInTheDocument();

    // Distribuição do dinheiro guardado.
    expect(screen.getByRole('img', { name: /Dinheiro guardado por meta: Reserva 75,0%, Viagem 25,0%/ })).toBeInTheDocument();

    // Progresso e previsão (R$ 8.500 faltando com R$ 1.000/mês = 9 meses).
    expect(screen.getByRole('progressbar', { name: 'Progresso de Reserva' })).toHaveAttribute('aria-valuenow', '15');
    expect(screen.getByText(`Previsão: ${formatMonthYearShort(addMonths(currentMonth(), 9))}`)).toBeInTheDocument();
    expect(screen.getByText('Meta concluída')).toBeInTheDocument();

    // Nada de taxa ou meta de poupança em %.
    expect(screen.queryByText(/taxa de poupança/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Meta estipulada/)).not.toBeInTheDocument();

    // Receitas × despesas continua como seção secundária.
    expect(screen.getByRole('heading', { name: 'Receitas × despesas' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Aportes em metas/ })).toBeInTheDocument();

    // O intervalo selecionado muda o "aportado no período".
    await user.click(screen.getByRole('radio', { name: '6 meses' }));
    const sixMonths = within(screen.getByRole('region', { name: 'Resumo das metas' }));
    expect(sixMonths.getByText('R$ 500')).toBeInTheDocument();
    expect(sixMonths.queryByText(/vs anterior/)).not.toBeInTheDocument();
  });

  it('sem metas, mostra um estado vazio que leva à tela de Metas', async () => {
    const { user } = setup('/relatorios', []);
    expect(await screen.findByText('Você ainda não tem metas')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resumo das metas' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Receitas × despesas' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ir para Metas/ }));
    expect(await screen.findByRole('heading', { name: 'Metas Financeiras' })).toBeInTheDocument();
  });
});

describe('Início: poupança = aportes em metas', () => {
  it('KPI "Poupança" soma os aportes do mês e o saldo disponível desconta os aportes', async () => {
    const { adapter, user } = setup('/');
    // R$ 5.000 de receita − R$ 500 já aportados (mês passado + este mês).
    expect(await screen.findByTestId('balance-value')).toHaveTextContent('4.500,00');
    expect(screen.getByText('R$ 200,00 guardado em metas neste mês')).toBeInTheDocument();
    expect(screen.queryByText(/Planejamento equilibrado/)).not.toBeInTheDocument();

    const metrics = within(screen.getByRole('region', { name: 'Resumo do mês' }));
    expect(metrics.getByText('Poupança')).toBeInTheDocument();
    expect(metrics.getByText('R$ 200')).toBeInTheDocument();
    expect(metrics.getByTitle(/Variação dos aportes/)).toHaveTextContent('−33,3%');

    // Um novo aporte em Metas reduz o saldo disponível e aumenta a poupança do mês.
    await user.click(screen.getAllByRole('link', { name: /Metas/ })[0]!);
    await screen.findByRole('heading', { name: 'Metas Financeiras' });
    await user.click(screen.getByRole('button', { name: /Aportar/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Aportar em Reserva' });
    expect(within(dialog).getByLabelText('Valor do aporte')).toHaveValue('1.000,00');
    await user.click(within(dialog).getByRole('button', { name: /Registrar aporte/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getAllByRole('link', { name: /Início|Visão Geral/ })[0]!);
    expect(await screen.findByTestId('balance-value')).toHaveTextContent('3.500,00');
    expect(within(screen.getByRole('region', { name: 'Resumo do mês' })).getByText('R$ 1.200')).toBeInTheDocument();

    // O aporte não vira lançamento (DT-008 continua valendo).
    const stored = JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
    expect(stored.transactions).toHaveLength(1);
  });
});
