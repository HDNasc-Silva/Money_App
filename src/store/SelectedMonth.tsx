import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { isFutureMonth, maxPlanningMonth } from '@/domain/periods';
import type { MonthKey } from '@/models';
import { addMonths, monthKeyOf, todayIso } from '@/utils/dates';

/** Mês de referência compartilhado entre Visão Geral, Categorias e Relatórios. */
interface SelectedMonthValue {
  month: MonthKey;
  currentMonth: MonthKey;
  /** Último mês navegável (mês atual + `MAX_FUTURE_MONTHS`). */
  maxMonth: MonthKey;
  /** O mês selecionado é posterior ao mês atual (planejamento). */
  isFuture: boolean;
  setMonth(month: MonthKey): void;
  previous(): void;
  next(): void;
}

const SelectedMonthContext = createContext<SelectedMonthValue | null>(null);

export function SelectedMonthProvider({ children }: { children: ReactNode }) {
  const today = todayIso();
  const currentMonth = monthKeyOf(today);
  const maxMonth = maxPlanningMonth(today);
  const [month, setMonthState] = useState<MonthKey>(currentMonth);

  const value = useMemo<SelectedMonthValue>(() => {
    const clamp = (m: MonthKey): MonthKey => (m > maxMonth ? maxMonth : m);
    return {
      month,
      currentMonth,
      maxMonth,
      isFuture: isFutureMonth(month, today),
      setMonth: (m) => setMonthState(clamp(m)),
      previous: () => setMonthState((m) => addMonths(m, -1)),
      // Meses futuros são permitidos para planejamento, até `maxMonth`.
      next: () => setMonthState((m) => clamp(addMonths(m, 1))),
    };
  }, [month, currentMonth, maxMonth, today]);

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>;
}

export function useSelectedMonth(): SelectedMonthValue {
  const context = useContext(SelectedMonthContext);
  if (!context) throw new Error('useSelectedMonth deve ser usado dentro de <SelectedMonthProvider>.');
  return context;
}
