import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'article' | 'div';
  padding?: 'md' | 'lg';
  children: ReactNode;
}

export function Card({ as: Tag = 'section', padding = 'lg', className, children, ...rest }: CardProps) {
  return (
    <Tag className={[styles.card, styles[padding], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  level?: 2 | 3;
}

export function CardHeader({ title, subtitle, action, level = 2 }: CardHeaderProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>
        <Heading className={styles.title}>{title}</Heading>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
