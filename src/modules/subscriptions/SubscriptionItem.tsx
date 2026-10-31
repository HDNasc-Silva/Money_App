import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { nextChargeDate, subscriptionStatus } from '@/domain/subscriptions';
import type { IsoDate, Subscription } from '@/models';
import { formatDateBr } from '@/utils/dates';
import { STATUS_BADGES } from './subscriptionPresentation';
import styles from './Subscriptions.module.css';

interface SubscriptionItemProps {
  subscription: Subscription;
  today: IsoDate;
  onEdit(): void;
  onToggleActive(): void;
}

export function SubscriptionItem({ subscription, today, onEdit, onToggleActive }: SubscriptionItemProps) {
  const status = subscriptionStatus(subscription, today);
  const badge = STATUS_BADGES[status];
  const next = nextChargeDate(subscription, today);

  return (
    <li className={[styles.item, status !== 'active' && styles.itemInactive].filter(Boolean).join(' ')}>
      <div className={styles.itemTop}>
        <span className={styles.itemIcon}>
          <Icon name={subscription.icon} size={22} />
        </span>
        <div className={styles.itemText}>
          <h3 className={styles.itemName}>{subscription.name}</h3>
          <span className={styles.itemMeta}>
            Dia {subscription.billingDay}
            {next ? ` · Próxima: ${formatDateBr(next)}` : ''}
          </span>
        </div>
        <div className={styles.itemAside}>
          <Money value={subscription.amount} className={styles.itemAmount} />
          <span className={styles.itemPer}>/mês</span>
        </div>
      </div>
      <div className={styles.itemFooter}>
        <Badge tone={badge.tone} icon={badge.icon}>
          {badge.label}
        </Badge>
        <div className={styles.itemActions}>
          {status !== 'ended' && (
            <Button
              variant="ghost"
              size="sm"
              icon={subscription.active ? 'pause' : 'play_arrow'}
              aria-label={`${subscription.active ? 'Pausar' : 'Retomar'} ${subscription.name}`}
              onClick={onToggleActive}
            >
              {subscription.active ? 'Pausar' : 'Retomar'}
            </Button>
          )}
          <Button variant="secondary" size="sm" icon="edit" aria-label={`Editar ${subscription.name}`} onClick={onEdit}>
            Editar
          </Button>
        </div>
      </div>
    </li>
  );
}
