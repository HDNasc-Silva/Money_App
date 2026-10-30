import type { Category, FinanceData, Goal, IsoDate, Transaction, TransactionType } from '@/models';
import { addMonths, daysInMonth, monthKeyOf } from '@/utils/dates';
import { fromReais } from '@/utils/money';

/**
 * DADOS DE DEMONSTRAÇÃO.
 * Gerados de forma determinística relativa à data atual (últimos 6 meses), para que todas as telas
 * tenham conteúdo na primeira execução. São sinalizados por `settings.isDemoData` e podem ser
 * apagados em Ajustes.
 */

const CREATED_AT = '2020-01-01T00:00:00.000Z';

const category = (
  id: string,
  name: string,
  description: string,
  icon: string,
  kind: TransactionType,
  group: Category['group'],
  limit: number | null,
): Category => ({
  id,
  name,
  description,
  icon,
  kind,
  group,
  monthlyLimit: limit === null ? null : fromReais(limit),
  createdAt: CREATED_AT,
});

export const DEMO_CATEGORIES: Category[] = [
  category('cat-food', 'Alimentação', 'Mercado, feira e refeições diárias', 'restaurant', 'expense', 'essential', 1200),
  category('cat-home', 'Moradia', 'Aluguel, contas fixas e condomínio', 'home', 'expense', 'essential', 1300),
  category('cat-transport', 'Transporte', 'Combustível, passagens e manutenção', 'directions_car', 'expense', 'essential', 600),
  category('cat-leisure', 'Lazer', 'Passeios, cinema e entretenimento', 'sports_esports', 'expense', 'lifestyle', 400),
  category('cat-health', 'Saúde', 'Medicamentos, consultas e cuidados', 'health_and_safety', 'expense', 'essential', 300),
  category('cat-education', 'Educação', 'Livros, cursos e workshops', 'school', 'expense', 'lifestyle', 200),
  category('cat-other', 'Outros', 'Reservas pontuais e pequenas demandas', 'category', 'expense', 'lifestyle', 300),
  category('cat-salary', 'Salário', 'Receita principal', 'account_balance_wallet', 'income', 'essential', null),
  category('cat-freelance', 'Freelance', 'Trabalhos extras', 'payments', 'income', 'lifestyle', null),
  category('cat-yield', 'Rendimentos', 'Juros e investimentos', 'savings', 'income', 'lifestyle', null),
];

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
    { day: 8, type: 'expense', description: 'Assinatura Streaming', categoryId: 'cat-leisure', amount: 55.9 },
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
  const contribution = (monthsAgo: number, amount: number) => ({
    id: `demo-contrib-${monthsAgo}-${amount}`,
    amount: fromReais(amount),
    date: `${addMonths(currentMonth, -monthsAgo)}-06`,
  });

  return {
    transactions,
    categories: DEMO_CATEGORIES,
    goals: [
      goal('goal-emergency', 'Reserva de Emergência', 'Segurança Financeira', 'shield', 10000, 7000, 500, `${year + 1}-06-30`, [contribution(2, 500), contribution(1, 500)]),
      goal('goal-trip', 'Viagem de Férias', 'Lazer & Descanso', 'flight_takeoff', 6000, 3000, 400, `${year + 1}-07-31`, [contribution(1, 800)]),
      goal('goal-notebook', 'Upgrade Notebook', 'Trabalho & Produção', 'laptop_mac', 5000, 2400, 300, `${year + 1}-10-31`, []),
      goal('goal-room', 'Reforma do Quarto', 'Moradia & Bem-estar', 'format_paint', 5000, 600, 250, `${year + 1}-12-31`, []),
    ],
    settings: { userName: 'Gabriel', savingsTarget: 50, hideBalances: false, isDemoData: true },
  };
}
