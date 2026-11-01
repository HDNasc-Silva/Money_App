import { useMemo, useState } from 'react';
import { AlertCard } from '@/components/common/AlertCard';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { MonthSwitcher } from '@/components/common/MonthSwitcher';
import { ProgressBar } from '@/components/common/ProgressBar';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useDragReorder } from '@/components/common/useDragReorder';
import { Page } from '@/components/layout/Page';
import { categoryBudgets, globalBudget, type CategoryBudget } from '@/domain/budgets';
import { monthPeriod } from '@/domain/periods';
import { filterByPeriod } from '@/domain/summary';
import type { Category } from '@/models';
import { MonthSubscriptionsCard } from '@/modules/subscriptions/MonthSubscriptionsCard';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { formatPercent } from '@/utils/format';
import styles from './Categories.module.css';
import { CategoryCard, IncomeCategoryCard } from './CategoryCard';
import { CategoryFormSheet } from './CategoryForm';

type Filter = 'all' | 'essential' | 'lifestyle' | 'income';

const budgetId = (b: CategoryBudget) => b.category.id;
const categoryId = (c: Category) => c.id;

export function CategoriesPage() {
  const { transactions, categories } = useFinanceData();
  const { reorderCategories, toggleCategoryAlerts } = useFinanceActions();
  const { month } = useSelectedMonth();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<{ key: number; category: Category | null } | null>(null);

  const budgets = useMemo(() => categoryBudgets(transactions, categories, month), [transactions, categories, month]);
  const global = useMemo(() => globalBudget(budgets), [budgets]);
  const incomeByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of filterByPeriod(transactions, monthPeriod(month))) {
      if (t.type === 'income') totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    }
    return totals;
  }, [transactions, month]);

  const exceeded = budgets.filter((b) => b.status === 'exceeded');
  // Sugere compensar na categoria de estilo de vida com maior folga.
  const compensation = budgets
    .filter((b) => b.category.group === 'lifestyle' && b.remaining !== null && b.remaining > 0)
    .sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0))[0];

  const expenseCount = budgets.length;
  const filterOptions: { value: Filter; label: string }[] = [
    { value: 'all', label: `Todas (${expenseCount})` },
    { value: 'essential', label: 'Essenciais' },
    { value: 'lifestyle', label: 'Estilo de Vida' },
    { value: 'income', label: 'Receitas' },
  ];

  const visibleBudgets = filter === 'income' ? [] : budgets.filter((b) => filter === 'all' || b.category.group === filter);
  const incomeCategories = filter === 'income' ? categories.filter((c) => c.kind === 'income') : [];
  const open = (category: Category | null) => setEditing({ key: Date.now(), category });

  // Arrastar e soltar para reordenar (DT-025): cada lista visível (despesas filtradas ou receitas)
  // tem seu próprio arraste; a nova ordem relativa é mesclada na ordem global das categorias.
  const expenseDrag = useDragReorder(visibleBudgets, budgetId, (ids) => void reorderCategories(ids));
  const incomeDrag = useDragReorder(incomeCategories, categoryId, (ids) => void reorderCategories(ids));

  return (
    <Page title="Categorias & Orçamentos" description="Defina tetos mensais e evite surpresas no fechamento." action={<MonthSwitcher />}>
      <Card>
        <div className={styles.globalTop}>
          <div>
            <span className={styles.overline}>Teto mensal global</span>
            <div className={styles.globalValues}>
              <Money value={global.spent} className={styles.globalSpent} />
              <span className={styles.muted}>
                / <Money value={global.limit} />
              </span>
            </div>
          </div>
          {global.ratio !== null && (
            <Badge tone={global.status === 'exceeded' ? 'expense' : 'income'} icon={global.status === 'exceeded' ? 'error' : 'check_circle'}>
              {formatPercent(global.ratio)} usado
            </Badge>
          )}
        </div>
        <ProgressBar value={global.ratio ?? 0} tone={global.status === 'exceeded' ? 'danger' : 'good'} label="Consumo do teto global" />
        <div className={styles.globalFooter}>
          <span>
            <Icon name="timelapse" size={16} /> {global.available >= 0 ? 'Disponível até o fechamento' : 'Excedido no mês'}
          </span>
          <Money value={Math.abs(global.available)} className={global.available >= 0 ? styles.good : styles.danger} />
        </div>
      </Card>

      {exceeded.length > 0 && (
        <AlertCard tone="danger" icon="warning" title="Alerta de Compensação">
          {exceeded.map((b) => b.category.name).join(', ')} {exceeded.length > 1 ? 'ultrapassaram' : 'ultrapassou'} o orçamento previsto.
          {compensation && ` Considere compensar reduzindo gastos em ${compensation.category.name} até o fechamento.`}
        </AlertCard>
      )}

      <MonthSubscriptionsCard month={month} />

      <div className={styles.toolbar}>
        <SegmentedControl variant="pills" label="Filtrar categorias" options={filterOptions} value={filter} onChange={setFilter} />
      </div>

      <div className={styles.cards} ref={expenseDrag.containerRef}>
        {expenseDrag.orderedItems.map((b) => (
          <CategoryCard
            key={b.category.id}
            budget={b}
            onEdit={() => open(b.category)}
            onToggleAlerts={() => void toggleCategoryAlerts(b.category.id)}
            cardProps={{ ...expenseDrag.getHandleProps(b.category.id), ...expenseDrag.getCardProps(b.category.id) }}
            dragging={expenseDrag.draggingId === b.category.id}
          />
        ))}
      </div>
      <div className={styles.cards} ref={incomeDrag.containerRef}>
        {incomeDrag.orderedItems.map((c) => (
          <IncomeCategoryCard
            key={c.id}
            id={c.id}
            name={c.name}
            icon={c.icon}
            description={c.description}
            received={incomeByCategory.get(c.id) ?? 0}
            onEdit={() => open(c)}
            cardProps={{ ...incomeDrag.getHandleProps(c.id), ...incomeDrag.getCardProps(c.id) }}
            dragging={incomeDrag.draggingId === c.id}
          />
        ))}
      </div>
      {visibleBudgets.length === 0 && incomeCategories.length === 0 && (
        <EmptyState icon="category" title="Nenhuma categoria neste filtro" description="Crie uma categoria para organizar seus lançamentos." />
      )}

      <Button icon="add_circle" fullWidth onClick={() => open(null)}>
        Nova Categoria Personalizada
      </Button>

      {editing && <CategoryFormSheet key={editing.key} category={editing.category} onClose={() => setEditing(null)} />}
    </Page>
  );
}
