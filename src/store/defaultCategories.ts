import type { Category, TransactionType } from '@/models';
import { normalizeText } from '@/utils/format';
import { fromReais } from '@/utils/money';

/**
 * CATEGORIAS PADRÃO.
 * Conjunto inicial usado pelos dados de demonstração, ao apagar todos os dados ("começar do zero")
 * e na recuperação de quem ficou sem categorias. Os ids são estáveis para que os lançamentos de
 * demonstração possam referenciá-los.
 */

/** Categoria padrão sugerida para as assinaturas (v1.6.0, DT-017). */
export const SUBSCRIPTIONS_CATEGORY_ID = 'cat-subscriptions';
export const SUBSCRIPTIONS_CATEGORY_NAME = 'Assinaturas';

interface DefaultCategoryDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  kind: TransactionType;
  group: Category['group'];
  /** Limite mensal em reais; `null` = sem limite. */
  limit: number | null;
}

const DEFINITIONS: readonly DefaultCategoryDefinition[] = [
  { id: 'cat-food', name: 'Alimentação', description: 'Mercado, feira e refeições diárias', icon: 'restaurant', kind: 'expense', group: 'essential', limit: 1200 },
  { id: 'cat-home', name: 'Moradia', description: 'Aluguel, contas fixas e condomínio', icon: 'home', kind: 'expense', group: 'essential', limit: 1300 },
  { id: 'cat-transport', name: 'Transporte', description: 'Combustível, passagens e manutenção', icon: 'directions_car', kind: 'expense', group: 'essential', limit: 600 },
  { id: 'cat-leisure', name: 'Lazer', description: 'Passeios, cinema e entretenimento', icon: 'sports_esports', kind: 'expense', group: 'lifestyle', limit: 400 },
  { id: 'cat-health', name: 'Saúde', description: 'Medicamentos, consultas e cuidados', icon: 'health_and_safety', kind: 'expense', group: 'essential', limit: 300 },
  { id: 'cat-education', name: 'Educação', description: 'Livros, cursos e workshops', icon: 'school', kind: 'expense', group: 'lifestyle', limit: 200 },
  { id: SUBSCRIPTIONS_CATEGORY_ID, name: SUBSCRIPTIONS_CATEGORY_NAME, description: 'Streaming, música, nuvem e apps mensais', icon: 'subscriptions', kind: 'expense', group: 'lifestyle', limit: 250 },
  { id: 'cat-other', name: 'Outros', description: 'Reservas pontuais e pequenas demandas', icon: 'category', kind: 'expense', group: 'lifestyle', limit: 300 },
  { id: 'cat-salary', name: 'Salário', description: 'Receita principal', icon: 'account_balance_wallet', kind: 'income', group: 'essential', limit: null },
  { id: 'cat-freelance', name: 'Freelance', description: 'Trabalhos extras', icon: 'payments', kind: 'income', group: 'lifestyle', limit: null },
  { id: 'cat-yield', name: 'Rendimentos', description: 'Juros e investimentos', icon: 'savings', kind: 'income', group: 'lifestyle', limit: null },
];

/** Cria as categorias padrão com a data de criação informada. */
export function buildDefaultCategories(createdAt: string): Category[] {
  return DEFINITIONS.map(({ limit, ...definition }, index) => ({
    ...definition,
    monthlyLimit: limit === null ? null : fromReais(limit),
    alertsEnabled: true,
    order: index,
    createdAt,
  }));
}

const nameKey = (kind: TransactionType, name: string) => `${kind}:${normalizeText(name)}`;

/**
 * Categorias padrão que ainda não existem (mesmo tipo e mesmo nome, sem acento e sem diferenciar
 * maiúsculas — regra 16). Se o id padrão já estiver em uso por outra categoria, recebe um id novo
 * para nunca sobrescrever dados do usuário.
 */
export function missingDefaultCategories(
  existing: readonly Category[],
  createdAt: string,
  newId: () => string,
): Category[] {
  const names = new Set(existing.map((c) => nameKey(c.kind, c.name)));
  const ids = new Set(existing.map((c) => c.id));
  const nextOrder = existing.reduce((max, c) => Math.max(max, c.order), -1) + 1;
  return buildDefaultCategories(createdAt)
    .filter((c) => !names.has(nameKey(c.kind, c.name)))
    .map((c, index) => ({ ...c, order: nextOrder + index }))
    .map((c) => (ids.has(c.id) ? { ...c, id: newId() } : c));
}

/** Categoria de despesa chamada "Assinaturas" (sem acento e sem diferenciar maiúsculas), se existir. */
export function findSubscriptionsCategory(categories: readonly Category[]): Category | undefined {
  const key = nameKey('expense', SUBSCRIPTIONS_CATEGORY_NAME);
  return categories.find((c) => nameKey(c.kind, c.name) === key);
}

/** A categoria padrão "Assinaturas" pronta para ser criada, seguindo as mesmas regras de `missingDefaultCategories`. */
export function subscriptionsCategoryToCreate(
  existing: readonly Category[],
  createdAt: string,
  newId: () => string,
): Category | null {
  return missingDefaultCategories(existing, createdAt, newId).find((c) => c.name === SUBSCRIPTIONS_CATEGORY_NAME) ?? null;
}
