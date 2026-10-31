import { useSelectedMonth } from '@/store/SelectedMonth';
import { formatMonthLabel } from '@/utils/dates';
import { Icon } from './Icon';
import styles from './MonthSwitcher.module.css';

/** Seletor de mês compartilhado (Visão Geral, Categorias, Relatórios). */
export function MonthSwitcher() {
  const { month, maxMonth, isFuture, previous, next } = useSelectedMonth();
  return (
    <div className={styles.switcher}>
      <button type="button" className={styles.arrow} aria-label="Mês anterior" onClick={previous}>
        <Icon name="chevron_left" size={18} />
      </button>
      <span className={styles.label} aria-live="polite">
        {formatMonthLabel(month)}
        {isFuture && <span className={styles.future}>Mês futuro</span>}
      </span>
      <button
        type="button"
        className={styles.arrow}
        aria-label="Próximo mês"
        onClick={next}
        disabled={month >= maxMonth}
      >
        <Icon name="chevron_right" size={18} />
      </button>
    </div>
  );
}
