import styles from './LoadingScreen.module.css';

/** Tela exibida enquanto os dados salvos são carregados: esqueleto no formato do Início. */
export function LoadingScreen() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className="visually-hidden">Carregando suas finanças…</span>
      <div className={styles.skeletonPage} aria-hidden="true">
        <div className={['skeleton', styles.title].join(' ')} />
        <div className={['skeleton', styles.hero].join(' ')} />
        <div className={styles.row}>
          <div className={['skeleton', styles.metric].join(' ')} />
          <div className={['skeleton', styles.metric].join(' ')} />
          <div className={['skeleton', styles.metric].join(' ')} />
        </div>
        <div className={['skeleton', styles.block].join(' ')} />
        <div className={['skeleton', styles.block].join(' ')} />
      </div>
    </div>
  );
}
