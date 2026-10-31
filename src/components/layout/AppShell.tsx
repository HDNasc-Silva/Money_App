import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useFinance } from '@/store/FinanceProvider';
import { AppHeader } from './AppHeader';
import styles from './AppShell.module.css';
import { BottomNav, SideNav } from './Navigation';

const NOTICE_MESSAGES = {
  corrupted: 'Os dados salvos estavam ilegíveis e foram preservados em backup. O app recomeçou do zero.',
  'not-persistent': 'O armazenamento do navegador está indisponível: os dados não serão mantidos ao fechar o app.',
  'load-failed': 'Não foi possível carregar os dados salvos.',
} as const;

export function AppShell() {
  const { state, actions } = useFinance();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // O carregamento e o onboarding são tratados antes, pelo OnboardingGate (ver AppRoutes).
  return (
    <div className={styles.shell}>
      <a href="#conteudo" className={styles.skip}>
        Pular para o conteúdo
      </a>
      <SideNav />
      <div className={styles.column}>
        <AppHeader />
        <main id="conteudo" className={styles.main} tabIndex={-1}>
          {state.notice && (
            <div className={styles.notice} role="alert">
              <Icon name="error" size={18} />
              <span>{NOTICE_MESSAGES[state.notice]}</span>
              <Button variant="ghost" size="sm" onClick={actions.dismissNotice}>
                Ok
              </Button>
            </div>
          )}
          {state.data.settings.isDemoData && pathname !== '/ajustes' && (
            <div className={styles.demo}>
              <Icon name="science" size={18} />
              <span>
                Você está vendo <strong>dados de demonstração</strong>.
              </span>
              <Link to="/ajustes" className={styles.demoLink}>
                Começar do zero
              </Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
