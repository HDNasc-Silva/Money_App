import type {
  Category,
  CategoryGroup,
  Cents,
  Goal,
  IsoDate,
  Transaction,
  TransactionType,
} from '@/models';
import { isValidIso } from '@/utils/dates';
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

export function validateTransaction(
  values: TransactionFormValues,
  categories: readonly Category[],
): ValidationResult<TransactionDraft, TransactionField> {
  const errors: FieldErrors<TransactionField> = {};

  const description = validateText(values.description, 'Descrição', DESCRIPTION_MAX);
  if (description.error) errors.description = description.error;

  const amount = validateAmount(values.amount);
  if (amount.error) errors.amount = amount.error;

  if (!isValidIso(values.date)) errors.date = 'Informe uma data válida.';

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
}

export type CategoryDraft = Pick<Category, 'name' | 'description' | 'icon' | 'kind' | 'group' | 'monthlyLimit'>;
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
