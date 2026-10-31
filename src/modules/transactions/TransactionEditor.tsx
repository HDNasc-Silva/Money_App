import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { defaultDateForMonth } from '@/domain/periods';
import type { Transaction } from '@/models';
import { useSelectedMonth } from '@/store/SelectedMonth';
import { todayIso } from '@/utils/dates';
import { TransactionFormSheet, type TransactionPreset } from './TransactionForm';

interface TransactionEditorValue {
  openNew(preset?: TransactionPreset): void;
  openEdit(transaction: Transaction): void;
}

const TransactionEditorContext = createContext<TransactionEditorValue | null>(null);

interface EditorState {
  key: number;
  transaction: Transaction | null;
  preset?: TransactionPreset;
}

/** Permite abrir o formulário de lançamento de qualquer tela (Visão Geral, Lançamentos, navegação). */
export function TransactionEditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const { month } = useSelectedMonth();

  // Todo novo lançamento sugere uma data dentro do mês selecionado no seletor de mês.
  const openNew = useCallback(
    (preset?: TransactionPreset) => {
      const date = preset?.date ?? defaultDateForMonth(month, todayIso());
      setEditor({ key: Date.now(), transaction: null, preset: { ...preset, date } });
    },
    [month],
  );

  const openEdit = useCallback((transaction: Transaction) => {
    setEditor({ key: Date.now(), transaction });
  }, []);

  const value = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit]);

  return (
    <TransactionEditorContext.Provider value={value}>
      {children}
      {editor && (
        <TransactionFormSheet
          key={editor.key}
          open
          transaction={editor.transaction}
          preset={editor.preset}
          onClose={() => setEditor(null)}
        />
      )}
    </TransactionEditorContext.Provider>
  );
}

export function useTransactionEditor(): TransactionEditorValue {
  const context = useContext(TransactionEditorContext);
  if (!context) throw new Error('useTransactionEditor deve ser usado dentro de <TransactionEditorProvider>.');
  return context;
}
