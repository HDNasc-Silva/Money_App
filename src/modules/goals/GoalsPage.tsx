import { useMemo, useState } from 'react';
import { Badge, type BadgeTone } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Page, PageColumn, PageGrid } from '@/components/layout/Page';
import { goalForecast, goalProgress, goalsSummary, type GoalPace } from '@/domain/goals';
import type { Goal } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { formatMonthLabel, formatMonthYearShort, todayIso } from '@/utils/dates';
import { formatPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import { ContributionSheet, GoalFormSheet } from './GoalForms';
import styles from './Goals.module.css';
import { GoalSimulator } from './GoalSimulator';

const NEAR_RATIO = 0.8;

function paceBadge(pace: GoalPace, ratio: number): { label: string; tone: BadgeTone } {
  if (pace === 'completed') return { label: 'Concluída', tone: 'income' };
  if (ratio >= NEAR_RATIO) return { label: 'Quase lá!', tone: 'income' };
  if (pace === 'late') return { label: 'Atrasada', tone: 'expense' };
  if (pace === 'no-plan') return { label: 'Sem aporte', tone: 'neutral' };
  return { label: 'Em ritmo', tone: 'neutral' };
}

export function GoalsPage() {
  const { goals } = useFinanceData();
  const [editing, setEditing] = useState<{ key: number; goal: Goal | null } | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const today = todayIso();

  const summary = useMemo(() => goalsSummary(goals), [goals]);
  const lastForecastMonth = useMemo(() => {
    const months = goals.map((g) => goalForecast(g, today).month);
    if (months.some((m) => m === null)) return null;
    return months.reduce<string | null>((latest, m) => (m && (!latest || m > latest) ? m : latest), null);
  }, [goals, today]);

  return (
    <Page
      title="Metas Financeiras"
      eyebrow={
        <Badge tone="info" icon="trending_up">
          Planejamento ativo
        </Badge>
      }
      description="Conquiste seus objetivos com consistência e autonomia."
    >
      <PageGrid>
        <PageColumn>
          <Card>
            <div className={styles.summaryTop}>
              <div>
                <span className={styles.overline}>Total acumulado</span>
                <Money value={summary.saved} className={styles.summaryValue} />
                <span className={styles.muted}>
                  de <Money value={summary.target} /> pretendidos
                </span>
              </div>
              <div className={styles.summaryAside}>
                <Badge tone="income" money>
                  {formatPercent(summary.ratio)}
                </Badge>
                <span className={styles.muted}>{summary.active === 1 ? '1 ativa' : `${summary.active} ativas`}</span>
              </div>
            </div>
            <ProgressBar value={summary.ratio} tone="good" label="Progresso geral das metas" />
            <div className={styles.summaryFooter}>
              <span>Faltam</span>
              <Money value={summary.remaining} />
            </div>
            {summary.plannedMonthly > 0 && lastForecastMonth && (
              <div className={styles.tip}>
                <Icon name="lightbulb" size={18} />
                <p>
                  Guardando <strong className="money">{formatCurrency(summary.plannedMonthly)}/mês</strong> você atinge todas as metas até{' '}
                  {formatMonthLabel(lastForecastMonth)}.
                </p>
              </div>
            )}
          </Card>

          <div className={styles.listHeader}>
            <h2>Metas em andamento</h2>
            <span className={styles.muted}>{goals.length === 1 ? '1 meta' : `${goals.length} metas`}</span>
          </div>
          {goals.length === 0 && (
            <EmptyState
              icon="flag"
              title="Nenhuma meta criada"
              description="Reserva de emergência, viagem, um carro novo… defina um objetivo e acompanhe cada aporte."
            />
          )}
          {goals.map((goal) => {
            const progress = goalProgress(goal);
            const forecast = goalForecast(goal, today);
            const badge = paceBadge(forecast.pace, progress.ratio);
            return (
              <article key={goal.id} className={styles.goal}>
                <div className={styles.goalTop}>
                  <span className={styles.goalIcon}>
                    <Icon name={goal.icon} size={22} />
                  </span>
                  <div className={styles.goalTitle}>
                    <h3>{goal.name}</h3>
                    {goal.description && <p>{goal.description}</p>}
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
                <div className={styles.goalValues}>
                  <Money value={progress.saved} className={styles.goalSaved} />
                  <span className={styles.muted}>
                    Meta: <Money value={goal.targetAmount} />
                  </span>
                </div>
                <ProgressBar value={progress.ratio} tone="good" label={`Progresso de ${goal.name}`} />
                <div className={styles.goalMeta}>
                  <span>{formatPercent(progress.ratio)} alcançado</span>
                  <span>
                    Resta <Money value={progress.remaining} />
                  </span>
                </div>
                <div className={styles.goalFooter}>
                  <span className={styles.muted}>
                    {forecast.pace === 'completed'
                      ? 'Meta concluída 🎉'
                      : forecast.month
                        ? `Previsão: ${formatMonthYearShort(forecast.month)}`
                        : 'Defina um aporte mensal'}
                    {goal.deadline && ` · Prazo: ${formatMonthYearShort(goal.deadline.slice(0, 7))}`}
                  </span>
                  <div className={styles.goalActions}>
                    <Button variant="ghost" size="sm" icon="edit" aria-label={`Editar ${goal.name}`} onClick={() => setEditing({ key: Date.now(), goal })} />
                    {!progress.completed && (
                      <Button size="sm" icon="add" onClick={() => setContributing(goal)}>
                        Aportar
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          <Button icon="add_circle" fullWidth onClick={() => setEditing({ key: Date.now(), goal: null })}>
            Criar Nova Meta
          </Button>
        </PageColumn>

        {/* Simulador depois da lista (v1.7.0): a lista de metas é o conteúdo principal da tela. */}
        <PageColumn>
          <GoalSimulator key={goals.map((g) => g.id).join()} goals={goals} />
        </PageColumn>
      </PageGrid>

      {editing && <GoalFormSheet key={editing.key} goal={editing.goal} onClose={() => setEditing(null)} />}
      {contributing && <ContributionSheet key={contributing.id} goal={contributing} onClose={() => setContributing(null)} />}
    </Page>
  );
}
