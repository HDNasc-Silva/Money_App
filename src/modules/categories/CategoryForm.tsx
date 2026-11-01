import { useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, MoneyField, SelectField, TextField } from '@/components/forms/Fields';
import { IconPicker } from '@/components/forms/IconPicker';
import type { Category, CategoryGroup, TransactionType } from '@/models';
import { DomainError, useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { centsToInput } from '@/utils/money';
import { validateCategory, type CategoryFormValues, type FieldErrors } from '@/validations';
import styles from './Categories.module.css';

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  essential: 'Essencial',
  lifestyle: 'Estilo de Vida',
};

const KIND_OPTIONS = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
] as const;

const GROUP_OPTIONS = Object.entries(GROUP_LABELS).map(([value, label]) => ({ value, label }));

interface CategoryFormSheetProps {
  category: Category | null;
  onClose(): void;
}

const toValues = (category: Category | null): CategoryFormValues => ({
  name: category?.name ?? '',
  description: category?.description ?? '',
  icon: category?.icon ?? 'category',
  kind: category?.kind ?? 'expense',
  group: category?.group ?? 'essential',
  monthlyLimit: category?.monthlyLimit ? centsToInput(category.monthlyLimit) : '',
  alertsEnabled: category?.alertsEnabled ?? true,
});

export function CategoryFormSheet({ category, onClose }: CategoryFormSheetProps) {
  const { categories } = useFinanceData();
  const { saveCategory, deleteCategory } = useFinanceActions();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => toValues(category));
  const [errors, setErrors] = useState<FieldErrors<keyof CategoryFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const update = <K extends keyof CategoryFormValues>(field: K, value: CategoryFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleDomainError = (error: unknown) => {
    if (error instanceof DomainError) setFormError(error.message);
    else throw error;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateCategory(values, categories, category?.id ?? null);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      await saveCategory(result.value, category?.id);
      showToast({ message: category ? 'Categoria atualizada.' : 'Categoria criada.' });
      onClose();
    } catch (error) {
      handleDomainError(error);
    }
  };

  const remove = async () => {
    if (!category) return;
    setConfirming(false);
    try {
      await deleteCategory(category.id);
      showToast({ message: 'Categoria excluída.' });
      onClose();
    } catch (error) {
      handleDomainError(error);
    }
  };

  return (
    <>
      <Sheet
        open={!confirming}
        title={category ? 'Editar categoria' : 'Nova categoria'}
        subtitle="Defina nome, ícone e teto orçamentário mensal"
        onClose={onClose}
      >
        <form onSubmit={submit} noValidate>
          <FormStack>
            <SegmentedControl
              label="Tipo da categoria"
              options={KIND_OPTIONS}
              value={values.kind}
              onChange={(v: TransactionType) => update('kind', v)}
            />
            <TextField label="Nome da categoria" value={values.name} onChange={(v) => update('name', v)} error={errors.name} placeholder="Ex.: Assinaturas Digitais" maxLength={40} />
            <TextField label="Descrição (opcional)" value={values.description} onChange={(v) => update('description', v)} error={errors.description} maxLength={80} />
            <FormRow>
              {values.kind === 'expense' ? (
                <MoneyField
                  label="Teto mensal"
                  value={values.monthlyLimit}
                  onChange={(v) => update('monthlyLimit', v)}
                  error={errors.monthlyLimit}
                  hint="Vazio = sem limite"
                />
              ) : (
                <div />
              )}
              <SelectField label="Grupo" value={values.group} onChange={(v) => update('group', v as CategoryGroup)} options={GROUP_OPTIONS} />
            </FormRow>
            <IconPicker label="Ícone de identificação" value={values.icon} onChange={(v) => update('icon', v)} error={errors.icon} />
            {values.kind === 'expense' && (
              <label className={styles.switchRow}>
                <span>
                  <strong>Alertas de orçamento</strong>
                  <small>Avisa quando o teto mensal desta categoria estiver próximo ou ultrapassado.</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  className={styles.switch}
                  checked={values.alertsEnabled}
                  onChange={(event) => update('alertsEnabled', event.target.checked)}
                />
              </label>
            )}
            {formError && (
              <p role="alert" className={styles.formError}>
                {formError}
              </p>
            )}
            <Button type="submit" icon="check" fullWidth>
              {category ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
            {category && (
              <Button variant="danger" icon="delete" fullWidth onClick={() => setConfirming(true)}>
                Excluir categoria
              </Button>
            )}
          </FormStack>
        </form>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Excluir categoria?"
        message={`A categoria "${category?.name ?? ''}" será removida. Categorias com lançamentos não podem ser excluídas.`}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
