import {
  USER_NAME_MAX,
  type Category,
  type CategoryGroup,
  type Cents,
  type Goal,
  type IsoDate,
  type MonthKey,
  type Settings,
  type Subscription,
  type Transaction,
  type TransactionType,
} from '@/models';
import { maxPlanningDate, maxPlanningMonth } from '@/domain/periods';
import { BILLING_DAY_MAX, BILLING_DAY_MIN, SUBSCRIPTION_BACKFILL_MONTHS } from '@/domain/subscriptions';
import { addMonths, formatDateBr, formatMonthLabel, isValidIso, monthKeyOf } from '@/utils/dates';
import { normalizeText } from '@/utils/format';
import { MAX_AMOUNT, parseMoney } from '@/utils/money';

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export type ValidationResult<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors<K> };

const DESCRIPTION_MAX = 80;
const NAME_MAX = 40;
const NOTE_MAX = 200;

function validateAmount(raw: string, { allowZero = false } = {}): { value?: Cents; error?: string } {
  const value = parseMoney(raw);
  if (value === null) return { error: 'Informe um valor válido.' };
  if (value < 0) return { error: 'O valor não pode ser negativo.' };
  if (!allowZero && value === 0) return { error: 'O valor deve ser maior que zero.' };
  if (value > MAX_AMOUNT) return { error: 'Valor acima do permitido.' };
  return { value };
}

function validateText(raw: string, label: string, max: number, required = true): { value: string; error?: string } {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (required && !value) return { value, error: `${label} é obrigatório.` };
  if (value.length > max) return { value, error: `${label} deve ter no máximo ${max} caracteres.` };
  return { value };
}

/* ---------- Lançamento ---------- */

export interface TransactionFormValues {
  type: TransactionType;
  description: string;
  amount: string;
  date: string;
  categoryId: string;
  note: string;
}

export type TransactionDraft = Pick<Transaction, 'type' | 'description' | 'amount' | 'date' | 'categoryId' | 'note'>;
type TransactionField = keyof TransactionFormValues;

/**
 * Datas futuras são aceitas (planejamento), até o fim do mês limite
 * (`maxPlanningDate`, mês atual + `MAX_FUTURE_MONTHS`).
 */
export function validateTransaction(
  values: TransactionFormValues,
  categories: readonly Category[],
  today: IsoDate,
): ValidationResult<TransactionDraft, TransactionField> {
  const errors: FieldErrors<TransactionField> = {};

  const description = validateText(values.description, 'Descrição', DESCRIPTION_MAX);
  if (description.error) errors.description = description.error;

  const amount = validateAmount(values.amount);
  if (amount.error) errors.amount = amount.error;

  if (!isValidIso(values.date)) errors.date = 'Informe uma data válida.';
  else if (values.date > maxPlanningDate(today)) {
    errors.date = `A data deve ser até ${formatDateBr(maxPlanningDate(today))}.`;
  }

  const category = categories.find((c) => c.id === values.categoryId);
  if (!category) errors.categoryId = 'Selecione uma categoria.';
  else if (category.kind !== values.type) errors.categoryId = 'Categoria incompatível com o tipo do lançamento.';

  const note = validateText(values.note, 'Observação', NOTE_MAX, false);
  if (note.error) errors.note = note.error;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      type: values.type,
      description: description.value,
      amount: amount.value as Cents,
      date: values.date as IsoDate,
      categoryId: values.categoryId,
      note: note.value || undefined,
    },
  };
}

/* ---------- Categoria ---------- */

export interface CategoryFormValues {
  name: string;
  description: string;
  icon: string;
  kind: TransactionType;
  group: CategoryGroup;
  monthlyLimit: string;
  /** Liga/desliga os alertas de limite próximo/ultrapassado desta categoria (ver DT-025). */
  alertsEnabled: boolean;
}

export type CategoryDraft = Pick<Category, 'name' | 'description' | 'icon' | 'kind' | 'group' | 'monthlyLimit' | 'alertsEnabled'>;
type CategoryField = keyof CategoryFormValues;

export function validateCategory(
  values: CategoryFormValues,
  categories: readonly Category[],
  editingId: string | null,
): ValidationResult<CategoryDraft, CategoryField> {
  const errors: FieldErrors<CategoryField> = {};

  const name = validateText(values.name, 'Nome', NAME_MAX);
  if (name.error) errors.name = name.error;
  else {
    const duplicate = categories.some(
      (c) => c.id !== editingId && c.kind === values.kind && normalizeText(c.name) === normalizeText(name.value),
    );
    if (duplicate) errors.name = 'Já existe uma categoria com este nome.';
  }

  const description = validateText(values.description, 'Descrição', DESCRIPTION_MAX, false);
  if (description.error) errors.description = description.error;

  if (!values.icon) errors.icon = 'Escolha um ícone.';

  let monthlyLimit: Cents | null = null;
  if (values.kind === 'expense' && values.monthlyLimit.trim()) {
    const limit = validateAmount(values.monthlyLimit, { allowZero: true });
    if (limit.error) errors.monthlyLimit = limit.error;
    else monthlyLimit = limit.value && limit.value > 0 ? limit.value : null;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: name.value,
      description: description.value,
      icon: values.icon,
      kind: values.kind,
      group: values.group,
      monthlyLimit,
      alertsEnabled: values.alertsEnabled,
    },
  };
}

/* ---------- Meta ---------- */

export interface GoalFormValues {
  name: string;
  description: string;
  icon: string;
  targetAmount: string;
  initialAmount: string;
  monthlyContribution: string;
  deadline: string;
}

export type GoalDraft = Pick<
  Goal,
  'name' | 'description' | 'icon' | 'targetAmount' | 'initialAmount' | 'monthlyContribution' | 'deadline'
>;
type GoalField = keyof GoalFormValues;

export function validateGoal(values: GoalFormValues, today: IsoDate): ValidationResult<GoalDraft, GoalField> {
  const errors: FieldErrors<GoalField> = {};

  const name = validateText(values.name, 'Nome', NAME_MAX);
  if (name.error) errors.name = name.error;

  const description = validateText(values.description, 'Descrição', DESCRIPTION_MAX, false);
  if (description.error) errors.description = description.error;

  if (!values.icon) errors.icon = 'Escolha um ícone.';

  const target = validateAmount(values.targetAmount);
  if (target.error) errors.targetAmount = target.error;

  const initial = values.initialAmount.trim()
    ? validateAmount(values.initialAmount, { allowZero: true })
    : { value: 0 };
  if (initial.error) errors.initialAmount = initial.error;

  const monthly = values.monthlyContribution.trim()
    ? validateAmount(values.monthlyContribution, { allowZero: true })
    : { value: 0 };
  if (monthly.error) errors.monthlyContribution = monthly.error;

  let deadline: IsoDate | null = null;
  if (values.deadline) {
    if (!isValidIso(values.deadline)) errors.deadline = 'Informe uma data válida.';
    else if (values.deadline <= today) errors.deadline = 'O prazo deve ser uma data futura.';
    else deadline = values.deadline;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: name.value,
      description: description.value,
      icon: values.icon,
      targetAmount: target.value as Cents,
      initialAmount: initial.value ?? 0,
      monthlyContribution: monthly.value ?? 0,
      deadline,
    },
  };
}

/* ---------- Perfil (boas-vindas e Ajustes) ---------- */

export type ProfileDraft = Pick<Settings, 'userName' | 'monthlyIncome'>;

export interface OnboardingFormValues {
  name: string;
  monthlyIncome: string;
}

type OnboardingField = keyof OnboardingFormValues;

/** Renda mensal é opcional: vazio vale 0 (não informada). */
function validateMonthlyIncome(raw: string): { value: Cents; error?: string } {
  if (!raw.trim()) return { value: 0 };
  const income = validateAmount(raw, { allowZero: true });
  return { value: income.value ?? 0, error: income.error };
}

/** Tela de boas-vindas: nome obrigatório (até `USER_NAME_MAX` caracteres) e renda mensal opcional. */
export function validateOnboarding(values: OnboardingFormValues): ValidationResult<ProfileDraft, OnboardingField> {
  const errors: FieldErrors<OnboardingField> = {};
  const name = validateText(values.name, 'Nome', USER_NAME_MAX);
  if (name.error) errors.name = name.error;
  const income = validateMonthlyIncome(values.monthlyIncome);
  if (income.error) errors.monthlyIncome = income.error;
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { userName: name.value, monthlyIncome: income.value } };
}

/** Os campos do perfil em Ajustes são os mesmos das boas-vindas. */
export type ProfileSettingsFormValues = OnboardingFormValues;

/** Ajustes → Perfil. O nome pode ficar vazio aqui (a saudação passa a ser só "Olá"). */
export function validateProfileSettings(values: ProfileSettingsFormValues): ValidationResult<ProfileDraft, OnboardingField> {
  const errors: FieldErrors<OnboardingField> = {};
  const name = validateText(values.name, 'Nome', USER_NAME_MAX, false);
  if (name.error) errors.name = name.error;
  const income = validateMonthlyIncome(values.monthlyIncome);
  if (income.error) errors.monthlyIncome = income.error;
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { userName: name.value, monthlyIncome: income.value } };
}

/* ---------- Assinatura ---------- */

/**
 * Valor especial do campo de categoria: "criar a categoria padrão Assinaturas ao salvar"
 * (oferecido quando ela ainda não existe).
 */
export const CREATE_SUBSCRIPTIONS_CATEGORY = '__create-subscriptions-category__';

export interface SubscriptionFormValues {
  name: string;
  amount: string;
  billingDay: string;
  categoryId: string;
  icon: string;
  active: boolean;
  startMonth: string;
  endMonth: string;
  notes: string;
}

export type SubscriptionDraft = Pick<
  Subscription,
  'name' | 'icon' | 'amount' | 'billingDay' | 'categoryId' | 'active' | 'startMonth' | 'endMonth' | 'notes'
>;
type SubscriptionField = keyof SubscriptionFormValues;

const isMonthInput = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

/**
 * Primeiro mês: no máximo `SUBSCRIPTION_BACKFILL_MONTHS` meses atrás (as cobranças desses meses são
 * lançadas ao salvar) e no máximo o mês limite de planejamento. Último mês opcional, ≥ primeiro mês.
 * Na edição, manter o primeiro mês já salvo é sempre aceito (previousStartMonth), mesmo que antigo.
 */
export function validateSubscription(
  values: SubscriptionFormValues,
  categories: readonly Category[],
  today: IsoDate,
  previousStartMonth?: MonthKey,
): ValidationResult<SubscriptionDraft, SubscriptionField> {
  const errors: FieldErrors<SubscriptionField> = {};

  const name = validateText(values.name, 'Nome', NAME_MAX);
  if (name.error) errors.name = name.error;

  const amount = validateAmount(values.amount);
  if (amount.error) errors.amount = amount.error;

  const day = Number(values.billingDay);
  if (!/^\d{1,2}$/.test(values.billingDay.trim()) || day < BILLING_DAY_MIN || day > BILLING_DAY_MAX) {
    errors.billingDay = `Informe um dia entre ${BILLING_DAY_MIN} e ${BILLING_DAY_MAX}.`;
  }

  if (values.categoryId !== CREATE_SUBSCRIPTIONS_CATEGORY) {
    const category = categories.find((c) => c.id === values.categoryId);
    if (!category) errors.categoryId = 'Selecione uma categoria.';
    else if (category.kind !== 'expense') errors.categoryId = 'Escolha uma categoria de despesa.';
  }

  if (!values.icon) errors.icon = 'Escolha um ícone.';

  const earliest = addMonths(monthKeyOf(today), -SUBSCRIPTION_BACKFILL_MONTHS);
  const latest = maxPlanningMonth(today);
  if (!isMonthInput(values.startMonth)) errors.startMonth = 'Informe um mês válido.';
  else if (values.startMonth < earliest && values.startMonth !== previousStartMonth) errors.startMonth = `O primeiro mês deve ser a partir de ${formatMonthLabel(earliest)}.`;
  else if (values.startMonth > latest) errors.startMonth = `O primeiro mês deve ser até ${formatMonthLabel(latest)}.`;

  let endMonth: MonthKey | null = null;
  if (values.endMonth.trim()) {
    if (!isMonthInput(values.endMonth)) errors.endMonth = 'Informe um mês válido.';
    else if (isMonthInput(values.startMonth) && values.endMonth < values.startMonth) errors.endMonth = 'O último mês deve ser igual ou posterior ao primeiro.';
    else if (values.endMonth > latest) errors.endMonth = `O último mês deve ser até ${formatMonthLabel(latest)}.`;
    else endMonth = values.endMonth;
  }

  const notes = validateText(values.notes, 'Observação', NOTE_MAX, false);
  if (notes.error) errors.notes = notes.error;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: name.value,
      icon: values.icon,
      amount: amount.value as Cents,
      billingDay: day,
      categoryId: values.categoryId,
      active: values.active,
      startMonth: values.startMonth,
      endMonth,
      notes: notes.value || undefined,
    },
  };
}

/* ---------- Aporte ---------- */

export interface ContributionFormValues {
  amount: string;
  date: string;
}

type ContributionField = keyof ContributionFormValues;

export function validateContribution(
  values: ContributionFormValues,
): ValidationResult<{ amount: Cents; date: IsoDate }, ContributionField> {
  const errors: FieldErrors<ContributionField> = {};
  const amount = validateAmount(values.amount);
  if (amount.error) errors.amount = amount.error;
  if (!isValidIso(values.date)) errors.date = 'Informe uma data válida.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { amount: amount.value as Cents, date: values.date } };
}
