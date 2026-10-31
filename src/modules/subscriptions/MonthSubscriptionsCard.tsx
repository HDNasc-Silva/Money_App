import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { monthSubscriptionCharges, summarizeCharges } from '@/domain/subscriptions';
import type { MonthKey } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { formatDateBr, todayIso } from '@/utils/dates';
import styles from './Subscriptions.module.css';

/** Bloco "Assinaturas do mês" da aba Gastos: cobranças lançadas e previstas do mês selecionado. */
export function MonthSubscriptionsCard({ month }: { month: MonthKey }) {
  const { subscriptions, transactions } = useFinanceData();
  const today = todayIso();
  const charges = useMemo(
    () => monthSubscriptionCharges(subscriptions, transactions, month, today),
    [subscriptions, transactions, month, today],
  );
  const totals = summarizeCharges(charges);

  return (
    <Card aria-label="Assinaturas do mês">
      <CardHeader
        title="Assinaturas do mês"
        subtitle={charges.length === 1 ? '1 cobrança' : `${charges.length} cobranças`}
        action={
          <Link to="/assinaturas" className={styles.manageLink}>
            Gerenciar
            <Icon name="chevron_right" size={18} />
          </Link>
        }
      />
      {charges.length === 0 ? (
        <p className={styles.muted}>
          Nenhuma assinatura cobrada neste mês.{' '}
          {subscriptions.length === 0 && (
            <Link to="/assinaturas" className={styles.inlineLink}>
              Cadastrar assinaturas
            </Link>
          )}
        </p>
      ) : (
        <>
          <ul className={styles.chargeList}>
            {charges.map((c) => (
              <li key={c.key} className={styles.charge}>
                <span className={styles.chargeIcon}>
                  <Icon name={c.icon} size={18} />
                </span>
                <div className={styles.chargeText}>
                  <span className={styles.chargeName}>{c.name}</span>
                  <span className={styles.chargeDate}>
                    {formatDateBr(c.date)}
                    <Badge tone={c.status === 'launched' ? 'income' : 'neutral'} icon={c.status === 'launched' ? 'check' : 'schedule'}>
                      {c.status === 'launched' ? 'Lançada' : 'Prevista'}
                    </Badge>
                  </span>
                </div>
                <Money value={c.amount} className={styles.chargeAmount} />
              </li>
            ))}
          </ul>
          <div className={styles.chargeTotal}>
            <span>
              Total do mês
              {totals.forecast > 0 && totals.launched > 0 && (
                <small className={styles.muted}>
                  {' '}
                  (<Money value={totals.launched} /> lançado · <Money value={totals.forecast} /> previsto)
                </small>
              )}
            </span>
            <Money value={totals.total} className={styles.chargeTotalValue} />
          </div>
        </>
      )}
    </Card>
  );
}
