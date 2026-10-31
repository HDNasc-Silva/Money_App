import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CategoriesPage } from '@/modules/categories/CategoriesPage';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { GoalsPage } from '@/modules/goals/GoalsPage';
import { ONBOARDING_PATH, OnboardingGate } from '@/modules/onboarding/OnboardingGate';
import { OnboardingPage } from '@/modules/onboarding/OnboardingPage';
import { ReportsPage } from '@/modules/reports/ReportsPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
import { SubscriptionsPage } from '@/modules/subscriptions/SubscriptionsPage';
import { TransactionsPage } from '@/modules/transactions/TransactionsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<OnboardingGate />}>
        {/* Fora do AppShell: a tela de boas-vindas não tem cabeçalho nem navegação. */}
        <Route path={ONBOARDING_PATH} element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="lancamentos" element={<TransactionsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="assinaturas" element={<SubscriptionsPage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
