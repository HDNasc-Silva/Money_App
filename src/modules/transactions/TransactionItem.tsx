import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { signedAmount } from '@/domain/transactions';
import type { Category, Transaction } from '@/models';
import styles from './Transactions.module.css';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  onOpenActions(transaction: Transaction): void;
}

export function TransactionItem({ transaction, category, onOpenActions }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  return (
    <li className={styles.item}>
      <span className={[styles.itemIcon, isIncome ? styles.iconIncome : styles.iconExpense].join(' ')}>
        <Icon name={category?.icon ?? 'help_outline'} size={20} />
      </span>
      <div className={styles.itemText}>
        <span className={styles.itemTitle}>{transaction.description}</span>
        <span className={styles.itemMeta}>
          {transaction.subscriptionId && (
            <span className={styles.itemTag} title="Gerado automaticamente por uma assinatura">
              <Icon name="autorenew" size={12} />
              Assinatura
            </span>
          )}
          {transaction.installmentGroupId && (
            <span className={styles.itemTag} title="Parcela de uma compra parcelada">
              <Icon name="calendar_month" size={12} />
              Parcela {transaction.installmentIndex}/{transaction.installmentTotal}
            </span>
          )}
          {transaction.loanId && (
            <span className={styles.itemTag} title="Pagamento de empréstimo (Agiotagem)">
              <Icon name="theater_comedy" size={12} />
              Empréstimo
            </span>
          )}
          {category?.name ?? 'Sem categoria'}
          {transaction.note && <span className={styles.itemNote}> · {transaction.note}</span>}
        </span>
      </div>
      <Money
        value={signedAmount(transaction)}
        signed
        className={[styles.itemAmount, isIncome && styles.amountIncome].filter(Boolean).join(' ')}
      />
      <button
        type="button"
        className={styles.itemMenu}
        aria-label={`Ações do lançamento ${transaction.description}`}
        onClick={() => onOpenActions(transaction)}
      >
        <Icon name="more_vert" size={20} />
      </button>
    </li>
  );
}
