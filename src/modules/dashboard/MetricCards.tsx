import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import type { PeriodSummary } from '@/domain/summary';
import type { Cents } from '@/models';
import { formatSignedPercent } from '@/utils/format';
import styles from './Dashboard.module.css';

interface MetricCardsProps {
  summary: PeriodSummary;
  incomeChange: number | null;
  expenseChange: number | null;
  /** Total aportado em metas no mês (a "poupança" do mês). */
  saved: Cents;
  savedChange: number | null;
}

interface DeltaProps {
  change: number | null;
  /** `true` quando subir é bom (receitas, poupança); `false` quando é ruim (despesas). */
  upIsGood: boolean;
  title: string;
}

/** Variação discreta: seta colorida pelo significado (bom/ruim) e o percentual em tom neutro. */
function Delta({ change, upIsGood, title }: DeltaProps) {
  if (change === null) {
    return (
      <span className={styles.delta} title="Sem valores no mês anterior para comparar">
        —
      </span>
    );
  }
  const good = change === 0 ? null : change > 0 === upIsGood;
  const arrow = change > 0 ? 'arrow_upward' : change < 0 ? 'arrow_downward' : 'remove';
  return (
    <span className={styles.delta} title={title}>
      <Icon name={arrow} size={14} className={good === null ? undefined : good ? styles.positive : styles.negative} />
      {formatSignedPercent(change)}
    </span>
  );
}

export function MetricCards({ summary, incomeChange, expenseChange, saved, savedChange }: MetricCardsProps) {
  return (
    <section className={styles.metricsBlock} aria-label="Resumo do mês">
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>
            <span className={[styles.metricDot, styles.dotIncome].join(' ')} aria-hidden="true" />
            Receitas
          </span>
          <Money value={summary.income} compact className={styles.metricValue} />
          <Delta change={incomeChange} upIsGood title="Variação das receitas em relação ao mês anterior" />
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>
            <span className={[styles.metricDot, styles.dotExpense].join(' ')} aria-hidden="true" />
            Despesas
          </span>
          <Money value={summary.expense} compact className={styles.metricValue} />
          <Delta change={expenseChange} upIsGood={false} title="Variação das despesas em relação ao mês anterior" />
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel} title="Total aportado em metas no mês">
            <span className={[styles.metricDot, styles.dotSaved].join(' ')} aria-hidden="true" />
            Poupança
          </span>
          <Money value={saved} compact className={styles.metricValue} />
          <Delta change={savedChange} upIsGood title="Variação dos aportes em metas em relação ao mês anterior" />
        </div>
      </div>
      <p className={styles.metricsNote}>Variação vs mês anterior</p>
    </section>
  );
}
