import { useNavigate } from 'react-router-dom';
import { AlertCard } from '@/components/common/AlertCard';
import { Badge } from '@/components/common/Badge';
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
import { formatCurrency } from '@/utils/money';
import { BalanceCard } from './BalanceCard';
import { CategorySpendingCard } from './CategorySpendingCard';
import styles from './Dashboard.module.css';
import { MetricCards } from './MetricCards';
import { useDashboard } from './useDashboard';

const WEEK_SERIES: ChartSeries[] = [
  { key: 'income', name: 'Entradas', color: 'var(--color-income-strong)' },
  { key: 'expense', name: 'Saídas', color: 'var(--color-expense-strong)' },
];

export function DashboardPage() {
  const { settings } = useFinanceData();
  const { openNew } = useTransactionEditor();
  const navigate = useNavigate();
  const { summary, saved, savedChange, incomeChange, balance, isFuture, weeks, budgets, alerts, indicators } = useDashboard();

  const weeklyAverage = weeks.length ? Math.round(summary.balance / weeks.length) : 0;
  const chartData = weeks.map((w) => ({
    label: w.label,
    detailLabel: `${w.label.replace('Sem', 'Semana')} (dias ${Number(w.start.slice(8))}–${Number(w.end.slice(8))})`,
    values: { income: w.income, expense: w.expense },
  }));
  const greeting = settings.userName ? `Olá, ${settings.userName}` : 'Olá';

  return (
    <Page title="Visão Geral" eyebrow={<>{greeting} ✨</>} action={<MonthSwitcher />}>
      <PageGrid>
        <PageColumn>
          <BalanceCard balance={balance} monthBalance={summary.balance} saved={saved} hasIncome={summary.income > 0} projected={isFuture} />
          <MetricCards summary={summary} incomeChange={incomeChange} saved={saved} savedChange={savedChange} />

          <div className={styles.quickActions}>
            <Button icon="add_circle" fullWidth onClick={() => openNew()}>
              Novo Lançamento
            </Button>
            <IconButton icon="history" label="Histórico de lançamentos" variant="tonal" onClick={() => navigate('/lancamentos')} />
          </div>

          <section className={styles.alerts} aria-labelledby="alerts-title">
            <div className={styles.sectionHeader}>
              <h2 id="alerts-title" className={styles.sectionTitle}>
                <Icon name="lightbulb" size={18} />
                Alertas &amp; Diagnóstico do Mês
              </h2>
              <Badge>{alerts.length === 1 ? '1 ativo' : `${alerts.length} ativos`}</Badge>
            </div>
            {alerts.length === 0 ? (
              <AlertCard tone="success" icon="check_circle" title="Tudo em ordem">
                Nenhum limite estourado e nenhum alerta para este mês.
              </AlertCard>
            ) : (
              alerts.map((alert) => (
                <AlertCard key={alert.id} tone={alert.tone} icon={alert.icon} title={alert.title} to={alert.to}>
                  {alert.message}
                </AlertCard>
              ))
            )}
          </section>
        </PageColumn>

        <PageColumn>
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
