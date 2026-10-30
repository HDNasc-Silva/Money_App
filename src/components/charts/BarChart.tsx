import { useState } from 'react';
import { ChartDetails } from './ChartDetails';
import { niceMax, type ChartDatum, type ChartSeries } from './chartTypes';
import styles from './Charts.module.css';

interface BarChartProps {
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  /** `grouped` = barras lado a lado; `stacked` = empilhadas. */
  mode?: 'grouped' | 'stacked';
  format(value: number): string;
  ariaLabel: string;
  /** Índice destacado por padrão (ex.: mês atual). */
  highlightIndex?: number;
  height?: number;
}

const WIDTH = 320;
const AXIS_GAP = 18;
const TOP_GAP = 8;

export function BarChart({ data, series, mode = 'grouped', format, ariaLabel, highlightIndex, height = 150 }: BarChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const plotHeight = height - AXIS_GAP - TOP_GAP;

  const totals = data.map((d) =>
    mode === 'stacked'
      ? series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0)
      : Math.max(...series.map((s) => d.values[s.key] ?? 0)),
  );
  const max = niceMax(Math.max(...totals, 0));
  const slot = WIDTH / Math.max(data.length, 1);
  const barWidth = mode === 'stacked' ? Math.min(slot * 0.55, 34) : Math.min((slot * 0.6) / series.length, 18);
  const scale = (value: number) => (value / max) * plotHeight;
  const active = selected ?? highlightIndex ?? null;

  return (
    <div className={styles.chart}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className={styles.svg} role="group" aria-label={ariaLabel}>
        {[0.5, 0].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={WIDTH}
            y1={TOP_GAP + plotHeight * fraction}
            y2={TOP_GAP + plotHeight * fraction}
            className={styles.gridLine}
          />
        ))}
        <line x1={0} x2={WIDTH} y1={TOP_GAP + plotHeight} y2={TOP_GAP + plotHeight} className={styles.axisLine} />

        {data.map((datum, index) => {
          const center = slot * index + slot / 2;
          const isActive = active === index;
          const dimmed = active !== null && !isActive;
          let stackOffset = 0;
          const summary = series.map((s) => `${s.name} ${format(datum.values[s.key] ?? 0)}`).join(', ');
          return (
            <g
              key={datum.label}
              className={[styles.group, dimmed && styles.dimmed].filter(Boolean).join(' ')}
              tabIndex={0}
              role="button"
              aria-label={`${datum.detailLabel ?? datum.label}: ${summary}`}
              aria-pressed={isActive}
              onMouseEnter={() => setSelected(index)}
              onFocus={() => setSelected(index)}
              onClick={() => setSelected(index)}
            >
              <rect x={slot * index} y={0} width={slot} height={height} fill="transparent" />
              {series.map((s, seriesIndex) => {
                const value = datum.values[s.key] ?? 0;
                const barHeight = Math.max(scale(value), value > 0 ? 2 : 0);
                if (mode === 'stacked') {
                  const y = TOP_GAP + plotHeight - stackOffset - barHeight;
                  stackOffset += barHeight;
                  return <rect key={s.key} x={center - barWidth / 2} y={y} width={barWidth} height={barHeight} rx={3} fill={s.color} />;
                }
                const x = center - (barWidth * series.length + 3 * (series.length - 1)) / 2 + seriesIndex * (barWidth + 3);
                return (
                  <rect key={s.key} x={x} y={TOP_GAP + plotHeight - barHeight} width={barWidth} height={barHeight} rx={4} fill={s.color} />
                );
              })}
              <text x={center} y={height - 4} textAnchor="middle" className={[styles.axisLabel, isActive && styles.axisLabelActive].filter(Boolean).join(' ')}>
                {datum.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartDetails datum={active !== null ? data[active] : undefined} series={series} format={format} />
    </div>
  );
}
