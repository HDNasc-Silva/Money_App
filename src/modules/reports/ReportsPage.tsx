import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { MonthSwitcher } from '@/components/common/MonthSwitcher';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useToast } from '@/components/common/Toast';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartDetails';
import type { ChartSeries } from '@/components/charts/chartTypes';
import { LineChart } from '@/components/charts/LineChart';
import { Page, PageColumn, PageGrid } from '@/components/layout/Page';
import { downloadFile, transactionsToCsv } from '@/services/export';
import { useFinanceData } from '@/store/FinanceProvider';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { formatMonthLabel, formatMonthShort } from '@/utils/dates';
import { formatPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import { ComparisonCard, DiagnosticCard, DistributionCard, InsightsCard } from './ReportCards';
import styles from './Reports.module.css';
import { intervalLabel, useReport, type ReportInterval } from './useReport';

const EVOLUTION_SERIES: ChartSeries[] = [
  { key: 'expense', name: 'Gastos', color: 'var(--color-expense-strong)' },
  { key: 'saved', name: 'Guardado', color: 'var(--color-income-strong)' },
];
const BALANCE_SERIES: ChartSeries = { key: 'balance', name: 'Saldo acumulado', color: 'var(--color-accent)' };

export function ReportsPage() {
  const { categories, settings } = useFinanceData();
  const { month } = useSelectedMonth();
  const { showToast } = useToast();
  const [interval, setReportInterval] = useState<ReportInterval>('month');
  const report = useReport(interval, month);
  const label = intervalLabel(interval, month);

  const intervalOptions: { value: ReportInterval; label: string }[] = [
    { value: 'month', label: 'Este mês' },
    { value: 'six-months', label: '6 meses' },
    { value: 'year', label: `Ano ${month.slice(0, 4)}` },
  ];

  const evolutionData = report.series.map((p) => ({
    label: formatMonthShort(p.month),
    detailLabel: `${formatMonthLabel(p.month)} · poupança ${formatPercent(p.savingsRate)}`,
    values: { expense: p.expense, saved: p.saved },
  }));
  const balanceData = report.series.map((p) => ({
    label: formatMonthShort(p.month),
    detailLabel: `Fim de ${formatMonthLabel(p.month)}`,
    values: { balance: p.closingBalance },
  }));
  const average = report.series.length
    ? report.series.reduce((sum, p) => sum + p.savingsRate, 0) / report.series.length
    : 0;
  const { current, previous } = report.comparison;
  const savingsDiff = previous.income > 0 || previous.expense > 0 ? current.savings - previous.savings : null;

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
    <Page title="Tendências & Relatórios" description="Análise de ritmo e balanço consolidado." action={<MonthSwitcher />}>
      <div data-no-print>
        <SegmentedControl label="Intervalo do relatório" options={intervalOptions} value={interval} onChange={setReportInterval} />
      </div>

      <PageGrid>
        <PageColumn>
          <DiagnosticCard label={label} comparison={report.comparison} savingsTarget={settings.savingsTarget} />

          <Card>
            <CardHeader title={`Evolução líquida (${report.series.length} meses)`} subtitle="Reserva retida vs despesas correntes" action={<ChartLegend series={EVOLUTION_SERIES} />} />
            <BarChart
              data={evolutionData}
              series={EVOLUTION_SERIES}
              mode="stacked"
              format={(v) => formatCurrency(v)}
              ariaLabel="Evolução mensal de gastos e valores guardados"
              highlightIndex={evolutionData.length - 1}
            />
            <div className={styles.chartFooter}>
              <span>Média de poupança no intervalo</span>
              <strong className="money">{formatPercent(average)}</strong>
            </div>
          </Card>

          <Card>
            <CardHeader title="Evolução do saldo" subtitle="Saldo acumulado ao fim de cada mês" />
            <LineChart data={balanceData} series={BALANCE_SERIES} format={(v) => formatCurrency(v)} ariaLabel="Evolução do saldo acumulado" />
          </Card>

          <ComparisonCard comparison={report.comparison} />
        </PageColumn>

        <PageColumn>
          <DistributionCard distribution={report.distribution} total={current.expense} />
          <InsightsCard indicators={report.indicators} savingsDiff={savingsDiff} />

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
