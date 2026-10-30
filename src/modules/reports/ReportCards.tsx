import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { ProgressBar } from '@/components/common/ProgressBar';
import { DonutChart } from '@/components/charts/DonutChart';
import type { CategoryShare, PeriodComparison, PeriodIndicators } from '@/domain/reports';
import { percentChange } from '@/domain/summary';
import type { Cents } from '@/models';
import { formatPercent, formatSignedPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import styles from './Reports.module.css';

/* ---------- Diagnóstico ---------- */

interface DiagnosticProps {
  label: string;
  comparison: PeriodComparison;
  savingsTarget: number;
}

export function DiagnosticCard({ label, comparison, savingsTarget }: DiagnosticProps) {
  const { current, previous } = comparison;
  const target = savingsTarget / 100;
  const deltaPoints = previous.income > 0 ? current.savingsRate - previous.savingsRate : null;
  const aboveTarget = current.savingsRate - target;

  return (
    <section className={styles.diagnostic} aria-label="Diagnóstico do período">
      <div className={styles.diagnosticTop}>
        <span className={styles.diagnosticLabel}>
          <span className={styles.diagnosticIcon}>
            <Icon name="verified" size={18} />
          </span>
          Diagnóstico · {label}
        </span>
        {deltaPoints !== null && (
          <span className={[styles.diagnosticDelta, deltaPoints < 0 && styles.diagnosticDeltaDown].filter(Boolean).join(' ')}>
            <Icon name={deltaPoints >= 0 ? 'trending_up' : 'trending_down'} size={14} />
            {formatSignedPercent(deltaPoints).replace('%', ' p.p.')} vs anterior
          </span>
        )}
      </div>
      <div className={styles.diagnosticRate}>
        <strong className="money">{formatPercent(current.savingsRate)}</strong>
        <span>taxa de poupança</span>
      </div>
      <p className={styles.diagnosticText}>
        {current.income > 0 ? (
          <>
            Você reteve <Money value={current.savings} className={styles.heroHighlight} /> da renda total de <Money value={current.income} /> recebida
            neste período.
          </>
        ) : (
          'Nenhuma receita registrada neste período.'
        )}
      </p>
      <ProgressBar value={target > 0 ? current.savingsRate / target : 0} tone="good" label="Taxa de poupança em relação à meta" size="sm" />
      <div className={styles.diagnosticFooter}>
        <span>Meta estipulada: {savingsTarget}%</span>
        <span className={aboveTarget >= 0 ? styles.heroHighlight : styles.heroWarning}>
          {formatSignedPercent(aboveTarget).replace('%', ' p.p.')} {aboveTarget >= 0 ? 'acima' : 'abaixo'} do plano
        </span>
      </div>
    </section>
  );
}

/* ---------- Comparação ---------- */

function ChangeCell({ current, previous, invert = false }: { current: Cents; previous: Cents; invert?: boolean }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className={styles.muted}>—</span>;
  const good = invert ? change <= 0 : change >= 0;
  return <span className={good ? styles.good : styles.bad}>{formatSignedPercent(change)}</span>;
}

export function ComparisonCard({ comparison }: { comparison: PeriodComparison }) {
  const { current, previous } = comparison;
  const rows = [
    { label: 'Receitas', current: current.income, previous: previous.income, invert: false },
    { label: 'Despesas', current: current.expense, previous: previous.expense, invert: true },
    { label: 'Saldo', current: current.balance, previous: previous.balance, invert: false },
  ];
  return (
    <Card>
      <CardHeader title="Comparação entre períodos" subtitle="Período selecionado vs período anterior equivalente" />
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Indicador</th>
            <th scope="col">Atual</th>
            <th scope="col">Anterior</th>
            <th scope="col">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>
                <Money value={row.current} compact />
              </td>
              <td>
                <Money value={row.previous} compact />
              </td>
              <td>
                <ChangeCell current={row.current} previous={row.previous} invert={row.invert} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------- Distribuição ---------- */

const MAX_SLICES = 5;
const sliceColor = (index: number) => `var(--chart-${(index % 7) + 1})`;

export function DistributionCard({ distribution, total }: { distribution: readonly CategoryShare[]; total: Cents }) {
  const [active, setActive] = useState<string | null>(null);
  const top = distribution.slice(0, MAX_SLICES);
  const rest = distribution.slice(MAX_SLICES);
  const slices = [
    ...top.map((d, i) => ({ key: d.categoryId, label: d.name, value: d.amount, color: sliceColor(i) })),
    ...(rest.length
      ? [{ key: 'others', label: 'Outras áreas', value: rest.reduce((sum, d) => sum + d.amount, 0), color: sliceColor(MAX_SLICES) }]
      : []),
  ];

  return (
    <Card>
      <CardHeader
        title="Distribuição de Despesas"
        subtitle={
          <>
            <Money value={total} /> consumidos
          </>
        }
        action={<Badge>{distribution.length === 1 ? '1 categoria' : `${distribution.length} categorias`}</Badge>}
      />
      {distribution.length === 0 ? (
        <EmptyState icon="donut_large" title="Sem despesas no período" />
      ) : (
        <>
          <div className={styles.donutRow}>
            <DonutChart
              slices={slices}
              centerValue={`${slices.length}`}
              centerLabel={slices.length === 1 ? 'área' : 'áreas'}
              ariaLabel={`Distribuição de despesas: ${slices.map((s) => `${s.label} ${formatPercent(s.value / total)}`).join(', ')}`}
              activeKey={active}
              onSelect={setActive}
            />
            <ul className={styles.legendList}>
              {slices.map((s) => (
                <li
                  key={s.key}
                  className={active && active !== s.key ? styles.dimmed : undefined}
                  onMouseEnter={() => setActive(s.key)}
                  onMouseLeave={() => setActive(null)}
                >
                  <span className={styles.dot} style={{ background: s.color }} aria-hidden="true" />
                  <span className={styles.legendName}>{s.label}</span>
                  <span className="money">{formatPercent(s.value / total)}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className={styles.breakdown}>
            {distribution.map((d, i) => (
              <li key={d.categoryId}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownName}>
                    <Icon name={d.icon} size={18} />
                    {d.name}
                  </span>
                  <span className={styles.breakdownValues}>
                    <Money value={d.amount} />
                    <span className={styles.muted}>{formatPercent(d.share)}</span>
                  </span>
                </div>
                <div className={styles.breakdownTrack}>
                  <div style={{ width: `${d.share * 100}%`, background: sliceColor(Math.min(i, MAX_SLICES)) }} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/* ---------- Insights ---------- */

interface InsightsProps {
  indicators: PeriodIndicators;
  savingsDiff: Cents | null;
}

export function InsightsCard({ indicators, savingsDiff }: InsightsProps) {
  const items = [
    {
      icon: 'energy_savings_leaf',
      title: 'Dias sem gastos',
      value: `${indicators.noSpendDays} d`,
      text: indicators.days ? `${formatPercent(indicators.noSpendDays / indicators.days)} dos dias do período sem nenhuma despesa.` : 'Período ainda não iniciado.',
      tone: styles.insightGood,
    },
    {
      icon: 'receipt',
      title: 'Maior despesa única',
      value: indicators.largestExpense ? formatCurrency(indicators.largestExpense.amount) : '—',
      text: indicators.largestExpense ? indicators.largestExpense.description : 'Nenhuma despesa no período.',
      tone: styles.insightInfo,
      money: true,
    },
    {
      icon: 'calendar_today',
      title: 'Média diária de gastos',
      value: formatCurrency(indicators.averageDailyExpense),
      text: `Considerando ${indicators.days} dia(s) decorridos no período.`,
      tone: styles.insightNeutral,
      money: true,
    },
    ...(savingsDiff !== null
      ? [
          {
            icon: 'savings',
            title: 'Ritmo de poupança',
            value: formatCurrency(savingsDiff, { signed: true }),
            text: savingsDiff >= 0 ? 'Guardado a mais que no período anterior.' : 'Guardado a menos que no período anterior.',
            tone: savingsDiff >= 0 ? styles.insightGood : styles.insightBad,
            money: true,
          },
        ]
      : []),
  ];

  return (
    <section className={styles.insights} aria-labelledby="insights-title">
      <h2 id="insights-title">Insights &amp; Hábitos Financeiros</h2>
      {items.map((item) => (
        <div key={item.title} className={styles.insight}>
          <span className={[styles.insightIcon, item.tone].join(' ')}>
            <Icon name={item.icon} size={22} />
          </span>
          <div className={styles.insightText}>
            <div className={styles.insightTitle}>
              <strong>{item.title}</strong>
              <span className={item.money ? 'money' : undefined}>{item.value}</span>
            </div>
            <p>{item.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
