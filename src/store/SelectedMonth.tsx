import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MonthKey } from '@/models';
import { addMonths, monthKeyOf, todayIso } from '@/utils/dates';

/** Mês de referência compartilhado entre Visão Geral, Categorias e Relatórios. */
interface SelectedMonthValue {
  month: MonthKey;
  currentMonth: MonthKey;
  setMonth(month: MonthKey): void;
  previous(): void;
  next(): void;
}

const SelectedMonthContext = createContext<SelectedMonthValue | null>(null);

export function SelectedMonthProvider({ children }: { children: ReactNode }) {
  const currentMonth = monthKeyOf(todayIso());
  const [month, setMonth] = useState<MonthKey>(currentMonth);

  const value = useMemo<SelectedMonthValue>(
    () => ({
      month,
      currentMonth,
      setMonth,
      previous: () => setMonth((m) => addMonths(m, -1)),
      // Não permite navegar para meses futuros.
      next: () => setMonth((m) => (m < currentMonth ? addMonths(m, 1) : m)),
    }),
    [month, currentMonth],
  );

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>;
}

export function useSelectedMonth(): SelectedMonthValue {
  const context = useContext(SelectedMonthContext);
  if (!context) throw new Error('useSelectedMonth deve ser usado dentro de <SelectedMonthProvider>.');
  return context;
}
