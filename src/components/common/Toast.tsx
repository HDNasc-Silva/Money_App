import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createId } from '@/utils/id';
import { Icon } from './Icon';
import styles from './Toast.module.css';

type ToastTone = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  showToast(toast: { tone?: ToastTone; message: string }): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;
const ICONS: Record<ToastTone, string> = { success: 'check_circle', error: 'error', info: 'info' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>(
    ({ tone = 'success', message }) => {
      const id = createId();
      setToasts((current) => [...current.slice(-2), { id, tone, message }]);
      timers.current.set(id, setTimeout(() => dismiss(id), TOAST_DURATION_MS));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={[styles.toast, styles[toast.tone]].join(' ')}>
            <Icon name={ICONS[toast.tone]} size={18} />
            <span className={styles.message}>{toast.message}</span>
            <button type="button" className={styles.close} aria-label="Fechar aviso" onClick={() => dismiss(toast.id)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return context;
}
