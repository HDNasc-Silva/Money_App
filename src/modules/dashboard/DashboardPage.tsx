import { useNavigate } from 'react-router-dom';
import { Button, IconButton } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { MonthSwitcher } from '@/components/common/MonthSwitcher';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartDetails';
import type { ChartSeries } from '@/components/charts/chartTypes';
import { Page, PageColumn, PageGrid } from '@/components/layout/Page';
import { useTransactionEditor } from '@/modules/transactions/TransactionEditor';
import { useFinanceData } from '@/store/FinanceProvider';
import { lastDayOfMonth, todayIso } from '@/utils/dates';
import { formatCurrency } from '@/utils/money';
import { AlertsSummary } from './AlertsSummary';
import { BalanceCard } from './BalanceCard';
import { CategorySpendingCard } from './CategorySpendingCard';
import styles from './Dashboard.module.css';
import { GoalsHighlightCard } from './GoalsHighlightCard';
import { MetricCards } from './MetricCards';
import { RecentTransactionsCard } from './RecentTransactionsCard';
import { UpcomingChargesCard } from './UpcomingChargesCard';
import { useDashboard } from './useDashboard';

const WEEK_SERIES: ChartSeries[] = [
  { key: 'income', name: 'Entradas', color: 'var(--color-income-strong)' },
  { key: 'expense', name: 'Saídas', color: 'var(--color-expense-strong)' },
];

/**
 * Início (v1.7.0), em ordem de importância: saudação e mês → saldo → resumo do mês → ação rápida →
 * próximas cobranças → últimos lançamentos → metas → alertas → análises (gráfico e categorias).
 */
export function DashboardPage() {
  const { settings, categories } = useFinanceData();
  const { openNew } = useTransactionEditor();
  const navigate = useNavigate();
  const dashboard = useDashboard();
  const { summary, saved, balance, isFuture, weeks, budgets, alerts, indicators, month } = dashboard;

  const weeklyAverage = weeks.length ? Math.round(summary.balance / weeks.length) : 0;
  const chartData = weeks.map((w) => ({
    label: w.label,
    detailLabel: `${w.label.replace('Sem', 'Semana')} (dias ${Number(w.start.slice(8))}–${Number(w.end.slice(8))})`,
    values: { income: w.income, expense: w.expense },
  }));
  const greeting = settings.userName ? `Olá, ${settings.userName}` : 'Olá';
  const isPastMonth = lastDayOfMonth(month) < todayIso();

  return (
    <Page title="Visão Geral" eyebrow={<>{greeting} ✨</>} action={<MonthSwitcher />}>
      <PageGrid>
        <PageColumn>
          <BalanceCard
            balance={balance}
            monthBalance={summary.balance}
            saved={saved}
            hasIncome={summary.income > 0}
            projected={isFuture}
            projectedSubscriptions={dashboard.projectedSubscriptions}
          />
          <MetricCards
            summary={summary}
            incomeChange={dashboard.incomeChange}
            expenseChange={dashboard.expenseChange}
            saved={saved}
            savedChange={dashboard.savedChange}
          />

          <div className={styles.quickActions}>
            <Button icon="add_circle" fullWidth onClick={() => openNew()}>
              Novo Lançamento
            </Button>
            <IconButton icon="receipt_long" label="Abrir extrato" variant="tonal" onClick={() => navigate('/lancamentos')} />
          </div>

          <UpcomingChargesCard
            charges={dashboard.upcomingCharges}
            total={dashboard.upcomingTotal}
            hasSubscriptions={dashboard.hasSubscriptions}
            past={isPastMonth}
          />
          <RecentTransactionsCard transactions={dashboard.recent} categories={categories} />
        </PageColumn>

        <PageColumn>
          <GoalsHighlightCard goals={dashboard.goals} />
          <AlertsSummary alerts={alerts} />

          <Card>
            <CardHeader title="Receitas vs Despesas" subtitle="Evolução por semana no mês" action={<ChartLegend series={WEEK_SERIES} />} />
            <BarChart data={chartData} series={WEEK_SERIES} format={(v) => formatCurrency(v)} ariaLabel="Receitas e despesas por semana" />
            <div className={styles.chartFooter}>
              <span>{weeklyAverage >= 0 ? 'Superávit médio semanal' : 'Déficit médio semanal'}</span>
              <span className={['money', weeklyAverage >= 0 ? styles.positive : styles.negative].join(' ')}>
                <Icon name={weeklyAverage >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                {settings.hideBalances ? 'R$ ••••' : `${formatCurrency(weeklyAverage, { signed: true })}/sem`}
              </span>
            </div>
          </Card>

          <CategorySpendingCard budgets={budgets} />

          {indicators.days > 0 && (
            <section className={styles.note}>
              <Icon name="sentiment_satisfied" size={24} />
              <div>
                <strong>Consistência financeira</strong>
                <p>
                  Você registrou movimentações em {indicators.daysWithRecords} dos {indicators.days} dias deste ciclo.
                </p>
              </div>
            </section>
          )}
        </PageColumn>
      </PageGrid>
    </Page>
  );
}
