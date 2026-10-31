import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PaletteId } from './palettes';
import {
  applyTheme,
  loadThemePreferences,
  resolveMode,
  saveThemePreferences,
  type TextSize,
  type ThemeMode,
  type ThemeName,
  type ThemePreferences,
} from './theme';

interface ThemeContextValue {
  /** Modo efetivo (claro/escuro), já resolvido quando o modo é automático. */
  theme: ThemeName;
  mode: ThemeMode;
  palette: PaletteId;
  textSize: TextSize;
  /** Alterna entre claro e escuro (fixa o modo, saindo do automático). */
  toggleTheme(): void;
  setMode(mode: ThemeMode): void;
  setPalette(palette: PaletteId): void;
  setTextSize(textSize: TextSize): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = '(prefers-color-scheme: dark)';

const systemPrefersDark = (): boolean => typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ThemePreferences>(loadThemePreferences);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const systemDarkRef = useRef(systemDark);
  systemDarkRef.current = systemDark;

  const theme = resolveMode(preferences.mode, systemDark);
  const { palette, textSize, mode } = preferences;

  const isFirstApply = useRef(true);
  useEffect(() => {
    applyTheme({ theme, palette, textSize }, !isFirstApply.current);
    isFirstApply.current = false;
  }, [theme, palette, textSize]);

  // Acompanha o tema do sistema (usado quando o modo é automático).
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const update = useCallback((changes: (current: ThemePreferences) => Partial<ThemePreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...changes(current) };
      saveThemePreferences(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(
    () => update((current) => ({ mode: resolveMode(current.mode, systemDarkRef.current) === 'dark' ? 'light' : 'dark' })),
    [update],
  );
  const setMode = useCallback((next: ThemeMode) => update(() => ({ mode: next })), [update]);
  const setPalette = useCallback((next: PaletteId) => update(() => ({ palette: next })), [update]);
  const setTextSize = useCallback((next: TextSize) => update(() => ({ textSize: next })), [update]);

  const value = useMemo(
    () => ({ theme, mode, palette, textSize, toggleTheme, setMode, setPalette, setTextSize }),
    [theme, mode, palette, textSize, toggleTheme, setMode, setPalette, setTextSize],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.');
  return context;
}
