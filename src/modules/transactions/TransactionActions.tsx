import { useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Icon } from '@/components/common/Icon';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import type { Transaction } from '@/models';
import { useFinanceActions } from '@/store/FinanceProvider';
import { formatDateBr } from '@/utils/dates';
import { formatCurrency } from '@/utils/money';
import { useTransactionEditor } from './TransactionEditor';
import styles from './Transactions.module.css';

interface TransactionActionsProps {
  transaction: Transaction | null;
  onClose(): void;
}

/** Bottom sheet de ações do lançamento: editar, duplicar e excluir (com confirmação). */
export function TransactionActions({ transaction, onClose }: TransactionActionsProps) {
  const { duplicateTransaction, deleteTransaction } = useFinanceActions();
  const { openEdit } = useTransactionEditor();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);

  if (!transaction) return null;

  const edit = () => {
    onClose();
    openEdit(transaction);
  };

  const duplicate = async () => {
    await duplicateTransaction(transaction.id);
    showToast({ message: 'Lançamento duplicado com a data de hoje.' });
    onClose();
  };

  const remove = async () => {
    await deleteTransaction(transaction.id);
    setConfirming(false);
    showToast({ message: 'Lançamento excluído.' });
    onClose();
  };

  return (
    <>
      <Sheet
        open={!confirming}
        title="Opções do lançamento"
        subtitle={`${transaction.description} · ${formatCurrency(transaction.amount)} · ${formatDateBr(transaction.date)}`}
        onClose={onClose}
      >
        <div className={styles.actionList}>
          <button type="button" className={styles.actionButton} onClick={edit}>
            <Icon name="edit" />
            <span>
              <strong>Editar informações</strong>
              <small>Alterar valor, categoria ou data</small>
            </span>
          </button>
          <button type="button" className={styles.actionButton} onClick={duplicate}>
            <Icon name="content_copy" />
            <span>
              <strong>Duplicar lançamento</strong>
              <small>Criar uma cópia com a data de hoje</small>
            </span>
          </button>
          <button type="button" className={[styles.actionButton, styles.actionDanger].join(' ')} onClick={() => setConfirming(true)}>
            <Icon name="delete" />
            <span>
              <strong>Excluir lançamento</strong>
              <small>Remover permanentemente do extrato</small>
            </span>
          </button>
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Excluir lançamento?"
        message={`"${transaction.description}" será removido e todos os indicadores serão recalculados.${
          transaction.subscriptionId ? ' Esta cobrança de assinatura não será lançada de novo neste mês.' : ''
        }`}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
