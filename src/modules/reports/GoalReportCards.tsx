import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { ProgressBar } from '@/components/common/ProgressBar';
import { BarChart } from '@/components/charts/BarChart';
import { ChartLegend } from '@/components/charts/ChartDetails';
import type { ChartSeries } from '@/components/charts/chartTypes';
import { LineChart } from '@/components/charts/LineChart';
import type { GoalForecast } from '@/domain/goals';
import { percentChange } from '@/domain/summary';
import { formatMonthLabel, formatMonthShort, formatMonthYearShort } from '@/utils/dates';
import { formatPercent, formatSignedPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import { MAX_SLICES, sliceColor } from './chartSlices';
import { ShareBreakdown } from './ReportCards';
import styles from './Reports.module.css';
import type { GoalsReport } from './useReport';

const formatMoney = (value: number) => formatCurrency(value);

/* ---------- Resumo ---------- */

export function GoalsOverviewCard({ label, report }: { label: string; report: GoalsReport }) {
  const { summary, totalSaved, contributed, previousContributed, count } = report;
  const change = percentChange(contributed, previousContributed);

  return (
    <section className={styles.diagnostic} aria-label="Resumo das metas">
      <div className={styles.diagnosticTop}>
        <span className={styles.diagnosticLabel}>
          <span className={styles.diagnosticIcon}>
            <Icon name="savings" size={18} />
          </span>
          Metas · {label}
        </span>
        {change !== null && (
          <span
            className={[styles.diagnosticDelta, change < 0 && styles.diagnosticDeltaDown].filter(Boolean).join(' ')}
            title="Aportes em relação ao período anterior"
          >
            <Icon name={change >= 0 ? 'trending_up' : 'trending_down'} size={14} />
            {formatSignedPercent(change)} vs anterior
          </span>
        )}
      </div>
      <div className={styles.overviewTotal}>
        <span>Total guardado em metas</span>
        <Money value={totalSaved} className={styles.overviewValue} />
      </div>
      <ProgressBar value={summary.ratio} tone="good" label="Progresso geral das metas" size="sm" />
      <dl className={styles.overviewStats}>
        <div>
          <dt>Aportado no período</dt>
          <dd>
            <Money value={contributed} compact className={styles.heroHighlight} />
          </dd>
        </div>
        <div>
          <dt>Falta para concluir</dt>
          <dd>
            <Money value={summary.remaining} compact />
          </dd>
        </div>
        <div>
          <dt>Concluídas</dt>
          <dd className="money">
            {summary.completed} de {count}
          </dd>
        </div>
      </dl>
    </section>
  );
}

/* ---------- Aportes por mês ---------- */

/** Séries do gráfico empilhado: as metas com mais aportes na janela e "Outras metas". */
function contributionSeries(report: GoalsReport): { series: ChartSeries[]; keyOf: (goalId: string) => string } {
  const totals = new Map<string, number>();
  for (const point of report.monthly) {
    for (const [goalId, amount] of Object.entries(point.byGoal)) totals.set(goalId, (totals.get(goalId) ?? 0) + amount);
  }
  const names = new Map(report.items.map(({ goal }) => [goal.id, goal.name]));
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const top = new Set(ranked.slice(0, MAX_SLICES));
  const series: ChartSeries[] = ranked.slice(0, MAX_SLICES).map((id, i) => ({ key: id, name: names.get(id) ?? 'Meta excluída', color: sliceColor(i) }));
  if (ranked.length > MAX_SLICES) series.push({ key: 'others', name: 'Outras metas', color: sliceColor(MAX_SLICES) });
  return { series, keyOf: (goalId) => (top.has(goalId) ? goalId : 'others') };
}

export function GoalContributionsCard({ report }: { report: GoalsReport }) {
  const { series, keyOf } = contributionSeries(report);
  const hasContributions = series.length > 0;
  const chartSeries = hasContributions ? series : [{ key: 'total', name: 'Aportes', color: sliceColor(1) }];
  const data = report.monthly.map((point) => {
    const values: Record<string, number> = {};
    for (const [goalId, amount] of Object.entries(point.byGoal)) values[keyOf(goalId)] = (values[keyOf(goalId)] ?? 0) + amount;
    return {
      label: formatMonthShort(point.month),
      detailLabel: `${formatMonthLabel(point.month)} · total ${formatCurrency(point.total)}`,
      values: hasContributions ? values : { total: 0 },
    };
  });
  const average = report.monthly.length ? Math.round(report.monthly.reduce((sum, p) => sum + p.total, 0) / report.monthly.length) : 0;

  return (
    <Card>
      <CardHeader title={`Aportes por mês (${report.monthly.length} meses)`} subtitle="Quanto você guardou em cada meta, mês a mês" />
      <BarChart
        data={data}
        series={chartSeries}
        mode="stacked"
        format={formatMoney}
        ariaLabel="Aportes mensais em metas"
        highlightIndex={data.length - 1}
      />
      {hasContributions ? (
        <ChartLegend series={series} />
      ) : (
        <p className={styles.muted}>Nenhum aporte registrado nestes meses. Use “Aportar” na tela de Metas.</p>
      )}
      <div className={styles.chartFooter}>
        <span>Média mensal de aportes</span>
        <Money value={average} />
      </div>
    </Card>
  );
}

/* ---------- Evolução do total guardado ---------- */

const SAVED_SERIES: ChartSeries = { key: 'total', name: 'Total guardado', color: 'var(--color-income-strong)' };

export function SavedEvolutionCard({ report }: { report: GoalsReport }) {
  const data = report.evolution.map((point) => ({
    label: formatMonthShort(point.month),
    detailLabel: `Fim de ${formatMonthLabel(point.month)}`,
    values: { total: point.total },
  }));
  const first = report.evolution[0]?.total ?? 0;
  const last = report.evolution[report.evolution.length - 1]?.total ?? 0;

  return (
    <Card>
      <CardHeader title="Evolução do total guardado" subtitle="Soma de todas as metas ao fim de cada mês" />
      <LineChart data={data} series={SAVED_SERIES} format={formatMoney} ariaLabel="Evolução do total guardado em metas" />
      <div className={styles.chartFooter}>
        <span>Crescimento no intervalo</span>
        <Money value={last - first} signed />
      </div>
    </Card>
  );
}

/* ---------- Distribuição por meta ---------- */

export function GoalDistributionCard({ report }: { report: GoalsReport }) {
  const { distribution, totalSaved } = report;
  return (
    <Card>
      <CardHeader
        title="Onde está o dinheiro guardado"
        subtitle={
          <>
            <Money value={totalSaved} /> em {distribution.length === 1 ? '1 meta' : `${distribution.length} metas`}
          </>
        }
      />
      {distribution.length === 0 ? (
        <EmptyState icon="donut_large" title="Nada guardado ainda" description="Registre um aporte para ver a distribuição." />
      ) : (
        <ShareBreakdown
          items={distribution.map((d) => ({ key: d.goalId, name: d.name, icon: d.icon, amount: d.saved, share: d.share }))}
          total={totalSaved}
          othersLabel="Outras metas"
          centerLabel={['meta', 'metas']}
          ariaLabel="Dinheiro guardado por meta"
        />
      )}
    </Card>
  );
}

/* ---------- Progresso de cada meta ---------- */

function forecastText(forecast: GoalForecast): string {
  if (forecast.pace === 'completed') return 'Meta concluída';
  if (!forecast.month) return 'Sem aporte mensal planejado';
  const text = `Previsão: ${formatMonthYearShort(forecast.month)}`;
  return forecast.pace === 'late' ? `${text} · após o prazo` : text;
}

export function GoalProgressCard({ report }: { report: GoalsReport }) {
  return (
    <Card>
      <CardHeader title="Progresso das metas" subtitle="Situação atual e previsão de conclusão" />
      <ul className={styles.progressList}>
        {report.items.map(({ goal, progress, forecast }) => (
          <li key={goal.id} className={styles.progressItem}>
            <div className={styles.progressTop}>
              <span className={styles.progressIcon}>
                <Icon name={goal.icon} size={18} />
              </span>
              <strong className={styles.ellipsis}>{goal.name}</strong>
              <Badge tone={progress.completed ? 'income' : forecast.pace === 'late' ? 'expense' : 'neutral'} money>
                {formatPercent(progress.ratio)}
              </Badge>
            </div>
            <ProgressBar value={progress.ratio} tone="good" label={`Progresso de ${goal.name}`} size="sm" />
            <div className={styles.progressMeta}>
              <span>
                <Money value={progress.saved} /> de <Money value={goal.targetAmount} />
              </span>
              <span className={forecast.pace === 'late' ? styles.bad : undefined}>{forecastText(forecast)}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Estado vazio ---------- */

export function GoalsEmptyCard() {
  const navigate = useNavigate();
  return (
    <Card>
      <EmptyState
        icon="flag"
        title="Você ainda não tem metas"
        description="É nas metas que você guarda dinheiro. Crie a primeira para acompanhar aqui seus aportes e o total guardado."
        action={
          <Button icon="flag" onClick={() => navigate('/metas')}>
            Ir para Metas
          </Button>
        }
      />
    </Card>
  );
}
