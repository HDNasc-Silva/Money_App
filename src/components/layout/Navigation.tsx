import { NavLink } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { useTransactionEditor } from '@/modules/transactions/TransactionEditor';
import { NAV_ITEMS, SETTINGS_ITEM } from './navItems';
import styles from './Navigation.module.css';

const linkClass = ({ isActive }: { isActive: boolean }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ');

/** Barra inferior (mobile/tablet). */
export function BottomNav() {
  return (
    <nav className={styles.bottom} aria-label="Navegação principal">
      <div className={styles.bottomInner}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size={22} filled={isActive} />
                <span className={styles.bottomLabel}>{item.shortLabel}</span>
                <span className={styles.indicator} aria-hidden="true" />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Navegação lateral (desktop ≥ 1024 px). */
export function SideNav() {
  const { openNew } = useTransactionEditor();
  return (
    <nav className={styles.side} aria-label="Navegação principal">
      <div className={styles.sideBrand}>
        <span className={styles.sideLogo}>
          <Icon name="account_balance_wallet" size={20} />
        </span>
        <span className={styles.sideName}>Money App</span>
      </div>
      <button type="button" className={styles.sideAction} onClick={() => openNew()}>
        <Icon name="add_circle" size={20} />
        Novo Lançamento
      </button>
      <div className={styles.sideLinks}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size={20} filled={isActive} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <NavLink to={SETTINGS_ITEM.to} className={linkClass}>
        {({ isActive }) => (
          <>
            <Icon name={SETTINGS_ITEM.icon} size={20} filled={isActive} />
            <span>{SETTINGS_ITEM.label}</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
