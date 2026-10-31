import { useState } from 'react';
import { AlertCard } from '@/components/common/AlertCard';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/common/Icon';
import type { FinanceAlert } from '@/domain/alerts';
import styles from './Dashboard.module.css';

/** Alertas visíveis antes de "Ver todos". */
export const VISIBLE_ALERTS = 2;

/** Alertas do mês em formato compacto: no máximo dois visíveis; o restante fica recolhido. */
export function AlertsSummary({ alerts }: { alerts: readonly FinanceAlert[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? alerts : alerts.slice(0, VISIBLE_ALERTS);
  const hiddenCount = alerts.length - visible.length;

  return (
    <section className={styles.alerts} aria-labelledby="alerts-title">
      <div className={styles.sectionHeader}>
        <h2 id="alerts-title" className={styles.sectionTitle}>
          <Icon name="lightbulb" size={18} />
          Alertas do mês
        </h2>
        {alerts.length > 0 && <Badge>{alerts.length === 1 ? '1 ativo' : `${alerts.length} ativos`}</Badge>}
      </div>
      {alerts.length === 0 ? (
        <AlertCard tone="success" icon="check_circle" title="Tudo em ordem" compact>
          Nenhum limite estourado e nenhum alerta para este mês.
        </AlertCard>
      ) : (
        <>
          {visible.map((alert) => (
            <AlertCard key={alert.id} tone={alert.tone} icon={alert.icon} title={alert.title} to={alert.to} compact>
              {alert.message}
            </AlertCard>
          ))}
          {alerts.length > VISIBLE_ALERTS && (
            <button type="button" className={styles.moreButton} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Mostrar menos' : `Ver todos (+${hiddenCount})`}
              <Icon name={expanded ? 'expand_less' : 'expand_more'} size={18} />
            </button>
          )}
        </>
      )}
    </section>
  );
}
