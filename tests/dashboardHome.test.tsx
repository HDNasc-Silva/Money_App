import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type Category, type FinanceData, type Subscription } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { categories, goal, tx } from './helpers';

/** Hoje = 15/10/2026 (só o `Date` é falso). */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

const subscription = (partial: Partial<Subscription>): Subscription => ({
  id: 'sub-1',
  name: 'Netflix',
  icon: 'live_tv',
  amount: 4490,
  billingDay: 20,
  categoryId: 'fun',
  active: true,
  startMonth: '2026-10',
  endMonth: null,
  skippedMonths: [],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...partial,
});

/** Três categorias com limite baixo para gerar mais de dois alertas. */
const tightCategories: Category[] = categories.map((c) => (c.kind === 'expense' ? { ...c, monthlyLimit: 1_000 } : c));

function renderHome(data: Partial<FinanceData>) {
  const adapter = new MemoryStorageAdapter();
  adapter.write(
    DATA_KEY,
    serializeFinanceData({
      transactions: [],
      categories,
      goals: [],
      subscriptions: [],
      settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
      ...data,
    }),
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return user;
}

const region = (name: string) => within(screen.getByRole('region', { name }));

describe('Início reorganizado', () => {
  it('mostra próximas cobranças, últimos lançamentos (5), metas e KPIs com variação vs mês anterior', async () => {
    const transactions = [
      tx({ type: 'income', amount: 500_000, date: '2026-10-05', description: 'Salário', categoryId: 'salary' }),
      tx({ type: 'income', amount: 400_000, date: '2026-09-05', description: 'Salário setembro', categoryId: 'salary' }),
      ...['Mercado', 'Feira', 'Cinema', 'Uber', 'Farmácia', 'Livro'].map((description, i) =>
        tx({ type: 'expense', amount: 1_00 * (i + 1), date: `2026-10-${String(i + 6).padStart(2, '0')}`, description, categoryId: 'misc' }),
      ),
    ];
    renderHome({
      transactions,
      subscriptions: [subscription({}), subscription({ id: 'sub-2', name: 'Spotify', amount: 2190, billingDay: 3 })],
      goals: [goal({ id: 'g1', name: 'Viagem', initialAmount: 800_000 }), goal({ id: 'g2', name: 'Reserva', initialAmount: 100_000 })],
    });
    await screen.findByTestId('balance-value');

    // Próximas cobranças: só a Netflix (dia 20) ainda vai sair; o Spotify (dia 3) já foi lançado.
    const upcoming = region('Próximas cobranças');
    expect(upcoming.getByText('Netflix')).toBeInTheDocument();
    expect(upcoming.queryByText('Spotify')).not.toBeInTheDocument();
    expect(upcoming.getByText('20 de Outubro')).toBeInTheDocument();
    expect(upcoming.getByText('Total previsto')).toBeInTheDocument();
    expect(upcoming.getAllByText('−R$ 44,90')).toHaveLength(2);

    // Últimos lançamentos: os 5 mais recentes do mês, com link para o extrato.
    const recent = region('Últimos lançamentos');
    const items = recent.getAllByRole('button', { name: /^Editar lançamento/ });
    expect(items.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Editar lançamento Livro',
      'Editar lançamento Farmácia',
      'Editar lançamento Uber',
      'Editar lançamento Cinema',
      'Editar lançamento Feira',
    ]);
    expect(recent.getByRole('link', { name: 'Ver extrato' })).toHaveAttribute('href', '/lancamentos');

    // Metas em destaque: a mais próxima de concluir primeiro.
    const goals = region('Suas metas');
    expect(goals.getAllByRole('progressbar').map((p) => p.getAttribute('aria-label'))).toEqual(['Progresso de Viagem', 'Progresso de Reserva']);
    expect(goals.getByText('80,0%')).toBeInTheDocument();

    // KPIs: variação discreta com o contexto "vs mês anterior".
    const metrics = region('Resumo do mês');
    expect(metrics.getByTitle('Variação das receitas em relação ao mês anterior')).toHaveTextContent('+25,0%');
    expect(metrics.getByText('Variação vs mês anterior')).toBeInTheDocument();
  });

  it('tocar num lançamento recente abre a edição', async () => {
    const user = renderHome({ transactions: [tx({ type: 'expense', amount: 1_000, date: '2026-10-10', description: 'Mercado', categoryId: 'food' })] });
    await user.click(await screen.findByRole('button', { name: 'Editar lançamento Mercado' }));
    expect(await screen.findByRole('dialog', { name: 'Editar lançamento' })).toBeInTheDocument();
  });

  it('estados vazios convidam à ação (primeiro lançamento, assinaturas, metas)', async () => {
    const user = renderHome({});
    await screen.findByTestId('balance-value');
    expect(region('Últimos lançamentos').getByText(/Nenhum lançamento neste mês/)).toBeInTheDocument();
    expect(region('Próximas cobranças').getByRole('link', { name: /Cadastre suas assinaturas/ })).toHaveAttribute('href', '/assinaturas');
    expect(region('Suas metas').getByRole('link', { name: /Crie sua primeira meta/ })).toHaveAttribute('href', '/metas');
    await user.click(region('Últimos lançamentos').getByRole('button', { name: /Registrar lançamento/ }));
    expect(await screen.findByRole('dialog', { name: 'Novo lançamento' })).toBeInTheDocument();
  });

  it('alertas compactos: no máximo 2 visíveis, o resto em "Ver todos"', async () => {
    const user = renderHome({
      categories: tightCategories,
      transactions: ['food', 'fun', 'misc'].map((categoryId) => tx({ type: 'expense', amount: 5_000, date: '2026-10-10', categoryId })),
    });
    await screen.findByTestId('balance-value');
    const alerts = within(screen.getByRole('heading', { name: 'Alertas do mês' }).closest('section')!);
    expect(alerts.getByText('3 ativos')).toBeInTheDocument();
    expect(alerts.getAllByText('Alerta de Orçamento')).toHaveLength(2);

    const more = alerts.getByRole('button', { name: /Ver todos \(\+1\)/ });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(alerts.getAllByText('Alerta de Orçamento')).toHaveLength(3);
    expect(alerts.getByRole('button', { name: /Mostrar menos/ })).toHaveAttribute('aria-expanded', 'true');
  });
});
