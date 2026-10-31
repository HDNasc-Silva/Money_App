import type { Category, Cents, IsoDate, Transaction, TransactionType } from '@/models';
import { addMonths, monthKeyOf } from '@/utils/dates';
import { normalizeText } from '@/utils/format';
import { sortByDateDesc } from './transactions';

/**
 * Regras do lançamento rápido (v1.7.0): ordem das categorias por uso e sugestões de descrição
 * a partir do histórico, com a categoria usada da última vez.
 */

/**
 * Categorias do tipo, das mais usadas para as menos usadas (desempate: uso mais recente e, por fim,
 * a ordem original do cadastro). Categorias nunca usadas mantêm a ordem do cadastro, no fim.
 */
export function categoriesByUsage(
  categories: readonly Category[],
  transactions: readonly Transaction[],
  type: TransactionType,
): Category[] {
  const count = new Map<string, number>();
  const lastUsed = new Map<string, string>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    count.set(t.categoryId, (count.get(t.categoryId) ?? 0) + 1);
    const previous = lastUsed.get(t.categoryId);
    if (!previous || t.date > previous) lastUsed.set(t.categoryId, t.date);
  }
  return categories
    .map((category, index) => ({ category, index }))
    .filter(({ category }) => category.kind === type)
    .sort(
      (a, b) =>
        (count.get(b.category.id) ?? 0) - (count.get(a.category.id) ?? 0) ||
        (lastUsed.get(b.category.id) ?? '').localeCompare(lastUsed.get(a.category.id) ?? '') ||
        a.index - b.index,
    )
    .map(({ category }) => category);
}

export interface DescriptionSuggestion {
  description: string;
  /** Categoria do lançamento mais recente com essa descrição. */
  categoryId: string;
}

/** Quantidade padrão de sugestões exibidas abaixo do campo de descrição. */
export const SUGGESTION_LIMIT = 4;

/**
 * Descrições já usadas no tipo que contêm o texto digitado (sem acento e sem diferenciar maiúsculas),
 * das mais recentes para as mais antigas, sem repetição. As que começam com o texto vêm primeiro.
 * Texto vazio ou igual a uma descrição existente não gera sugestões.
 */
export function descriptionSuggestions(
  transactions: readonly Transaction[],
  query: string,
  type: TransactionType,
  limit = SUGGESTION_LIMIT,
): DescriptionSuggestion[] {
  const wanted = normalizeText(query);
  if (!wanted) return [];
  const unique = new Map<string, DescriptionSuggestion>();
  for (const t of [...transactions].sort(sortByDateDesc)) {
    if (t.type !== type) continue;
    const key = normalizeText(t.description);
    if (!key.includes(wanted) || unique.has(key)) continue;
    unique.set(key, { description: t.description, categoryId: t.categoryId });
  }
  if (unique.has(wanted)) return [];
  const all = [...unique.entries()];
  const startsWith = all.filter(([key]) => key.startsWith(wanted));
  const contains = all.filter(([key]) => !key.startsWith(wanted));
  return [...startsWith, ...contains].slice(0, limit).map(([, suggestion]) => suggestion);
}

/** Tolerância de valor para considerar dois lançamentos "parecidos" (10%). */
const RECURRING_AMOUNT_TOLERANCE = 0.1;

/**
 * Lançamento do mês anterior, mesmo tipo e categoria, com descrição igual (sem acento/maiúsculas) e
 * valor parecido (±10%) — sinal de despesa/receita fixa (ex.: aluguel). Usado para sugerir "Marcar
 * como fixo/recorrente" no lançamento rápido. Ignora lançamentos já gerados por uma assinatura
 * (já são fixos) e entradas sem categoria, descrição ou valor.
 */
export function findRecurringCandidate(
  transactions: readonly Transaction[],
  type: TransactionType,
  categoryId: string,
  description: string,
  amount: Cents,
  date: IsoDate,
): Transaction | null {
  const wantedDescription = normalizeText(description);
  if (!categoryId || !wantedDescription || !amount) return null;
  const previousMonth = addMonths(monthKeyOf(date), -1);
  const tolerance = amount * RECURRING_AMOUNT_TOLERANCE;
  return (
    [...transactions]
      .sort(sortByDateDesc)
      .find(
        (t) =>
          !t.subscriptionId &&
          t.type === type &&
          t.categoryId === categoryId &&
          monthKeyOf(t.date) === previousMonth &&
          normalizeText(t.description) === wantedDescription &&
          Math.abs(t.amount - amount) <= tolerance,
      ) ?? null
  );
}

/** Categoria do lançamento mais recente do tipo com exatamente essa descrição (sem acento/maiúsculas). */
export function lastCategoryForDescription(
  transactions: readonly Transaction[],
  description: string,
  type: TransactionType,
): string | null {
  const wanted = normalizeText(description);
  if (!wanted) return null;
  const match = [...transactions]
    .sort(sortByDateDesc)
    .find((t) => t.type === type && normalizeText(t.description) === wanted);
  return match?.categoryId ?? null;
}
