import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { MonthSwitcher } from '@/components/common/MonthSwitcher';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useToast } from '@/components/common/Toast';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartDetails';
import type { ChartSeries } from '@/components/charts/chartTypes';
import { Page, PageColumn, PageGrid } from '@/components/layout/Page';
import { downloadFile, transactionsToCsv } from '@/services/export';
import { useFinanceData } from '@/store/FinanceProvider';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { formatMonthLabel, formatMonthShort } from '@/utils/dates';
import { formatCurrency } from '@/utils/money';
import {
  GoalContributionsCard,
  GoalDistributionCard,
  GoalProgressCard,
  GoalsEmptyCard,
  GoalsOverviewCard,
  SavedEvolutionCard,
} from './GoalReportCards';
import { ComparisonCard, DistributionCard, InsightsCard } from './ReportCards';
import styles from './Reports.module.css';
import { intervalLabel, useReport, type ReportInterval } from './useReport';

const CASH_FLOW_SERIES: ChartSeries[] = [
  { key: 'income', name: 'Receitas', color: 'var(--color-income-strong)' },
  { key: 'expense', name: 'Despesas', color: 'var(--color-expense-strong)' },
];

/**
 * Relatórios centrados nas metas, que é onde o usuário guarda dinheiro (DT-016).
 * Receitas × despesas ficam como seção secundária.
 */
export function ReportsPage() {
  const { categories } = useFinanceData();
  const { month } = useSelectedMonth();
  const { showToast } = useToast();
  const [interval, setReportInterval] = useState<ReportInterval>('month');
  const report = useReport(interval, month);
  const label = intervalLabel(interval, month);
  const hasGoals = report.goals.count > 0;

  const intervalOptions: { value: ReportInterval; label: string }[] = [
    { value: 'month', label: 'Este mês' },
    { value: 'six-months', label: '6 meses' },
    { value: 'year', label: `Ano ${month.slice(0, 4)}` },
  ];

  const cashFlowData = report.series.map((p) => ({
    label: formatMonthShort(p.month),
    detailLabel: `${formatMonthLabel(p.month)} · saldo ${formatCurrency(p.balance, { signed: true })}`,
    values: { income: p.income, expense: p.expense },
  }));

  const exportCsv = () => {
    if (report.transactionsInPeriod.length === 0) {
      showToast({ tone: 'info', message: 'Não há lançamentos no período para exportar.' });
      return;
    }
    const csv = transactionsToCsv(report.transactionsInPeriod, categories);
    downloadFile(`money-app_${report.period.start}_${report.period.end}.csv`, csv, 'text/csv;charset=utf-8');
    showToast({ message: 'Planilha CSV exportada.' });
  };

  return (
    <Page title="Relatórios das Metas" description="Quanto você está guardando nas suas metas, mês a mês." action={<MonthSwitcher />}>
      <div data-no-print>
        <SegmentedControl label="Intervalo do relatório" options={intervalOptions} value={interval} onChange={setReportInterval} />
      </div>

      {hasGoals ? (
        <PageGrid>
          <PageColumn>
            <GoalsOverviewCard label={label} report={report.goals} />
            <GoalContributionsCard report={report.goals} />
            <SavedEvolutionCard report={report.goals} />
          </PageColumn>
          <PageColumn>
            <GoalDistributionCard report={report.goals} />
            <GoalProgressCard report={report.goals} />
          </PageColumn>
        </PageGrid>
      ) : (
        <GoalsEmptyCard />
      )}

      <h2 className={styles.sectionTitle}>
        <Icon name="swap_vert" size={20} />
        Receitas × despesas
      </h2>

      <PageGrid>
        <PageColumn>
          <Card>
            <CardHeader title={`Receitas e despesas (${report.series.length} meses)`} subtitle="Entradas e saídas de cada mês" />
            <BarChart
              data={cashFlowData}
              series={CASH_FLOW_SERIES}
              format={(v) => formatCurrency(v)}
              ariaLabel="Receitas e despesas por mês"
              highlightIndex={cashFlowData.length - 1}
            />
            <ChartLegend series={CASH_FLOW_SERIES} />
          </Card>
          <ComparisonCard
            comparison={report.comparison}
            contributions={{ current: report.goals.contributed, previous: report.goals.previousContributed }}
          />
        </PageColumn>

        <PageColumn>
          <DistributionCard distribution={report.distribution} total={report.comparison.current.expense} />
          <InsightsCard indicators={report.indicators} />

          <Card data-no-print>
            <CardHeader title="Exportação de dados" subtitle="CSV compatível com Excel, Notion e Google Sheets" />
            <div className={styles.exportButtons}>
              <Button icon="picture_as_pdf" onClick={() => window.print()}>
                Relatório PDF
              </Button>
              <Button variant="secondary" icon="table_view" onClick={exportCsv}>
                Planilha CSV
              </Button>
            </div>
          </Card>
        </PageColumn>
      </PageGrid>
    </Page>
  );
}
