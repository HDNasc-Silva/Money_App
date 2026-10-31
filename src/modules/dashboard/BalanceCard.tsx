import { Icon } from '@/components/common/Icon';
import { HIDDEN_VALUE } from '@/components/common/Money';
import type { Cents } from '@/models';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { formatPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import styles from './Dashboard.module.css';

interface BalanceCardProps {
  balance: Cents;
  monthBalance: Cents;
  savingsRate: number;
  hasIncome: boolean;
  /** Mês futuro: o saldo é uma previsão para o fim do mês. */
  projected?: boolean;
}

export function BalanceCard({ balance, monthBalance, savingsRate, hasIncome, projected = false }: BalanceCardProps) {
  const { hideBalances } = useFinanceData().settings;
  const { updateSettings } = useFinanceActions();

  let insight: string;
  if (!hasIncome) insight = projected ? 'Nenhuma receita planejada para este mês' : 'Nenhuma receita registrada neste mês';
  else if (monthBalance < 0) insight = `Mês negativo em ${hideBalances ? HIDDEN_VALUE : formatCurrency(-monthBalance)}`;
  else insight = `Planejamento equilibrado com ${formatPercent(savingsRate)} guardado`;

  return (
    <section className={styles.hero} aria-label="Saldo">
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroTop}>
        <span className={styles.heroLabel}>
          <span className={styles.heroDot} aria-hidden="true" />
          {projected ? 'Saldo previsto ao fim do mês' : 'Saldo atual disponível'}
        </span>
        <button
          type="button"
          className={styles.heroToggle}
          aria-label={hideBalances ? 'Exibir valores' : 'Ocultar valores'}
          aria-pressed={hideBalances}
          onClick={() => updateSettings({ hideBalances: !hideBalances })}
        >
          <Icon name={hideBalances ? 'visibility_off' : 'visibility'} size={19} />
        </button>
      </div>
      <div className={styles.heroValue}>
        <span className={styles.heroCurrency}>R$</span>
        <span className={['money', styles.heroAmount].join(' ')} data-testid="balance-value">
          {hideBalances ? HIDDEN_VALUE : formatCurrency(balance, { bare: true })}
        </span>
      </div>
      <div className={styles.heroInsight}>
        <Icon name={monthBalance < 0 ? 'error' : 'verified'} size={16} />
        <span>{insight}</span>
      </div>
    </section>
  );
}
