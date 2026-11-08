import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Money } from '@/components/common/Money';
import { Page } from '@/components/layout/Page';
import { loanTotals, sortLoans } from '@/domain/loans';
import type { Loan } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { LoanFormSheet } from './LoanForm';
import { LoanItem } from './LoanItem';
import styles from './Loans.module.css';

/**
 * Agiotagem (DT-026): registro de empréstimos a terceiros. Registrar NÃO debita o saldo; cada
 * parcela (ou o pagamento único) vira uma receita automaticamente quando o mês esperado chega.
 */
export function LoansPage() {
  const { loans, transactions } = useFinanceData();
  const [editing, setEditing] = useState<{ key: number; loan: Loan | null } | null>(null);

  const sorted = useMemo(() => sortLoans(loans, transactions), [loans, transactions]);
  const pendingTotal = useMemo(
    () => loans.reduce((sum, loan) => sum + loanTotals(loan, transactions).pending, 0),
    [loans, transactions],
  );
  const open = (loan: Loan | null) => setEditing({ key: Date.now(), loan });

  return (
    <Page title="Agiotagem" description="Empréstimos informais a terceiros: o saldo não é debitado ao registrar; cada pagamento esperado vira receita no mês certo.">
      <Card>
        <div className={styles.summary}>
          <div className={styles.summaryMain}>
            <span className={styles.overline}>Total a receber</span>
            <Money value={pendingTotal} className={styles.summaryValue} />
            <span className={styles.muted}>
              {loans.length === 1 ? '1 empréstimo registrado' : `${loans.length} empréstimos registrados`}
            </span>
          </div>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState
          icon="theater_comedy"
          title="Nenhum empréstimo registrado"
          description="Registre quem pegou dinheiro com você e quando espera receber de volta — em uma vez ou parcelado."
          action={
            <Button size="sm" icon="add" onClick={() => open(null)}>
              Registrar empréstimo
            </Button>
          }
        />
      ) : (
        <ul className={styles.list} aria-label="Empréstimos">
          {sorted.map((loan) => (
            <LoanItem key={loan.id} loan={loan} transactions={transactions} onEdit={() => open(loan)} />
          ))}
        </ul>
      )}

      {sorted.length > 0 && (
        <Button icon="add_circle" fullWidth onClick={() => open(null)}>
          Novo empréstimo
        </Button>
      )}

      {editing && <LoanFormSheet key={editing.key} loan={editing.loan} onClose={() => setEditing(null)} />}
    </Page>
  );
}
