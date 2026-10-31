import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import type { PeriodSummary } from '@/domain/summary';
import type { Cents } from '@/models';
import { formatPercent, formatSignedPercent } from '@/utils/format';
import styles from './Dashboard.module.css';

interface MetricCardsProps {
  summary: PeriodSummary;
  incomeChange: number | null;
  /** Total aportado em metas no mês (a "poupança" do mês). */
  saved: Cents;
  savedChange: number | null;
}

export function MetricCards({ summary, incomeChange, saved, savedChange }: MetricCardsProps) {
  const expenseShare = summary.income > 0 ? summary.expense / summary.income : null;
  return (
    <section className={styles.metrics} aria-label="Resumo do mês">
      <div className={styles.metric}>
        <div className={styles.metricTop}>
          <span className={[styles.metricIcon, styles.metricIncome].join(' ')}>
            <Icon name="arrow_downward" size={16} />
          </span>
          {incomeChange !== null && (
            <span className={incomeChange >= 0 ? styles.positive : styles.negative} title="Variação em relação ao mês anterior">
              {formatSignedPercent(incomeChange)}
            </span>
          )}
        </div>
        <span className={styles.metricLabel}>Receitas</span>
        <Money value={summary.income} compact className={styles.metricValue} />
      </div>

      <div className={styles.metric}>
        <div className={styles.metricTop}>
          <span className={[styles.metricIcon, styles.metricExpense].join(' ')}>
            <Icon name="arrow_upward" size={16} />
          </span>
          {expenseShare !== null && (
            <span className={styles.negative} title="Despesas em relação às receitas">
              {formatPercent(expenseShare)}
            </span>
          )}
        </div>
        <span className={styles.metricLabel}>Despesas</span>
        <Money value={summary.expense} compact className={styles.metricValue} />
      </div>

      <div className={styles.metric}>
        <div className={styles.metricTop}>
          <span className={styles.metricIcon}>
            <Icon name="savings" size={16} />
          </span>
          {savedChange !== null && (
            <span className={savedChange >= 0 ? styles.positive : styles.negative} title="Variação dos aportes em metas em relação ao mês anterior">
              {formatSignedPercent(savedChange)}
            </span>
          )}
        </div>
        <span className={styles.metricLabel} title="Total aportado em metas no mês">
          Poupança
        </span>
        <Money value={saved} compact className={[styles.metricValue, styles.positive].join(' ')} />
      </div>
    </section>
  );
}
