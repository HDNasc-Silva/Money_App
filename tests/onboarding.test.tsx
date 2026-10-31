import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { DEFAULT_SETTINGS, type FinanceData } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, parseFinanceData, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { buildDefaultCategories } from '@/store/defaultCategories';
import { todayIso } from '@/utils/dates';
import { categories, tx } from './helpers';

const DEFAULT_CATEGORY_NAMES = buildDefaultCategories('').map((c) => c.name);

function renderApp(adapter: MemoryStorageAdapter, path = '/') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders repositories={createRepositories(adapter)}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return user;
}

const readStored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;

/** Documento salvo por uma versão anterior à 1.4.0 (sem `monthlyIncome` nem `onboardingCompleted`). */
function legacyStorage(): MemoryStorageAdapter {
  const adapter = new MemoryStorageAdapter();
  adapter.write(
    DATA_KEY,
    JSON.stringify({
      schemaVersion: 1,
      transactions: [tx({ type: 'income', amount: 300_000, date: todayIso(), description: 'Salário', categoryId: 'salary' })],
      categories,
      goals: [],
      settings: { userName: 'Ana', savingsTarget: 30, hideBalances: false, isDemoData: false },
    }),
  );
  return adapter;
}

describe('primeiro acesso', () => {
  it('começa com dados zerados, categorias padrão e a tela de boas-vindas (sem navegação)', async () => {
    const adapter = new MemoryStorageAdapter();
    renderApp(adapter);

    expect(await screen.findByRole('heading', { name: 'Como prefere ser chamado?' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText(/dados de demonstração/)).not.toBeInTheDocument();

    const stored = readStored(adapter);
    expect(stored.transactions).toHaveLength(0);
    expect(stored.goals).toHaveLength(0);
    expect(stored.categories.map((c) => c.name)).toEqual(DEFAULT_CATEGORY_NAMES);
    expect(stored.settings).toMatchObject({ userName: '', monthlyIncome: 0, isDemoData: false, onboardingCompleted: false });
  });

  it('qualquer rota leva à tela de boas-vindas enquanto ela não for concluída', async () => {
    renderApp(new MemoryStorageAdapter(), '/lancamentos');
    expect(await screen.findByRole('heading', { name: 'Como prefere ser chamado?' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lançamentos' })).not.toBeInTheDocument();
  });

  it('exige o nome e não conclui o onboarding sem ele', async () => {
    const adapter = new MemoryStorageAdapter();
    const user = renderApp(adapter);

    const name = await screen.findByLabelText('Seu nome');
    expect(name).toHaveAttribute('maxlength', '40');
    await user.type(name, '   ');
    await user.click(screen.getByRole('button', { name: /Começar/ }));

    expect(screen.getByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Como prefere ser chamado?' })).toBeInTheDocument();
    expect(readStored(adapter).settings.onboardingCompleted).toBe(false);
  });

  it('salva nome e renda, abre o Início com a saudação e permite lançar em seguida', async () => {
    const adapter = new MemoryStorageAdapter();
    const user = renderApp(adapter);

    await user.type(await screen.findByLabelText('Seu nome'), '  Maria  ');
    const income = screen.getByLabelText('Renda mensal (opcional)');
    await user.type(income, '500000');
    expect(income).toHaveValue('5.000,00');
    await user.click(screen.getByRole('button', { name: /Começar/ }));

    expect(await screen.findByText(/Olá, Maria/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Como prefere ser chamado?' })).not.toBeInTheDocument();
    expect(screen.queryByText(/dados de demonstração/)).not.toBeInTheDocument();
    expect(readStored(adapter).settings).toMatchObject({ userName: 'Maria', monthlyIncome: 500_000, onboardingCompleted: true });

    // As categorias padrão do primeiro acesso permitem lançar sem configuração extra.
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /Novo Lançamento/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo lançamento' });
    await user.type(within(dialog).getByLabelText('Valor'), '4250');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Padaria');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'Alimentação');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar lançamento/ }));
    await waitFor(() => expect(readStored(adapter).transactions).toHaveLength(1));
  });

  it('renda mensal é opcional', async () => {
    const adapter = new MemoryStorageAdapter();
    const user = renderApp(adapter);
    await user.type(await screen.findByLabelText('Seu nome'), 'João');
    await user.click(screen.getByRole('button', { name: /Começar/ }));
    expect(await screen.findByText(/Olá, João/)).toBeInTheDocument();
    expect(readStored(adapter).settings).toMatchObject({ userName: 'João', monthlyIncome: 0, onboardingCompleted: true });
  });
});

describe('usuários que já tinham dados salvos', () => {
  it('não veem a tela de boas-vindas e mantêm os dados (migração de documentos antigos)', async () => {
    const adapter = legacyStorage();
    renderApp(adapter);

    expect(await screen.findByText(/Olá, Ana/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Como prefere ser chamado?' })).not.toBeInTheDocument();
    expect(screen.getByTestId('balance-value')).toHaveTextContent('3.000,00');

    const parsed = parseFinanceData(adapter.read(DATA_KEY) ?? '');
    expect(parsed?.settings).toMatchObject({ userName: 'Ana', savingsTarget: 30, monthlyIncome: 0, onboardingCompleted: true });
    expect(parsed?.transactions).toHaveLength(1);
  });

  it('a rota de boas-vindas redireciona para o Início depois de concluída', async () => {
    renderApp(legacyStorage(), '/boas-vindas');
    expect(await screen.findByText(/Olá, Ana/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Como prefere ser chamado?' })).not.toBeInTheDocument();
  });

  it('sem nome salvo, a saudação é apenas "Olá"', async () => {
    const adapter = new MemoryStorageAdapter();
    adapter.write(DATA_KEY, serializeFinanceData({ transactions: [], categories, goals: [], settings: DEFAULT_SETTINGS }));
    renderApp(adapter);
    expect(await screen.findByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument();
    expect(screen.getByText(/^Olá/)).toHaveTextContent(/^Olá ✨$/);
  });
});

describe('Ajustes: demonstração e renda mensal', () => {
  it('carrega os dados de demonstração após confirmação, mantendo o perfil, e permite sair deles', async () => {
    const adapter = legacyStorage();
    const user = renderApp(adapter, '/ajustes');

    await user.click(await screen.findByRole('button', { name: 'Carregar dados de demonstração' }));
    const dialog = await screen.findByRole('dialog', { name: 'Carregar dados de demonstração?' });
    expect(within(dialog).getByText(/serão substituídos pelos dados de demonstração/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Carregar demonstração' }));

    await waitFor(() => expect(readStored(adapter).settings.isDemoData).toBe(true));
    const stored = readStored(adapter);
    expect(stored.transactions.length).toBeGreaterThan(10);
    expect(stored.goals.length).toBeGreaterThan(0);
    expect(stored.settings).toMatchObject({ userName: 'Ana', savingsTarget: 30, onboardingCompleted: true });
    expect(stored.settings.userName).not.toBe('Gabriel');

    // Fora de Ajustes, o aviso de demonstração aparece com o atalho para começar do zero.
    await user.click(screen.getAllByRole('link', { name: /Início|Visão Geral/ })[0]!);
    expect(await screen.findByText(/dados de demonstração/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Começar do zero' }));

    await user.click(await screen.findByRole('button', { name: /Apagar todos os dados/ }));
    const clear = await screen.findByRole('dialog', { name: 'Apagar todos os dados?' });
    await user.click(within(clear).getByRole('button', { name: /Apagar tudo/ }));
    await waitFor(() => expect(readStored(adapter).settings.isDemoData).toBe(false));
    expect(readStored(adapter).transactions).toHaveLength(0);
    expect(readStored(adapter).settings.userName).toBe('Ana');
  });

  it('cancelar a confirmação não altera os dados', async () => {
    const adapter = legacyStorage();
    const user = renderApp(adapter, '/ajustes');
    await user.click(await screen.findByRole('button', { name: 'Carregar dados de demonstração' }));
    const dialog = await screen.findByRole('dialog', { name: 'Carregar dados de demonstração?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(readStored(adapter).transactions).toHaveLength(1);
    expect(readStored(adapter).settings.isDemoData).toBe(false);
  });

  it('salva a renda mensal no card da meta de poupança e mostra o valor da meta em reais', async () => {
    const adapter = legacyStorage();
    const user = renderApp(adapter, '/ajustes');

    const summary = await screen.findByTestId('savings-target-summary');
    expect(summary).toHaveTextContent('Informe a renda mensal e a meta');

    await user.type(screen.getByLabelText('Renda mensal'), '500000');
    const target = screen.getByLabelText('Meta de poupança (%)');
    await user.clear(target);
    await user.type(target, '20');
    expect(summary).toHaveTextContent('Meta de 20% de R$ 5.000,00 = R$ 1.000,00 por mês.');

    await user.click(screen.getByRole('button', { name: /Salvar preferências/ }));
    await waitFor(() => expect(readStored(adapter).settings.monthlyIncome).toBe(500_000));
    expect(readStored(adapter).settings.savingsTarget).toBe(20);
  });

  it('valida a meta de poupança', async () => {
    const adapter = legacyStorage();
    const user = renderApp(adapter, '/ajustes');
    const target = await screen.findByLabelText('Meta de poupança (%)');
    await user.clear(target);
    await user.type(target, '150');
    await user.click(screen.getByRole('button', { name: /Salvar preferências/ }));
    expect(screen.getByText('Informe um percentual entre 0 e 100.')).toBeInTheDocument();
    expect(readStored(adapter).settings.savingsTarget).toBe(30);
  });
});
