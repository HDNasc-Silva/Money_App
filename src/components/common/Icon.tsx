import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Ícone Material Symbols (decorativo; o texto acessível fica no elemento pai). */
export function Icon({ name, size = 20, filled = false, className, style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={['material-symbols-outlined', className].filter(Boolean).join(' ')}
      style={{
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
