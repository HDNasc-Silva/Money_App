import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import type { PeriodSummary } from '@/domain/summary';
import { formatPercent, formatSignedPercent } from '@/utils/format';
import styles from './Dashboard.module.css';

interface MetricCardsProps {
  summary: PeriodSummary;
  incomeChange: number | null;
}

export function MetricCards({ summary, incomeChange }: MetricCardsProps) {
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
          <span className={styles.positive} title="Taxa de poupança">
            {formatPercent(summary.savingsRate)}
          </span>
        </div>
        <span className={styles.metricLabel}>Poupança</span>
        <Money value={summary.savings} compact className={[styles.metricValue, styles.positive].join(' ')} />
      </div>
    </section>
  );
}
