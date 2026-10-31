import { Icon } from '@/components/common/Icon';
import { HIDDEN_VALUE } from '@/components/common/Money';
import type { Cents } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { formatCurrency } from '@/utils/money';
import styles from './Dashboard.module.css';

interface ProjectedBalanceCardProps {
  /** Receitas conhecidas − despesas já lançadas − assinaturas que ainda vão descontar até o fim do mês. */
  value: Cents;
}

/**
 * Projeção simples do saldo até o fim do mês atual (regra de negócio nova, v1.9.0): receitas e
 * despesas já lançadas no mês, descontadas as cobranças de assinaturas ainda não lançadas até o
 * fim do mês. Só aparece no mês corrente (meses passados/futuros já têm o próprio "saldo previsto").
 */
export function ProjectedBalanceCard({ value }: ProjectedBalanceCardProps) {
  const { hideBalances } = useFinanceData().settings;
  const money = hideBalances ? HIDDEN_VALUE : formatCurrency(value, { signed: true });

  return (
    <section className={styles.note} aria-label="Saldo projetado até o fim do mês">
      <Icon name="insights" size={24} />
      <div>
        <strong>Saldo projetado até o fim do mês</strong>
        <p>
          Considerando o que já entrou, já saiu e as assinaturas que ainda vão descontar: {' '}
          <span className={['money', value < 0 ? styles.negative : styles.positive].join(' ')}>{money}</span>
        </p>
      </div>
    </section>
  );
}
