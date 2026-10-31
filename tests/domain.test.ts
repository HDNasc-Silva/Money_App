import { describe, expect, it } from 'vitest';
import { buildAlerts } from '@/domain/alerts';
import { budgetStatus, categoryBudgets, globalBudget } from '@/domain/budgets';
import { goalForecast, goalProgress, goalsSummary, monthsToReach, requiredMonthly, simulationScenarios } from '@/domain/goals';
import {
  defaultDateForMonth,
  isFutureMonth,
  MAX_FUTURE_MONTHS,
  maxPlanningDate,
  maxPlanningMonth,
  monthPeriod,
  monthsPeriod,
  previousPeriod,
} from '@/domain/periods';
import { expenseDistribution, monthlySeries, periodIndicators, weeklyBreakdown } from '@/domain/reports';
import { cumulativeBalance, percentChange, summarize } from '@/domain/summary';
import { DEFAULT_FILTERS, filterTransactions, groupByDay } from '@/domain/transactions';
import { categories, goal, tx } from './helpers';

describe('summary', () => {
  const list = [
    tx({ type: 'income', amount: 820000, date: '2026-10-05' }),
    tx({ type: 'expense', amount: 335000, date: '2026-10-10' }),
  ];

  it('calcula receitas, despesas, saldo e taxa de poupança', () => {
    expect(summarize(list)).toEqual({
      income: 820000,
      expense: 335000,
      balance: 485000,
      savings: 485000,
      savingsRate: 485000 / 820000,
      count: 2,
    });
  });

  it('poupança não fica negativa e taxa é 0 sem receitas', () => {
    const result = summarize([tx({ type: 'expense', amount: 1000, date: '2026-10-01' })]);
    expect(result.balance).toBe(-1000);
    expect(result.savings).toBe(0);
    expect(result.savingsRate).toBe(0);
  });

  it('saldo acumulado considera apenas datas até o limite', () => {
    expect(cumulativeBalance(list, '2026-10-09')).toBe(820000);
    expect(cumulativeBalance(list, '2026-10-31')).toBe(485000);
  });

  it('variação percentual sem base retorna null', () => {
    expect(percentChange(110, 100)).toBeCloseTo(0.1);
    expect(percentChange(50, 0)).toBeNull();
  });
});

describe('budgets', () => {
  const list = [
    tx({ type: 'expense', amount: 104_100, date: '2026-10-03', categoryId: 'food' }),
    tx({ type: 'expense', amount: 40_000, date: '2026-10-04', categoryId: 'fun' }),
    tx({ type: 'expense', amount: 99_999, date: '2026-09-04', categoryId: 'fun' }),
    tx({ type: 'expense', amount: 5_000, date: '2026-10-04', categoryId: 'misc' }),
  ];

  it('classifica o status pelo consumo', () => {
    expect(budgetStatus(null)).toBe('none');
    expect(budgetStatus(0.5)).toBe('ok');
    expect(budgetStatus(0.8)).toBe('warning');
    expect(budgetStatus(1)).toBe('warning');
    expect(budgetStatus(1.01)).toBe('exceeded');
  });

  it('calcula gasto, consumo e restante por categoria no mês', () => {
    const budgets = categoryBudgets(list, categories, '2026-10');
    const food = budgets.find((b) => b.category.id === 'food')!;
    const fun = budgets.find((b) => b.category.id === 'fun')!;
    const misc = budgets.find((b) => b.category.id === 'misc')!;
    expect(budgets).toHaveLength(3); // só categorias de despesa
    expect(food).toMatchObject({ spent: 104_100, remaining: -4_100, status: 'exceeded' });
    expect(food.ratio).toBeCloseTo(1.041);
    expect(fun).toMatchObject({ spent: 40_000, remaining: 10_000, status: 'warning' });
    expect(misc).toMatchObject({ spent: 5_000, limit: null, ratio: null, status: 'none' });
  });

  it('teto global soma apenas categorias com limite', () => {
    const global = globalBudget(categoryBudgets(list, categories, '2026-10'));
    expect(global.limit).toBe(150_000);
    expect(global.spent).toBe(144_100);
    expect(global.available).toBe(5_900);
  });
});

describe('goals', () => {
  it('progresso soma valor inicial e aportes', () => {
    const g = goal({ initialAmount: 500_000, contributions: [{ id: 'c', amount: 300_000, date: '2026-10-01' }] });
    expect(goalProgress(g)).toEqual({ saved: 800_000, remaining: 200_000, ratio: 0.8, completed: false });
  });

  it('meta concluída limita o progresso em 100%', () => {
    const g = goal({ initialAmount: 1_200_000 });
    expect(goalProgress(g)).toMatchObject({ remaining: 0, ratio: 1, completed: true });
  });

  it('meses necessários e aporte para o prazo', () => {
    expect(monthsToReach(200_000, 50_000)).toBe(4);
    expect(monthsToReach(200_001, 50_000)).toBe(5);
    expect(monthsToReach(100, 0)).toBeNull();
    expect(monthsToReach(0, 0)).toBe(0);
    expect(requiredMonthly(600_000, '2027-04-30', '2026-10-30')).toBe(100_000);
    expect(requiredMonthly(600_000, '2026-11-01', '2026-10-30')).toBe(600_000);
  });

  it('previsão indica atraso em relação ao prazo', () => {
    const onTrack = goal({ initialAmount: 800_000, monthlyContribution: 100_000, deadline: '2027-06-30' });
    expect(goalForecast(onTrack, '2026-10-30')).toMatchObject({ months: 2, month: '2026-12', pace: 'on-track' });

    const late = goal({ initialAmount: 0, monthlyContribution: 100_000, deadline: '2027-01-31' });
    const forecast = goalForecast(late, '2026-10-30');
    expect(forecast).toMatchObject({ months: 10, month: '2027-08', pace: 'late' });
    expect(forecast.requiredMonthly).toBe(333_334);

    expect(goalForecast(goal({ monthlyContribution: 0 }), '2026-10-30').pace).toBe('no-plan');
  });

  it('resumo e cenários do simulador', () => {
    const summary = goalsSummary([goal({ initialAmount: 500_000 }), goal({ id: 'g2', initialAmount: 2_000_000 })]);
    expect(summary).toMatchObject({ saved: 1_500_000, target: 2_000_000, active: 1, completed: 1, plannedMonthly: 100_000 });

    const scenarios = simulationScenarios(240_000, 50_000);
    expect(scenarios.map((s) => [s.monthly, s.months])).toEqual([
      [30_000, 8],
      [50_000, 5],
      [75_000, 4],
    ]);
  });
});

describe('periods & reports', () => {
  const list = [
    tx({ type: 'income', amount: 100_000, date: '2026-10-01' }),
    tx({ type: 'expense', amount: 20_000, date: '2026-10-02', categoryId: 'food' }),
    tx({ type: 'expense', amount: 10_000, date: '2026-10-09', categoryId: 'fun' }),
    tx({ type: 'expense', amount: 10_000, date: '2026-10-30', categoryId: 'food' }),
    tx({ type: 'income', amount: 50_000, date: '2026-09-15' }),
  ];

  it('período anterior tem o mesmo tamanho', () => {
    expect(previousPeriod({ start: '2026-10-01', end: '2026-10-31' })).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(previousPeriod(monthsPeriod('2026-10', 6))).toEqual({ start: '2025-11-01', end: '2026-04-30' });
  });

  it('semanas do mês incluem a 5ª semana quando existe', () => {
    const weeks = weeklyBreakdown(list, '2026-10');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toMatchObject({ label: 'Sem 1', income: 100_000, expense: 20_000 });
    expect(weeks[1]).toMatchObject({ expense: 10_000 });
    expect(weeks[4]).toMatchObject({ start: '2026-10-29', end: '2026-10-31', expense: 10_000 });
    expect(weeklyBreakdown([], '2026-02')).toHaveLength(4);
  });

  it('série mensal com saldo acumulado', () => {
    const series = monthlySeries(list, { start: '2026-09-01', end: '2026-10-31' });
    expect(series.map((p) => p.closingBalance)).toEqual([50_000, 110_000]);
    expect(series[1]).toMatchObject({ income: 100_000, expense: 40_000, saved: 60_000 });
  });

  it('distribuição de despesas ordenada por valor', () => {
    const distribution = expenseDistribution(list, categories, { start: '2026-10-01', end: '2026-10-31' });
    expect(distribution.map((d) => [d.name, d.amount])).toEqual([
      ['Alimentação', 30_000],
      ['Lazer', 10_000],
    ]);
    expect(distribution[0]!.share).toBeCloseTo(0.75);
  });

  it('indicadores consideram apenas dias até hoje', () => {
    const indicators = periodIndicators(list, { start: '2026-10-01', end: '2026-10-31' }, '2026-10-10');
    expect(indicators.days).toBe(10);
    expect(indicators.noSpendDays).toBe(8);
    expect(indicators.daysWithRecords).toBe(3);
    expect(indicators.largestExpense?.amount).toBe(20_000);
    expect(indicators.averageDailyExpense).toBe(3_000);
  });

  it('limite de planejamento é de 60 meses à frente do mês atual', () => {
    expect(MAX_FUTURE_MONTHS).toBe(60);
    expect(maxPlanningMonth('2026-10-30')).toBe('2031-10');
    expect(maxPlanningDate('2026-10-30')).toBe('2031-10-31');
    expect(isFutureMonth('2026-12', '2026-10-30')).toBe(true);
    expect(isFutureMonth('2026-10', '2026-10-30')).toBe(false);
    expect(isFutureMonth('2026-09', '2026-10-30')).toBe(false);
  });

  describe('defaultDateForMonth', () => {
    it('usa hoje quando o mês selecionado é o mês atual', () => {
      expect(defaultDateForMonth('2026-10', '2026-10-30')).toBe('2026-10-30');
      expect(defaultDateForMonth('2026-10', '2026-10-01')).toBe('2026-10-01');
    });

    it('mantém o mesmo dia em meses futuros e passados', () => {
      expect(defaultDateForMonth('2026-12', '2026-10-30')).toBe('2026-12-30');
      expect(defaultDateForMonth('2026-08', '2026-10-15')).toBe('2026-08-15');
      expect(defaultDateForMonth('2027-01', '2026-10-05')).toBe('2027-01-05');
      expect(defaultDateForMonth('2025-10', '2026-10-30')).toBe('2025-10-30');
    });

    it('limita ao último dia em meses mais curtos', () => {
      expect(defaultDateForMonth('2026-11', '2026-10-31')).toBe('2026-11-30');
      expect(defaultDateForMonth('2026-09', '2026-10-31')).toBe('2026-09-30');
      expect(defaultDateForMonth('2026-12', '2026-10-31')).toBe('2026-12-31');
    });

    it('trata fevereiro em anos comuns e bissextos', () => {
      expect(defaultDateForMonth('2027-02', '2026-10-30')).toBe('2027-02-28');
      expect(defaultDateForMonth('2028-02', '2026-10-31')).toBe('2028-02-29');
      expect(defaultDateForMonth('2028-02', '2026-10-28')).toBe('2028-02-28');
      expect(defaultDateForMonth('2026-02', '2026-10-29')).toBe('2026-02-28');
    });
  });

  it('mês futuro sem lançamentos não gera divisões por zero', () => {
    const period = monthPeriod('2026-12');
    const indicators = periodIndicators([], period, '2026-10-30');
    expect(indicators).toEqual({ days: 0, noSpendDays: 0, daysWithRecords: 0, largestExpense: null, averageDailyExpense: 0 });
    expect(summarize([]).savingsRate).toBe(0);
    expect(expenseDistribution([], categories, period)).toEqual([]);
    expect(monthlySeries(list, monthsPeriod('2026-12', 3)).map((p) => p.closingBalance)).toEqual([110_000, 110_000, 110_000]);
    const alerts = buildAlerts({ transactions: list, categories, goals: [], month: '2026-12', today: '2026-10-30' });
    expect(alerts.filter((a) => a.id === 'spending-up' || a.id === 'savings-up')).toEqual([]);
  });
});

describe('alerts', () => {
  it('gera alertas de limite, aumento de gastos e metas', () => {
    const list = [
      tx({ type: 'expense', amount: 110_000, date: '2026-10-03', categoryId: 'food' }),
      tx({ type: 'expense', amount: 42_000, date: '2026-10-04', categoryId: 'fun' }),
      tx({ type: 'expense', amount: 50_000, date: '2026-09-03', categoryId: 'food' }),
    ];
    const alerts = buildAlerts({
      transactions: list,
      categories,
      goals: [goal({ initialAmount: 850_000 })],
      month: '2026-10',
      today: '2026-10-30',
    });
    const ids = alerts.map((a) => a.id);
    expect(ids).toContain('budget-exceeded-food');
    expect(ids).toContain('budget-warning-fun');
    expect(ids).toContain('spending-up');
    expect(ids).toContain('goal-near-g1');
  });

  it('compara o mês corrente com o mesmo intervalo do mês anterior', () => {
    const list = [
      tx({ type: 'expense', amount: 10_000, date: '2026-10-05', categoryId: 'misc' }),
      // Gasto do fim de setembro não entra na comparação até o dia 10.
      tx({ type: 'expense', amount: 90_000, date: '2026-09-25', categoryId: 'misc' }),
      tx({ type: 'expense', amount: 5_000, date: '2026-09-05', categoryId: 'misc' }),
    ];
    const alerts = buildAlerts({ transactions: list, categories, goals: [], month: '2026-10', today: '2026-10-10' });
    expect(alerts.map((a) => a.id)).toContain('spending-up');
  });

  it('sem dados não há alertas', () => {
    expect(buildAlerts({ transactions: [], categories, goals: [], month: '2026-10', today: '2026-10-10' })).toEqual([]);
  });
});

describe('transaction filters', () => {
  const list = [
    tx({ type: 'expense', amount: 1, date: '2026-10-30', description: 'Farmácia Droga Raia', categoryId: 'misc' }),
    tx({ type: 'income', amount: 1, date: '2026-10-25', description: 'Salário' }),
    tx({ type: 'expense', amount: 1, date: '2026-09-20', description: 'Cinema', categoryId: 'fun' }),
  ];

  it('filtra por período, tipo, categoria e busca sem acento', () => {
    const today = '2026-10-30';
    expect(filterTransactions(list, categories, DEFAULT_FILTERS, today)).toHaveLength(2);
    expect(filterTransactions(list, categories, { ...DEFAULT_FILTERS, period: 'all' }, today)).toHaveLength(3);
    expect(filterTransactions(list, categories, { ...DEFAULT_FILTERS, period: 'previous-month' }, today)).toHaveLength(1);
    expect(filterTransactions(list, categories, { ...DEFAULT_FILTERS, type: 'income' }, today)).toHaveLength(1);
    expect(filterTransactions(list, categories, { ...DEFAULT_FILTERS, period: 'all', categoryId: 'fun' }, today)).toHaveLength(1);
    expect(filterTransactions(list, categories, { ...DEFAULT_FILTERS, search: 'farmacia' }, today)).toHaveLength(1);
    // Busca também pelo nome da categoria.
    expect(filterTransactions(list, categories, { ...DEFAULT_FILTERS, period: 'all', search: 'lazer' }, today)).toHaveLength(1);
  });

  it('agrupa por dia com saldo diário', () => {
    const sameDay = [
      tx({ type: 'income', amount: 1000, date: '2026-10-30' }),
      tx({ type: 'expense', amount: 300, date: '2026-10-30' }),
      tx({ type: 'expense', amount: 200, date: '2026-10-29' }),
    ];
    const groups = groupByDay(sameDay);
    expect(groups.map((g) => [g.date, g.net, g.items.length])).toEqual([
      ['2026-10-30', 700, 2],
      ['2026-10-29', -200, 1],
    ]);
  });
});
