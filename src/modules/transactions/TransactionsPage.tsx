import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SelectField } from '@/components/forms/Fields';
import { Page } from '@/components/layout/Page';
import { summarize } from '@/domain/summary';
import {
  DEFAULT_FILTERS,
  filterTransactions,
  groupByDay,
  type PeriodFilter,
  type TransactionFilters,
  type TypeFilter,
} from '@/domain/transactions';
import type { Transaction } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { addDays, formatDayMonth, todayIso } from '@/utils/dates';
import { normalizeText } from '@/utils/format';
import { TransactionActions } from './TransactionActions';
import { useTransactionEditor } from './TransactionEditor';
import { TransactionItem } from './TransactionItem';
import styles from './Transactions.module.css';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'this-month', label: 'Este mês' },
  { value: 'last-7-days', label: 'Últimos 7 dias' },
  { value: 'previous-month', label: 'Mês anterior' },
  { value: 'all', label: 'Todos' },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
];

function dayTitle(date: string, today: string): string {
  if (date === today) return `Hoje • ${formatDayMonth(date)}`;
  if (date === addDays(today, -1)) return `Ontem • ${formatDayMonth(date)}`;
  return formatDayMonth(date);
}

export function TransactionsPage() {
  const { transactions, categories } = useFinanceData();
  const { openNew } = useTransactionEditor();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoria');
  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    ...DEFAULT_FILTERS,
    categoryId: initialCategory && categories.some((c) => c.id === initialCategory) ? initialCategory : null,
    period: initialCategory ? 'all' : DEFAULT_FILTERS.period,
  }));
  const [selected, setSelected] = useState<Transaction | null>(null);
  const today = todayIso();

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const filtered = useMemo(
    () => filterTransactions(transactions, categories, filters, today),
    [transactions, categories, filters, today],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  // O resumo considera período e categoria, mas não tipo/busca, para mostrar entradas e saídas.
  const periodSummary = useMemo(
    () => summarize(filterTransactions(transactions, categories, { ...filters, type: 'all', search: '' }, today)),
    [transactions, categories, filters, today],
  );

  const setFilter = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const hasActiveFilters =
    normalizeText(filters.search) !== '' || filters.type !== 'all' || filters.categoryId !== null || filters.period !== 'this-month';

  const categoryOptions = [
    { value: '', label: 'Todas as categorias' },
    ...categories.map((c) => ({ value: c.id, label: `${c.name} (${c.kind === 'income' ? 'receita' : 'despesa'})` })),
  ];
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === filters.period)?.label ?? '';

  return (
    <Page title="Lançamentos" description="Histórico, busca e filtros de receitas e despesas.">
      <Card className={styles.summary}>
        <div className={styles.summaryHeader}>
          <span className={styles.summaryPeriod}>
            <Icon name="calendar_month" size={18} />
            {periodLabel}
          </span>
          <Badge tone={periodSummary.balance >= 0 ? 'income' : 'expense'} icon={periodSummary.balance >= 0 ? 'trending_up' : 'trending_down'}>
            {periodSummary.balance >= 0 ? 'Balanço positivo' : 'Balanço negativo'}
          </Badge>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryBox}>
            <span className={[styles.summaryLabel, styles.labelIncome].join(' ')}>
              <Icon name="arrow_downward" size={16} /> Entradas
            </span>
            <Money value={periodSummary.income} className={[styles.summaryValue, styles.amountIncome].join(' ')} />
          </div>
          <div className={styles.summaryBox}>
            <span className={[styles.summaryLabel, styles.labelExpense].join(' ')}>
              <Icon name="arrow_upward" size={16} /> Saídas
            </span>
            <Money value={periodSummary.expense} className={styles.summaryValue} />
          </div>
        </div>
      </Card>

      <section className={styles.filters} aria-label="Busca e filtros">
        <div className={styles.search}>
          <Icon name="search" size={20} />
          <label htmlFor="transaction-search" className="visually-hidden">
            Buscar lançamentos
          </label>
          <input
            id="transaction-search"
            type="search"
            placeholder="Buscar por descrição ou categoria"
            value={filters.search}
            onChange={(event) => setFilter('search', event.target.value)}
          />
          {filters.search && (
            <button type="button" aria-label="Limpar busca" onClick={() => setFilter('search', '')}>
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
        <SegmentedControl variant="pills" label="Período" options={PERIOD_OPTIONS} value={filters.period} onChange={(v) => setFilter('period', v)} />
        <div className={styles.filterRow}>
          <SegmentedControl label="Tipo" options={TYPE_OPTIONS} value={filters.type} onChange={(v) => setFilter('type', v)} />
          <SelectField
            label="Categoria"
            value={filters.categoryId ?? ''}
            onChange={(v) => setFilter('categoryId', v || null)}
            options={categoryOptions}
          />
        </div>
      </section>

      {groups.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="Nenhum lançamento encontrado"
          description={hasActiveFilters ? 'Tente outro termo ou ajuste os filtros.' : 'Registre sua primeira receita ou despesa.'}
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" icon="filter_alt_off" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Limpar filtros
              </Button>
            ) : (
              <Button size="sm" icon="add" onClick={() => openNew()}>
                Novo lançamento
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.date} className={styles.group} aria-label={dayTitle(group.date, today)}>
              <div className={styles.groupHeader}>
                <h2>{dayTitle(group.date, today)}</h2>
                <Money value={group.net} signed className={group.net > 0 ? styles.amountIncome : undefined} />
              </div>
              <ul className={styles.list}>
                {group.items.map((t) => (
                  <TransactionItem key={t.id} transaction={t} category={categoriesById.get(t.categoryId)} onOpenActions={setSelected} />
                ))}
              </ul>
            </section>
          ))}
          <p className={styles.footer}>
            <Icon name="done_all" size={16} />
            Mostrando {filtered.length} de {transactions.length} lançamentos
          </p>
        </div>
      )}

      <button type="button" className={styles.fab} onClick={() => openNew()}>
        <Icon name="add" size={22} />
        Nova Movimentação
      </button>

      <TransactionActions transaction={selected} onClose={() => setSelected(null)} />
    </Page>
  );
}
