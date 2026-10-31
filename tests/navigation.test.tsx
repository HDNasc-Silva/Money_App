import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { categories } from './helpers';

function setup(path = '/') {
  const data: FinanceData = {
    transactions: [],
    categories,
    goals: [],
    subscriptions: [],
    settings: { ...DEFAULT_SETTINGS },
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

async function waitForNavs() {
  return screen.findAllByRole('navigation', { name: 'Navegação principal' });
}

function bottomNav(navs: HTMLElement[]) {
  return navs.find((nav) => !nav.querySelector('button'))!;
}

function sideNavOf(navs: HTMLElement[]) {
  return navs.find((nav) => nav.querySelector('button'))!;
}

describe('navegação (DT-021)', () => {
  it('a barra inferior mostra só 4 destinos: Início, Extrato, Metas e Mais', async () => {
    setup();
    const nav = bottomNav(await waitForNavs());
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.textContent)).toEqual([
      'grid_viewInício',
      'receipt_longExtrato',
      'flagMetas',
      'appsMais',
    ]);
  });

  it('chega a Início, Extrato e Metas direto pela barra inferior', async () => {
    const { user } = setup();
    const nav = bottomNav(await waitForNavs());

    await user.click(within(nav).getByRole('link', { name: 'Extrato' }));
    await screen.findByRole('heading', { name: 'Lançamentos' });

    await user.click(within(nav).getByRole('link', { name: 'Metas' }));
    await screen.findByRole('heading', { name: 'Metas Financeiras' });

    await user.click(within(nav).getByRole('link', { name: 'Início' }));
    await screen.findByTestId('balance-value');
  });

  it('o hub "Mais" lista Gastos, Assinaturas, Gráficos e Ajustes e leva a cada um', async () => {
    const { user } = setup();
    const nav = bottomNav(await waitForNavs());

    await user.click(within(nav).getByRole('link', { name: 'Mais' }));
    expect(await screen.findByRole('heading', { name: 'Mais' })).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: /Categorias/ })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: /Assinaturas/ })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: /Relatórios/ })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: /Ajustes/ })).toBeInTheDocument();

    await user.click(within(main).getByRole('link', { name: /Assinaturas/ }));
    await screen.findByRole('heading', { name: 'Assinaturas' });
  });

  it('a navegação lateral continua com todos os 6 destinos e Ajustes', async () => {
    setup();
    const nav = sideNavOf(await waitForNavs());
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'grid_viewVisão Geral',
      'receipt_longLançamentos',
      'categoryCategorias',
      'subscriptionsAssinaturas',
      'flagMetas',
      'analyticsRelatórios',
      'tuneAjustes',
    ]);
  });

  it('a barra inferior (a que fica apertada em 320 px) nunca tem 6 ou 7 itens', async () => {
    setup();
    const nav = bottomNav(await waitForNavs());
    const count = within(nav).getAllByRole('link').length;
    expect(count).toBeLessThanOrEqual(5);
  });
});
