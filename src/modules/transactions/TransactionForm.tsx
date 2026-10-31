import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import { FormStack, MoneyField, TextField } from '@/components/forms/Fields';
import {
  categoriesByUsage,
  descriptionSuggestions,
  findRecurringCandidate,
  lastCategoryForDescription,
  type DescriptionSuggestion,
} from '@/domain/quickEntry';
import type { IsoDate, Transaction, TransactionType } from '@/models';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { monthKeyOf, todayIso } from '@/utils/dates';
import { centsToInput, parseMoney } from '@/utils/money';
import { validateTransaction, type FieldErrors, type TransactionFormValues } from '@/validations';
import { MissingCategoriesNotice } from './MissingCategoriesNotice';
import styles from './TransactionForm.module.css';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
] as const;

export interface TransactionPreset {
  type?: TransactionType;
  categoryId?: string;
  /** Data sugerida; por padrão, hoje. O editor preenche conforme o mês selecionado. */
  date?: IsoDate;
}

interface TransactionFormSheetProps {
  open: boolean;
  transaction: Transaction | null;
  preset?: TransactionPreset;
  onClose(): void;
}

function initialValues(transaction: Transaction | null, preset: TransactionPreset = {}): TransactionFormValues {
  if (transaction) {
    return {
      type: transaction.type,
      description: transaction.description,
      amount: centsToInput(transaction.amount),
      date: transaction.date,
      categoryId: transaction.categoryId,
      note: transaction.note ?? '',
    };
  }
  return {
    type: preset.type ?? 'expense',
    description: '',
    amount: '',
    date: preset.date ?? todayIso(),
    categoryId: preset.categoryId ?? '',
    note: '',
  };
}

/**
 * Formulário de criação/edição (lançamento rápido, v1.7.0): valor com foco automático, categorias em
 * chips (mais usadas primeiro), descrição com sugestões que trazem a categoria usada da última vez e
 * "Salvar e adicionar outro". Montado com `key` para reiniciar o estado a cada abertura.
 */
export function TransactionFormSheet({ open, transaction, preset, onClose }: TransactionFormSheetProps) {
  const { categories, transactions } = useFinanceData();
  const { saveTransaction, ensureDefaultCategories, saveSubscription } = useFinanceActions();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => initialValues(transaction, preset));
  const [errors, setErrors] = useState<FieldErrors<keyof TransactionFormValues>>({});
  const [saving, setSaving] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [markingFixed, setMarkingFixed] = useState(false);
  const [markedFixed, setMarkedFixed] = useState(false);
  /** Categoria escolhida pelo usuário: as sugestões de descrição não a substituem. */
  const categoryTouched = useRef(Boolean(transaction || preset?.categoryId));
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = Boolean(transaction);

  const orderedCategories = useMemo(
    () => categoriesByUsage(categories, transactions, values.type),
    [categories, transactions, values.type],
  );
  const suggestions = useMemo(
    () => (isEditing ? [] : descriptionSuggestions(transactions, values.description, values.type)),
    [isEditing, transactions, values.description, values.type],
  );
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;

  /** Lançamento parecido com um do mês anterior, mesma categoria: sugere marcar como fixo (regra nova, v1.9.0). */
  const recurringCandidate = useMemo(() => {
    if (isEditing || values.type !== 'expense' || markedFixed) return null;
    const amount = parseMoney(values.amount);
    if (!amount) return null;
    return findRecurringCandidate(transactions, values.type, values.categoryId, values.description, amount, values.date);
  }, [isEditing, markedFixed, transactions, values.type, values.categoryId, values.description, values.amount, values.date]);

  /** Cria uma assinatura a partir do lançamento atual, para que ele e os próximos meses sejam gerados automaticamente. */
  const markAsFixed = async () => {
    const amount = parseMoney(values.amount);
    if (!amount || !values.categoryId) return;
    const category = categories.find((c) => c.id === values.categoryId);
    setMarkingFixed(true);
    try {
      await saveSubscription({
        name: values.description.trim(),
        icon: category?.icon ?? 'subscriptions',
        amount,
        billingDay: Number(values.date.slice(8, 10)),
        categoryId: values.categoryId,
        active: true,
        startMonth: monthKeyOf(values.date),
        endMonth: null,
      });
      setMarkedFixed(true);
      showToast({ message: 'Marcado como fixo: criado em Assinaturas.' });
    } finally {
      setMarkingFixed(false);
    }
  };

  const update = <K extends keyof TransactionFormValues>(field: K, value: TransactionFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const changeType = (type: TransactionType) => {
    setValues((current) => {
      const category = categories.find((c) => c.id === current.categoryId);
      return { ...current, type, categoryId: category?.kind === type ? current.categoryId : '' };
    });
  };

  const changeCategory = (categoryId: string) => {
    categoryTouched.current = true;
    update('categoryId', categoryId);
  };

  /** Ao digitar uma descrição já usada, sugere a categoria da última vez (se o usuário não escolheu outra). */
  const changeDescription = (description: string) => {
    update('description', description);
    if (categoryTouched.current || isEditing) return;
    const last = lastCategoryForDescription(transactions, description, values.type);
    if (last) update('categoryId', last);
  };

  const applySuggestion = (suggestion: DescriptionSuggestion) => {
    update('description', suggestion.description);
    if (!categoryTouched.current) update('categoryId', suggestion.categoryId);
  };

  const createDefaultCategories = async () => {
    setCreatingCategories(true);
    const added = await ensureDefaultCategories();
    setCreatingCategories(false);
    setErrors((current) => ({ ...current, categoryId: undefined }));
    showToast({
      message: added.length ? `${added.length} categoria(s) padrão criada(s). Selecione uma para continuar.` : 'As categorias padrão já existem.',
    });
  };

  /** Valida e salva; com `addAnother`, mantém o formulário aberto e pronto para o próximo lançamento. */
  const save = async (addAnother: boolean) => {
    const result = validateTransaction(values, categories, todayIso());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    await saveTransaction(result.value, transaction?.id);
    setSaving(false);
    showToast({ message: transaction ? 'Lançamento atualizado.' : 'Lançamento adicionado.' });
    if (!addAnother) {
      onClose();
      return;
    }
    // Mantém tipo e data (lançamentos em sequência costumam ser do mesmo dia); limpa o resto.
    setValues((current) => ({ ...current, description: '', amount: '', categoryId: '', note: '' }));
    setErrors({});
    categoryTouched.current = false;
    setAddedCount((count) => count + 1);
    formRef.current?.querySelector<HTMLInputElement>('input[inputmode="numeric"]')?.focus();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save(false);
  };

  const subtitle = isEditing
    ? 'Altere valor, categoria ou data'
    : addedCount > 0
      ? `${addedCount} adicionado(s) nesta sequência`
      : 'Registre uma receita ou despesa em poucos toques';

  return (
    <Sheet open={open} title={isEditing ? 'Editar lançamento' : 'Novo lançamento'} subtitle={subtitle} onClose={onClose}>
      <form ref={formRef} onSubmit={submit} noValidate>
        <FormStack>
          <SegmentedControl label="Tipo do lançamento" options={TYPE_OPTIONS} value={values.type} onChange={changeType} />
          <MoneyField label="Valor" value={values.amount} onChange={(v) => update('amount', v)} error={errors.amount} enterKeyHint="next" />
          {orderedCategories.length > 0 ? (
            <CategoryPicker
              label="Categoria"
              categories={orderedCategories}
              value={values.categoryId}
              onChange={changeCategory}
              error={errors.categoryId}
            />
          ) : (
            <MissingCategoriesNotice
              type={values.type}
              busy={creatingCategories}
              onCreateDefaults={createDefaultCategories}
              onCustomize={onClose}
            />
          )}
          <div className={styles.descriptionField}>
            <TextField
              label="Descrição"
              value={values.description}
              onChange={changeDescription}
              error={errors.description}
              placeholder={values.type === 'expense' ? 'Ex.: Supermercado' : 'Ex.: Salário'}
              maxLength={80}
              autoComplete="off"
              enterKeyHint="done"
            />
            {suggestions.length > 0 && (
              <ul className={styles.suggestions} aria-label="Sugestões de descrição">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.description}>
                    <button type="button" className={styles.suggestion} onClick={() => applySuggestion(suggestion)}>
                      <Icon name="history" size={16} />
                      <span className={styles.suggestionText}>{suggestion.description}</span>
                      {categoryName(suggestion.categoryId) && (
                        <span className={styles.suggestionCategory}>{categoryName(suggestion.categoryId)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {recurringCandidate && (
            <div className={styles.recurringHint}>
              <Icon name="autorenew" size={20} />
              <span className={styles.recurringHintText}>
                Parece com &ldquo;{recurringCandidate.description}&rdquo; do mês passado. Quer marcar como fixo/recorrente?
              </span>
              <Button variant="secondary" size="sm" disabled={markingFixed} onClick={() => void markAsFixed()}>
                Marcar como fixo
              </Button>
            </div>
          )}
          <TextField label="Data" type="date" value={values.date} onChange={(v) => update('date', v)} error={errors.date} />
          <TextField
            label="Observação (opcional)"
            value={values.note}
            onChange={(v) => update('note', v)}
            error={errors.note}
            maxLength={200}
          />
          <div className={styles.actions}>
            <Button type="submit" icon="check" fullWidth disabled={saving}>
              {isEditing ? 'Salvar alterações' : 'Adicionar lançamento'}
            </Button>
            {!isEditing && (
              <Button variant="secondary" icon="playlist_add" fullWidth disabled={saving} onClick={() => void save(true)}>
                Salvar e adicionar outro
              </Button>
            )}
          </div>
        </FormStack>
      </form>
    </Sheet>
  );
}
