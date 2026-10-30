import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/components/common/Icon';
import { ICON_CATALOG, iconLabel, searchIcons, type IconOption } from '@/design-system/icons';
import fieldStyles from './Fields.module.css';
import styles from './IconPicker.module.css';

interface IconPickerProps {
  label: string;
  value: string;
  onChange(icon: string): void;
  error?: string;
  /** Subconjunto do catálogo; padrão: catálogo completo. */
  options?: readonly IconOption[];
}

/** Evita que Enter na busca envie o formulário em que o seletor está. */
const preventSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === 'Enter') event.preventDefault();
};

/** Seletor de ícone com busca em português e grade rolável. */
export function IconPicker({ label, value, onChange, error, options = ICON_CATALOG }: IconPickerProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchIcons(query, options), [query, options]);
  const selectedLabel = iconLabel(value);

  return (
    <fieldset className={fieldStyles.fieldset} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={fieldStyles.label}>{label}</legend>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={preventSubmit}
            placeholder="Buscar ícone (ex.: mercado, pet, viagem)"
            aria-label="Buscar ícone"
            autoComplete="off"
          />
        </div>
        {value && (
          <p className={styles.selected} aria-live="polite">
            <span className={styles.selectedIcon}>
              <Icon name={value} size={18} />
            </span>
            Selecionado: <strong>{selectedLabel}</strong>
          </p>
        )}
      </div>
      {results.length > 0 ? (
        <div className={styles.grid} role="radiogroup" aria-label={label}>
          {results.map((option) => {
            const checked = option.name === value;
            return (
              <button
                key={option.name}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={option.label}
                title={option.label}
                className={[styles.option, checked && styles.optionSelected].filter(Boolean).join(' ')}
                onClick={() => onChange(option.name)}
              >
                <Icon name={option.name} size={20} />
              </button>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty} role="status">
          Nenhum ícone encontrado para “{query.trim()}”.
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={fieldStyles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
