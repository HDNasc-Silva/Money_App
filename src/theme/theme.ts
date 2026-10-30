/** `light` = Slate & Flow · `dark` = Obsidian Capital. */
export type ThemeName = 'light' | 'dark';

/** Mesma chave usada pelo script inline do `index.html` (aplica o tema antes do React). */
export const THEME_STORAGE_KEY = 'money-app:theme';

export const THEME_LABELS: Record<ThemeName, string> = {
  light: 'Slate & Flow (claro)',
  dark: 'Obsidian Capital (escuro)',
};

const isThemeName = (value: unknown): value is ThemeName => value === 'light' || value === 'dark';

export function loadThemePreference(): ThemeName | null {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveThemePreference(theme: ThemeName): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sem storage disponível: o tema vale apenas para a sessão atual.
  }
}

/** Preferência salva tem prioridade; sem ela, segue o tema do sistema. */
export const resolveInitialTheme = (saved: ThemeName | null, systemPrefersDark: boolean): ThemeName =>
  saved ?? (systemPrefersDark ? 'dark' : 'light');

const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 300;
let transitionTimer: ReturnType<typeof setTimeout> | undefined;

/** Aplica o tema no `<html>`; com `animate`, ativa a transição suave de cores (ver styles/global.css). */
export function applyTheme(theme: ThemeName, animate = false): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add(TRANSITION_CLASS);
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS);
  }
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', theme === 'dark' ? '#0b0f17' : '#f8f9ff');
}
