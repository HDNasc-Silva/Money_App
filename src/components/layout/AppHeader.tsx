import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCard } from '@/components/common/AlertCard';
import { IconButton } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Sheet } from '@/components/common/Sheet';
import { buildAlerts } from '@/domain/alerts';
import { useFinanceData } from '@/store/FinanceProvider';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { formatMonthLabel, todayIso } from '@/utils/dates';
import { initials } from '@/utils/format';
import styles from './AppHeader.module.css';
import { titleForPath } from './navItems';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader() {
  const { pathname } = useLocation();
  const { transactions, categories, goals, settings } = useFinanceData();
  const { month } = useSelectedMonth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const alerts = useMemo(
    () => buildAlerts({ transactions, categories, goals, month, today: todayIso() }),
    [transactions, categories, goals, month],
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Money App — Visão Geral">
          <span className={styles.logo}>
            <Icon name="account_balance_wallet" size={20} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Money App</span>
            <span className={styles.section}>{titleForPath(pathname)}</span>
          </span>
        </Link>
        <div className={styles.actions}>
          <ThemeToggle />
          <IconButton
            icon="notifications"
            label={alerts.length ? `Notificações (${alerts.length})` : 'Notificações'}
            badge={alerts.length > 0}
            onClick={() => setNotificationsOpen(true)}
          />
          <Link to="/ajustes" className={styles.avatar} aria-label="Ajustes e perfil" title="Ajustes">
            {initials(settings.userName) || <Icon name="person" size={18} />}
          </Link>
        </div>
      </div>

      <Sheet
        open={notificationsOpen}
        title="Notificações"
        subtitle={`Alertas de ${formatMonthLabel(month)}`}
        onClose={() => setNotificationsOpen(false)}
      >
        {alerts.length === 0 ? (
          <EmptyState icon="notifications_off" title="Nenhum alerta" description="Tudo dentro do planejado neste mês." />
        ) : (
          <div className={styles.alertList} onClick={() => setNotificationsOpen(false)}>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} tone={alert.tone} icon={alert.icon} title={alert.title} to={alert.to}>
                {alert.message}
              </AlertCard>
            ))}
          </div>
        )}
      </Sheet>
    </header>
  );
}
