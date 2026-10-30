import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size={28} />
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
