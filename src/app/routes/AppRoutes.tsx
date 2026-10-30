import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CategoriesPage } from '@/modules/categories/CategoriesPage';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { GoalsPage } from '@/modules/goals/GoalsPage';
import { ReportsPage } from '@/modules/reports/ReportsPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
import { TransactionsPage } from '@/modules/transactions/TransactionsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="lancamentos" element={<TransactionsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
