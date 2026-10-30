import type { Cents } from '@/models';
import { useFinanceData } from '@/store/FinanceProvider';
import { formatCurrency, type FormatOptions } from '@/utils/money';

interface MoneyProps extends FormatOptions {
  value: Cents;
  className?: string;
  /** Ignora a preferência de ocultar valores (ex.: dentro de formulários). */
  alwaysVisible?: boolean;
}

export const HIDDEN_VALUE = '••••••';

/** Valor monetário com fonte tabular do tema e suporte a "ocultar valores". */
export function Money({ value, className, alwaysVisible = false, ...options }: MoneyProps) {
  const { hideBalances } = useFinanceData().settings;
  const hidden = hideBalances && !alwaysVisible;
  return (
    <span className={['money', className].filter(Boolean).join(' ')} aria-label={hidden ? 'Valor oculto' : undefined}>
      {hidden ? `R$ ${HIDDEN_VALUE}` : formatCurrency(value, options)}
    </span>
  );
}
