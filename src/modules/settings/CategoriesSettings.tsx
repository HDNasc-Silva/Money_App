import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { useToast } from '@/components/common/Toast';
import type { Category, TransactionType } from '@/models';
import { CategoryFormSheet, GROUP_LABELS } from '@/modules/categories/CategoryForm';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import styles from './Settings.module.css';

const SECTIONS: { kind: TransactionType; title: string }[] = [
  { kind: 'expense', title: 'Despesas' },
  { kind: 'income', title: 'Receitas' },
];

function CategoryRow({ category, onEdit }: { category: Category; onEdit(): void }) {
  return (
    <li>
      <button type="button" className={styles.categoryRow} onClick={onEdit} aria-label={`Editar categoria ${category.name}`}>
        <span className={category.kind === 'income' ? styles.categoryIconIncome : styles.categoryIcon}>
          <Icon name={category.icon} size={20} />
        </span>
        <span className={styles.categoryText}>
          <strong>{category.name}</strong>
          <small>
            {GROUP_LABELS[category.group]}
            {category.kind === 'expense' && (
              <>
                {' · '}
                {category.monthlyLimit ? (
                  <>
                    Teto <Money value={category.monthlyLimit} />
                  </>
                ) : (
                  'Sem teto'
                )}
              </>
            )}
          </small>
        </span>
        <Icon name="chevron_right" size={20} className={styles.categoryChevron} />
      </button>
    </li>
  );
}

/** Gerenciamento de categorias em Ajustes: lista compacta, criar/editar e restaurar as padrão. */
export function CategoriesSettings() {
  const { categories } = useFinanceData();
  const { ensureDefaultCategories } = useFinanceActions();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<{ key: number; category: Category | null } | null>(null);
  const [restoring, setRestoring] = useState(false);

  // A ordem segue a definida pelo usuário em Categorias (arrastar e soltar, DT-025), não alfabética.
  const sections = useMemo(
    () => SECTIONS.map((section) => ({ ...section, items: categories.filter((c) => c.kind === section.kind) })),
    [categories],
  );

  const open = (category: Category | null) => setEditing({ key: Date.now(), category });

  const restoreDefaults = async () => {
    setRestoring(true);
    const added = await ensureDefaultCategories();
    setRestoring(false);
    showToast({
      message: added.length
        ? `${added.length} categoria(s) padrão restaurada(s).`
        : 'Nenhuma categoria padrão estava faltando.',
    });
  };

  return (
    <Card>
      <CardHeader title="Categorias" subtitle="Crie, edite e escolha ícones; os lançamentos usam estas categorias." />
      {sections.map((section) => (
        <section key={section.kind} className={styles.categorySection} aria-label={`Categorias de ${section.title.toLowerCase()}`}>
          <h3 className={styles.categorySectionTitle}>
            {section.title} <span>({section.items.length})</span>
          </h3>
          {section.items.length > 0 ? (
            <ul className={styles.categoryList}>
              {section.items.map((category) => (
                <CategoryRow key={category.id} category={category} onEdit={() => open(category)} />
              ))}
            </ul>
          ) : (
            <p className={styles.categoryEmpty}>Nenhuma categoria de {section.title.toLowerCase()}.</p>
          )}
        </section>
      ))}
      <div className={styles.buttons}>
        <Button icon="add_circle" onClick={() => open(null)}>
          Nova categoria
        </Button>
        <Button variant="secondary" icon="restart_alt" onClick={restoreDefaults} disabled={restoring}>
          Restaurar categorias padrão
        </Button>
      </div>
      {editing && <CategoryFormSheet key={editing.key} category={editing.category} onClose={() => setEditing(null)} />}
    </Card>
  );
}
