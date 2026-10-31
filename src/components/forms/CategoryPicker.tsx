import { useId, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import type { Category } from '@/models';
import styles from './CategoryPicker.module.css';

/** Chips exibidos antes de "Mais"; a categoria selecionada aparece sempre. */
const VISIBLE_CHIPS = 8;

interface CategoryPickerProps {
  label: string;
  /** Já na ordem desejada (ex.: mais usadas primeiro). */
  categories: readonly Category[];
  value: string;
  onChange(categoryId: string): void;
  error?: string;
}

/** Seleção de categoria em grade de chips com ícone (grupo de opções acessível como `radiogroup`). */
export function CategoryPicker({ label, categories, value, onChange, error }: CategoryPickerProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const hidden = categories.length - VISIBLE_CHIPS;
  const collapsed = !expanded && hidden > 1;
  const visible = collapsed
    ? categories.filter((c, index) => index < VISIBLE_CHIPS || c.id === value)
    : categories;

  return (
    <div className={styles.field}>
      <span id={`${id}-label`} className={styles.label}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={styles.grid}
      >
        {visible.map((category) => {
          const selected = category.id === value;
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={[styles.chip, selected && styles.selected].filter(Boolean).join(' ')}
              onClick={() => onChange(category.id)}
            >
              <Icon name={category.icon} size={20} filled={selected} />
              <span className={styles.name}>{category.name}</span>
            </button>
          );
        })}
        {collapsed && (
          <button type="button" className={[styles.chip, styles.more].join(' ')} onClick={() => setExpanded(true)}>
            <Icon name="expand_more" size={20} />
            <span className={styles.name}>Mais {categories.length - visible.length}</span>
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
