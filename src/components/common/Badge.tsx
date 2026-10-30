import type { ReactNode } from 'react';
import styles from './Badge.module.css';
import { Icon } from './Icon';

export type BadgeTone = 'neutral' | 'income' | 'expense' | 'warning' | 'info';

interface BadgeProps {
  tone?: BadgeTone;
  icon?: string;
  money?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', icon, money = false, children }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[tone], money && 'money'].filter(Boolean).join(' ')}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
