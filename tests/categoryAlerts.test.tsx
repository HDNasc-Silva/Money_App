import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type Category, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { buildDefaultCategories } from '@/store/defaultCategories';

function renderCategories(categories: Category[]) {
  const adapter = new MemoryStorageAdapter();
  const data: FinanceData = { transactions: [], categories, goals: [], subscriptions: [], settings: { ...DEFAULT_SETTINGS, userName: 'Ana' } };
  adapter.write(DATA_KEY, serializeFinanceData(data));
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/categorias']}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { adapter, user };
}

const readStored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;

describe('sininho de alertas por categoria (DT-025)', () => {
  it('desliga e religa pelo cartão, com feedback visual e persistência', async () => {
    const { adapter, user } = renderCategories(buildDefaultCategories(''));

    const bell = await screen.findByRole('button', { name: 'Desligar alertas de orçamento de Alimentação' });
    expect(bell).toHaveAttribute('aria-pressed', 'true');

    await user.click(bell);
    const offBell = await screen.findByRole('button', { name: 'Ligar alertas de orçamento de Alimentação' });
    expect(offBell).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => {
      const stored = readStored(adapter).categories.find((c) => c.id === 'cat-food');
      expect(stored?.alertsEnabled).toBe(false);
    });

    await user.click(offBell);
    expect(await screen.findByRole('button', { name: 'Desligar alertas de orçamento de Alimentação' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => {
      const stored = readStored(adapter).categories.find((c) => c.id === 'cat-food');
      expect(stored?.alertsEnabled).toBe(true);
    });
  });

  it('o formulário de categoria mostra o switch "Alertas de orçamento" só para despesas e salva o valor escolhido', async () => {
    const { adapter, user } = renderCategories(buildDefaultCategories(''));

    await user.click(await screen.findByRole('button', { name: /Nova Categoria Personalizada/ }));
    const form = await screen.findByRole('dialog', { name: 'Nova categoria' });
    const toggle = within(form).getByRole('switch', { name: /Alertas de orçamento/ });
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();

    await user.click(within(form).getByRole('radio', { name: 'Receita' }));
    expect(within(form).queryByRole('switch', { name: /Alertas de orçamento/ })).not.toBeInTheDocument();

    await user.click(within(form).getByRole('radio', { name: 'Despesa' }));
    await user.type(within(form).getByLabelText('Nome da categoria'), 'Pet shop');
    await user.click(within(form).getByRole('button', { name: /Criar categoria/ }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova categoria' })).not.toBeInTheDocument());

    const created = readStored(adapter).categories.find((c) => c.name === 'Pet shop');
    expect(created?.alertsEnabled).toBe(false);
  });
});
