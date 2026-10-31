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

function setup() {
  const today = todayIso();
  const data: FinanceData = {
    transactions: [
      tx({ type: 'income', amount: 500_000, date: today, description: 'Salário', categoryId: 'salary' }),
      tx({ type: 'expense', amount: 3_000, date: today, description: 'Cinema', categoryId: 'fun' }),
      tx({ type: 'expense', amount: 2_000, date: today, description: 'Pipoca', categoryId: 'fun' }),
      tx({ type: 'expense', amount: 1_500, date: today, description: 'Padaria Central', categoryId: 'misc' }),
    ],
    categories,
    goals: [],
    subscriptions: [],
    settings: { ...DEFAULT_SETTINGS, userName: 'Ana' },
  };
  const adapter = new MemoryStorageAdapter();
  adapter.write(DATA_KEY, serializeFinanceData(data));
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/lancamentos']}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { adapter, user };
}

const stored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Nova Movimentação/ }));
  return within(await screen.findByRole('dialog', { name: 'Novo lançamento' }));
}

describe('lançamento rápido', () => {
  it('foca o valor com teclado numérico e mostra as categorias em chips, mais usadas primeiro', async () => {
    const { user } = setup();
    const dialog = await openForm(user);
    const amount = dialog.getByLabelText('Valor');
    expect(amount).toHaveFocus();
    expect(amount).toHaveAttribute('inputmode', 'numeric');

    // Nome acessível de cada chip (o ícone é decorativo). Lazer (2 usos) → Outros (1) → Alimentação (0).
    const names = within(dialog.getByRole('radiogroup', { name: 'Categoria' }))
      .getAllByRole('radio')
      .map((r) => r.textContent?.replace(/^[a-z_]+/, ''));
    expect(names).toEqual(['Lazer', 'Outros', 'Alimentação']);

    // Receita mostra só as categorias de receita.
    await user.click(dialog.getByRole('radio', { name: 'Receita' }));
    expect(within(dialog.getByRole('radiogroup', { name: 'Categoria' })).getAllByRole('radio')).toHaveLength(1);
  });

  it('a descrição sugere lançamentos anteriores e aplica a categoria usada da última vez', async () => {
    const { adapter, user } = setup();
    const dialog = await openForm(user);
    await user.type(dialog.getByLabelText('Valor'), '1250');
    await user.type(dialog.getByLabelText('Descrição'), 'pad');

    const suggestions = within(dialog.getByRole('list', { name: 'Sugestões de descrição' }));
    const suggestion = suggestions.getByRole('button', { name: /Padaria Central/ });
    expect(suggestion).toHaveTextContent('Outros');
    await user.click(suggestion);

    expect(dialog.getByLabelText('Descrição')).toHaveValue('Padaria Central');
    expect(dialog.getByRole('radio', { name: 'Outros' })).toHaveAttribute('aria-checked', 'true');
    expect(dialog.queryByRole('list', { name: 'Sugestões de descrição' })).not.toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: /Adicionar lançamento/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(stored(adapter).transactions.filter((t) => t.description === 'Padaria Central').map((t) => t.categoryId)).toEqual(['misc', 'misc']);
  });

  it('digitar uma descrição já usada seleciona a categoria, mas não substitui uma escolha manual', async () => {
    const { user } = setup();
    let dialog = await openForm(user);
    await user.type(dialog.getByLabelText('Descrição'), 'cinema');
    expect(dialog.getByRole('radio', { name: 'Lazer' })).toHaveAttribute('aria-checked', 'true');
    await user.click(dialog.getByRole('button', { name: 'Fechar' }));

    dialog = await openForm(user);
    await user.click(dialog.getByRole('radio', { name: 'Alimentação' }));
    await user.type(dialog.getByLabelText('Descrição'), 'Cinema');
    expect(dialog.getByRole('radio', { name: 'Alimentação' })).toHaveAttribute('aria-checked', 'true');
  });

  it('"Salvar e adicionar outro" salva, mantém o formulário aberto, limpa os campos e volta ao valor', async () => {
    const { adapter, user } = setup();
    const dialog = await openForm(user);
    const date = (dialog.getByLabelText('Data') as HTMLInputElement).value;

    // Mantém as validações.
    await user.click(dialog.getByRole('button', { name: /Salvar e adicionar outro/ }));
    expect(dialog.getByText('Informe um valor válido.')).toBeInTheDocument();
    expect(dialog.getByText('Selecione uma categoria.')).toBeInTheDocument();

    await user.type(dialog.getByLabelText('Valor'), '990');
    await user.click(dialog.getByRole('radio', { name: 'Alimentação' }));
    await user.type(dialog.getByLabelText('Descrição'), 'Café');
    await user.click(dialog.getByRole('button', { name: /Salvar e adicionar outro/ }));

    await waitFor(() => expect(stored(adapter).transactions.some((t) => t.description === 'Café')).toBe(true));
    expect(screen.getByRole('dialog', { name: 'Novo lançamento' })).toBeInTheDocument();
    expect(dialog.getByLabelText('Valor')).toHaveValue('');
    expect(dialog.getByLabelText('Valor')).toHaveFocus();
    expect(dialog.getByLabelText('Descrição')).toHaveValue('');
    expect(dialog.getByLabelText('Data')).toHaveValue(date);
    expect(dialog.getByRole('radio', { name: 'Alimentação' })).toHaveAttribute('aria-checked', 'false');
    expect(dialog.getByText('1 adicionado(s) nesta sequência')).toBeInTheDocument();

    await user.type(dialog.getByLabelText('Valor'), '500');
    await user.click(dialog.getByRole('radio', { name: 'Alimentação' }));
    await user.type(dialog.getByLabelText('Descrição'), 'Pão');
    await user.click(dialog.getByRole('button', { name: /Adicionar lançamento/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const added = stored(adapter).transactions.filter((t) => ['Café', 'Pão'].includes(t.description));
    expect(added.map((t) => [t.description, t.amount, t.categoryId])).toEqual([
      ['Café', 990, 'food'],
      ['Pão', 500, 'food'],
    ]);
  });

  it('a edição não mostra "Salvar e adicionar outro" nem sugestões', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: 'Ações do lançamento Cinema' }));
    await user.click(await screen.findByRole('button', { name: /Editar informações/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Editar lançamento' }));
    expect(dialog.queryByRole('button', { name: /Salvar e adicionar outro/ })).not.toBeInTheDocument();
    await user.clear(dialog.getByLabelText('Descrição'));
    await user.type(dialog.getByLabelText('Descrição'), 'Pi');
    expect(dialog.queryByRole('list', { name: 'Sugestões de descrição' })).not.toBeInTheDocument();
    expect(dialog.getByRole('radio', { name: 'Lazer' })).toHaveAttribute('aria-checked', 'true');
  });
});
