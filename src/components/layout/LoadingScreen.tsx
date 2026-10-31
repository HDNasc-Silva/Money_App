import { Icon } from '@/components/common/Icon';
import styles from './LoadingScreen.module.css';

/** Tela exibida enquanto os dados salvos são carregados. */
export function LoadingScreen() {
  return (
    <div className={styles.loading} role="status">
      <Icon name="hourglass_empty" size={28} />
      Carregando suas finanças…
    </div>
  );
}
