import styles from './ProgressBar.module.css';

export type ProgressTone = 'default' | 'good' | 'warning' | 'danger' | 'muted';

interface ProgressBarProps {
  /** 0–1 (valores acima de 1 preenchem a barra inteira). */
  value: number;
  tone?: ProgressTone;
  label: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, tone = 'default', label, size = 'md' }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 1000) / 10;
  return (
    <div
      className={[styles.track, styles[size]].join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <div className={[styles.fill, styles[tone]].join(' ')} style={{ width: `${percent}%` }} />
    </div>
  );
}
