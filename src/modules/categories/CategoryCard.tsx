import type { HTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { Badge, type BadgeTone } from '@/components/common/Badge';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { ProgressBar, type ProgressTone } from '@/components/common/ProgressBar';
import type { BudgetStatus, CategoryBudget } from '@/domain/budgets';
import { formatPercent } from '@/utils/format';
import { GROUP_LABELS } from './CategoryForm';
import styles from './Categories.module.css';

/** Props do cabo de arrastar (Pointer Events) e do cartão em si, repassadas por `useDragReorder`. */
type DragProps = Record<string, unknown> & HTMLAttributes<HTMLElement>;

function DragHandle({ handleProps }: { handleProps?: DragProps }) {
  if (!handleProps) return null;
  return (
    <button type="button" className={styles.dragHandle} aria-label="Arrastar para reordenar" {...handleProps}>
      <Icon name="drag_indicator" size={20} />
    </button>
  );
}

const TONE: Record<BudgetStatus, ProgressTone> = { none: 'muted', ok: 'good', warning: 'warning', exceeded: 'danger' };
const BADGE: Record<BudgetStatus, BadgeTone> = { none: 'neutral', ok: 'income', warning: 'neutral', exceeded: 'expense' };

function statusText(budget: CategoryBudget): { label: string; detail: string; className?: string } {
  const { status, spent, remaining } = budget;
  if (status === 'none') return { label: 'Sem teto definido', detail: '' };
  if (status === 'exceeded') return { label: 'Teto ultrapassado', detail: 'Excedido', className: styles.danger };
  if (spent === 0) return { label: 'Nenhum gasto registrado', detail: 'Saldo integral livre', className: styles.good };
  if (status === 'warning') return { label: 'Atenção à margem', detail: 'Restam' };
  return { label: 'Dentro do planejado', detail: remaining !== null ? 'Restam' : '', className: styles.good };
}

interface CategoryCardProps {
  budget: CategoryBudget;
  onEdit(): void;
  /** Liga/desliga os alertas de limite desta categoria (DT-025). */
  onToggleAlerts(): void;
  /** Alça de arrastar (Pointer Events) do `useDragReorder`, repassada pelo contêiner da lista. */
  dragHandleProps?: DragProps;
  /** Props do próprio cartão para o `useDragReorder` medir sua posição (`data-drag-id`). */
  cardProps?: DragProps;
  dragging?: boolean;
}

export function CategoryCard({ budget, onEdit, onToggleAlerts, dragHandleProps, cardProps, dragging }: CategoryCardProps) {
  const { category, spent, limit, ratio, remaining, status } = budget;
  const text = statusText(budget);
  const exceededBy = remaining !== null && remaining < 0 ? -remaining : 0;

  return (
    <article className={[styles.card, dragging && styles.dragging].filter(Boolean).join(' ')} {...cardProps}>
      <div className={styles.cardTop}>
        <DragHandle handleProps={dragHandleProps} />
        <span className={[styles.cardIcon, status === 'exceeded' && styles.cardIconDanger].filter(Boolean).join(' ')}>
          <Icon name={category.icon} size={22} />
        </span>
        <div className={styles.cardTitle}>
          <div className={styles.cardName}>
            <h3>{category.name}</h3>
            <Badge>{GROUP_LABELS[category.group]}</Badge>
          </div>
          {category.description && <p>{category.description}</p>}
        </div>
        <button
          type="button"
          className={[styles.bellButton, category.alertsEnabled && styles.bellActive].filter(Boolean).join(' ')}
          onClick={onToggleAlerts}
          aria-pressed={category.alertsEnabled}
          aria-label={category.alertsEnabled ? `Desligar alertas de orçamento de ${category.name}` : `Ligar alertas de orçamento de ${category.name}`}
        >
          <Icon name={category.alertsEnabled ? 'notifications' : 'notifications_off'} size={18} filled={category.alertsEnabled} />
        </button>
        {ratio !== null && (
          <Badge tone={BADGE[status]} money>
            {status === 'exceeded' ? <Money value={exceededBy} signed /> : formatPercent(ratio)}
          </Badge>
        )}
      </div>

      <div className={styles.cardNumbers}>
        <span className={status === 'exceeded' ? styles.danger : undefined}>
          Consumo <Money value={spent} />
        </span>
        {limit !== null && (
          <span className={styles.muted}>
            Teto <Money value={limit} />
          </span>
        )}
      </div>
      <ProgressBar value={ratio ?? 0} tone={TONE[status]} label={`Consumo de ${category.name}`} />
      <div className={styles.cardStatus}>
        <span className={status === 'exceeded' ? styles.danger : undefined}>
          {status === 'exceeded' && <Icon name="error" size={14} />} {text.label}
        </span>
        {text.detail && (
          <span className={text.className}>
            {text.detail}
            {status === 'exceeded' && (
              <>
                {' '}em <Money value={exceededBy} />
              </>
            )}
            {(status === 'ok' || status === 'warning') && spent > 0 && remaining !== null && (
              <>
                {' '}
                <Money value={remaining} />
              </>
            )}
          </span>
        )}
      </div>

      <div className={styles.cardActions}>
        <Link to={`/lancamentos?categoria=${encodeURIComponent(category.id)}`} className={styles.cardAction}>
          <Icon name="history" size={16} /> Ver histórico
        </Link>
        <button type="button" className={styles.cardAction} onClick={onEdit}>
          <Icon name="tune" size={16} /> Ajustar limite
        </button>
      </div>
    </article>
  );
}

interface IncomeCategoryCardProps {
  name: string;
  icon: string;
  description: string;
  received: number;
  id: string;
  onEdit(): void;
  dragHandleProps?: DragProps;
  cardProps?: DragProps;
  dragging?: boolean;
}

export function IncomeCategoryCard({ id, name, icon, description, received, onEdit, dragHandleProps, cardProps, dragging }: IncomeCategoryCardProps) {
  return (
    <article className={[styles.card, dragging && styles.dragging].filter(Boolean).join(' ')} {...cardProps}>
      <div className={styles.cardTop}>
        <DragHandle handleProps={dragHandleProps} />
        <span className={[styles.cardIcon, styles.cardIconIncome].join(' ')}>
          <Icon name={icon} size={22} />
        </span>
        <div className={styles.cardTitle}>
          <div className={styles.cardName}>
            <h3>{name}</h3>
            <Badge tone="income">Receita</Badge>
          </div>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className={styles.cardNumbers}>
        <span>
          Recebido no mês <Money value={received} className={styles.good} />
        </span>
      </div>
      <div className={styles.cardActions}>
        <Link to={`/lancamentos?categoria=${encodeURIComponent(id)}`} className={styles.cardAction}>
          <Icon name="history" size={16} /> Ver histórico
        </Link>
        <button type="button" className={styles.cardAction} onClick={onEdit}>
          <Icon name="edit" size={16} /> Editar
        </button>
      </div>
    </article>
  );
}
