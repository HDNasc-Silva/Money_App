import type { Cents, Goal, IsoDate, MonthKey } from '@/models';
import { addMonths, monthKeyOf, monthsBetween } from '@/utils/dates';
import { sumCents } from '@/utils/money';

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
