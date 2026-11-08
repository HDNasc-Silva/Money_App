import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { loanInstallments, loanStatus, loanTotals, type LoanStatus } from '@/domain/loans';
import type { Loan, Transaction } from '@/models';
import { formatDateBr } from '@/utils/dates';
import styles from './Loans.module.css';

const STATUS_BADGES: Record<LoanStatus, { label: string; tone: 'income' | 'warning' | 'neutral' }> = {
  pending: { label: 'A receber', tone: 'warning' },
  partial: { label: 'Parcialmente recebido', tone: 'warning' },
  settled: { label: 'Recebido', tone: 'income' },
};

interface LoanItemProps {
  loan: Loan;
  transactions: readonly Transaction[];
  onEdit(): void;
}

export function LoanItem({ loan, transactions, onEdit }: LoanItemProps) {
  const status = loanStatus(loan, transactions);
  const badge = STATUS_BADGES[status];
  const installments = loanInstallments(loan, transactions);
  const totals = loanTotals(loan, transactions);

  return (
    <li className={styles.item}>
      <div className={styles.itemTop}>
        <span className={styles.itemIcon}>
          <Icon name="theater_comedy" size={22} />
        </span>
        <div className={styles.itemText}>
          <h3 className={styles.itemName}>{loan.borrower}</h3>
          <span className={styles.itemMeta}>
            Emprestado em {formatDateBr(loan.loanDate)} ·{' '}
            {loan.installmentTotal > 1 ? `${loan.installmentTotal} parcelas` : 'Pagamento único'}
          </span>
        </div>
        <div className={styles.itemAside}>
          <Money value={loan.amount} className={styles.itemAmount} />
          {loan.installmentTotal > 1 && <span className={styles.muted}>/parcela</span>}
        </div>
      </div>
      {installments.length > 1 && (
        <ul className={styles.installments} aria-label={`Parcelas de ${loan.borrower}`}>
          {installments.map((installment) => (
            <li
              key={installment.month}
              className={[styles.installment, installment.status === 'received' && styles.installmentReceived].filter(Boolean).join(' ')}
            >
              {installment.index}/{loan.installmentTotal} · {formatDateBr(installment.date)}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.itemFooter}>
        <Badge tone={badge.tone}>{badge.label}</Badge>
        {totals.pending > 0 && (
          <span className={styles.muted}>
            Falta receber: <Money value={totals.pending} />
          </span>
        )}
        <Button variant="secondary" size="sm" icon="edit" aria-label={`Editar empréstimo de ${loan.borrower}`} onClick={onEdit}>
          Editar
        </Button>
      </div>
    </li>
  );
}
