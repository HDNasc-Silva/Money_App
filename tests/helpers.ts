import type { Category, Goal, Transaction } from '@/models';

let sequence = 0;

export function tx(partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date'>): Transaction {
  sequence += 1;
  return {
    id: `t${sequence}`,
    description: `Lançamento ${sequence}`,
    categoryId: partial.type === 'income' ? 'salary' : 'food',
    createdAt: `2026-01-01T00:00:${String(sequence % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

export const categories: Category[] = [
  { id: 'food', name: 'Alimentação', description: '', icon: 'restaurant', kind: 'expense', group: 'essential', monthlyLimit: 100_000, alertsEnabled: true, order: 0, createdAt: '' },
  { id: 'fun', name: 'Lazer', description: '', icon: 'sports_esports', kind: 'expense', group: 'lifestyle', monthlyLimit: 50_000, alertsEnabled: true, order: 1, createdAt: '' },
  { id: 'misc', name: 'Outros', description: '', icon: 'category', kind: 'expense', group: 'lifestyle', monthlyLimit: null, alertsEnabled: true, order: 2, createdAt: '' },
  { id: 'salary', name: 'Salário', description: '', icon: 'payments', kind: 'income', group: 'essential', monthlyLimit: null, alertsEnabled: true, order: 3, createdAt: '' },
];

export function goal(partial: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    name: 'Reserva',
    description: '',
    icon: 'shield',
    targetAmount: 1_000_000,
    initialAmount: 0,
    contributions: [],
    monthlyContribution: 100_000,
    deadline: null,
    createdAt: '',
    ...partial,
  };
}
