import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { signedAmount } from '@/domain/transactions';
import type { Category, Transaction } from '@/models';
import { useTransactionEditor } from '@/modules/transactions/TransactionEditor';
import { formatDayMonth } from '@/utils/dates';
import styles from './Dashboard.module.css';

interface RecentTransactionsCardProps {
  transactions: readonly Transaction[];
  categories: readonly Category[];
}

/** "Últimos lançamentos" do mês selecionado; tocar num item abre a edição. */
export function RecentTransactionsCard({ transactions, categories }: RecentTransactionsCardProps) {
  const { openNew, openEdit } = useTransactionEditor();
  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <Card padding="md" aria-label="Últimos lançamentos" className="enter">
      <CardHeader
        title="Últimos lançamentos"
        action={
          <Link to="/lancamentos" className={styles.textLink}>
            Ver extrato
          </Link>
        }
      />
      {transactions.length === 0 ? (
        <div className={styles.blockEmptyAction}>
          <p className={styles.blockEmpty}>Nenhum lançamento neste mês ainda. Que tal registrar o primeiro gasto?</p>
          <Button size="sm" icon="add" onClick={() => openNew()}>
            Registrar lançamento
          </Button>
        </div>
      ) : (
        <ul className={styles.rows}>
          {transactions.map((t) => {
            const category = byId.get(t.categoryId);
            const isIncome = t.type === 'income';
            return (
              <li key={t.id}>
                <button type="button" className={[styles.row, styles.rowButton].join(' ')} onClick={() => openEdit(t)} aria-label={`Editar lançamento ${t.description}`}>
                  <span className={[styles.rowIcon, isIncome && styles.rowIconIncome].filter(Boolean).join(' ')}>
                    <Icon name={category?.icon ?? 'help_outline'} size={18} />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{t.description}</span>
                    <span className={styles.rowMeta}>
                      {formatDayMonth(t.date)} · {category?.name ?? 'Sem categoria'}
                    </span>
                  </span>
                  <Money value={signedAmount(t)} signed className={[styles.rowAmount, isIncome && styles.positive].filter(Boolean).join(' ')} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
