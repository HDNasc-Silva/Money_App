import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Money } from '@/components/common/Money';
import { useToast } from '@/components/common/Toast';
import { Page } from '@/components/layout/Page';
import { sortSubscriptions, subscriptionTotals } from '@/domain/subscriptions';
import type { Subscription } from '@/models';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { todayIso } from '@/utils/dates';
import { SubscriptionFormSheet } from './SubscriptionForm';
import { SubscriptionItem } from './SubscriptionItem';
import styles from './Subscriptions.module.css';

export function SubscriptionsPage() {
  const { subscriptions } = useFinanceData();
  const { setSubscriptionActive } = useFinanceActions();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<{ key: number; subscription: Subscription | null } | null>(null);
  const today = todayIso();

  const sorted = useMemo(() => sortSubscriptions(subscriptions, today), [subscriptions, today]);
  const totals = useMemo(() => subscriptionTotals(subscriptions, today), [subscriptions, today]);
  const open = (subscription: Subscription | null) => setEditing({ key: Date.now(), subscription });

  const toggle = async (subscription: Subscription) => {
    await setSubscriptionActive(subscription.id, !subscription.active);
    showToast({ message: subscription.active ? `${subscription.name} pausada.` : `${subscription.name} retomada.` });
  };

  return (
    <Page title="Assinaturas" description="Cobranças mensais lançadas automaticamente no dia de cobrança.">
      <Card>
        <div className={styles.summary}>
          <div className={styles.summaryMain}>
            <span className={styles.overline}>Total mensal</span>
            <Money value={totals.monthly} className={styles.summaryValue} />
            <span className={styles.muted}>
              {totals.activeCount === 1 ? '1 assinatura ativa' : `${totals.activeCount} assinaturas ativas`}
            </span>
          </div>
          <div className={styles.summaryAside}>
            <span className={styles.overline}>Estimativa anual</span>
            <Money value={totals.yearly} className={styles.summaryYearly} />
          </div>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState
          icon="subscriptions"
          title="Nenhuma assinatura cadastrada"
          description="Cadastre Netflix, Spotify, Claude e outras cobranças mensais. Elas aparecem em Gastos e são lançadas no Extrato no dia da cobrança."
          action={
            <Button size="sm" icon="add" onClick={() => open(null)}>
              Adicionar assinatura
            </Button>
          }
        />
      ) : (
        <ul className={styles.list} aria-label="Assinaturas">
          {sorted.map((s) => (
            <SubscriptionItem key={s.id} subscription={s} today={today} onEdit={() => open(s)} onToggleActive={() => void toggle(s)} />
          ))}
        </ul>
      )}

      {sorted.length > 0 && (
        <Button icon="add_circle" fullWidth onClick={() => open(null)}>
          Nova assinatura
        </Button>
      )}

      {editing && <SubscriptionFormSheet key={editing.key} subscription={editing.subscription} onClose={() => setEditing(null)} />}
    </Page>
  );
}
