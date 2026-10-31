import { useSyncExternalStore } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { useToast } from '@/components/common/Toast';
import {
  canPromptInstall,
  isAppleMobile,
  isRunningStandalone,
  promptInstall,
  subscribeInstallPrompt,
} from '@/services/pwa/installPrompt';
import styles from './Settings.module.css';

/**
 * Instalação do app (PWA): botão nativo quando o navegador oferece `beforeinstallprompt`
 * (Chrome/Edge/Android); instruções manuais no iPhone/iPad e nos demais navegadores.
 */
export function InstallAppCard() {
  const { showToast } = useToast();
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall);
  const standalone = useSyncExternalStore(subscribeInstallPrompt, isRunningStandalone);

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') showToast({ message: 'Money App instalado. Procure o ícone na tela inicial.' });
  };

  return (
    <Card>
      <CardHeader title="Instalar app" subtitle="Abra o Money App pela tela inicial, em tela cheia e também sem internet." />
      {standalone ? (
        <p className={styles.stats}>O Money App já está instalado e aberto como aplicativo.</p>
      ) : canPrompt ? (
        <Button icon="install_mobile" onClick={install}>
          Instalar app
        </Button>
      ) : isAppleMobile() ? (
        <ol className={styles.steps}>
          <li>Abra esta página no Safari.</li>
          <li>
            Toque em <strong>Compartilhar</strong> (quadrado com seta para cima).
          </li>
          <li>
            Escolha <strong>Adicionar à Tela de Início</strong> e confirme em <strong>Adicionar</strong>.
          </li>
        </ol>
      ) : (
        <p className={styles.stats}>
          Abra o menu do navegador (⋮) e escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>. No
          Android, use o Chrome.
        </p>
      )}
    </Card>
  );
}
