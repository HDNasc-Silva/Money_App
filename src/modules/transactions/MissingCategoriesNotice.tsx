import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import type { TransactionType } from '@/models';
import styles from './Transactions.module.css';

const KIND_LABELS: Record<TransactionType, string> = {
  expense: 'despesa',
  income: 'receita',
};

interface MissingCategoriesNoticeProps {
  type: TransactionType;
  busy: boolean;
  onCreateDefaults(): void;
  /** Chamado antes de navegar para Categorias (fecha o formulário). */
  onCustomize(): void;
}

/** Saída para quando não há categoria do tipo escolhido: sem ela não é possível lançar. */
export function MissingCategoriesNotice({ type, busy, onCreateDefaults, onCustomize }: MissingCategoriesNoticeProps) {
  return (
    <div className={styles.missingCategories} role="status">
      <p className={styles.missingCategoriesText}>
        <Icon name="info" size={18} />
        <span>
          Você ainda não tem categorias de {KIND_LABELS[type]}. Crie as categorias padrão para continuar ou cadastre uma
          personalizada.
        </span>
      </p>
      <div className={styles.missingCategoriesActions}>
        <Button variant="secondary" size="sm" icon="add" onClick={onCreateDefaults} disabled={busy}>
          Criar categorias padrão
        </Button>
        <Link to="/categorias" className={styles.missingCategoriesLink} onClick={onCustomize}>
          Criar categoria personalizada
        </Link>
      </div>
    </div>
  );
}
