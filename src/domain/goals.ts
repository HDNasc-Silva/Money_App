import type { Cents, Goal, IsoDate, MonthKey, Period } from '@/models';
import { addMonths, lastDayOfMonth, monthKeyOf, monthsBetween } from '@/utils/dates';
import { sumCents } from '@/utils/money';
import { isInPeriod } from './periods';

export interface GoalProgress {
  saved: Cents;
  remaining: Cents;
  /** 0–1 (limitado a 1). */
  ratio: number;
  completed: boolean;
}

export const goalSaved = (goal: Goal): Cents =>
  goal.initialAmount + sumCents(goal.contributions.map((c) => c.amount));

export function goalProgress(goal: Goal): GoalProgress {
  const saved = goalSaved(goal);
  const remaining = Math.max(goal.targetAmount - saved, 0);
  const ratio = goal.targetAmount > 0 ? Math.min(saved / goal.targetAmount, 1) : 0;
  return { saved, remaining, ratio, completed: remaining === 0 };
}

/** Meses necessários para juntar `remaining` com aportes mensais; `null` se nunca atinge. */
export function monthsToReach(remaining: Cents, monthly: Cents): number | null {
  if (remaining <= 0) return 0;
  if (monthly <= 0) return null;
  return Math.ceil(remaining / monthly);
}

/** Mês previsto de conclusão a partir do mês atual. */
export function projectedMonth(today: IsoDate, months: number): MonthKey {
  return addMonths(monthKeyOf(today), months);
}

/** Aporte mensal necessário para concluir até o prazo (mínimo de 1 mês). */
export function requiredMonthly(remaining: Cents, deadline: IsoDate, today: IsoDate): Cents {
  if (remaining <= 0) return 0;
  const months = Math.max(monthsBetween(monthKeyOf(today), monthKeyOf(deadline)), 1);
  return Math.ceil(remaining / months);
}

export type GoalPace = 'completed' | 'on-track' | 'late' | 'no-plan';

export interface GoalForecast {
  months: number | null;
  month: MonthKey | null;
  pace: GoalPace;
  /** Aporte mensal necessário para cumprir o prazo; `null` sem prazo. */
  requiredMonthly: Cents | null;
}

export function goalForecast(goal: Goal, today: IsoDate, monthly: Cents = goal.monthlyContribution): GoalForecast {
  const { remaining, completed } = goalProgress(goal);
  const required = goal.deadline ? requiredMonthly(remaining, goal.deadline, today) : null;
  if (completed) return { months: 0, month: monthKeyOf(today), pace: 'completed', requiredMonthly: required };

  const months = monthsToReach(remaining, monthly);
  if (months === null) return { months: null, month: null, pace: 'no-plan', requiredMonthly: required };

  const month = projectedMonth(today, months);
  const late = goal.deadline !== null && month > monthKeyOf(goal.deadline);
  return { months, month, pace: late ? 'late' : 'on-track', requiredMonthly: required };
}

export interface GoalsSummary {
  saved: Cents;
  target: Cents;
  remaining: Cents;
  ratio: number;
  active: number;
  completed: number;
  /** Soma dos aportes mensais planejados das metas ativas. */
  plannedMonthly: Cents;
}

export function goalsSummary(goals: readonly Goal[]): GoalsSummary {
  let saved = 0;
  let target = 0;
  let completed = 0;
  let plannedMonthly = 0;
  for (const goal of goals) {
    const progress = goalProgress(goal);
    saved += Math.min(progress.saved, goal.targetAmount);
    target += goal.targetAmount;
    if (progress.completed) completed += 1;
    else plannedMonthly += goal.monthlyContribution;
  }
  return {
    saved,
    target,
    remaining: Math.max(target - saved, 0),
    ratio: target > 0 ? saved / target : 0,
    active: goals.length - completed,
    completed,
    plannedMonthly,
  };
}

/* ---------- Aportes e dinheiro guardado (poupança = aportes em metas, ver DT-016) ---------- */

/** Soma dos aportes de todas as metas com data dentro do período (não inclui o valor inicial). */
export function contributionsInPeriod(goals: readonly Goal[], period: Period): Cents {
  let total = 0;
  for (const goal of goals) {
    for (const c of goal.contributions) if (isInPeriod(c.date, period)) total += c.amount;
  }
  return total;
}

/**
 * Soma dos aportes de todas as metas com data até `date` (inclusive): dinheiro que saiu do
 * saldo disponível para as metas. O valor inicial não entra, pois foi guardado antes do app.
 */
export function contributionsUntil(goals: readonly Goal[], date: IsoDate): Cents {
  let total = 0;
  for (const goal of goals) {
    for (const c of goal.contributions) if (c.date <= date) total += c.amount;
  }
  return total;
}

export interface MonthContributions {
  month: MonthKey;
  total: Cents;
  /** Aportes do mês por id de meta (só metas com aporte no mês). */
  byGoal: Record<string, Cents>;
}

/** Aportes de cada mês da lista, no total e por meta. */
export function monthlyContributions(goals: readonly Goal[], months: readonly MonthKey[]): MonthContributions[] {
  const buckets = new Map<MonthKey, MonthContributions>(months.map((month) => [month, { month, total: 0, byGoal: {} }]));
  for (const goal of goals) {
    for (const c of goal.contributions) {
      const bucket = buckets.get(monthKeyOf(c.date));
      if (!bucket) continue;
      bucket.total += c.amount;
      bucket.byGoal[goal.id] = (bucket.byGoal[goal.id] ?? 0) + c.amount;
    }
  }
  return months.map((month) => buckets.get(month) as MonthContributions);
}

/** Mês de criação da meta, ou `null` quando `createdAt` não é uma data reconhecível. */
const createdMonth = (goal: Goal): MonthKey | null => (/^\d{4}-\d{2}/.test(goal.createdAt) ? goal.createdAt.slice(0, 7) : null);

/**
 * Valor guardado na meta ao fim de `date`: valor inicial (a partir do mês de criação da meta) +
 * aportes com data até `date`. Sem data de criação válida, o valor inicial conta sempre.
 */
export function goalSavedAt(goal: Goal, date: IsoDate): Cents {
  const created = createdMonth(goal);
  const initial = created === null || created <= monthKeyOf(date) ? goal.initialAmount : 0;
  return initial + sumCents(goal.contributions.filter((c) => c.date <= date).map((c) => c.amount));
}

export interface SavedPoint {
  month: MonthKey;
  /** Total guardado em todas as metas ao fim do mês. */
  total: Cents;
}

/** Evolução do total guardado em metas ao fim de cada mês. */
export const savedEvolution = (goals: readonly Goal[], months: readonly MonthKey[]): SavedPoint[] =>
  months.map((month) => {
    const end = lastDayOfMonth(month);
    return { month, total: goals.reduce((sum, goal) => sum + goalSavedAt(goal, end), 0) };
  });

/** Total realmente guardado em todas as metas (sem limitar ao alvo). */
export const totalSaved = (goals: readonly Goal[]): Cents => goals.reduce((sum, goal) => sum + goalSaved(goal), 0);

export interface GoalShare {
  goalId: string;
  name: string;
  icon: string;
  saved: Cents;
  /** Participação no total guardado (0–1). */
  share: number;
}

/** Distribuição do dinheiro guardado por meta, da maior para a menor (metas sem saldo ficam de fora). */
export function savedDistribution(goals: readonly Goal[]): GoalShare[] {
  const total = totalSaved(goals);
  return goals
    .map((goal) => ({ goal, saved: goalSaved(goal) }))
    .filter(({ saved }) => saved > 0)
    .map(({ goal, saved }) => ({ goalId: goal.id, name: goal.name, icon: goal.icon, saved, share: total > 0 ? saved / total : 0 }))
    .sort((a, b) => b.saved - a.saved);
}

export interface SimulationScenario {
  key: 'conservative' | 'moderate' | 'focus';
  label: string;
  monthly: Cents;
  months: number | null;
}

/** Cenários comparativos: 60%, 100% e 150% do aporte simulado (arredondados para R$ 10). */
export function simulationScenarios(remaining: Cents, monthly: Cents): SimulationScenario[] {
  const round = (value: number): Cents => Math.max(Math.round(value / 1000) * 1000, 1000);
  const build = (key: SimulationScenario['key'], label: string, factor: number): SimulationScenario => {
    const value = round(monthly * factor);
    return { key, label, monthly: value, months: monthsToReach(remaining, value) };
  };
  return [
    build('conservative', 'Conservador', 0.6),
    build('moderate', 'Moderado', 1),
    build('focus', 'Foco Total', 1.5),
  ];
}
