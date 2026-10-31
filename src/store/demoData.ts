import { syncSubscriptionCharges } from '@/domain/subscriptions';
import {
  DEFAULT_SETTINGS,
  type FinanceData,
  type Goal,
  type IsoDate,
  type MonthKey,
  type Subscription,
  type Transaction,
  type TransactionType,
} from '@/models';
import { addMonths, daysInMonth, lastDayOfMonth, monthKeyOf } from '@/utils/dates';
import { fromReais } from '@/utils/money';
import { buildDefaultCategories, SUBSCRIPTIONS_CATEGORY_ID } from './defaultCategories';

/**
 * DADOS DE DEMONSTRAÇÃO.
 * Gerados de forma determinística relativa à data atual (últimos 6 meses), para que todas as telas
 * tenham conteúdo. Carregados apenas a pedido do usuário (Ajustes → "Carregar dados de demonstração");
 * são sinalizados por `settings.isDemoData` e podem ser apagados em Ajustes.
 */

const CREATED_AT = '2020-01-01T00:00:00.000Z';

/** Os lançamentos de demonstração usam os ids estáveis das categorias padrão (`cat-food`, `cat-salary`…). */
const DEMO_CATEGORIES = buildDefaultCategories(CREATED_AT);

/** Gerador pseudoaleatório determinístico (mulberry32). */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Entry {
  day: number;
  type: TransactionType;
  description: string;
  categoryId: string;
  amount: number;
}

function monthEntries(random: () => number, monthIndex: number): Entry[] {
  const vary = (base: number, spread: number) => Math.round((base + (random() - 0.5) * spread) * 100) / 100;
  const entries: Entry[] = [
    { day: 5, type: 'income', description: 'Salário Mensal', categoryId: 'cat-salary', amount: 7500 },
    { day: 10, type: 'expense', description: 'Aluguel & Condomínio', categoryId: 'cat-home', amount: 1100 },
    { day: 12, type: 'expense', description: 'Conta de Luz', categoryId: 'cat-home', amount: vary(160, 60) },
    { day: 15, type: 'expense', description: 'Internet Fibra', categoryId: 'cat-home', amount: 99.9 },
    { day: 3, type: 'expense', description: 'Supermercado Pão de Açúcar', categoryId: 'cat-food', amount: vary(320, 120) },
    { day: 11, type: 'expense', description: 'Feira Livre', categoryId: 'cat-food', amount: vary(90, 40) },
    { day: 17, type: 'expense', description: 'Supermercado Extra', categoryId: 'cat-food', amount: vary(290, 140) },
    { day: 24, type: 'expense', description: 'Restaurante Japonês', categoryId: 'cat-food', amount: vary(180, 120) },
    { day: 27, type: 'expense', description: 'Padaria e Hortifruti', categoryId: 'cat-food', amount: vary(140, 80) },
    { day: 7, type: 'expense', description: 'Posto Ipiranga Combustível', categoryId: 'cat-transport', amount: vary(180, 60) },
    { day: 21, type: 'expense', description: 'Posto Shell Combustível', categoryId: 'cat-transport', amount: vary(170, 60) },
    { day: 14, type: 'expense', description: 'Farmácia Droga Raia', categoryId: 'cat-health', amount: vary(85, 60) },
    { day: 20, type: 'expense', description: 'Cinema e Restaurante', categoryId: 'cat-leisure', amount: vary(115, 70) },
    { day: 28, type: 'income', description: 'Rendimento CDB', categoryId: 'cat-yield', amount: vary(60, 30) },
  ];
  if (monthIndex % 2 === 0) {
    entries.push({ day: 18, type: 'income', description: 'Projeto Freelance Design UI', categoryId: 'cat-freelance', amount: vary(900, 600) });
  }
  if (monthIndex % 3 === 1) {
    entries.push({ day: 22, type: 'expense', description: 'Curso Online', categoryId: 'cat-education', amount: vary(120, 60) });
  }
  if (monthIndex % 2 === 1) {
    entries.push({ day: 25, type: 'expense', description: 'Presente de Aniversário', categoryId: 'cat-other', amount: vary(110, 80) });
  }
  return entries;
}

const goal = (
  id: string,
  name: string,
  description: string,
  icon: string,
  target: number,
  initial: number,
  monthly: number,
  deadline: IsoDate | null,
  contributions: Goal['contributions'],
): Goal => ({
  id,
  name,
  description,
  icon,
  targetAmount: fromReais(target),
  initialAmount: fromReais(initial),
  monthlyContribution: fromReais(monthly),
  deadline,
  contributions,
  createdAt: CREATED_AT,
});

const subscription = (
  id: string,
  name: string,
  icon: string,
  amount: number,
  billingDay: number,
  startMonth: MonthKey,
): Subscription => ({
  id,
  name,
  icon,
  amount: fromReais(amount),
  billingDay,
  categoryId: SUBSCRIPTIONS_CATEGORY_ID,
  active: true,
  startMonth,
  endMonth: null,
  skippedMonths: [],
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
});

/**
 * Assinaturas de demonstração desde 5 meses atrás, com as cobranças lançadas pela mesma regra do app
 * (DT-017). O YouTube Premium foi pausado há 2 meses: tem histórico até então e os meses seguintes ignorados.
 */
function demoSubscriptions(currentMonth: MonthKey, today: IsoDate, transactions: Transaction[]) {
  const start = addMonths(currentMonth, -5);
  const all = [
    subscription('sub-netflix', 'Netflix', 'live_tv', 44.9, 8, start),
    subscription('sub-spotify', 'Spotify', 'library_music', 21.9, 15, start),
    subscription('sub-prime', 'Amazon Prime', 'local_shipping', 19.9, 22, start),
    subscription('sub-claude', 'Claude Pro', 'smart_toy', 99.9, 3, start),
    subscription('sub-icloud', 'iCloud+', 'cloud', 4.9, 27, start),
    subscription('sub-youtube', 'YouTube Premium', 'play_circle', 26.9, 12, start),
  ];
  const beforePause = syncSubscriptionCharges(all, transactions, lastDayOfMonth(addMonths(currentMonth, -3)), CREATED_AT);
  const paused = beforePause.subscriptions.map((s) => (s.id === 'sub-youtube' ? { ...s, active: false } : s));
  return syncSubscriptionCharges(paused, beforePause.transactions, today, CREATED_AT);
}

export function buildDemoData(today: IsoDate): FinanceData {
  const currentMonth = monthKeyOf(today);
  const todayDay = Number(today.slice(8, 10));
  const transactions: Transaction[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const month = addMonths(currentMonth, -offset);
    const monthIndex = 5 - offset;
    const random = seededRandom(Number(month.replace('-', '')));
    for (const [index, entry] of monthEntries(random, monthIndex).entries()) {
      const day = Math.min(entry.day, daysInMonth(month));
      if (offset === 0 && day > todayDay) continue;
      const date = `${month}-${String(day).padStart(2, '0')}`;
      const timestamp = `${date}T12:00:${String(index).padStart(2, '0')}.000Z`;
      transactions.push({
        id: `demo-${month}-${index}`,
        type: entry.type,
        description: entry.description,
        amount: fromReais(entry.amount),
        date,
        categoryId: entry.categoryId,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }

  const year = Number(currentMonth.slice(0, 4));
  /** Aportes no dia 6 dos meses indicados (meses atrás); o do mês atual só entra se o dia 6 já passou. */
  const contributions = (goalKey: string, amount: number, monthsAgo: readonly number[]): Goal['contributions'] =>
    monthsAgo
      .filter((ago) => ago > 0 || todayDay >= 6)
      .map((ago) => ({ id: `demo-contrib-${goalKey}-${ago}`, amount: fromReais(amount), date: `${addMonths(currentMonth, -ago)}-06` }));

  const withSubscriptions = demoSubscriptions(currentMonth, today, transactions);

  return {
    transactions: withSubscriptions.transactions,
    categories: DEMO_CATEGORIES,
    subscriptions: withSubscriptions.subscriptions,
    goals: [
      goal('goal-emergency', 'Reserva de Emergência', 'Segurança Financeira', 'shield', 10000, 4500, 500, `${year + 1}-06-30`, contributions('emergency', 500, [5, 4, 3, 2, 1, 0])),
      goal('goal-trip', 'Viagem de Férias', 'Lazer & Descanso', 'flight_takeoff', 6000, 2000, 400, `${year + 1}-07-31`, contributions('trip', 400, [4, 3, 2, 1])),
      goal('goal-notebook', 'Upgrade Notebook', 'Trabalho & Produção', 'laptop_mac', 5000, 2400, 300, `${year + 1}-10-31`, contributions('notebook', 300, [2, 1])),
      goal('goal-room', 'Reforma do Quarto', 'Moradia & Bem-estar', 'format_paint', 5000, 600, 250, `${year + 1}-12-31`, []),
    ],
    // Sem nome fixo: ao carregar a demonstração, o FinanceProvider mantém o perfil do usuário.
    settings: { ...DEFAULT_SETTINGS, isDemoData: true },
  };
}
