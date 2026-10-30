import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, MoneyField, SelectField, TextField } from '@/components/forms/Fields';
import type { Transaction, TransactionType } from '@/models';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { todayIso } from '@/utils/dates';
import { centsToInput } from '@/utils/money';
import { validateTransaction, type FieldErrors, type TransactionFormValues } from '@/validations';
import { MissingCategoriesNotice } from './MissingCategoriesNotice';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
] as const;

export interface TransactionPreset {
  type?: TransactionType;
  categoryId?: string;
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
    date: todayIso(),
    categoryId: preset.categoryId ?? '',
    note: '',
  };
}

/** Formulário de criação/edição; montado com `key` para reiniciar o estado a cada abertura. */
export function TransactionFormSheet({ open, transaction, preset, onClose }: TransactionFormSheetProps) {
  const { categories } = useFinanceData();
  const { saveTransaction, ensureDefaultCategories } = useFinanceActions();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => initialValues(transaction, preset));
  const [errors, setErrors] = useState<FieldErrors<keyof TransactionFormValues>>({});
  const [saving, setSaving] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.kind === values.type).map((c) => ({ value: c.id, label: c.name })),
    [categories, values.type],
  );

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

  const createDefaultCategories = async () => {
    setCreatingCategories(true);
    const added = await ensureDefaultCategories();
    setCreatingCategories(false);
    setErrors((current) => ({ ...current, categoryId: undefined }));
    showToast({
      message: added.length ? `${added.length} categoria(s) padrão criada(s). Selecione uma para continuar.` : 'As categorias padrão já existem.',
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateTransaction(values, categories);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    await saveTransaction(result.value, transaction?.id);
    setSaving(false);
    showToast({ message: transaction ? 'Lançamento atualizado.' : 'Lançamento adicionado.' });
    onClose();
  };

  const isEditing = Boolean(transaction);

  return (
    <Sheet
      open={open}
      title={isEditing ? 'Editar lançamento' : 'Novo lançamento'}
      subtitle={isEditing ? 'Altere valor, categoria ou data' : 'Registre uma receita ou despesa'}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        <FormStack>
          <SegmentedControl label="Tipo do lançamento" options={TYPE_OPTIONS} value={values.type} onChange={changeType} />
          <MoneyField label="Valor" value={values.amount} onChange={(v) => update('amount', v)} error={errors.amount} />
          <TextField
            label="Descrição"
            value={values.description}
            onChange={(v) => update('description', v)}
            error={errors.description}
            placeholder={values.type === 'expense' ? 'Ex.: Supermercado' : 'Ex.: Salário'}
            maxLength={80}
          />
          <FormRow>
            <TextField label="Data" type="date" value={values.date} onChange={(v) => update('date', v)} error={errors.date} />
            <SelectField
              label="Categoria"
              value={values.categoryId}
              onChange={(v) => update('categoryId', v)}
              options={categoryOptions}
              placeholder={categoryOptions.length ? 'Selecione' : 'Nenhuma categoria'}
              error={errors.categoryId}
            />
          </FormRow>
          {categoryOptions.length === 0 && (
            <MissingCategoriesNotice
              type={values.type}
              busy={creatingCategories}
              onCreateDefaults={createDefaultCategories}
              onCustomize={onClose}
            />
          )}
          <TextField
            label="Observação (opcional)"
            value={values.note}
            onChange={(v) => update('note', v)}
            error={errors.note}
            maxLength={200}
          />
          <Button type="submit" icon="check" fullWidth disabled={saving}>
            {isEditing ? 'Salvar alterações' : 'Adicionar lançamento'}
          </Button>
        </FormStack>
      </form>
    </Sheet>
  );
}
