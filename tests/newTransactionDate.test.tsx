import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { categories, tx } from './helpers';

/** Fixa apenas o relógio (`Date`); timers reais mantêm o userEvent funcionando. */
function freezeToday(year: number, monthIndex: number, day: number) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(year, monthIndex, day, 12));
}

function setup(path = '/') {
  const data: FinanceData = {
    transactions: [tx({ type: 'income', amount: 500_000, date: '2026-10-05', description: 'Salário', categoryId: 'salary' })],
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
  return { user };
}

const main = () => within(screen.getByRole('main'));

async function openNewFromDashboard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(main().getByRole('button', { name: /Novo Lançamento/ }));
  return within(await screen.findByRole('dialog', { name: 'Novo lançamento' }));
}

describe('data sugerida para novo lançamento', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('hoje = 30/10/2026', () => {
    beforeEach(() => freezeToday(2026, 9, 30));

    it('sugere hoje no mês atual', async () => {
      const { user } = setup();
      await screen.findByTestId('balance-value');
      const dialog = await openNewFromDashboard(user);
      expect(dialog.getByLabelText('Data')).toHaveValue('2026-10-30');
    });

    it('sugere o mesmo dia em dezembro de 2026 quando dezembro está selecionado', async () => {
      const { user } = setup();
      await screen.findByTestId('balance-value');
      const next = main().getByRole('button', { name: 'Próximo mês' });
      await user.click(next);
      await user.click(next);
      expect(main().getByText('Dezembro 2026')).toBeInTheDocument();

      const dialog = await openNewFromDashboard(user);
      expect(dialog.getByLabelText('Data')).toHaveValue('2026-12-30');
    });

    it('vale para mês passado, navegação lateral e Lançamentos; edição mantém a data original', async () => {
      const { user } = setup();
      await screen.findByTestId('balance-value');
      await user.click(main().getByRole('button', { name: 'Mês anterior' }));
      expect(main().getByText('Setembro 2026')).toBeInTheDocument();

      // Botão da navegação lateral (fora do <main>).
      const sideNav = screen.getAllByRole('navigation', { name: 'Navegação principal' }).find((nav) =>
        within(nav).queryByRole('button', { name: /Novo Lançamento/ }),
      )!;
      await user.click(within(sideNav).getByRole('button', { name: /Novo Lançamento/ }));
      let dialog = within(await screen.findByRole('dialog', { name: 'Novo lançamento' }));
      expect(dialog.getByLabelText('Data')).toHaveValue('2026-09-30');
      await user.keyboard('{Escape}');

      // Tela de Lançamentos segue o mesmo mês selecionado.
      await user.click(screen.getAllByRole('link', { name: /Lançamentos|Extrato/ })[0]!);
      await screen.findByRole('heading', { name: 'Lançamentos' });
      await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
      dialog = within(await screen.findByRole('dialog', { name: 'Novo lançamento' }));
      expect(dialog.getByLabelText('Data')).toHaveValue('2026-09-30');
      await user.keyboard('{Escape}');

      // Edição: a data do lançamento é preservada.
      await user.click(screen.getByRole('button', { name: 'Ações do lançamento Salário' }));
      await user.click(await screen.findByRole('button', { name: /Editar informações/ }));
      dialog = within(await screen.findByRole('dialog', { name: 'Editar lançamento' }));
      expect(dialog.getByLabelText('Data')).toHaveValue('2026-10-05');
    });
  });

  it('limita ao último dia do mês selecionado (hoje 31/10 → 30/11)', async () => {
    freezeToday(2026, 9, 31);
    const { user } = setup();
    await screen.findByTestId('balance-value');
    await user.click(main().getByRole('button', { name: 'Próximo mês' }));
    const dialog = await openNewFromDashboard(user);
    expect(dialog.getByLabelText('Data')).toHaveValue('2026-11-30');
  });
});
