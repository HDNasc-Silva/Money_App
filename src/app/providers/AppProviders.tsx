import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/common/Toast';
import { TransactionEditorProvider } from '@/modules/transactions/TransactionEditor';
import type { Repositories } from '@/services/repositories';
import { FinanceProvider } from '@/store/FinanceProvider';
import { SelectedMonthProvider } from '@/store/SelectedMonth';
import { ThemeProvider } from '@/theme/ThemeProvider';

interface AppProvidersProps {
  children: ReactNode;
  repositories?: Repositories;
}

export function AppProviders({ children, repositories }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <FinanceProvider repositories={repositories}>
          <SelectedMonthProvider>
            <TransactionEditorProvider>{children}</TransactionEditorProvider>
          </SelectedMonthProvider>
        </FinanceProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
