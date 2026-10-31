import type { DonutSlice } from '@/components/charts/DonutChart';

/** Quantidade de itens exibidos individualmente em roscas e gráficos empilhados; o resto vira "Outras". */
export const MAX_SLICES = 5;

/** Cor da paleta de gráficos do tema (`--chart-1` a `--chart-7`). */
export const sliceColor = (index: number): string => `var(--chart-${(index % 7) + 1})`;

export interface SliceInput {
  key: string;
  label: string;
  value: number;
}

/** Mantém os `MAX_SLICES` primeiros itens (já ordenados) e agrupa o restante em `othersLabel`. */
export function groupSlices(items: readonly SliceInput[], othersLabel: string): DonutSlice[] {
  const top = items.slice(0, MAX_SLICES).map((item, i) => ({ ...item, color: sliceColor(i) }));
  const rest = items.slice(MAX_SLICES);
  if (rest.length === 0) return top;
  return [...top, { key: 'others', label: othersLabel, value: rest.reduce((sum, item) => sum + item.value, 0), color: sliceColor(MAX_SLICES) }];
}
