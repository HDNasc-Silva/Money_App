export interface ChartSeries {
  key: string;
  name: string;
  /** Cor CSS (de preferência um token: `var(--color-income-strong)`). */
  color: string;
}

export interface ChartDatum {
  label: string;
  /** Rótulo completo para o painel de detalhes (ex.: "Semana 2 (8–14)"). */
  detailLabel?: string;
  values: Record<string, number>;
}

/** Arredonda o máximo do eixo para um valor "redondo" acima do maior dado. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}
