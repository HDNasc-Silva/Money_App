import { useState } from 'react';
import { ChartDetails } from './ChartDetails';
import type { ChartDatum, ChartSeries } from './chartTypes';
import styles from './Charts.module.css';

interface LineChartProps {
  data: readonly ChartDatum[];
  series: ChartSeries;
  format(value: number): string;
  ariaLabel: string;
  height?: number;
}

const WIDTH = 320;
const PADDING_X = 14;
const TOP_GAP = 12;
const AXIS_GAP = 20;

/** Linha com área preenchida; aceita valores negativos (linha de zero tracejada). */
export function LineChart({ data, series, format, ariaLabel, height = 150 }: LineChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const values = data.map((d) => d.values[series.key] ?? 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const plotHeight = height - TOP_GAP - AXIS_GAP;
  const step = data.length > 1 ? (WIDTH - PADDING_X * 2) / (data.length - 1) : 0;
  const x = (index: number) => (data.length > 1 ? PADDING_X + step * index : WIDTH / 2);
  const y = (value: number) => TOP_GAP + plotHeight - ((value - min) / range) * plotHeight;
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const zeroY = y(0);
  const area = values.length ? `${x(0)},${zeroY} ${points} ${x(values.length - 1)},${zeroY}` : '';
  const active = selected ?? (data.length ? data.length - 1 : null);
  const gradientId = `line-${series.key}`;

  return (
    <div className={styles.chart}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className={styles.svg} role="group" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={series.color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={series.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <line x1={0} x2={WIDTH} y1={zeroY} y2={zeroY} className={styles.gridLine} />
        {area && <polygon points={area} fill={`url(#${gradientId})`} />}
        <polyline points={points} fill="none" stroke={series.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((datum, index) => (
          <g
            key={datum.label}
            className={styles.group}
            tabIndex={0}
            role="button"
            aria-label={`${datum.detailLabel ?? datum.label}: ${format(values[index] ?? 0)}`}
            aria-pressed={active === index}
            onMouseEnter={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onClick={() => setSelected(index)}
          >
            <rect x={x(index) - step / 2} y={0} width={Math.max(step, 24)} height={height} fill="transparent" />
            <circle
              cx={x(index)}
              cy={y(values[index] ?? 0)}
              r={active === index ? 5 : 3}
              fill={active === index ? series.color : 'var(--color-surface)'}
              stroke={series.color}
              strokeWidth={2}
            />
            <text x={x(index)} y={height - 4} textAnchor="middle" className={[styles.axisLabel, active === index && styles.axisLabelActive].filter(Boolean).join(' ')}>
              {datum.label}
            </text>
          </g>
        ))}
      </svg>
      <ChartDetails datum={active !== null ? data[active] : undefined} series={[series]} format={format} hint="Toque em um ponto para ver o valor." />
    </div>
  );
}
