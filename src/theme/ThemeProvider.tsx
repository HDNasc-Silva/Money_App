import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applyTheme, loadThemePreference, resolveInitialTheme, saveThemePreference, type ThemeName } from './theme';

interface ThemeContextValue {
  theme: ThemeName;
  toggleTheme(): void;
  setTheme(theme: ThemeName): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const systemPrefersDark = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() =>
    resolveInitialTheme(loadThemePreference(), systemPrefersDark()),
  );

  const isFirstApply = useRef(true);
  useEffect(() => {
    applyTheme(theme, !isFirstApply.current);
    isFirstApply.current = false;
  }, [theme]);

  // Sem preferência salva, acompanha mudanças do tema do sistema.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (!loadThemePreference()) setThemeState(event.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    saveThemePreference(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      saveThemePreference(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.');
  return context;
}
