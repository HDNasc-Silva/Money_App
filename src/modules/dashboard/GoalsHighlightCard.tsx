import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { ProgressBar } from '@/components/common/ProgressBar';
import type { GoalProgress } from '@/domain/goals';
import type { Goal } from '@/models';
import { formatPercent } from '@/utils/format';
import styles from './Dashboard.module.css';

/** "Suas metas": progresso compacto das metas mais próximas de concluir. */
export function GoalsHighlightCard({ goals }: { goals: readonly { goal: Goal; progress: GoalProgress }[] }) {
  return (
    <Card padding="md" aria-label="Suas metas" className="enter">
      <CardHeader
        title="Suas metas"
        action={
          <Link to="/metas" className={styles.textLink}>
            {goals.length > 0 ? 'Ver metas' : 'Abrir metas'}
          </Link>
        }
      />
      {goals.length === 0 ? (
        <Link to="/metas" className={styles.invite}>
          <Icon name="flag" size={20} />
          <span>
            <strong>Crie sua primeira meta</strong>
            <small>Reserva de emergência, viagem, troca de carro… acompanhe cada aporte.</small>
          </span>
          <Icon name="chevron_right" size={20} />
        </Link>
      ) : (
        <ul className={styles.goalRows}>
          {goals.map(({ goal, progress }) => (
            <li key={goal.id} className={styles.goalRow}>
              <div className={styles.goalRowTop}>
                <span className={styles.goalRowName}>
                  <Icon name={goal.icon} size={18} />
                  <span className={styles.truncate}>{goal.name}</span>
                </span>
                <span className={styles.goalRowPercent}>{progress.completed ? 'Concluída' : formatPercent(progress.ratio)}</span>
              </div>
              <ProgressBar value={progress.ratio} tone="good" size="sm" label={`Progresso de ${goal.name}`} />
              <span className={styles.rowMeta}>
                <Money value={progress.saved} compact /> de <Money value={goal.targetAmount} compact />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
