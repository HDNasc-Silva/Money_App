import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AlertTone } from '@/domain/alerts';
import styles from './AlertCard.module.css';
import { Icon } from './Icon';

interface AlertCardProps {
  tone: AlertTone;
  icon: string;
  title: string;
  children: ReactNode;
  to?: string;
  aside?: ReactNode;
  /** Versão compacta (Início): menos espaço e mensagem limitada a duas linhas. */
  compact?: boolean;
}

export function AlertCard({ tone, icon, title, children, to, aside, compact = false }: AlertCardProps) {
  const content = (
    <>
      <Icon name={icon} size={compact ? 18 : 20} className={styles.icon} />
      <div className={styles.text}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {aside}
        </div>
        <p className={styles.message}>{children}</p>
      </div>
    </>
  );
  const className = [styles.alert, styles[tone], compact && styles.compact].filter(Boolean).join(' ');
  return to ? (
    <Link to={to} className={[className, styles.link].join(' ')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
