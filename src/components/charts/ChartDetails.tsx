import type { ChartDatum, ChartSeries } from './chartTypes';
import styles from './Charts.module.css';

interface ChartDetailsProps {
  datum: ChartDatum | undefined;
  series: readonly ChartSeries[];
  format(value: number): string;
  hint?: string;
}

/** Painel de detalhes do item selecionado no gráfico (toque, clique, foco ou passar o mouse). */
export function ChartDetails({ datum, series, format, hint = 'Toque em uma barra para ver os valores.' }: ChartDetailsProps) {
  return (
    <div className={styles.details} aria-live="polite">
      {datum ? (
        <>
          <span className={styles.detailsLabel}>{datum.detailLabel ?? datum.label}</span>
          {series.map((s) => (
            <span key={s.key} className={styles.detailsValue}>
              <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
              {s.name}: <strong className="money">{format(datum.values[s.key] ?? 0)}</strong>
            </span>
          ))}
        </>
      ) : (
        <span className={styles.detailsHint}>{hint}</span>
      )}
    </div>
  );
}

export function ChartLegend({ series }: { series: readonly ChartSeries[] }) {
  return (
    <div className={styles.legend}>
      {series.map((s) => (
        <span key={s.key} className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
          {s.name}
        </span>
      ))}
    </div>
  );
}
