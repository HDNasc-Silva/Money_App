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
  /**
   * Compra parcelada (DT-026): identifica o grupo de parcelas geradas juntas. Cada parcela é um
   * `Transaction` independente — editar ou excluir uma não afeta as demais.
   */
  installmentGroupId?: string;
  /** Posição da parcela (1-based) dentro do grupo. */
  installmentIndex?: number;
  /** Quantidade total de parcelas do grupo. */
  installmentTotal?: number;
  /** Empréstimo (Agiotagem, DT-026) que gerou esta receita automaticamente. Ausente em lançamentos manuais. */
  loanId?: string;
  /** Mês de referência da parcela do empréstimo; chave de idempotência junto com `loanId`. */
  loanMonth?: MonthKey;
  /** Mês de referência da renda mensal gerada automaticamente (DT-028); chave de idempotência. */
  incomeMonth?: MonthKey;
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

/**
 * Empréstimo informal a terceiros ("Agiotagem", DT-026): registro de que um valor foi
 * emprestado e de quando ele deve voltar — em um único mês ou parcelado em N meses. Não debita
 * o saldo ao ser criado (o dinheiro já tinha saído do bolso antes do app existir); cada parcela
 * gera uma receita real quando o mês do pagamento chega (mesmo padrão de materialização das
 * assinaturas, DT-017, mas finito).
 */
export interface Loan {
  id: string;
  /** Nome livre de quem pegou o dinheiro. */
  borrower: string;
  /** Valor de CADA parcela (ou o valor único, quando `installmentTotal` é 1). */
  amount: Cents;
  /** Categoria de receita dos lançamentos gerados quando as parcelas são recebidas. */
  categoryId: string;
  /** Data em que o dinheiro foi emprestado (apenas registro; não gera lançamento). */
  loanDate: IsoDate;
  /** Primeiro mês em que o pagamento é esperado. */
  firstMonth: MonthKey;
  /** Quantidade de parcelas esperadas; `1` = pagamento único. */
  installmentTotal: number;
  /** Meses que não devem ser lançados (o usuário excluiu o lançamento gerado). */
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
  /**
   * Liga/desliga os alertas de "limite próximo" e "limite ultrapassado" desta categoria
   * (ver DT-025); padrão `true`. Não afeta os demais tipos de alerta (ex.: gastos em alta, metas).
   */
  alertsEnabled: boolean;
  /** Posição na ordem definida pelo usuário (arrastar e soltar, DT-025); menor = primeiro. */
  order: number;
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
  /**
   * Renda mensal informada pelo usuário; 0 = não informada. Quando > 0, vira uma receita automática
   * no dia 1º de cada mês (DT-028).
   */
  monthlyIncome: Cents;
  /** Primeiro mês em que a renda é lançada; `null` = renda não informada (nada é gerado). */
  incomeStartMonth: MonthKey | null;
  /** Meses cuja renda não deve ser lançada (o usuário excluiu o lançamento gerado). */
  incomeSkippedMonths: MonthKey[];
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
  /** Empréstimos a terceiros ("Agiotagem", DT-026). */
  loans: Loan[];
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
  incomeStartMonth: null,
  incomeSkippedMonths: [],
  hideBalances: false,
  isDemoData: false,
  onboardingCompleted: true,
};

export const EMPTY_DATA: FinanceData = {
  transactions: [],
  categories: [],
  goals: [],
  subscriptions: [],
  loans: [],
  settings: DEFAULT_SETTINGS,
};
