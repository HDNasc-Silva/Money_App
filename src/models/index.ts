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
  /** Meta de taxa de poupança, em pontos percentuais (0–100). */
  savingsTarget: number;
  hideBalances: boolean;
  isDemoData: boolean;
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

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  savingsTarget: 20,
  hideBalances: false,
  isDemoData: false,
};

export const EMPTY_DATA: FinanceData = {
  transactions: [],
  categories: [],
  goals: [],
  settings: DEFAULT_SETTINGS,
};
