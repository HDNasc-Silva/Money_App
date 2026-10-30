import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: NoInfer<T>;
  onChange(value: NoInfer<T>): void;
  label: string;
  /** `pills` = chips roláveis; `segmented` = abas de largura igual. */
  variant?: 'segmented' | 'pills';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = 'segmented',
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={styles[variant]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={[styles.option, selected && styles.selected].filter(Boolean).join(' ')}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
