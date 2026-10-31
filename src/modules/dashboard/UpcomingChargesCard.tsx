import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import type { MonthCharge } from '@/domain/subscriptions';
import type { Cents } from '@/models';
import { formatDayMonth } from '@/utils/dates';
import styles from './Dashboard.module.css';

interface UpcomingChargesCardProps {
  charges: readonly MonthCharge[];
  total: Cents;
  hasSubscriptions: boolean;
  /** Mês já encerrado: não há o que "ainda vai sair". */
  past: boolean;
}

/** "Próximas cobranças": assinaturas previstas até o fim do mês selecionado, com o total. */
export function UpcomingChargesCard({ charges, total, hasSubscriptions, past }: UpcomingChargesCardProps) {
  if (past && charges.length === 0) return null;
  return (
    <Card padding="md" aria-label="Próximas cobranças" className="enter">
      <CardHeader
        title="Próximas cobranças"
        subtitle={charges.length > 0 ? 'O que ainda vai sair até o fim do mês' : undefined}
        action={
          hasSubscriptions ? (
            <Link to="/assinaturas" className={styles.textLink}>
              Assinaturas
            </Link>
          ) : undefined
        }
      />
      {charges.length === 0 ? (
        hasSubscriptions ? (
          <p className={styles.blockEmpty}>Nenhuma cobrança prevista até o fim do mês.</p>
        ) : (
          <Link to="/assinaturas" className={styles.invite}>
            <Icon name="subscriptions" size={20} />
            <span>
              <strong>Cadastre suas assinaturas</strong>
              <small>Streaming, música, nuvem… o app lança e avisa o que vai sair.</small>
            </span>
            <Icon name="chevron_right" size={20} />
          </Link>
        )
      ) : (
        <>
          <ul className={styles.rows}>
            {charges.map((charge) => (
              <li key={charge.key} className={styles.row}>
                <span className={styles.rowIcon}>
                  <Icon name={charge.icon} size={18} />
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>{charge.name}</span>
                  <span className={styles.rowMeta}>{formatDayMonth(charge.date)}</span>
                </span>
                <Money value={-charge.amount} className={styles.rowAmount} />
              </li>
            ))}
          </ul>
          <div className={styles.rowsTotal}>
            <span>Total previsto</span>
            <Money value={-total} className={styles.rowsTotalValue} />
          </div>
        </>
      )}
    </Card>
  );
}
