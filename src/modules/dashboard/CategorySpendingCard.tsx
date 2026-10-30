import { Link } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { ProgressBar, type ProgressTone } from '@/components/common/ProgressBar';
import type { BudgetStatus, CategoryBudget } from '@/domain/budgets';
import { formatPercent } from '@/utils/format';
import styles from './Dashboard.module.css';

const TONES: Record<BudgetStatus, ProgressTone> = { none: 'muted', ok: 'default', warning: 'warning', exceeded: 'danger' };

export function CategorySpendingCard({ budgets }: { budgets: readonly CategoryBudget[] }) {
  const visible = budgets.filter((b) => b.spent > 0 || b.limit !== null).sort((a, b) => b.spent - a.spent);
  return (
    <Card>
      <CardHeader
        title="Gastos por Categoria"
        subtitle="Consumo em relação ao orçamento definido"
        action={
          <Link to="/categorias" className={styles.textLink}>
            Editar tetos
          </Link>
        }
      />
      {visible.length === 0 ? (
        <EmptyState icon="category" title="Sem categorias de despesa" description="Crie categorias com limites mensais." />
      ) : (
        <ul className={styles.budgetList}>
          {visible.map((b) => (
            <li key={b.category.id} className={styles.budget}>
              <div className={styles.budgetRow}>
                <span className={styles.budgetName}>
                  <span className={styles.budgetIcon}>
                    <Icon name={b.category.icon} size={16} />
                  </span>
                  <span className={styles.truncate}>{b.category.name}</span>
                  {b.status === 'exceeded' && <Badge tone="expense">Acima do limite</Badge>}
                </span>
                <Money value={b.spent} className={[styles.budgetSpent, b.status === 'exceeded' && styles.negative].filter(Boolean).join(' ')} />
              </div>
              <ProgressBar value={b.ratio ?? 0} tone={TONES[b.status]} label={`Consumo de ${b.category.name}`} />
              <div className={styles.budgetMeta}>
                {b.limit !== null ? (
                  <>
                    <span>
                      Teto: <Money value={b.limit} />
                    </span>
                    <span className={b.status === 'exceeded' ? styles.negative : undefined}>{formatPercent(b.ratio ?? 0)}</span>
                  </>
                ) : (
                  <span>Sem teto definido</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to="/lancamentos" className={styles.wideLink}>
        Ver todas as transações
        <Icon name="arrow_forward" size={16} />
      </Link>
    </Card>
  );
}
