import { DEFAULT_PALETTE, isPaletteId, paletteById, type PaletteId } from './palettes';

/**
 * Sistema de temas (DT-019): o **modo** (claro/escuro/automático) é independente da **paleta**
 * (cor de destaque). `light` usa a base Slate & Flow e `dark` a base Obsidian Capital.
 */
export type ThemeName = 'light' | 'dark';
/** `system` segue `prefers-color-scheme`. */
export type ThemeMode = ThemeName | 'system';
export type TextSize = 'normal' | 'large';

export interface ThemePreferences {
  mode: ThemeMode;
  palette: PaletteId;
  textSize: TextSize;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = { mode: 'system', palette: DEFAULT_PALETTE, textSize: 'normal' };

/** Chave versionada (JSON); a mesma do script inline do `index.html`, que aplica o tema antes do React. */
export const THEME_STORAGE_KEY = 'money-app:theme:v2';
/** Chave das versões ≤ 1.6.0 (`'light'` | `'dark'`), migrada na primeira leitura. */
export const LEGACY_THEME_STORAGE_KEY = 'money-app:theme';

export const MODE_LABELS: Record<ThemeMode, string> = { light: 'Claro', dark: 'Escuro', system: 'Automático' };
export const TEXT_SIZE_LABELS: Record<TextSize, string> = { normal: 'Normal', large: 'Grande' };

const isThemeName = (value: unknown): value is ThemeName => value === 'light' || value === 'dark';
const isThemeMode = (value: unknown): value is ThemeMode => isThemeName(value) || value === 'system';
const isTextSize = (value: unknown): value is TextSize => value === 'normal' || value === 'large';

/**
 * Lê as preferências salvas. Campos inválidos voltam ao padrão; sem a chave nova, migra a antiga
 * (`'light'`/`'dark'` → modo fixo com a paleta Esmeralda). Sem nada salvo, devolve `null`.
 */
export function parseThemePreferences(raw: string | null, legacy: string | null): ThemePreferences | null {
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const value = parsed as Record<string, unknown>;
        return {
          mode: isThemeMode(value.mode) ? value.mode : DEFAULT_THEME_PREFERENCES.mode,
          palette: isPaletteId(value.palette) ? value.palette : DEFAULT_THEME_PREFERENCES.palette,
          textSize: isTextSize(value.textSize) ? value.textSize : DEFAULT_THEME_PREFERENCES.textSize,
        };
      }
    } catch {
      // JSON ilegível: tenta a chave antiga e, sem ela, usa o padrão.
    }
  }
  if (isThemeName(legacy)) return { ...DEFAULT_THEME_PREFERENCES, mode: legacy };
  return null;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadThemePreferences(): ThemePreferences {
  return parseThemePreferences(readStorage(THEME_STORAGE_KEY), readStorage(LEGACY_THEME_STORAGE_KEY)) ?? DEFAULT_THEME_PREFERENCES;
}

/** Salva na chave versionada e remove a chave antiga (migração concluída). */
export function saveThemePreferences(preferences: ThemePreferences): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  } catch {
    // Sem storage disponível: o tema vale apenas para a sessão atual.
  }
}

/** Modo efetivo: `system` segue o tema do sistema. */
export const resolveMode = (mode: ThemeMode, systemPrefersDark: boolean): ThemeName =>
  mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

/** Cor da barra do navegador/app instalado para a paleta e o modo (mesmos valores do `index.html`). */
export const themeColorFor = (palette: PaletteId, theme: ThemeName): string => paletteById(palette)[theme].themeColor;

export interface AppliedTheme {
  theme: ThemeName;
  palette: PaletteId;
  textSize: TextSize;
}

const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 300;
let transitionTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Aplica o tema no `<html>` (`data-theme`, `data-palette`, `data-text-size`, `color-scheme` e metas
 * `theme-color`); com `animate`, ativa a transição suave de cores (ver styles/global.css).
 */
export function applyTheme({ theme, palette, textSize }: AppliedTheme, animate = false): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add(TRANSITION_CLASS);
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS);
  }
  root.dataset.theme = theme;
  root.dataset.palette = palette;
  root.dataset.textSize = textSize;
  root.style.colorScheme = theme;
  // Há uma meta por esquema de cor do sistema; ambas seguem o tema escolhido no app.
  const color = themeColorFor(palette, theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', color));
}
