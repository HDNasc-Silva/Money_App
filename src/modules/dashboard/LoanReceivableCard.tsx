import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import type { Cents } from '@/models';
import styles from './Dashboard.module.css';

interface LoanReceivableCardProps {
  /** Soma das parcelas de empréstimos esperadas no mês selecionado (Agiotagem, DT-026). */
  amount: Cents;
}

/** Indicador discreto perto do saldo: só aparece quando há algo a receber de empréstimos no mês. */
export function LoanReceivableCard({ amount }: LoanReceivableCardProps) {
  if (amount <= 0) return null;
  return (
    <div className={styles.note}>
      <Icon name="theater_comedy" size={24} />
      <div>
        <strong>Empréstimo a receber</strong>
        <p>
          <Money value={amount} alwaysVisible /> de empréstimo a receber esse mês.
        </p>
      </div>
    </div>
  );
}
