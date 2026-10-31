import { describe, expect, it } from 'vitest';
import { validateCategory, validateContribution, validateGoal, validateTransaction } from '@/validations';
import { categories } from './helpers';

const TODAY = '2026-10-30';

const validTransaction = {
  type: 'expense' as const,
  description: '  Supermercado   Extra ',
  amount: '245,50',
  date: '2026-10-30',
  categoryId: 'food',
  note: '',
};

describe('validateTransaction', () => {
  it('aceita e normaliza um lançamento válido', () => {
    const result = validateTransaction(validTransaction, categories, TODAY);
    expect(result).toEqual({
      ok: true,
      value: { type: 'expense', description: 'Supermercado Extra', amount: 24550, date: '2026-10-30', categoryId: 'food', note: undefined },
    });
  });

  it('rejeita campos inválidos', () => {
    const result = validateTransaction({ ...validTransaction, description: ' ', amount: '0', date: '2026-02-31', categoryId: '' }, categories, TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['amount', 'categoryId', 'date', 'description']);
  });

  it('rejeita categoria incompatível com o tipo', () => {
    const result = validateTransaction({ ...validTransaction, type: 'income' }, categories, TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.categoryId).toMatch(/incompatível/);
  });

  it('rejeita valor acima do máximo', () => {
    const result = validateTransaction({ ...validTransaction, amount: '1000000000' }, categories, TODAY);
    expect(result.ok).toBe(false);
  });

  it('aceita datas futuras para planejamento até o limite de 60 meses', () => {
    expect(validateTransaction({ ...validTransaction, date: '2026-12-15' }, categories, TODAY).ok).toBe(true);
    expect(validateTransaction({ ...validTransaction, date: '2031-10-31' }, categories, TODAY).ok).toBe(true);
    const beyond = validateTransaction({ ...validTransaction, date: '2031-11-01' }, categories, TODAY);
    expect(beyond.ok).toBe(false);
    if (!beyond.ok) expect(beyond.errors.date).toBe('A data deve ser até 31/10/2031.');
  });

  it('mantém datas passadas permitidas', () => {
    expect(validateTransaction({ ...validTransaction, date: '2020-01-01' }, categories, TODAY).ok).toBe(true);
  });
});

describe('validateCategory', () => {
  const base = { name: 'Pets', description: '', icon: 'pets', kind: 'expense' as const, group: 'lifestyle' as const, monthlyLimit: '300' };

  it('aceita categoria com limite', () => {
    const result = validateCategory(base, categories, null);
    expect(result.ok && result.value.monthlyLimit).toBe(30000);
  });

  it('limite vazio ou zero significa sem limite', () => {
    const empty = validateCategory({ ...base, monthlyLimit: '' }, categories, null);
    const zero = validateCategory({ ...base, monthlyLimit: '0' }, categories, null);
    expect(empty.ok && empty.value.monthlyLimit).toBeNull();
    expect(zero.ok && zero.value.monthlyLimit).toBeNull();
  });

  it('impede nomes duplicados no mesmo tipo, ignorando acentos e caixa', () => {
    const result = validateCategory({ ...base, name: 'alimentacao' }, categories, null);
    expect(result.ok).toBe(false);
    // A própria categoria em edição não conta como duplicada.
    expect(validateCategory({ ...base, name: 'Alimentação' }, categories, 'food').ok).toBe(true);
  });
});

describe('validateGoal e validateContribution', () => {
  const base = { name: 'Viagem', description: '', icon: 'flight', targetAmount: '6000', initialAmount: '', monthlyContribution: '500', deadline: '' };

  it('aceita meta válida', () => {
    const result = validateGoal(base, '2026-10-30');
    expect(result).toMatchObject({ ok: true, value: { targetAmount: 600000, initialAmount: 0, monthlyContribution: 50000, deadline: null } });
  });

  it('prazo precisa ser futuro', () => {
    expect(validateGoal({ ...base, deadline: '2026-10-30' }, '2026-10-30').ok).toBe(false);
    expect(validateGoal({ ...base, deadline: '2027-01-01' }, '2026-10-30').ok).toBe(true);
  });

  it('aporte precisa ser positivo', () => {
    expect(validateContribution({ amount: '0', date: '2026-10-30' }).ok).toBe(false);
    expect(validateContribution({ amount: '150,00', date: '2026-10-30' })).toEqual({ ok: true, value: { amount: 15000, date: '2026-10-30' } });
  });
});
