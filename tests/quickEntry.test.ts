import { describe, expect, it } from 'vitest';
import { highlightedGoals } from '@/domain/goals';
import { categoriesByUsage, descriptionSuggestions, findRecurringCandidate, lastCategoryForDescription } from '@/domain/quickEntry';
import { latestTransactions } from '@/domain/transactions';
import { categories, goal, tx } from './helpers';

describe('lançamento rápido: categorias por uso', () => {
  it('ordena as categorias do tipo pelas mais usadas; sem uso, mantém a ordem do cadastro', () => {
    const history = [
      tx({ type: 'expense', amount: 100, date: '2026-10-01', categoryId: 'fun' }),
      tx({ type: 'expense', amount: 100, date: '2026-10-02', categoryId: 'fun' }),
      tx({ type: 'expense', amount: 100, date: '2026-10-03', categoryId: 'misc' }),
      tx({ type: 'income', amount: 100, date: '2026-10-03', categoryId: 'salary' }),
    ];
    expect(categoriesByUsage(categories, history, 'expense').map((c) => c.id)).toEqual(['fun', 'misc', 'food']);
    expect(categoriesByUsage(categories, history, 'income').map((c) => c.id)).toEqual(['salary']);
    expect(categoriesByUsage(categories, [], 'expense').map((c) => c.id)).toEqual(['food', 'fun', 'misc']);
  });

  it('em empate de uso, a usada mais recentemente vem primeiro', () => {
    const history = [
      tx({ type: 'expense', amount: 100, date: '2026-10-01', categoryId: 'food' }),
      tx({ type: 'expense', amount: 100, date: '2026-10-05', categoryId: 'misc' }),
    ];
    expect(categoriesByUsage(categories, history, 'expense').map((c) => c.id)).toEqual(['misc', 'food', 'fun']);
  });
});

describe('lançamento rápido: sugestões de descrição', () => {
  const history = [
    tx({ type: 'expense', amount: 100, date: '2026-09-01', description: 'Padaria', categoryId: 'misc' }),
    tx({ type: 'expense', amount: 100, date: '2026-10-01', description: 'padaria', categoryId: 'food' }),
    tx({ type: 'expense', amount: 100, date: '2026-10-02', description: 'Pão de açúcar', categoryId: 'food' }),
    tx({ type: 'expense', amount: 100, date: '2026-10-03', description: 'Cinema', categoryId: 'fun' }),
    tx({ type: 'expense', amount: 100, date: '2026-10-04', description: 'Supermercado Pão', categoryId: 'food' }),
    tx({ type: 'income', amount: 100, date: '2026-10-05', description: 'Pagamento', categoryId: 'salary' }),
  ];

  it('sugere descrições do mesmo tipo que contêm o texto, sem acento, sem repetir e com a categoria mais recente', () => {
    const suggestions = descriptionSuggestions(history, 'pa', 'expense');
    // As que começam com o texto vêm primeiro (mais recentes antes); depois as que só contêm.
    expect(suggestions).toEqual([
      { description: 'Pão de açúcar', categoryId: 'food' },
      { description: 'padaria', categoryId: 'food' },
      { description: 'Supermercado Pão', categoryId: 'food' },
    ]);
    expect(descriptionSuggestions(history, 'pag', 'expense')).toEqual([]);
    expect(descriptionSuggestions(history, 'pag', 'income')).toEqual([{ description: 'Pagamento', categoryId: 'salary' }]);
  });

  it('não sugere com texto vazio nem quando o texto já é uma descrição existente; respeita o limite', () => {
    expect(descriptionSuggestions(history, '  ', 'expense')).toEqual([]);
    expect(descriptionSuggestions(history, 'PADARIA', 'expense')).toEqual([]);
    expect(descriptionSuggestions(history, 'a', 'expense', 2)).toHaveLength(2);
  });

  it('lastCategoryForDescription devolve a categoria da última vez (sem acento/maiúsculas)', () => {
    expect(lastCategoryForDescription(history, 'PADARIA', 'expense')).toBe('food');
    expect(lastCategoryForDescription(history, 'pao de acucar', 'expense')).toBe('food');
    expect(lastCategoryForDescription(history, 'Inexistente', 'expense')).toBeNull();
    expect(lastCategoryForDescription(history, 'Pagamento', 'expense')).toBeNull();
  });
});

describe('findRecurringCandidate (sugestão de fixo/recorrente)', () => {
  const history = [
    tx({ type: 'expense', amount: 150_000, date: '2026-09-05', description: 'Aluguel', categoryId: 'misc' }),
    tx({ type: 'expense', amount: 3_000, date: '2026-09-10', description: 'Cinema', categoryId: 'fun' }),
  ];

  it('encontra um lançamento parecido (mesma categoria, descrição e valor) do mês anterior', () => {
    const match = findRecurringCandidate(history, 'expense', 'misc', 'Aluguel', 152_000, '2026-10-05');
    expect(match?.description).toBe('Aluguel');
  });

  it('não sugere fora da tolerância de valor, categoria diferente, tipo diferente ou campos vazios', () => {
    expect(findRecurringCandidate(history, 'expense', 'misc', 'Aluguel', 300_000, '2026-10-05')).toBeNull();
    expect(findRecurringCandidate(history, 'expense', 'fun', 'Aluguel', 150_000, '2026-10-05')).toBeNull();
    expect(findRecurringCandidate(history, 'income', 'misc', 'Aluguel', 150_000, '2026-10-05')).toBeNull();
    expect(findRecurringCandidate(history, 'expense', '', 'Aluguel', 150_000, '2026-10-05')).toBeNull();
    expect(findRecurringCandidate(history, 'expense', 'misc', '', 150_000, '2026-10-05')).toBeNull();
    expect(findRecurringCandidate(history, 'expense', 'misc', 'Aluguel', 0, '2026-10-05')).toBeNull();
  });

  it('ignora lançamentos já gerados por uma assinatura (já são fixos)', () => {
    const generated = [tx({ type: 'expense', amount: 150_000, date: '2026-09-05', description: 'Aluguel', categoryId: 'misc', subscriptionId: 'sub-1' })];
    expect(findRecurringCandidate(generated, 'expense', 'misc', 'Aluguel', 150_000, '2026-10-05')).toBeNull();
  });
});

describe('Início: blocos derivados', () => {
  it('latestTransactions devolve os mais recentes do período, limitado', () => {
    const list = [
      tx({ type: 'expense', amount: 1, date: '2026-09-30' }),
      tx({ type: 'expense', amount: 2, date: '2026-10-01' }),
      tx({ type: 'expense', amount: 3, date: '2026-10-20' }),
      tx({ type: 'expense', amount: 4, date: '2026-10-10' }),
    ];
    expect(latestTransactions(list, { start: '2026-10-01', end: '2026-10-31' }, 2).map((t) => t.amount)).toEqual([3, 4]);
  });

  it('highlightedGoals mostra primeiro as em andamento mais próximas de concluir, depois as concluídas', () => {
    const goals = [
      goal({ id: 'a', initialAmount: 100_000 }), // 10%
      goal({ id: 'b', initialAmount: 1_000_000 }), // concluída
      goal({ id: 'c', initialAmount: 700_000 }), // 70%
    ];
    expect(highlightedGoals(goals, 3).map((g) => g.goal.id)).toEqual(['c', 'a', 'b']);
    expect(highlightedGoals(goals, 1).map((g) => g.goal.id)).toEqual(['c']);
  });
});
