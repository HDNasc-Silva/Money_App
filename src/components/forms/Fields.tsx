import { useId, useLayoutEffect, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Icon } from '@/components/common/Icon';
import { formatMoneyInput } from '@/utils/money';
import styles from './Fields.module.css';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange(value: string): void;
  error?: string;
  hint?: string;
}

export function TextField({ label, value, onChange, error, hint, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </FieldShell>
  );
}

/**
 * Campo monetário com prefixo "R$" fixo, máscara automática pelos centavos (`formatMoneyInput`)
 * e teclado numérico no mobile. O cursor é mantido no fim após cada digitação.
 */
export function MoneyField({ label, value, onChange, error, hint, ...rest }: TextFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) input.setSelectionRange(value.length, value.length);
  }, [value]);

  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className={styles.moneyWrap}>
        <span className={styles.prefix} aria-hidden="true">
          R$
        </span>
        <input
          ref={inputRef}
          id={id}
          className={[styles.input, styles.moneyInput, 'money'].join(' ')}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0,00"
          value={value}
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  value: string;
  onChange(value: string): void;
  options: readonly { value: string; label: string }[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

export function SelectField({ label, value, onChange, options, error, hint, placeholder, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className={styles.selectWrap}>
        <select
          id={id}
          className={[styles.input, styles.select].join(' ')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="expand_more" size={20} className={styles.chevron} />
      </div>
    </FieldShell>
  );
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function FormStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}
