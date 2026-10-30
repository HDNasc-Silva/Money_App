import type { Cents } from '@/models';

export const MAX_AMOUNT: Cents = 99_999_999_999;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

/** Normaliza o espaço não separável do Intl para espaço comum. */
const normalizeSpaces = (text: string): string => text.replace(/\s/g, ' ');

export interface FormatOptions {
  /** Prefixa `+` ou `−` conforme o sinal. */
  signed?: boolean;
  /** Sem centavos (ex.: `R$ 8.200`). */
  compact?: boolean;
  /** Sem o prefixo `R$`. */
  bare?: boolean;
}

export function formatCurrency(cents: Cents, options: FormatOptions = {}): string {
  const value = Math.abs(cents) / 100;
  let body: string;
  if (options.compact) body = `R$ ${compactFormatter.format(Math.round(value))}`;
  else if (options.bare) body = numberFormatter.format(value);
  else body = normalizeSpaces(currencyFormatter.format(value));
  if (options.compact && options.bare) body = compactFormatter.format(Math.round(value));

  if (options.signed) {
    if (cents > 0) return `+ ${body}`;
    if (cents < 0) return `− ${body}`;
    return body;
  }
  return cents < 0 ? `−${body}` : body;
}

/**
 * Converte o texto digitado pelo usuário ("1.234,56", "1234.5", "R$ 10") em centavos.
 * Retorna `null` se o texto não representar um número válido.
 */
export function parseMoney(input: string): Cents | null {
  const cleaned = input.replace(/[R$\s]/g, '');
  if (!cleaned) return null;

  let normalized = cleaned;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if ((cleaned.match(/\./g) ?? []).length > 1) {
    normalized = cleaned.replace(/\./g, '');
  } else if (/^\d{1,3}\.\d{3}$/.test(cleaned)) {
    // "1.234" no padrão brasileiro é milhar, não decimal.
    normalized = cleaned.replace('.', '');
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Formata centavos para preencher um campo de edição ("1234,56"). */
export function centsToInput(cents: Cents): string {
  return numberFormatter.format(cents / 100).replace(/\./g, '');
}

export const fromReais = (reais: number): Cents => Math.round(reais * 100);

export const sumCents = (values: readonly Cents[]): Cents =>
  values.reduce((total, value) => total + value, 0);
