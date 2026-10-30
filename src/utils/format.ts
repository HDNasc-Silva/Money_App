const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Formata uma razão (0.591) como "59,1%". */
export const formatPercent = (ratio: number): string => `${percentFormatter.format(ratio * 100)}%`;

/** Formata uma razão com sinal ("+7,4%" / "−3,0%"). */
export function formatSignedPercent(ratio: number): string {
  const text = formatPercent(Math.abs(ratio));
  if (ratio > 0) return `+${text}`;
  if (ratio < 0) return `−${text}`;
  return text;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Iniciais do nome para o avatar ("Gabriel Souza" → "GS"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Normaliza texto para busca: minúsculas e sem acentos. */
export const normalizeText = (text: string): string =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
