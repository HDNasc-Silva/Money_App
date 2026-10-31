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
  /** Renda mensal informada pelo usuário (referência para a meta de poupança); 0 = não informada. */
  monthlyIncome: Cents;
  /** Meta de taxa de poupança, em pontos percentuais (0–100). */
  savingsTarget: number;
  hideBalances: boolean;
  isDemoData: boolean;
  /** `false` só num primeiro acesso, até o usuário concluir a tela de boas-vindas (ver DT-014). */
  onboardingCompleted: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
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
  savingsTarget: 20,
  hideBalances: false,
  isDemoData: false,
  onboardingCompleted: true,
};

export const EMPTY_DATA: FinanceData = {
  transactions: [],
  categories: [],
  goals: [],
  settings: DEFAULT_SETTINGS,
};
