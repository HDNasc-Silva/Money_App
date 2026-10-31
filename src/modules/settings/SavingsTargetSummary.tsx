import { savingsTargetAmount } from '@/domain/summary';
import { formatCurrency, parseMoney } from '@/utils/money';
import styles from './Settings.module.css';

interface SavingsTargetSummaryProps {
  /** Valores ainda em edição no formulário (texto), para a prévia acompanhar a digitação. */
  monthlyIncome: string;
  savingsTarget: string;
}

/** Mostra quanto a meta de poupança representa em reais sobre a renda mensal informada. */
export function SavingsTargetSummary({ monthlyIncome, savingsTarget }: SavingsTargetSummaryProps) {
  const income = parseMoney(monthlyIncome) ?? 0;
  const percent = Number(savingsTarget.replace(',', '.'));
  const validPercent = savingsTarget.trim() !== '' && Number.isFinite(percent) && percent >= 0 && percent <= 100;
  const amount = validPercent ? savingsTargetAmount(income, Math.round(percent)) : null;

  return (
    <p className={styles.targetSummary} aria-live="polite" data-testid="savings-target-summary">
      {amount === null ? (
        'Informe a renda mensal e a meta para ver quanto guardar por mês.'
      ) : (
        <>
          Meta de {Math.round(percent)}% de {formatCurrency(income)} = <strong className="money">{formatCurrency(amount)}</strong> por mês.
        </>
      )}
    </p>
  );
}
