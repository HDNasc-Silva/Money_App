import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData, type Subscription } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { categories, tx } from './helpers';

/** Hoje = 15/10/2026 (só o `Date` é falso; timers reais mantêm o userEvent funcionando). */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

const netflix = (partial: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  name: 'Netflix',
  icon: 'live_tv',
  amount: 4490,
  billingDay: 8,
  categoryId: 'fun',
  active: true,
  startMonth: '2026-10',
  endMonth: null,
  skippedMonths: [],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...partial,
});

function storageWith(subscriptions: Subscription[] = []): MemoryStorageAdapter {
  const data: FinanceData = {
    transactions: [tx({ type: 'income', amount: 500_000, date: '2026-10-05', description: 'Salário', categoryId: 'salary' })],
    categories,
    goals: [],
    subscriptions,
    settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
  };
  const adapter = new MemoryStorageAdapter();
  adapter.write(DATA_KEY, serializeFinanceData(data));
  return adapter;
}

function renderApp(adapter: MemoryStorageAdapter, path: string) {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { user, unmount: view.unmount };
}

const readStored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;
const main = () => within(screen.getByRole('main'));
const navLink = (name: RegExp) => screen.getAllByRole('link', { name })[0]!;

async function createSubscription(user: ReturnType<typeof userEvent.setup>, suggestion: string, amount: string, day: string) {
  const dialog = within(await screen.findByRole('dialog', { name: 'Nova assinatura' }));
  await user.click(dialog.getByRole('button', { name: suggestion }));
  expect(dialog.getByLabelText('Nome')).toHaveValue(suggestion);
  await user.type(dialog.getByLabelText('Valor mensal'), amount);
  await user.clear(dialog.getByLabelText('Dia de cobrança'));
  await user.type(dialog.getByLabelText('Dia de cobrança'), day);
  await user.click(dialog.getByRole('button', { name: /Adicionar assinatura/ }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova assinatura' })).not.toBeInTheDocument());
}

describe('aba Assinaturas', () => {
  it('cria assinaturas que aparecem em Assinaturas, em Gastos e no Extrato do mês, com totais corretos', async () => {
    const adapter = storageWith();
    const { user } = renderApp(adapter, '/assinaturas');

    expect(await screen.findByRole('heading', { name: 'Assinaturas', level: 1 })).toBeInTheDocument();
    expect(main().getByText('Nenhuma assinatura cadastrada')).toBeInTheDocument();

    // Netflix, dia 8: a cobrança de outubro já chegou e é lançada; a categoria "Assinaturas" é criada.
    await user.click(main().getByRole('button', { name: /Adicionar assinatura/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Nova assinatura' }));
    expect(dialog.getByRole('combobox', { name: 'Categoria' })).toHaveDisplayValue('Assinaturas (nova categoria)');
    await createSubscription(user, 'Netflix', '4490', '8');

    // Spotify, dia 20: ainda não chegou, fica prevista.
    await user.click(main().getByRole('button', { name: /Nova assinatura/ }));
    await createSubscription(user, 'Spotify', '2190', '20');

    const list = within(main().getByRole('list', { name: 'Assinaturas' }));
    expect(list.getByText('Netflix')).toBeInTheDocument();
    expect(list.getByText('Dia 8 · Próxima: 08/11/2026')).toBeInTheDocument();
    expect(list.getByText('Dia 20 · Próxima: 20/10/2026')).toBeInTheDocument();
    expect(main().getByText('R$ 66,80')).toBeInTheDocument();
    expect(main().getByText('R$ 801,60')).toBeInTheDocument();
    expect(main().getByText('2 assinaturas ativas')).toBeInTheDocument();

    const stored = readStored(adapter);
    const category = stored.categories.find((c) => c.name === 'Assinaturas');
    expect(category).toBeDefined();
    expect(stored.subscriptions).toHaveLength(2);
    expect(stored.transactions.filter((t) => t.subscriptionId)).toEqual([
      expect.objectContaining({ description: 'Netflix', amount: 4490, date: '2026-10-08', categoryId: category?.id, subscriptionMonth: '2026-10' }),
    ]);

    // Gastos: bloco "Assinaturas do mês" com lançada, prevista e total.
    await user.click(navLink(/Gastos|Categorias/));
    const block = within(await screen.findByRole('region', { name: 'Assinaturas do mês' }));
    expect(block.getByText('Netflix')).toBeInTheDocument();
    expect(block.getByText('Lançada')).toBeInTheDocument();
    expect(block.getByText('Spotify')).toBeInTheDocument();
    expect(block.getByText('Prevista')).toBeInTheDocument();
    expect(block.getByText('R$ 66,80')).toBeInTheDocument();
    expect(block.getByRole('link', { name: /Gerenciar/ })).toHaveAttribute('href', '/assinaturas');
    // A cobrança lançada entra no consumo da categoria.
    expect(main().getAllByText('Assinaturas').length).toBeGreaterThan(0);

    // Extrato: só a cobrança lançada, com o indicador "Assinatura".
    await user.click(navLink(/Extrato|Lançamentos/));
    await screen.findByRole('heading', { name: 'Lançamentos' });
    const item = main().getByText('Netflix').closest('li')!;
    expect(within(item).getByText('Assinatura')).toBeInTheDocument();
    expect(main().queryByText('Spotify')).not.toBeInTheDocument();

    // O link "Gerenciar" volta para Assinaturas.
    await user.click(navLink(/Gastos|Categorias/));
    await user.click(within(await screen.findByRole('region', { name: 'Assinaturas do mês' })).getByRole('link', { name: /Gerenciar/ }));
    expect(await screen.findByRole('heading', { name: 'Assinaturas', level: 1 })).toBeInTheDocument();
  });

  it('gera ao abrir o app as cobranças vencidas, sem duplicar ao reabrir, e não regenera um lançamento excluído', async () => {
    const adapter = storageWith([netflix({ startMonth: '2026-09' })]);
    const first = renderApp(adapter, '/lancamentos');
    await screen.findByRole('heading', { name: 'Lançamentos' });
    await waitFor(() => expect(readStored(adapter).transactions.filter((t) => t.subscriptionId)).toHaveLength(2));

    // Exclui a cobrança de outubro pelo Extrato.
    await first.user.click(main().getByRole('button', { name: 'Ações do lançamento Netflix' }));
    await first.user.click(await screen.findByRole('button', { name: /Excluir lançamento/ }));
    const confirm = within(await screen.findByRole('dialog', { name: 'Excluir lançamento?' }));
    expect(confirm.getByText(/não será lançada de novo neste mês/)).toBeInTheDocument();
    await first.user.click(confirm.getByRole('button', { name: /Excluir/ }));
    await waitFor(() => expect(readStored(adapter).subscriptions[0]?.skippedMonths).toEqual(['2026-10']));
    first.unmount();

    // Reabrir o app não gera de novo.
    renderApp(adapter, '/lancamentos');
    await screen.findByRole('heading', { name: 'Lançamentos' });
    const months = readStored(adapter).transactions.filter((t) => t.subscriptionId).map((t) => t.subscriptionMonth);
    expect(months).toEqual(['2026-09']);
  });

  it('pausa e retoma pela lista; pausada não aparece prevista em Gastos', async () => {
    const adapter = storageWith([netflix({ billingDay: 25 })]);
    const { user } = renderApp(adapter, '/assinaturas');
    await user.click(await screen.findByRole('button', { name: 'Pausar Netflix' }));
    expect(await main().findByText('Pausada')).toBeInTheDocument();
    expect(main().getByText('0 assinaturas ativas')).toBeInTheDocument();
    expect(readStored(adapter).subscriptions[0]?.active).toBe(false);

    await user.click(navLink(/Gastos|Categorias/));
    const block = within(await screen.findByRole('region', { name: 'Assinaturas do mês' }));
    expect(block.getByText('Nenhuma assinatura cobrada neste mês.')).toBeInTheDocument();

    await user.click(navLink(/Assinaturas/));
    await user.click(await screen.findByRole('button', { name: 'Retomar Netflix' }));
    expect(await main().findByText('Ativa')).toBeInTheDocument();
  });

  it('o saldo previsto de um mês futuro desconta as assinaturas previstas', async () => {
    const adapter = storageWith([netflix()]);
    const { user } = renderApp(adapter, '/');
    await screen.findByTestId('balance-value');
    // Outubro: a cobrança do dia 8 já foi lançada (5.000,00 − 44,90).
    await waitFor(() => expect(screen.getByTestId('balance-value')).toHaveTextContent('4.955,10'));

    await user.click(main().getByRole('button', { name: 'Próximo mês' }));
    await user.click(main().getByRole('button', { name: 'Próximo mês' }));
    // Dezembro: + previsões de novembro e dezembro.
    expect(screen.getByTestId('balance-value')).toHaveTextContent('4.865,30');
    expect(main().getByText('Inclui R$ 89,80 em assinaturas previstas')).toBeInTheDocument();
  });

  it('exclui a assinatura mantendo (padrão) ou removendo os lançamentos já gerados', async () => {
    const adapter = storageWith([netflix(), netflix({ id: 'sub-2', name: 'Spotify', amount: 2190, billingDay: 3 })]);
    const { user } = renderApp(adapter, '/assinaturas');

    await user.click(await screen.findByRole('button', { name: 'Editar Netflix' }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Editar assinatura' })).getByRole('button', { name: /Excluir assinatura/ }));
    let confirm = within(await screen.findByRole('dialog', { name: 'Excluir assinatura?' }));
    expect(confirm.getByRole('checkbox', { name: /Excluir também os lançamentos/ })).not.toBeChecked();
    await user.click(confirm.getByRole('button', { name: /Excluir/ }));
    await waitFor(() => expect(readStored(adapter).subscriptions.map((s) => s.name)).toEqual(['Spotify']));
    expect(readStored(adapter).transactions.some((t) => t.subscriptionId === 'sub-1')).toBe(true);

    await user.click(await screen.findByRole('button', { name: 'Editar Spotify' }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Editar assinatura' })).getByRole('button', { name: /Excluir assinatura/ }));
    confirm = within(await screen.findByRole('dialog', { name: 'Excluir assinatura?' }));
    await user.click(confirm.getByRole('checkbox', { name: /Excluir também os lançamentos/ }));
    await user.click(confirm.getByRole('button', { name: /^Excluir$/ }));
    await waitFor(() => expect(readStored(adapter).subscriptions).toHaveLength(0));
    expect(readStored(adapter).transactions.some((t) => t.subscriptionId === 'sub-2')).toBe(false);
  });

  it('a navegação tem a aba Assinaturas e categorias usadas por assinaturas não podem ser excluídas', async () => {
    const adapter = storageWith([netflix({ categoryId: 'misc', billingDay: 25 })]);
    const { user } = renderApp(adapter, '/categorias');
    await screen.findByRole('heading', { name: 'Categorias & Orçamentos' });
    expect(screen.getAllByRole('link', { name: /Assinaturas/ }).some((l) => l.getAttribute('href') === '/assinaturas')).toBe(true);

    const card = main().getByRole('heading', { name: 'Outros' }).closest('article')!;
    await user.click(within(card).getByRole('button', { name: /Ajustar limite/ }));
    const sheet = within(await screen.findByRole('dialog', { name: 'Editar categoria' }));
    await user.click(sheet.getByRole('button', { name: /Excluir categoria/ }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Excluir categoria?' })).getByRole('button', { name: /Excluir/ }));
    expect(await screen.findByText(/usada por 1 assinatura/)).toBeInTheDocument();
    expect(readStored(adapter).categories.some((c) => c.id === 'misc')).toBe(true);
  });
});
