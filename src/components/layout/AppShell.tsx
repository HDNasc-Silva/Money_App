import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Icon } from '@/components/common/Icon';
import { useToast } from '@/components/common/Toast';
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
  const { showToast } = useToast();
  const [leavingDemo, setLeavingDemo] = useState(false);

  const leaveDemo = async () => {
    setLeavingDemo(false);
    await actions.clearAllData();
    showToast({ message: 'Pronto! Agora é com você: registre seu primeiro lançamento.' });
  };

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
              <Icon name="science" size={16} />
              <span className={styles.demoText}>
                <span className={styles.demoLong}>Você está vendo </span>dados de demonstração
              </span>
              <button type="button" className={styles.demoButton} onClick={() => setLeavingDemo(true)}>
                Sair da demonstração
              </button>
            </div>
          )}
          <div key={pathname} className={styles.pageTransition}>
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
      <ConfirmDialog
        open={leavingDemo}
        title="Sair da demonstração?"
        message="Os dados de demonstração serão apagados e você começa do zero, com as categorias padrão. Seu nome e sua renda mensal são mantidos."
        confirmLabel="Começar do zero"
        onConfirm={leaveDemo}
        onCancel={() => setLeavingDemo(false)}
      />
    </div>
  );
}
