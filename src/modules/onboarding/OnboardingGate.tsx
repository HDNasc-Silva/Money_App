import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useFinance } from '@/store/FinanceProvider';

export const ONBOARDING_PATH = '/boas-vindas';

/**
 * Rota de layout que decide entre o app e a tela de boas-vindas:
 * enquanto `settings.onboardingCompleted` for `false`, qualquer rota leva ao onboarding;
 * depois de concluído, o onboarding redireciona para o Início.
 */
export function OnboardingGate() {
  const { state } = useFinance();
  const { pathname } = useLocation();

  if (state.status === 'loading') return <LoadingScreen />;

  const completed = state.data.settings.onboardingCompleted;
  const onOnboarding = pathname === ONBOARDING_PATH;
  if (!completed && !onOnboarding) return <Navigate to={ONBOARDING_PATH} replace />;
  if (completed && onOnboarding) return <Navigate to="/" replace />;
  return <Outlet />;
}
