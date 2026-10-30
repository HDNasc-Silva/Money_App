import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  size = 'md',
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], fullWidth && styles.full, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  variant?: 'plain' | 'tonal';
  badge?: boolean;
}

/** Botão só com ícone: `label` é obrigatório para leitores de tela. */
export function IconButton({ icon, label, variant = 'plain', badge = false, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.iconButton, styles[`icon-${variant}`], className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon name={icon} size={22} />
      {badge && <span className={styles.badge} aria-hidden="true" />}
    </button>
  );
}
