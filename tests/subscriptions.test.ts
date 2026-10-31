import { describe, expect, it } from 'vitest';
import {
  chargeDate,
  monthSubscriptionCharges,
  nextChargeDate,
  projectedSubscriptionExpenses,
  skipMonth,
  sortSubscriptions,
  subscriptionStatus,
  subscriptionTotals,
  summarizeCharges,
  syncSubscriptionCharges,
} from '@/domain/subscriptions';
import { EMPTY_DATA, type Subscription, type Transaction } from '@/models';
import { parseFinanceData, serializeFinanceData } from '@/services/storage/FinanceDocument';
import {
  buildDefaultCategories,
  findSubscriptionsCategory,
  SUBSCRIPTIONS_CATEGORY_ID,
  subscriptionsCategoryToCreate,
} from '@/store/defaultCategories';
import { buildDemoData } from '@/store/demoData';
import { CREATE_SUBSCRIPTIONS_CATEGORY, validateSubscription, type SubscriptionFormValues } from '@/validations';
import { categories, tx } from './helpers';

const TS = '2026-10-15T12:00:00.000Z';

function sub(partial: Partial<Subscription> = {}): Subscription {
  return {
    id: 's1',
    name: 'Netflix',
    icon: 'live_tv',
    amount: 4490,
    billingDay: 8,
    categoryId: 'misc',
    active: true,
    startMonth: '2026-08',
    endMonth: null,
    skippedMonths: [],
    createdAt: TS,
    updatedAt: TS,
    ...partial,
  };
}

const generated = (transactions: readonly Transaction[]) => transactions.filter((t) => t.subscriptionId);

describe('chargeDate', () => {
  it('usa o dia de cobrança e limita ao último dia do mês', () => {
    expect(chargeDate({ billingDay: 8 }, '2026-10')).toBe('2026-10-08');
    expect(chargeDate({ billingDay: 31 }, '2027-02')).toBe('2027-02-28');
    expect(chargeDate({ billingDay: 31 }, '2028-02')).toBe('2028-02-29');
    expect(chargeDate({ billingDay: 31 }, '2026-04')).toBe('2026-04-30');
    expect(chargeDate({ billingDay: 31 }, '2026-12')).toBe('2026-12-31');
  });
});

describe('syncSubscriptionCharges (geração dos lançamentos)', () => {
  it('lança do primeiro mês até as cobranças cuja data já chegou, como despesas vinculadas', () => {
    const result = syncSubscriptionCharges([sub()], [], '2026-10-15', TS);
    const charges = generated(result.transactions);
    expect(charges.map((t) => t.date)).toEqual(['2026-08-08', '2026-09-08', '2026-10-08']);
    expect(charges[0]).toMatchObject({
      type: 'expense',
      description: 'Netflix',
      amount: 4490,
      categoryId: 'misc',
      subscriptionId: 's1',
      subscriptionMonth: '2026-08',
      id: 'sub-s1-2026-08',
    });
    expect(result.changed).toBe(true);
  });

  it('não lança a cobrança do mês atual antes do dia de cobrança', () => {
    const result = syncSubscriptionCharges([sub({ billingDay: 20, startMonth: '2026-10' })], [], '2026-10-15', TS);
    expect(result.created).toHaveLength(0);
    expect(result.changed).toBe(false);
    const onDay = syncSubscriptionCharges([sub({ billingDay: 20, startMonth: '2026-10' })], [], '2026-10-20', TS);
    expect(onDay.created.map((t) => t.date)).toEqual(['2026-10-20']);
  });

  it('é idempotente: sincronizar de novo não duplica', () => {
    const first = syncSubscriptionCharges([sub()], [], '2026-10-15', TS);
    const second = syncSubscriptionCharges(first.subscriptions, first.transactions, '2026-10-15', TS);
    expect(second.changed).toBe(false);
    expect(second.transactions).toHaveLength(3);
  });

  it('dia 31 em fevereiro vira o último dia do mês', () => {
    const result = syncSubscriptionCharges([sub({ billingDay: 31, startMonth: '2027-01' })], [], '2027-03-31', TS);
    expect(result.created.map((t) => t.date)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
  });

  it('lançamento excluído pelo usuário (mês ignorado) não é gerado de novo', () => {
    const first = syncSubscriptionCharges([sub()], [], '2026-10-15', TS);
    const deleted = first.transactions.filter((t) => t.subscriptionMonth !== '2026-09');
    const skipped = first.subscriptions.map((s) => skipMonth(s, '2026-09'));
    const again = syncSubscriptionCharges(skipped, deleted, '2026-10-15', TS);
    expect(again.changed).toBe(false);
    expect(generated(again.transactions).map((t) => t.subscriptionMonth)).toEqual(['2026-08', '2026-10']);
  });

  it('lançamento gerado e editado pelo usuário (outra data) continua contando para o mês original', () => {
    const first = syncSubscriptionCharges([sub()], [], '2026-10-15', TS);
    const edited = first.transactions.map((t) => (t.subscriptionMonth === '2026-09' ? { ...t, date: '2026-10-01', amount: 1000 } : t));
    const again = syncSubscriptionCharges(first.subscriptions, edited, '2026-10-15', TS);
    expect(again.changed).toBe(false);
  });

  it('assinatura pausada não lança; os meses vencidos na pausa ficam ignorados e retomar não gera retroativos', () => {
    const paused = syncSubscriptionCharges([sub({ active: false })], [], '2026-10-15', TS);
    expect(paused.created).toHaveLength(0);
    expect(paused.subscriptions[0]?.skippedMonths).toEqual(['2026-08', '2026-09', '2026-10']);

    const resumed = paused.subscriptions.map((s) => ({ ...s, active: true }));
    expect(syncSubscriptionCharges(resumed, [], '2026-10-15', TS).created).toHaveLength(0);
    expect(syncSubscriptionCharges(resumed, [], '2026-11-08', TS).created.map((t) => t.date)).toEqual(['2026-11-08']);
  });

  it('editar o valor vale só para os meses ainda não lançados', () => {
    const first = syncSubscriptionCharges([sub()], [], '2026-10-15', TS);
    const edited = first.subscriptions.map((s) => ({ ...s, amount: 5590 }));
    const later = syncSubscriptionCharges(edited, first.transactions, '2026-11-10', TS);
    expect(generated(later.transactions).map((t) => t.amount)).toEqual([4490, 4490, 4490, 5590]);
  });

  it('respeita o último mês de cobrança (assinatura cancelada)', () => {
    const result = syncSubscriptionCharges([sub({ endMonth: '2026-09' })], [], '2026-12-31', TS);
    expect(result.created.map((t) => t.subscriptionMonth)).toEqual(['2026-08', '2026-09']);
  });

  it('assinatura com primeiro mês no futuro não gera nada', () => {
    expect(syncSubscriptionCharges([sub({ startMonth: '2027-01' })], [], '2026-10-15', TS).changed).toBe(false);
  });
});

describe('previsões e cobranças do mês', () => {
  const synced = syncSubscriptionCharges([sub(), sub({ id: 's2', name: 'Spotify', billingDay: 20, amount: 2190 })], [], '2026-10-15', TS);
  const { subscriptions, transactions } = synced;

  it('mês atual mostra lançadas e previstas, com totais', () => {
    const charges = monthSubscriptionCharges(subscriptions, transactions, '2026-10', '2026-10-15');
    expect(charges.map((c) => [c.name, c.status, c.date])).toEqual([
      ['Netflix', 'launched', '2026-10-08'],
      ['Spotify', 'forecast', '2026-10-20'],
    ]);
    expect(summarizeCharges(charges)).toEqual({ total: 6680, launched: 4490, forecast: 2190 });
  });

  it('meses futuros são apenas previstos (não materializados)', () => {
    const charges = monthSubscriptionCharges(subscriptions, transactions, '2026-12', '2026-10-15');
    expect(charges.every((c) => c.status === 'forecast')).toBe(true);
    expect(charges).toHaveLength(2);
    expect(transactions.some((t) => t.date >= '2026-11-01')).toBe(false);
  });

  it('mês passado mostra só o que foi lançado; assinatura pausada não tem previsão', () => {
    expect(monthSubscriptionCharges(subscriptions, transactions, '2026-09', '2026-10-15').every((c) => c.status === 'launched')).toBe(true);
    const paused = subscriptions.map((s) => ({ ...s, active: false }));
    expect(monthSubscriptionCharges(paused, transactions, '2026-11', '2026-10-15')).toEqual([]);
  });

  it('lançamentos de assinatura excluída (mantidos) continuam aparecendo no mês', () => {
    const charges = monthSubscriptionCharges([], transactions, '2026-10', '2026-10-15');
    expect(charges).toHaveLength(1);
    expect(charges[0]).toMatchObject({ name: 'Netflix', status: 'launched', icon: 'subscriptions' });
  });

  it('saldo previsto: soma só as cobranças previstas depois de hoje até a data', () => {
    expect(projectedSubscriptionExpenses(subscriptions, transactions, '2026-10-15', '2026-10-15')).toBe(0);
    expect(projectedSubscriptionExpenses(subscriptions, transactions, '2026-10-15', '2026-10-31')).toBe(2190);
    expect(projectedSubscriptionExpenses(subscriptions, transactions, '2026-10-15', '2026-11-30')).toBe(2190 + 4490 + 2190);
    expect(projectedSubscriptionExpenses(subscriptions, transactions, '2026-10-15', '2026-09-30')).toBe(0);
  });
});

describe('status, próxima cobrança e totais', () => {
  it('próxima cobrança, status e ordenação', () => {
    expect(nextChargeDate(sub(), '2026-10-15')).toBe('2026-11-08');
    expect(nextChargeDate(sub({ billingDay: 20 }), '2026-10-15')).toBe('2026-10-20');
    expect(nextChargeDate(sub({ billingDay: 31 }), '2027-01-31')).toBe('2027-02-28');
    expect(nextChargeDate(sub({ startMonth: '2027-03' }), '2026-10-15')).toBe('2027-03-08');
    expect(nextChargeDate(sub({ active: false }), '2026-10-15')).toBeNull();
    expect(nextChargeDate(sub({ endMonth: '2026-10' }), '2026-10-15')).toBeNull();

    expect(subscriptionStatus(sub(), '2026-10-15')).toBe('active');
    expect(subscriptionStatus(sub({ active: false }), '2026-10-15')).toBe('paused');
    expect(subscriptionStatus(sub({ endMonth: '2026-09' }), '2026-10-15')).toBe('ended');
    expect(subscriptionStatus(sub({ endMonth: '2026-10', billingDay: 20 }), '2026-10-15')).toBe('active');

    const list = [sub({ id: 'a', name: 'Zeta', active: false }), sub({ id: 'b', name: 'Beta' }), sub({ id: 'c', name: 'Alfa' })];
    expect(sortSubscriptions(list, '2026-10-15').map((s) => s.name)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('total mensal e estimativa anual consideram só as ativas', () => {
    const totals = subscriptionTotals(
      [sub(), sub({ id: 's2', amount: 2190 }), sub({ id: 's3', amount: 9990, active: false }), sub({ id: 's4', amount: 100, endMonth: '2026-01' })],
      '2026-10-15',
    );
    expect(totals).toEqual({ monthly: 6680, yearly: 80160, activeCount: 2 });
  });
});

describe('persistência e migração', () => {
  it('documento salvo antes da v1.6.0 (sem assinaturas) carrega com lista vazia', () => {
    const legacy = JSON.stringify({ schemaVersion: 1, transactions: [], categories, goals: [], settings: {} });
    expect(parseFinanceData(legacy)?.subscriptions).toEqual([]);
  });

  it('grava e relê assinaturas e o vínculo dos lançamentos', () => {
    const synced = syncSubscriptionCharges([sub({ notes: 'Plano padrão' })], [], '2026-10-15', TS);
    const data = { ...EMPTY_DATA, categories, transactions: synced.transactions, subscriptions: synced.subscriptions };
    expect(parseFinanceData(serializeFinanceData(data))).toEqual(data);
  });

  it('completa campos opcionais ausentes e descarta valores inválidos', () => {
    const raw = { id: 's1', name: 'Netflix', icon: 'live_tv', amount: 4490, billingDay: 8, categoryId: 'misc', startMonth: '2026-08', endMonth: '2026-01', skippedMonths: ['2026-09', 'x', '2026-09'] };
    const parsed = parseFinanceData(JSON.stringify({ schemaVersion: 1, transactions: [], categories, goals: [], subscriptions: [raw], settings: {} }));
    expect(parsed?.subscriptions[0]).toMatchObject({ active: true, endMonth: null, skippedMonths: ['2026-09'] });
  });

  it('rejeita assinaturas ou vínculos estruturalmente inválidos', () => {
    const base = { schemaVersion: 1, transactions: [], categories, goals: [], settings: {} };
    const valid = { id: 's1', name: 'N', icon: 'live_tv', amount: 100, billingDay: 8, categoryId: 'misc', startMonth: '2026-08' };
    expect(parseFinanceData(JSON.stringify({ ...base, subscriptions: [valid] }))).not.toBeNull();
    expect(parseFinanceData(JSON.stringify({ ...base, subscriptions: [{ ...valid, billingDay: 32 }] }))).toBeNull();
    expect(parseFinanceData(JSON.stringify({ ...base, subscriptions: [{ ...valid, amount: 1.5 }] }))).toBeNull();
    expect(parseFinanceData(JSON.stringify({ ...base, subscriptions: [{ ...valid, startMonth: '2026-13' }] }))).toBeNull();
    expect(parseFinanceData(JSON.stringify({ ...base, subscriptions: {} }))).toBeNull();
    const badLink = tx({ type: 'expense', amount: 100, date: '2026-10-01', subscriptionId: 's1', subscriptionMonth: 'outubro' });
    expect(parseFinanceData(JSON.stringify({ ...base, transactions: [badLink] }))).toBeNull();
  });
});

describe('categoria padrão Assinaturas', () => {
  it('faz parte das categorias padrão e é encontrada sem acento/maiúsculas', () => {
    const defaults = buildDefaultCategories('');
    expect(defaults.find((c) => c.id === SUBSCRIPTIONS_CATEGORY_ID)).toMatchObject({ name: 'Assinaturas', kind: 'expense', icon: 'subscriptions' });
    expect(findSubscriptionsCategory([{ ...categories[0]!, id: 'x', name: 'ASSINATURAS' }])?.id).toBe('x');
    expect(findSubscriptionsCategory([{ ...categories[3]!, id: 'y', name: 'Assinaturas' }])).toBeUndefined();
  });

  it('a criação não sobrescreve um id ocupado', () => {
    const occupied = [{ ...categories[0]!, id: SUBSCRIPTIONS_CATEGORY_ID, name: 'Streaming' }];
    expect(subscriptionsCategoryToCreate(occupied, '', () => 'novo')).toMatchObject({ id: 'novo', name: 'Assinaturas' });
    expect(subscriptionsCategoryToCreate(buildDefaultCategories(''), '', () => 'novo')).toBeNull();
  });
});

describe('validateSubscription', () => {
  const values = (partial: Partial<SubscriptionFormValues> = {}): SubscriptionFormValues => ({
    name: 'Netflix',
    amount: '44,90',
    billingDay: '8',
    categoryId: 'misc',
    icon: 'live_tv',
    active: true,
    startMonth: '2026-10',
    endMonth: '',
    notes: '',
    ...partial,
  });

  it('aceita valores válidos e o valor especial de criar a categoria', () => {
    const result = validateSubscription(values(), categories, '2026-10-15');
    expect(result).toEqual({
      ok: true,
      value: { name: 'Netflix', icon: 'live_tv', amount: 4490, billingDay: 8, categoryId: 'misc', active: true, startMonth: '2026-10', endMonth: null, notes: undefined },
    });
    expect(validateSubscription(values({ categoryId: CREATE_SUBSCRIPTIONS_CATEGORY }), categories, '2026-10-15').ok).toBe(true);
  });

  it('rejeita dia, valor, categoria, meses e nome inválidos', () => {
    const result = validateSubscription(
      values({ name: ' ', amount: '', billingDay: '32', categoryId: 'salary', startMonth: '2025-09', endMonth: '2026-09' }),
      categories,
      '2026-10-15',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['amount', 'billingDay', 'categoryId', 'name', 'startMonth']);
    }
    const end = validateSubscription(values({ endMonth: '2026-09' }), categories, '2026-10-15');
    expect(end.ok ? null : end.errors.endMonth).toMatch(/igual ou posterior/);
    expect(validateSubscription(values({ billingDay: '0' }), categories, '2026-10-15').ok).toBe(false);
  });

  it('na edição, mantém um primeiro mês antigo já salvo', () => {
    expect(validateSubscription(values({ startMonth: '2024-01' }), categories, '2026-10-15', '2024-01').ok).toBe(true);
    expect(validateSubscription(values({ startMonth: '2024-01' }), categories, '2026-10-15').ok).toBe(false);
  });
});

describe('dados de demonstração com assinaturas', () => {
  it('são coerentes: cobranças só até hoje, assinatura pausada sem cobranças recentes e sincronização sem mudanças', () => {
    const today = '2026-10-15';
    const demo = buildDemoData(today);
    expect(demo.subscriptions.length).toBeGreaterThanOrEqual(4);
    const charges = generated(demo.transactions);
    expect(charges.length).toBeGreaterThan(0);
    expect(charges.every((t) => t.date <= today && t.categoryId === SUBSCRIPTIONS_CATEGORY_ID)).toBe(true);
    const youtube = demo.subscriptions.find((s) => s.name === 'YouTube Premium');
    expect(youtube?.active).toBe(false);
    expect(charges.some((t) => t.subscriptionId === youtube?.id && t.subscriptionMonth! > '2026-07')).toBe(false);
    expect(syncSubscriptionCharges(demo.subscriptions, demo.transactions, today, TS).changed).toBe(false);
  });
});
