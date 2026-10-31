import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useToast } from '@/components/common/Toast';
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
import { downloadFile, transactionsToCsv } from '@/services/export';
import { useFinanceData } from '@/store/FinanceProvider';
import { addDays, formatDayMonth, todayIso } from '@/utils/dates';
import { normalizeText, pluralize } from '@/utils/format';
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

const ALL_CATEGORIES = '';

function dayTitle(date: string, today: string): string {
  if (date === today) return `Hoje • ${formatDayMonth(date)}`;
  if (date === addDays(today, -1)) return `Ontem • ${formatDayMonth(date)}`;
  return formatDayMonth(date);
}

/**
 * Extrato (v1.7.0): resumo do filtro (entradas, saídas e saldo), busca, filtros em chips,
 * lista agrupada por dia com o total do dia e, no desktop, colunas como numa planilha.
 */
export function TransactionsPage() {
  const { transactions, categories } = useFinanceData();
  const { openNew } = useTransactionEditor();
  const { showToast } = useToast();
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
  // O resumo reflete exatamente o que está filtrado (como o rodapé de uma planilha filtrada).
  const filteredSummary = useMemo(() => summarize(filtered), [filtered]);
  const categoryOptions = useMemo(() => {
    const visible = filters.type === 'all' ? categories : categories.filter((c) => c.kind === filters.type);
    return [{ value: ALL_CATEGORIES, label: 'Todas' }, ...visible.map((c) => ({ value: c.id, label: c.name }))];
  }, [categories, filters.type]);

  const setFilter = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const changeType = (type: TypeFilter) =>
    setFilters((current) => {
      const category = current.categoryId ? categoriesById.get(current.categoryId) : undefined;
      // Ao filtrar por tipo, descarta uma categoria do outro tipo (o resultado ficaria sempre vazio).
      const keep = !category || type === 'all' || category.kind === type;
      return { ...current, type, categoryId: keep ? current.categoryId : null };
    });
  const hasActiveFilters =
    normalizeText(filters.search) !== '' || filters.type !== 'all' || filters.categoryId !== null || filters.period !== 'this-month';
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === filters.period)?.label ?? '';

  const exportFiltered = () => {
    downloadFile(`money-app_extrato_${today}.csv`, transactionsToCsv(filtered, categories), 'text/csv;charset=utf-8');
    showToast({ message: `${pluralize(filtered.length, 'lançamento exportado', 'lançamentos exportados')} para planilha (CSV).` });
  };

  return (
    <Page title="Lançamentos" description="Seu extrato: busque, filtre e acompanhe dia a dia.">
      <section className={styles.summary} aria-label="Resumo do filtro">
        <div className={styles.summaryHeader}>
          <span className={styles.summaryPeriod}>
            <Icon name="calendar_month" size={18} />
            {periodLabel}
            {hasActiveFilters && filters.period === 'this-month' ? ' · filtrado' : ''}
          </span>
          <Button variant="ghost" size="sm" icon="download" onClick={exportFiltered} disabled={filtered.length === 0}>
            Exportar CSV
          </Button>
        </div>
        <dl className={styles.summaryGrid}>
          <div className={styles.summaryBox}>
            <dt className={[styles.summaryLabel, styles.labelIncome].join(' ')}>
              <Icon name="arrow_downward" size={14} /> Entradas
            </dt>
            <dd>
              <Money value={filteredSummary.income} className={[styles.summaryValue, styles.amountIncome].join(' ')} />
            </dd>
          </div>
          <div className={styles.summaryBox}>
            <dt className={[styles.summaryLabel, styles.labelExpense].join(' ')}>
              <Icon name="arrow_upward" size={14} /> Saídas
            </dt>
            <dd>
              <Money value={filteredSummary.expense} className={styles.summaryValue} />
            </dd>
          </div>
          <div className={styles.summaryBox}>
            <dt className={styles.summaryLabel}>
              <Icon name="account_balance" size={14} /> Saldo
            </dt>
            <dd>
              <Money
                value={filteredSummary.balance}
                signed
                className={[styles.summaryValue, filteredSummary.balance < 0 ? styles.amountExpense : styles.amountIncome].join(' ')}
              />
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.filters} aria-label="Busca e filtros">
        <div className={styles.search}>
          <Icon name="search" size={20} />
          <label htmlFor="transaction-search" className="visually-hidden">
            Buscar lançamentos
          </label>
          <input
            id="transaction-search"
            type="search"
            placeholder="Buscar por descrição, categoria ou observação"
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
        <SegmentedControl variant="pills" label="Tipo" options={TYPE_OPTIONS} value={filters.type} onChange={changeType} />
        <SegmentedControl
          variant="pills"
          label="Categoria"
          options={categoryOptions}
          value={filters.categoryId ?? ALL_CATEGORIES}
          onChange={(v) => setFilter('categoryId', v || null)}
        />
        {hasActiveFilters && groups.length > 0 && (
          <button type="button" className={styles.clearFilters} onClick={() => setFilters(DEFAULT_FILTERS)}>
            <Icon name="filter_alt_off" size={16} />
            Limpar filtros
          </button>
        )}
      </section>

      {groups.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? 'search_off' : 'receipt_long'}
          title={hasActiveFilters ? 'Nenhum lançamento encontrado' : 'Seu extrato começa aqui'}
          description={
            hasActiveFilters
              ? 'Tente outro termo ou ajuste os filtros.'
              : 'Registre seus gastos e receitas — leva poucos segundos e substitui a planilha.'
          }
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
          <div className={styles.tableHead} aria-hidden="true">
            <span>Descrição</span>
            <span>Categoria</span>
            <span>Valor</span>
          </div>
          {groups.map((group) => (
            <section key={group.date} className={styles.group} aria-label={dayTitle(group.date, today)}>
              <div className={styles.groupHeader}>
                <h2>{dayTitle(group.date, today)}</h2>
                <span className={styles.groupTotal}>
                  <span className={styles.groupCount}>{pluralize(group.items.length, 'item', 'itens')} · </span>
                  <Money value={group.net} signed className={group.net > 0 ? styles.amountIncome : undefined} />
                </span>
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
