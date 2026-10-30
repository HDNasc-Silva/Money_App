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
