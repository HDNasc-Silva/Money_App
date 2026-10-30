import { useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, IconPicker, MoneyField, TextField } from '@/components/forms/Fields';
import { goalProgress } from '@/domain/goals';
import type { Goal } from '@/models';
import { useFinanceActions } from '@/store/FinanceProvider';
import { todayIso } from '@/utils/dates';
import { centsToInput, formatCurrency } from '@/utils/money';
import {
  validateContribution,
  validateGoal,
  type ContributionFormValues,
  type FieldErrors,
  type GoalFormValues,
} from '@/validations';

const GOAL_ICONS = [
  'shield', 'flight_takeoff', 'laptop_mac', 'format_paint', 'directions_car', 'home',
  'school', 'favorite', 'beach_access', 'celebration', 'child_care', 'savings',
] as const;

const toValues = (goal: Goal | null): GoalFormValues => ({
  name: goal?.name ?? '',
  description: goal?.description ?? '',
  icon: goal?.icon ?? 'savings',
  targetAmount: goal ? centsToInput(goal.targetAmount) : '',
  initialAmount: goal?.initialAmount ? centsToInput(goal.initialAmount) : '',
  monthlyContribution: goal?.monthlyContribution ? centsToInput(goal.monthlyContribution) : '',
  deadline: goal?.deadline ?? '',
});

interface GoalFormSheetProps {
  goal: Goal | null;
  onClose(): void;
}

export function GoalFormSheet({ goal, onClose }: GoalFormSheetProps) {
  const { saveGoal, deleteGoal } = useFinanceActions();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => toValues(goal));
  const [errors, setErrors] = useState<FieldErrors<keyof GoalFormValues>>({});
  const [confirming, setConfirming] = useState(false);

  const update = <K extends keyof GoalFormValues>(field: K, value: GoalFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateGoal(values, todayIso());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    await saveGoal(result.value, goal?.id);
    showToast({ message: goal ? 'Meta atualizada.' : 'Meta criada.' });
    onClose();
  };

  const remove = async () => {
    if (!goal) return;
    await deleteGoal(goal.id);
    showToast({ message: 'Meta excluída.' });
    onClose();
  };

  return (
    <>
      <Sheet open={!confirming} title={goal ? 'Editar meta' : 'Nova meta'} subtitle="Valor desejado, prazo e aporte planejado" onClose={onClose}>
        <form onSubmit={submit} noValidate>
          <FormStack>
            <TextField label="Nome da meta" value={values.name} onChange={(v) => update('name', v)} error={errors.name} placeholder="Ex.: Reserva de Emergência" maxLength={40} />
            <TextField label="Descrição (opcional)" value={values.description} onChange={(v) => update('description', v)} error={errors.description} maxLength={80} />
            <FormRow>
              <MoneyField label="Valor desejado" value={values.targetAmount} onChange={(v) => update('targetAmount', v)} error={errors.targetAmount} />
              <MoneyField
                label="Já guardado"
                value={values.initialAmount}
                onChange={(v) => update('initialAmount', v)}
                error={errors.initialAmount}
                hint={goal?.contributions.length ? 'Sem contar os aportes' : undefined}
              />
            </FormRow>
            <FormRow>
              <MoneyField label="Aporte mensal" value={values.monthlyContribution} onChange={(v) => update('monthlyContribution', v)} error={errors.monthlyContribution} />
              <TextField label="Prazo (opcional)" type="date" value={values.deadline} onChange={(v) => update('deadline', v)} error={errors.deadline} />
            </FormRow>
            <IconPicker label="Ícone" icons={GOAL_ICONS} value={values.icon} onChange={(v) => update('icon', v)} error={errors.icon} />
            <Button type="submit" icon="check" fullWidth>
              {goal ? 'Salvar alterações' : 'Criar meta'}
            </Button>
            {goal && (
              <Button variant="danger" icon="delete" fullWidth onClick={() => setConfirming(true)}>
                Excluir meta
              </Button>
            )}
          </FormStack>
        </form>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Excluir meta?"
        message={`A meta "${goal?.name ?? ''}" e o histórico de aportes serão removidos.`}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

interface ContributionSheetProps {
  goal: Goal;
  onClose(): void;
}

export function ContributionSheet({ goal, onClose }: ContributionSheetProps) {
  const { addContribution } = useFinanceActions();
  const { showToast } = useToast();
  const { remaining } = goalProgress(goal);
  const [values, setValues] = useState<ContributionFormValues>({
    amount: goal.monthlyContribution ? centsToInput(Math.min(goal.monthlyContribution, remaining || goal.monthlyContribution)) : '',
    date: todayIso(),
  });
  const [errors, setErrors] = useState<FieldErrors<keyof ContributionFormValues>>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateContribution(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    await addContribution(goal.id, result.value.amount, result.value.date);
    showToast({ message: `Aporte de ${formatCurrency(result.value.amount)} registrado em ${goal.name}.` });
    onClose();
  };

  return (
    <Sheet open title={`Aportar em ${goal.name}`} subtitle={`Faltam ${formatCurrency(remaining)} para concluir`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <FormStack>
          <MoneyField
            label="Valor do aporte"
            value={values.amount}
            onChange={(v) => {
              setValues((c) => ({ ...c, amount: v }));
              setErrors((c) => ({ ...c, amount: undefined }));
            }}
            error={errors.amount}
          />
          <TextField
            label="Data"
            type="date"
            value={values.date}
            onChange={(v) => {
              setValues((c) => ({ ...c, date: v }));
              setErrors((c) => ({ ...c, date: undefined }));
            }}
            error={errors.date}
          />
          {goal.contributions.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {goal.contributions.length} aporte(s) registrados, totalizando{' '}
              {formatCurrency(goal.contributions.reduce((sum, c) => sum + c.amount, 0))}.
            </p>
          )}
          <Button type="submit" icon="add" fullWidth>
            Registrar aporte
          </Button>
        </FormStack>
      </form>
    </Sheet>
  );
}
