import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart';
import type { CategoryShare, PeriodComparison, PeriodIndicators } from '@/domain/reports';
import { percentChange } from '@/domain/summary';
import type { Cents } from '@/models';
import { formatPercent, formatSignedPercent } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import { groupSlices, MAX_SLICES, sliceColor } from './chartSlices';
import styles from './Reports.module.css';

/* ---------- Rosca + detalhamento (despesas por categoria e dinheiro por meta) ---------- */

export interface ShareItem {
  key: string;
  name: string;
  icon: string;
  amount: Cents;
  /** Participação no total (0–1). */
  share: number;
}

interface ShareBreakdownProps {
  items: readonly ShareItem[];
  total: Cents;
  othersLabel: string;
  centerLabel: [singular: string, plural: string];
  /** Prefixo do rótulo acessível da rosca (ex.: "Distribuição de despesas"). */
  ariaLabel: string;
}

export function ShareBreakdown({ items, total, othersLabel, centerLabel, ariaLabel }: ShareBreakdownProps) {
  const [active, setActive] = useState<string | null>(null);
  const slices: DonutSlice[] = groupSlices(
    items.map((item) => ({ key: item.key, label: item.name, value: item.amount })),
    othersLabel,
  );

  return (
    <>
      <div className={styles.donutRow}>
        <DonutChart
          slices={slices}
          centerValue={`${slices.length}`}
          centerLabel={slices.length === 1 ? centerLabel[0] : centerLabel[1]}
          ariaLabel={`${ariaLabel}: ${slices.map((s) => `${s.label} ${formatPercent(s.value / total)}`).join(', ')}`}
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
        {items.map((item, i) => (
          <li key={item.key}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownName}>
                <Icon name={item.icon} size={18} />
                <span className={styles.ellipsis}>{item.name}</span>
              </span>
              <span className={styles.breakdownValues}>
                <Money value={item.amount} />
                <span className={styles.muted}>{formatPercent(item.share)}</span>
              </span>
            </div>
            <div className={styles.breakdownTrack}>
              <div style={{ width: `${item.share * 100}%`, background: sliceColor(Math.min(i, MAX_SLICES)) }} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Comparação ---------- */

function ChangeCell({ current, previous, invert = false }: { current: Cents; previous: Cents; invert?: boolean }) {
  const change = percentChange(current, previous);
  if (change === null) return <span className={styles.muted}>—</span>;
  const good = invert ? change <= 0 : change >= 0;
  return <span className={good ? styles.good : styles.bad}>{formatSignedPercent(change)}</span>;
}

interface ComparisonProps {
  comparison: PeriodComparison;
  /** Aportes em metas no período atual e no anterior. */
  contributions: { current: Cents; previous: Cents };
}

export function ComparisonCard({ comparison, contributions }: ComparisonProps) {
  const { current, previous } = comparison;
  const rows = [
    { label: 'Receitas', current: current.income, previous: previous.income, invert: false },
    { label: 'Despesas', current: current.expense, previous: previous.expense, invert: true },
    { label: 'Saldo', current: current.balance, previous: previous.balance, invert: false },
    { label: 'Aportes em metas', current: contributions.current, previous: contributions.previous, invert: false },
  ];
  return (
    <Card>
      <CardHeader title="Comparação entre períodos" subtitle="Período selecionado vs período anterior equivalente" />
      <div className={styles.tableWrap}>
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
      </div>
    </Card>
  );
}

/* ---------- Distribuição de despesas ---------- */

export function DistributionCard({ distribution, total }: { distribution: readonly CategoryShare[]; total: Cents }) {
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
        <ShareBreakdown
          items={distribution.map((d) => ({ key: d.categoryId, name: d.name, icon: d.icon, amount: d.amount, share: d.share }))}
          total={total}
          othersLabel="Outras áreas"
          centerLabel={['área', 'áreas']}
          ariaLabel="Distribuição de despesas"
        />
      )}
    </Card>
  );
}

/* ---------- Insights ---------- */

export function InsightsCard({ indicators }: { indicators: PeriodIndicators }) {
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
      text: indicators.days ? `Considerando ${indicators.days} dia(s) decorridos no período.` : 'Período ainda não iniciado.',
      tone: styles.insightNeutral,
      money: true,
    },
  ];

  return (
    <section className={styles.insights} aria-labelledby="insights-title">
      <h3 id="insights-title">Hábitos de gastos</h3>
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
