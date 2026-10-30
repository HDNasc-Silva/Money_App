import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Transaction } from '@/models';
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

  const openNew = useCallback((preset?: TransactionPreset) => {
    setEditor({ key: Date.now(), transaction: null, preset });
  }, []);

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
