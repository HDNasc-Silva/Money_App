import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { MoneyField, TextField } from '@/components/forms/Fields';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { USER_NAME_MAX } from '@/models';
import { useFinanceActions } from '@/store/FinanceProvider';
import { validateOnboarding, type FieldErrors, type OnboardingFormValues } from '@/validations';
import styles from './Onboarding.module.css';

/** Tela de boas-vindas do primeiro acesso: pede o nome (obrigatório) e a renda mensal (opcional). */
export function OnboardingPage() {
  const actions = useFinanceActions();
  const navigate = useNavigate();
  const [values, setValues] = useState<OnboardingFormValues>({ name: '', monthlyIncome: '' });
  const [errors, setErrors] = useState<FieldErrors<keyof OnboardingFormValues>>({});
  const [saving, setSaving] = useState(false);

  const change = (field: keyof OnboardingFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateOnboarding(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    await actions.completeOnboarding(result.value);
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <ThemeToggle />
      </div>
      <main className={styles.content}>
        <div className={styles.brand} aria-hidden="true">
          <img src="./icons/icon-192.png" alt="" width={64} height={64} />
        </div>
        <p className={styles.eyebrow}>Bem-vindo ao Money App</p>
        <h1 className={styles.title}>Como prefere ser chamado?</h1>
        <p className={styles.lead}>Seus dados ficam salvos só neste dispositivo. Você pode mudar tudo depois em Ajustes.</p>

        <form className={styles.form} onSubmit={submit} noValidate>
          <TextField
            label="Seu nome"
            value={values.name}
            onChange={change('name')}
            error={errors.name}
            maxLength={USER_NAME_MAX}
            autoComplete="given-name"
            autoFocus
            required
          />
          <MoneyField
            label="Renda mensal (opcional)"
            value={values.monthlyIncome}
            onChange={change('monthlyIncome')}
            error={errors.monthlyIncome}
            hint="Fica no seu perfil e pode ser alterada em Ajustes."
          />
          <Button type="submit" icon="arrow_forward" fullWidth disabled={saving}>
            Começar
          </Button>
        </form>
      </main>
    </div>
  );
}
