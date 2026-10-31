/** Valor monetário em centavos inteiros (ver DT-006). */
export type Cents = number;

/** Data no formato ISO `YYYY-MM-DD`, sem fuso horário. */
export type IsoDate = string;

/** Mês no formato `YYYY-MM`. */
export type MonthKey = string;

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: Cents;
  date: IsoDate;
  categoryId: string;
  note?: string;
  /** Assinatura que gerou este lançamento automaticamente (DT-017). Ausente em lançamentos manuais. */
  subscriptionId?: string;
  /** Mês de referência da cobrança gerada; chave de idempotência junto com `subscriptionId`. */
  subscriptionMonth?: MonthKey;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assinatura mensal (streaming, música, nuvem, IA...). Cada mês cobrado vira um lançamento de despesa
 * real, gerado no dia de cobrança quando a data chega (DT-017).
 */
export interface Subscription {
  id: string;
  name: string;
  icon: string;
  /** Valor mensal; alterá-lo afeta só os meses ainda não lançados. */
  amount: Cents;
  /** Dia de cobrança (1–31); em meses mais curtos, vale o último dia do mês. */
  billingDay: number;
  /** Categoria de despesa dos lançamentos gerados. */
  categoryId: string;
  /** `false` = pausada: meses cuja cobrança chega durante a pausa não são lançados. */
  active: boolean;
  /** Primeiro mês cobrado. */
  startMonth: MonthKey;
  /** Último mês cobrado (assinatura cancelada); `null` = sem fim. */
  endMonth: MonthKey | null;
  /** Meses que não devem ser lançados: lançamento excluído pelo usuário ou cobrança durante a pausa. */
  skippedMonths: MonthKey[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CategoryGroup = 'essential' | 'lifestyle';

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  kind: TransactionType;
  group: CategoryGroup;
  /** Limite mensal; `null` = sem limite. Só se aplica a categorias de despesa. */
  monthlyLimit: Cents | null;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  amount: Cents;
  date: IsoDate;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetAmount: Cents;
  /** Valor já guardado antes dos aportes registrados no app. */
  initialAmount: Cents;
  contributions: GoalContribution[];
  /** Aporte mensal planejado, usado na previsão de conclusão. */
  monthlyContribution: Cents;
  deadline: IsoDate | null;
  createdAt: string;
}

export interface Settings {
  userName: string;
  /** Renda mensal informada pelo usuário (apenas referência no perfil); 0 = não informada. */
  monthlyIncome: Cents;
  hideBalances: boolean;
  isDemoData: boolean;
  /** `false` só num primeiro acesso, até o usuário concluir a tela de boas-vindas (ver DT-014). */
  onboardingCompleted: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  subscriptions: Subscription[];
  settings: Settings;
}

export interface Period {
  start: IsoDate;
  end: IsoDate;
}

/** Limite de caracteres do nome do usuário (onboarding, Ajustes e saneamento do storage). */
export const USER_NAME_MAX = 40;

/**
 * Valores padrão, também usados para completar documentos salvos por versões anteriores.
 * `onboardingCompleted` é `true` aqui de propósito: quem já tem dados salvos não deve ser
 * interrompido pela tela de boas-vindas. O primeiro acesso usa `buildInitialData` (onboarding pendente).
 */
export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  monthlyIncome: 0,
  hideBalances: false,
  isDemoData: false,
  onboardingCompleted: true,
};

export const EMPTY_DATA: FinanceData = {
  transactions: [],
  categories: [],
  goals: [],
  subscriptions: [],
  settings: DEFAULT_SETTINGS,
};
