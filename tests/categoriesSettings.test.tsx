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

function renderSettings(categories: Category[]) {
  const adapter = new MemoryStorageAdapter();
  const data: FinanceData = { transactions: [], categories, goals: [], subscriptions: [], settings: { ...DEFAULT_SETTINGS, userName: 'Ana' } };
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

const readStored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;

describe('categorias em Ajustes', () => {
  it('cria categoria com ícone escolhido pela busca e a disponibiliza nos lançamentos', async () => {
    const { adapter, user } = renderSettings(buildDefaultCategories(''));

    const expenses = await screen.findByRole('region', { name: 'Categorias de despesas' });
    expect(within(expenses).getByRole('button', { name: 'Editar categoria Alimentação' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Categorias de receitas' })).getByRole('button', { name: 'Editar categoria Salário' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nova categoria/ }));
    const form = await screen.findByRole('dialog', { name: 'Nova categoria' });
    await user.type(within(form).getByLabelText('Nome da categoria'), 'Veterinário');

    const search = within(form).getByRole('searchbox', { name: 'Buscar ícone' });
    await user.type(search, 'zzzz');
    expect(within(form).getByText(/Nenhum ícone encontrado/)).toBeInTheDocument();
    // O ícone atual continua indicado mesmo fora do resultado da busca.
    expect(within(form).getByText(/Selecionado:/)).toHaveTextContent('Selecionado: Categoria');

    await user.clear(search);
    await user.type(search, 'CACHORRO{Enter}');
    expect(screen.getByRole('dialog', { name: 'Nova categoria' })).toBeInTheDocument();
    const iconGrid = within(form).getByRole('radiogroup', { name: 'Ícone de identificação' });
    const options = within(iconGrid).getAllByRole('radio');
    expect(options.map((o) => o.getAttribute('aria-label'))).toEqual(['Pets']);
    await user.click(within(form).getByRole('radio', { name: 'Pets' }));
    expect(within(form).getByRole('radio', { name: 'Pets' })).toHaveAttribute('aria-checked', 'true');
    expect(within(form).getByText('Pets', { selector: 'strong' })).toBeInTheDocument();

    await user.click(within(form).getByRole('button', { name: /Criar categoria/ }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova categoria' })).not.toBeInTheDocument());

    expect(within(expenses).getByRole('button', { name: 'Editar categoria Veterinário' })).toBeInTheDocument();
    const created = readStored(adapter).categories.find((c) => c.name === 'Veterinário');
    expect(created).toMatchObject({ icon: 'pets', kind: 'expense' });

    await user.click(screen.getAllByRole('link', { name: /Extrato|Lançamentos/ })[0]!);
    await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
    const txForm = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    expect(within(within(txForm).getByLabelText('Categoria')).getByRole('option', { name: 'Veterinário' })).toBeInTheDocument();
  });

  it('restaura uma categoria padrão excluída sem duplicar as existentes', async () => {
    const { adapter, user } = renderSettings(buildDefaultCategories(''));
    const total = buildDefaultCategories('').length;

    await user.click(await screen.findByRole('button', { name: 'Editar categoria Moradia' }));
    await user.click(await screen.findByRole('button', { name: /Excluir categoria/ }));
    await user.click(await screen.findByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Editar categoria Moradia' })).not.toBeInTheDocument());
    expect(readStored(adapter).categories).toHaveLength(total - 1);

    await user.click(screen.getByRole('button', { name: /Restaurar categorias padrão/ }));
    expect(await screen.findByText('1 categoria(s) padrão restaurada(s).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar categoria Moradia' })).toBeInTheDocument();
    expect(readStored(adapter).categories).toHaveLength(total);

    await user.click(screen.getByRole('button', { name: /Restaurar categorias padrão/ }));
    expect(await screen.findByText('Nenhuma categoria padrão estava faltando.')).toBeInTheDocument();
    expect(readStored(adapter).categories).toHaveLength(total);
  });
});
