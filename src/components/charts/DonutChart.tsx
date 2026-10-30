import styles from './Charts.module.css';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: readonly DonutSlice[];
  centerValue: string;
  centerLabel: string;
  ariaLabel: string;
  activeKey?: string | null;
  onSelect?(key: string | null): void;
  size?: number;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 1.5;

export function DonutChart({ slices, centerValue, centerLabel, ariaLabel, activeKey = null, onSelect, size = 120 }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className={styles.donut} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel} className={styles.donutSvg}>
        <circle cx={50} cy={50} r={RADIUS} fill="none" stroke="var(--color-track)" strokeWidth={12} />
        {total > 0 &&
          slices.map((slice) => {
            const length = (slice.value / total) * CIRCUMFERENCE;
            const dash = Math.max(length - (slices.length > 1 ? GAP : 0), 0);
            const circle = (
              <circle
                key={slice.key}
                cx={50}
                cy={50}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={activeKey === slice.key ? 15 : 12}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
                className={[styles.slice, activeKey && activeKey !== slice.key && styles.dimmed].filter(Boolean).join(' ')}
                onMouseEnter={() => onSelect?.(slice.key)}
                onMouseLeave={() => onSelect?.(null)}
              />
            );
            offset += length;
            return circle;
          })}
      </svg>
      <div className={styles.donutCenter}>
        <strong className="money">{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}
