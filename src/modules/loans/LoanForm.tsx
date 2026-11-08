import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, MoneyField, SelectField, TextField } from '@/components/forms/Fields';
import { INSTALLMENT_COUNT_MAX, INSTALLMENT_COUNT_MIN } from '@/domain/loans';
import type { Loan } from '@/models';
import { findLoansCategory, LOANS_CATEGORY_NAME } from '@/store/defaultCategories';
import { DomainError, useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { monthKeyOf, todayIso } from '@/utils/dates';
import { centsToInput } from '@/utils/money';
import { CREATE_LOANS_CATEGORY, validateLoan, type FieldErrors, type LoanFormValues, type LoanPaymentMode } from '@/validations';
import styles from './Loans.module.css';

const PAYMENT_MODE_OPTIONS: { value: LoanPaymentMode; label: string }[] = [
  { value: 'single', label: 'Pagamento único' },
  { value: 'installments', label: 'Parcelado' },
];

type Field = keyof LoanFormValues;

function toValues(loan: Loan | null, today: string): LoanFormValues {
  return {
    borrower: loan?.borrower ?? '',
    amount: loan ? centsToInput(loan.amount) : '',
    categoryId: loan?.categoryId ?? CREATE_LOANS_CATEGORY,
    loanDate: loan?.loanDate ?? today,
    paymentMode: loan && loan.installmentTotal > 1 ? 'installments' : 'single',
    firstMonth: loan?.firstMonth ?? monthKeyOf(today),
    installmentCount: loan ? String(loan.installmentTotal) : '2',
    notes: loan?.notes ?? '',
  };
}

interface LoanFormSheetProps {
  loan: Loan | null;
  onClose(): void;
}

/** Criar/editar um empréstimo a terceiros (Agiotagem, DT-026): pagamento único ou parcelado. */
export function LoanFormSheet({ loan, onClose }: LoanFormSheetProps) {
  const { categories, transactions } = useFinanceData();
  const { saveLoan, deleteLoan } = useFinanceActions();
  const { showToast } = useToast();
  const today = todayIso();
  const [values, setValues] = useState(() => toValues(loan, today));
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [removeLaunched, setRemoveLaunched] = useState(false);

  const categoryOptions = useMemo(() => {
    const income = categories.filter((c) => c.kind === 'income').map((c) => ({ value: c.id, label: c.name }));
    return findLoansCategory(categories)
      ? income
      : [{ value: CREATE_LOANS_CATEGORY, label: `${LOANS_CATEGORY_NAME} (nova categoria)` }, ...income];
  }, [categories]);

  const launchedCount = loan ? transactions.filter((t) => t.loanId === loan.id).length : 0;

  const update = <K extends Field>(field: K, value: LoanFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateLoan(values, categories, today);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      await saveLoan(result.value, loan?.id);
      showToast({ message: loan ? 'Empréstimo atualizado.' : 'Empréstimo registrado.' });
      onClose();
    } catch (error) {
      if (error instanceof DomainError) setFormError(error.message);
      else throw error;
    }
  };

  const remove = async () => {
    if (!loan) return;
    await deleteLoan(loan.id, { keepTransactions: !removeLaunched });
    showToast({ message: 'Empréstimo excluído.' });
    onClose();
  };

  return (
    <>
      <Sheet
        open={!confirming}
        title={loan ? 'Editar empréstimo' : 'Novo empréstimo'}
        subtitle="Não debita o saldo agora; a receita entra quando o pagamento é esperado"
        onClose={onClose}
      >
        <form onSubmit={submit} noValidate>
          <FormStack>
            <TextField label="Para quem" value={values.borrower} onChange={(v) => update('borrower', v)} error={errors.borrower} placeholder="Ex.: João" maxLength={40} />
            <FormRow>
              <MoneyField
                label={values.paymentMode === 'installments' ? 'Valor de cada parcela' : 'Valor'}
                value={values.amount}
                onChange={(v) => update('amount', v)}
                error={errors.amount}
              />
              <TextField label="Data do empréstimo" type="date" value={values.loanDate} onChange={(v) => update('loanDate', v)} error={errors.loanDate} />
            </FormRow>
            <SelectField label="Categoria" value={values.categoryId} onChange={(v) => update('categoryId', v)} options={categoryOptions} error={errors.categoryId} placeholder="Selecione" />
            <SegmentedControl
              label="Pagamento"
              options={PAYMENT_MODE_OPTIONS}
              value={values.paymentMode}
              onChange={(mode) => update('paymentMode', mode)}
            />
            <FormRow>
              <TextField
                label={values.paymentMode === 'installments' ? 'Primeira parcela' : 'Mês do pagamento'}
                type="month"
                value={values.firstMonth}
                onChange={(v) => update('firstMonth', v)}
                error={errors.firstMonth}
              />
              {values.paymentMode === 'installments' && (
                <TextField
                  label="Quantidade de parcelas"
                  type="number"
                  inputMode="numeric"
                  min={INSTALLMENT_COUNT_MIN + 1}
                  max={INSTALLMENT_COUNT_MAX}
                  value={values.installmentCount}
                  onChange={(v) => update('installmentCount', v)}
                  error={errors.installmentCount}
                />
              )}
            </FormRow>
            <TextField label="Observação (opcional)" value={values.notes} onChange={(v) => update('notes', v)} error={errors.notes} maxLength={200} />
            <p className={styles.formHint}>
              O empréstimo não entra no saldo agora. {values.paymentMode === 'installments' ? 'Cada parcela' : 'O pagamento'} vira uma receita
              automaticamente quando o mês esperado chega.
            </p>
            {formError && (
              <p role="alert" className={styles.formError}>
                {formError}
              </p>
            )}
            <Button type="submit" icon="check" fullWidth>
              {loan ? 'Salvar alterações' : 'Registrar empréstimo'}
            </Button>
            {loan && (
              <Button variant="danger" icon="delete" fullWidth onClick={() => setConfirming(true)}>
                Excluir empréstimo
              </Button>
            )}
          </FormStack>
        </form>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Excluir empréstimo?"
        message={`O registro do empréstimo de "${loan?.borrower ?? ''}" será removido.${
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
