import type { Category, Goal, IsoDate, MonthKey, Subscription, Transaction } from '@/models';
import { addMonths, lastDayOfMonth, monthKeyOf } from '@/utils/dates';
import { formatPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import { categoryBudgets } from './budgets';
import { contributionsInPeriod, goalProgress } from './goals';
import { filterByPeriod, percentChange, summarize } from './summary';
import { subscriptionsChargingSoon } from './subscriptions';

export type AlertTone = 'warning' | 'danger' | 'info' | 'success';

export interface FinanceAlert {
  id: string;
  tone: AlertTone;
  icon: string;
  title: string;
  message: string;
  /** Rota relacionada ao alerta. */
  to?: string;
}

/** Meta a partir deste progresso gera alerta de "quase lá". */
const GOAL_MILESTONE_RATIO = 0.8;
/** Variação mínima de gastos para gerar alerta (10%). */
const SPENDING_CHANGE_THRESHOLD = 0.1;
/** Lembrete de assinatura: cobranças previstas dentro desta janela (dias). */
const SUBSCRIPTION_REMINDER_DAYS = 3;

interface AlertInput {
  transactions: readonly Transaction[];
  categories: readonly Category[];
  goals: readonly Goal[];
  month: MonthKey;
  today: IsoDate;
  /** Assinaturas ativas; usadas para os lembretes de cobrança próxima (opcional, padrão nenhuma). */
  subscriptions?: readonly Subscription[];
}

/** "hoje" / "amanhã" / "em N dias", para o lembrete de cobrança. */
function dueInWords(daysUntil: number): string {
  if (daysUntil <= 0) return 'hoje';
  if (daysUntil === 1) return 'amanhã';
  return `em ${daysUntil} dias`;
}

/**
 * Compara o mês com o mês anterior no mesmo intervalo de dias
 * (no mês corrente, até o dia de hoje), para não comparar mês parcial com mês completo.
 */
function comparableRanges(month: MonthKey, today: IsoDate) {
  const isCurrent = monthKeyOf(today) === month;
  const day = isCurrent ? Number(today.slice(8, 10)) : 31;
  const previousMonth = addMonths(month, -1);
  const clamp = (m: MonthKey) => {
    const last = lastDayOfMonth(m);
    const candidate = `${m}-${String(day).padStart(2, '0')}`;
    return candidate > last ? last : candidate;
  };
  return {
    current: { start: `${month}-01`, end: clamp(month) },
    previous: { start: `${previousMonth}-01`, end: clamp(previousMonth) },
  };
}

export function buildAlerts({ transactions, categories, goals, month, today, subscriptions = [] }: AlertInput): FinanceAlert[] {
  const alerts: FinanceAlert[] = [];

  for (const charge of subscriptionsChargingSoon(subscriptions, transactions, today, SUBSCRIPTION_REMINDER_DAYS)) {
    alerts.push({
      id: `subscription-due-${charge.subscriptionId}-${charge.date}`,
      tone: 'info',
      icon: 'event_upcoming',
      title: 'Cobrança chegando',
      message: `${charge.name} desconta ${dueInWords(charge.daysUntil)} (${formatCurrency(charge.amount)}).`,
      to: '/assinaturas',
    });
  }

  for (const budget of categoryBudgets(transactions, categories, month)) {
    if (budget.status === 'exceeded' && budget.ratio !== null) {
      alerts.push({
        id: `budget-exceeded-${budget.category.id}`,
        tone: 'warning',
        icon: 'warning',
        title: 'Alerta de Orçamento',
        message: `Você ultrapassou o limite da categoria ${budget.category.name} (${formatPercent(budget.ratio)} do teto).`,
        to: '/categorias',
      });
    } else if (budget.status === 'warning' && budget.ratio !== null) {
      alerts.push({
        id: `budget-warning-${budget.category.id}`,
        tone: 'warning',
        icon: 'error',
        title: 'Limite próximo',
        message: `${budget.category.name} já consumiu ${formatPercent(budget.ratio)} do teto mensal.`,
        to: '/categorias',
      });
    }
  }

  const ranges = comparableRanges(month, today);
  const current = summarize(filterByPeriod(transactions, ranges.current));
  const previous = summarize(filterByPeriod(transactions, ranges.previous));
  const expenseChange = percentChange(current.expense, previous.expense);
  if (expenseChange !== null && expenseChange >= SPENDING_CHANGE_THRESHOLD) {
    alerts.push({
      id: 'spending-up',
      tone: 'danger',
      icon: 'trending_up',
      title: 'Atenção aos Gastos',
      message: `Seus gastos estão ${formatPercent(expenseChange)} maiores que no mesmo período do mês anterior.`,
      to: '/relatorios',
    });
  }

  for (const goal of goals) {
    const progress = goalProgress(goal);
    if (progress.completed) {
      alerts.push({
        id: `goal-done-${goal.id}`,
        tone: 'success',
        icon: 'emoji_events',
        title: 'Meta concluída',
        message: `Parabéns! A meta ${goal.name} atingiu o valor pretendido.`,
        to: '/metas',
      });
    } else if (progress.ratio >= GOAL_MILESTONE_RATIO) {
      alerts.push({
        id: `goal-near-${goal.id}`,
        tone: 'info',
        icon: 'flag',
        title: 'Quase lá!',
        message: `Sua meta ${goal.name} atingiu ${formatPercent(progress.ratio)} do valor pretendido.`,
        to: '/metas',
      });
    }
  }

  // Poupança = aportes em metas (DT-016), comparados no mesmo intervalo de dias do mês anterior.
  const savedNow = contributionsInPeriod(goals, ranges.current);
  const savedBefore = contributionsInPeriod(goals, ranges.previous);
  if (savedBefore > 0 && savedNow > savedBefore) {
    alerts.push({
      id: 'savings-up',
      tone: 'success',
      icon: 'auto_awesome',
      title: 'Ótima Notícia',
      message: `Você aportou ${formatCurrency(savedNow - savedBefore)} a mais em metas que no mesmo período do mês anterior.`,
      to: '/relatorios',
    });
  }

  return alerts;
}
