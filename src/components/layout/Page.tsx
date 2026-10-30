import type { ReactNode } from 'react';
import styles from './Page.module.css';

interface PageProps {
  title: string;
  eyebrow?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Estrutura comum das telas: título, ação opcional e conteúdo em coluna. */
export function Page({ title, eyebrow, description, action, children }: PageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titles}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/** Grade responsiva: 1 coluna no mobile, 2 em telas largas. */
export function PageGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function PageColumn({ children }: { children: ReactNode }) {
  return <div className={styles.column}>{children}</div>;
}
