import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, MoneyField, SelectField, TextField } from '@/components/forms/Fields';
import { IconPicker } from '@/components/forms/IconPicker';
import type { Category, Subscription } from '@/models';
import { findSubscriptionsCategory, SUBSCRIPTIONS_CATEGORY_NAME } from '@/store/defaultCategories';
import { DomainError, useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { monthKeyOf, todayIso } from '@/utils/dates';
import { centsToInput } from '@/utils/money';
import {
  CREATE_SUBSCRIPTIONS_CATEGORY,
  validateSubscription,
  type FieldErrors,
  type SubscriptionFormValues,
} from '@/validations';
import { SUBSCRIPTION_SUGGESTIONS } from './subscriptionPresentation';
import styles from './Subscriptions.module.css';

type Field = keyof SubscriptionFormValues;

function toValues(subscription: Subscription | null, categories: readonly Category[], today: string): SubscriptionFormValues {
  const defaultCategory = findSubscriptionsCategory(categories)?.id ?? CREATE_SUBSCRIPTIONS_CATEGORY;
  return {
    name: subscription?.name ?? '',
    amount: subscription ? centsToInput(subscription.amount) : '',
    billingDay: subscription ? String(subscription.billingDay) : String(Number(today.slice(8, 10))),
    categoryId: subscription?.categoryId ?? defaultCategory,
    icon: subscription?.icon ?? 'subscriptions',
    active: subscription?.active ?? true,
    startMonth: subscription?.startMonth ?? monthKeyOf(today),
    endMonth: subscription?.endMonth ?? '',
    notes: subscription?.notes ?? '',
  };
}

interface SubscriptionFormSheetProps {
  subscription: Subscription | null;
  onClose(): void;
}

/** Criar/editar assinatura; na edição, também excluir (mantendo ou não os lançamentos já gerados). */
export function SubscriptionFormSheet({ subscription, onClose }: SubscriptionFormSheetProps) {
  const { categories, transactions } = useFinanceData();
  const { saveSubscription, deleteSubscription } = useFinanceActions();
  const { showToast } = useToast();
  const today = todayIso();
  const [values, setValues] = useState(() => toValues(subscription, categories, today));
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [removeLaunched, setRemoveLaunched] = useState(false);

  const categoryOptions = useMemo(() => {
    const expense = categories.filter((c) => c.kind === 'expense').map((c) => ({ value: c.id, label: c.name }));
    return findSubscriptionsCategory(categories)
      ? expense
      : [{ value: CREATE_SUBSCRIPTIONS_CATEGORY, label: `${SUBSCRIPTIONS_CATEGORY_NAME} (nova categoria)` }, ...expense];
  }, [categories]);

  const launchedCount = subscription ? transactions.filter((t) => t.subscriptionId === subscription.id).length : 0;

  const update = <K extends Field>(field: K, value: SubscriptionFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const applySuggestion = (name: string, icon: string) => {
    setValues((current) => ({ ...current, name, icon }));
    setErrors((current) => ({ ...current, name: undefined, icon: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateSubscription(values, categories, today, subscription?.startMonth);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      await saveSubscription(result.value, subscription?.id);
      showToast({ message: subscription ? 'Assinatura atualizada.' : 'Assinatura criada.' });
      onClose();
    } catch (error) {
      if (error instanceof DomainError) setFormError(error.message);
      else throw error;
    }
  };

  const remove = async () => {
    if (!subscription) return;
    await deleteSubscription(subscription.id, { keepTransactions: !removeLaunched });
    showToast({ message: 'Assinatura excluída.' });
    onClose();
  };

  return (
    <>
      <Sheet
        open={!confirming}
        title={subscription ? 'Editar assinatura' : 'Nova assinatura'}
        subtitle="Cobrança mensal lançada automaticamente no dia escolhido"
        onClose={onClose}
      >
        <form onSubmit={submit} noValidate>
          <FormStack>
            {!subscription && (
              <div className={styles.suggestions}>
                <span className={styles.suggestionsLabel} id="subscription-suggestions">
                  Sugestões rápidas
                </span>
                <div className={styles.suggestionList} role="group" aria-labelledby="subscription-suggestions">
                  {SUBSCRIPTION_SUGGESTIONS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      className={[styles.chip, values.name === s.name && styles.chipActive].filter(Boolean).join(' ')}
                      aria-pressed={values.name === s.name}
                      onClick={() => applySuggestion(s.name, s.icon)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <TextField label="Nome" value={values.name} onChange={(v) => update('name', v)} error={errors.name} placeholder="Ex.: Netflix" maxLength={40} />
            <FormRow>
              <MoneyField label="Valor mensal" value={values.amount} onChange={(v) => update('amount', v)} error={errors.amount} />
              <TextField
                label="Dia de cobrança"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={values.billingDay}
                onChange={(v) => update('billingDay', v)}
                error={errors.billingDay}
                hint="Em meses curtos, o último dia"
              />
            </FormRow>
            <SelectField
              label="Categoria"
              value={values.categoryId}
              onChange={(v) => update('categoryId', v)}
              options={categoryOptions}
              error={errors.categoryId}
              placeholder="Selecione"
            />
            <FormRow>
              <TextField
                label="Primeira cobrança"
                type="month"
                value={values.startMonth}
                onChange={(v) => update('startMonth', v)}
                error={errors.startMonth}
              />
              <TextField
                label="Última cobrança (opcional)"
                type="month"
                value={values.endMonth}
                onChange={(v) => update('endMonth', v)}
                error={errors.endMonth}
                hint="Preencha ao cancelar"
              />
            </FormRow>
            <label className={styles.toggle}>
              <input type="checkbox" checked={values.active} onChange={(event) => update('active', event.target.checked)} />
              <span>
                <strong>Assinatura ativa</strong>
                <small>Pausada, as cobranças que vencerem não são lançadas.</small>
              </span>
            </label>
            <TextField label="Observação (opcional)" value={values.notes} onChange={(v) => update('notes', v)} error={errors.notes} maxLength={200} />
            <IconPicker label="Ícone" value={values.icon} onChange={(v) => update('icon', v)} error={errors.icon} />
            <p className={styles.formHint}>
              Cobranças com data até hoje são lançadas no Extrato como despesas; as próximas aparecem como previstas.
              {subscription && ' Alterações valem para os meses ainda não lançados.'}
            </p>
            {formError && (
              <p role="alert" className={styles.formError}>
                {formError}
              </p>
            )}
            <Button type="submit" icon="check" fullWidth>
              {subscription ? 'Salvar alterações' : 'Adicionar assinatura'}
            </Button>
            {subscription && (
              <Button variant="danger" icon="delete" fullWidth onClick={() => setConfirming(true)}>
                Excluir assinatura
              </Button>
            )}
          </FormStack>
        </form>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Excluir assinatura?"
        message={`"${subscription?.name ?? ''}" deixará de gerar cobranças.${
          launchedCount > 0 ? ` Os ${launchedCount} lançamento(s) já gerados continuam no Extrato, a menos que você marque a opção abaixo.` : ''
        }`}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        {launchedCount > 0 && (
          <label className={styles.toggle}>
            <input type="checkbox" checked={removeLaunched} onChange={(event) => setRemoveLaunched(event.target.checked)} />
            <span>
              <strong>Excluir também os lançamentos já gerados</strong>
              <small>Os indicadores dos meses passados serão recalculados.</small>
            </span>
          </label>
        )}
      </ConfirmDialog>
    </>
  );
}
