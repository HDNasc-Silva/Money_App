import { describe, expect, it } from 'vitest';
import { buildAlerts } from '@/domain/alerts';
import {
  contributionsInPeriod,
  contributionsUntil,
  goalSavedAt,
  monthlyContributions,
  savedDistribution,
  savedEvolution,
  totalSaved,
} from '@/domain/goals';
import { monthPeriod } from '@/domain/periods';
import { buildDemoData } from '@/store/demoData';
import { categories, goal } from './helpers';

const c = (id: string, amount: number, date: string) => ({ id, amount, date });

const reserve = goal({
  id: 'reserve',
  name: 'Reserva',
  initialAmount: 100_000,
  createdAt: '2026-08-15T10:00:00.000Z',
  contributions: [c('a', 20_000, '2026-08-20'), c('b', 30_000, '2026-09-05'), c('c', 10_000, '2026-10-01')],
});
const trip = goal({
  id: 'trip',
  name: 'Viagem',
  targetAmount: 500_000,
  initialAmount: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  contributions: [c('d', 50_000, '2026-09-30'), c('e', 5_000, '2026-11-02')],
});
const goals = [reserve, trip];

describe('poupança = aportes em metas', () => {
  it('soma os aportes de todas as metas no período (sem o valor inicial)', () => {
    expect(contributionsInPeriod(goals, monthPeriod('2026-09'))).toBe(80_000);
    expect(contributionsInPeriod(goals, monthPeriod('2026-10'))).toBe(10_000);
    expect(contributionsInPeriod(goals, monthPeriod('2026-07'))).toBe(0);
    expect(contributionsInPeriod([], monthPeriod('2026-09'))).toBe(0);
  });

  it('soma os aportes até a data, inclusive', () => {
    expect(contributionsUntil(goals, '2026-09-05')).toBe(50_000);
    expect(contributionsUntil(goals, '2026-09-30')).toBe(100_000);
    expect(contributionsUntil(goals, '2026-12-31')).toBe(115_000);
    expect(contributionsUntil(goals, '2026-01-01')).toBe(0);
  });

  it('agrupa os aportes por mês e por meta', () => {
    const months = monthlyContributions(goals, ['2026-08', '2026-09', '2026-10']);
    expect(months).toEqual([
      { month: '2026-08', total: 20_000, byGoal: { reserve: 20_000 } },
      { month: '2026-09', total: 80_000, byGoal: { reserve: 30_000, trip: 50_000 } },
      { month: '2026-10', total: 10_000, byGoal: { reserve: 10_000 } },
    ]);
  });
});

describe('dinheiro guardado ao longo do tempo', () => {
  it('valor inicial conta a partir do mês de criação da meta', () => {
    expect(goalSavedAt(reserve, '2026-07-31')).toBe(0);
    expect(goalSavedAt(reserve, '2026-08-01')).toBe(100_000);
    expect(goalSavedAt(reserve, '2026-08-31')).toBe(120_000);
    // Sem data de criação reconhecível, o valor inicial conta sempre.
    expect(goalSavedAt(goal({ initialAmount: 7_000, createdAt: '' }), '2000-01-01')).toBe(7_000);
  });

  it('evolução do total guardado ao fim de cada mês', () => {
    expect(savedEvolution(goals, ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])).toEqual([
      { month: '2026-07', total: 0 },
      { month: '2026-08', total: 120_000 },
      { month: '2026-09', total: 200_000 },
      { month: '2026-10', total: 210_000 },
      { month: '2026-11', total: 215_000 },
    ]);
  });

  it('total e distribuição usam o valor realmente guardado, sem limitar ao alvo', () => {
    const overSaved = goal({ id: 'over', name: 'Excedida', targetAmount: 1_000, initialAmount: 3_000 });
    expect(totalSaved([...goals, overSaved])).toBe(218_000);

    const distribution = savedDistribution([...goals, overSaved, goal({ id: 'empty', name: 'Vazia' })]);
    expect(distribution.map((d) => [d.goalId, d.saved])).toEqual([
      ['reserve', 160_000],
      ['trip', 55_000],
      ['over', 3_000],
    ]);
    expect(distribution[0]!.share).toBeCloseTo(160_000 / 218_000);
    expect(savedDistribution([])).toEqual([]);
  });
});

describe('alerta de aportes', () => {
  it('avisa quando os aportes superam os do mesmo período do mês anterior', () => {
    const alerts = buildAlerts({ transactions: [], categories, goals, month: '2026-09', today: '2026-09-30' });
    expect(alerts.find((a) => a.id === 'savings-up')?.message).toContain('aportou');

    // Outubro aportou menos que setembro: sem alerta.
    const october = buildAlerts({ transactions: [], categories, goals, month: '2026-10', today: '2026-10-31' });
    expect(october.some((a) => a.id === 'savings-up')).toBe(false);
  });

  it('não depende de receitas e despesas (a sobra do mês não é mais "poupança")', () => {
    const alerts = buildAlerts({ transactions: [], categories, goals: [], month: '2026-10', today: '2026-10-31' });
    expect(alerts.some((a) => a.id === 'savings-up')).toBe(false);
  });
});

describe('demonstração', () => {
  it('tem aportes em vários meses, com ids únicos e sem datas futuras', () => {
    for (const today of ['2026-10-30', '2026-10-03']) {
      const demo = buildDemoData(today);
      const all = demo.goals.flatMap((g) => g.contributions);
      expect(new Set(all.map((x) => x.id)).size).toBe(all.length);
      expect(all.every((x) => x.date <= today)).toBe(true);
      expect(new Set(all.map((x) => x.date.slice(0, 7))).size).toBeGreaterThanOrEqual(5);
      expect('savingsTarget' in demo.settings).toBe(false);
    }
  });
});
