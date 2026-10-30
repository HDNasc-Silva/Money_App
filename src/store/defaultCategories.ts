import type { Category, TransactionType } from '@/models';
import { normalizeText } from '@/utils/format';
import { fromReais } from '@/utils/money';

/**
 * CATEGORIAS PADRÃO.
 * Conjunto inicial usado pelos dados de demonstração, ao apagar todos os dados ("começar do zero")
 * e na recuperação de quem ficou sem categorias. Os ids são estáveis para que os lançamentos de
 * demonstração possam referenciá-los.
 */

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
  { id: 'cat-other', name: 'Outros', description: 'Reservas pontuais e pequenas demandas', icon: 'category', kind: 'expense', group: 'lifestyle', limit: 300 },
  { id: 'cat-salary', name: 'Salário', description: 'Receita principal', icon: 'account_balance_wallet', kind: 'income', group: 'essential', limit: null },
  { id: 'cat-freelance', name: 'Freelance', description: 'Trabalhos extras', icon: 'payments', kind: 'income', group: 'lifestyle', limit: null },
  { id: 'cat-yield', name: 'Rendimentos', description: 'Juros e investimentos', icon: 'savings', kind: 'income', group: 'lifestyle', limit: null },
];

/** Cria as categorias padrão com a data de criação informada. */
export function buildDefaultCategories(createdAt: string): Category[] {
  return DEFINITIONS.map(({ limit, ...definition }) => ({
    ...definition,
    monthlyLimit: limit === null ? null : fromReais(limit),
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
  return buildDefaultCategories(createdAt)
    .filter((c) => !names.has(nameKey(c.kind, c.name)))
    .map((c) => (ids.has(c.id) ? { ...c, id: newId() } : c));
}
