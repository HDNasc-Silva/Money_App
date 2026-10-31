import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { AppearanceSettings } from '@/modules/settings/AppearanceSettings';
import { PALETTES } from '@/theme/palettes';
import {
  DEFAULT_THEME_PREFERENCES,
  LEGACY_THEME_STORAGE_KEY,
  loadThemePreferences,
  parseThemePreferences,
  resolveMode,
  THEME_STORAGE_KEY,
  themeColorFor,
} from '@/theme/theme';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { mediaState } from './setup';

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

const renderAppearance = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
      <AppearanceSettings />
    </ThemeProvider>,
  );

const stored = () => JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? 'null') as Record<string, string> | null;
const root = () => document.documentElement;
const themeColorMeta = () => {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.appendChild(meta);
  return meta;
};

describe('tema: modo e paleta (regras puras)', () => {
  it('modo automático segue o sistema; claro/escuro são fixos', () => {
    expect(resolveMode('system', true)).toBe('dark');
    expect(resolveMode('system', false)).toBe('light');
    expect(resolveMode('light', true)).toBe('light');
    expect(resolveMode('dark', false)).toBe('dark');
  });

  it('migra a preferência antiga ("light"/"dark") para a paleta Esmeralda', () => {
    expect(parseThemePreferences(null, 'dark')).toEqual({ mode: 'dark', palette: 'esmeralda', textSize: 'normal' });
    expect(parseThemePreferences(null, 'light')).toEqual({ mode: 'light', palette: 'esmeralda', textSize: 'normal' });
    expect(parseThemePreferences(null, 'roxo')).toBeNull();
    expect(parseThemePreferences(null, null)).toBeNull();
  });

  it('a chave nova tem prioridade e campos inválidos voltam ao padrão', () => {
    expect(parseThemePreferences('{"mode":"dark","palette":"oceano","textSize":"large"}', 'light')).toEqual({
      mode: 'dark',
      palette: 'oceano',
      textSize: 'large',
    });
    expect(parseThemePreferences('{"mode":"azul","palette":"__proto__","textSize":9}', null)).toEqual(DEFAULT_THEME_PREFERENCES);
    // JSON ilegível: usa a chave antiga.
    expect(parseThemePreferences('{quebrado', 'dark')).toMatchObject({ mode: 'dark' });
  });

  it('loadThemePreferences lê o storage e devolve o padrão (automático, Esmeralda) sem nada salvo', () => {
    expect(loadThemePreferences()).toEqual(DEFAULT_THEME_PREFERENCES);
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, 'dark');
    expect(loadThemePreferences()).toMatchObject({ mode: 'dark', palette: 'esmeralda' });
  });

  it('há pelo menos 5 paletas com nome em português e theme-color para claro e escuro', () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(PALETTES.length);
    for (const palette of PALETTES) {
      expect(palette.light.themeColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(palette.dark.themeColor).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(themeColorFor('esmeralda', 'light')).toBe('#f8f9ff');
    expect(themeColorFor('esmeralda', 'dark')).toBe('#0b0f17');
  });

  it('o script inline do index.html conhece as mesmas chaves e cores (aplicação sem piscar)', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain(`'${THEME_STORAGE_KEY}'`);
    expect(html).toContain(`'${LEGACY_THEME_STORAGE_KEY}'`);
    for (const palette of PALETTES) {
      expect(html).toContain(`['${palette.light.themeColor}', '${palette.dark.themeColor}']`);
      expect(html).toMatch(new RegExp(`'?${palette.id}'?: \\[`));
    }
  });

  it('os tokens das paletas existem no CSS e não sobrescrevem as cores de receita/despesa', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/design-system/palettes.css'), 'utf8');
    for (const palette of PALETTES.filter((p) => p.id !== 'esmeralda')) {
      expect(css).toContain(`[data-theme='light'][data-palette='${palette.id}']`);
      expect(css).toContain(`[data-theme='dark'][data-palette='${palette.id}']`);
    }
    expect(css).not.toMatch(/--color-(income|expense)/);
  });
});

describe('tema: provider e botão sol/lua', () => {
  it('segue o tema do sistema na primeira utilização, sem gravar preferência', () => {
    mediaState.systemPrefersDark = true;
    renderToggle();
    expect(root().dataset.theme).toBe('dark');
    expect(root().dataset.palette).toBe('esmeralda');
    expect(root().dataset.textSize).toBe('normal');
    expect(screen.getByTestId('theme-toggle')).toHaveAccessibleName(/Tema escuro ativo/);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('o botão do cabeçalho alterna claro/escuro globalmente e persiste a escolha', async () => {
    const user = userEvent.setup();
    renderToggle();
    expect(root().dataset.theme).toBe('light');
    expect(screen.getByTestId('theme-toggle').textContent).toBe('light_mode');

    await user.click(screen.getByTestId('theme-toggle'));
    expect(root().dataset.theme).toBe('dark');
    expect(screen.getByTestId('theme-toggle').textContent).toBe('dark_mode');
    expect(stored()).toMatchObject({ mode: 'dark', palette: 'esmeralda' });

    await user.click(screen.getByTestId('theme-toggle'));
    expect(root().dataset.theme).toBe('light');
    expect(stored()).toMatchObject({ mode: 'light' });
  });

  it('usa a preferência salva mesmo com o sistema escuro', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'light', palette: 'ametista', textSize: 'normal' }));
    mediaState.systemPrefersDark = true;
    renderToggle();
    expect(root().dataset.theme).toBe('light');
    expect(root().dataset.palette).toBe('ametista');
  });

  it('migra a chave antiga ao salvar a próxima escolha', async () => {
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, 'dark');
    const user = userEvent.setup();
    renderToggle();
    expect(root().dataset.theme).toBe('dark');
    await user.click(screen.getByTestId('theme-toggle'));
    expect(stored()).toEqual({ mode: 'light', palette: 'esmeralda', textSize: 'normal' });
    expect(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull();
  });
});

describe('Ajustes → Aparência', () => {
  it('escolhe paleta, modo e tamanho do texto; aplica atributos e theme-color e persiste', async () => {
    const meta = themeColorMeta();
    const user = userEvent.setup();
    renderAppearance();

    const palettes = within(screen.getByRole('radiogroup', { name: 'Tema de cores' }));
    expect(palettes.getAllByRole('radio')).toHaveLength(PALETTES.length);
    expect(palettes.getByRole('radio', { name: /Esmeralda/ })).toHaveAttribute('aria-checked', 'true');

    await user.click(palettes.getByRole('radio', { name: /Oceano/ }));
    expect(palettes.getByRole('radio', { name: /Oceano/ })).toHaveAttribute('aria-checked', 'true');
    expect(root().dataset.palette).toBe('oceano');
    expect(meta.getAttribute('content')).toBe('#f5f9ff');

    await user.click(within(screen.getByRole('radiogroup', { name: 'Modo de cor' })).getByRole('radio', { name: 'Escuro' }));
    expect(root().dataset.theme).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#09101a');

    await user.click(within(screen.getByRole('radiogroup', { name: 'Tamanho do texto' })).getByRole('radio', { name: 'Grande' }));
    expect(root().dataset.textSize).toBe('large');
    expect(stored()).toEqual({ mode: 'dark', palette: 'oceano', textSize: 'large' });

    // O botão sol/lua continua alternando o modo, sem perder a paleta.
    await user.click(screen.getByTestId('theme-toggle'));
    expect(root().dataset.theme).toBe('light');
    expect(root().dataset.palette).toBe('oceano');

    // Automático volta a seguir o sistema.
    mediaState.systemPrefersDark = true;
    await user.click(within(screen.getByRole('radiogroup', { name: 'Modo de cor' })).getByRole('radio', { name: 'Automático' }));
    expect(stored()).toMatchObject({ mode: 'system' });
    meta.remove();
  });

  it('cada prévia é renderizada com os tokens da própria paleta (data-attributes)', () => {
    renderAppearance();
    const previews = document.querySelectorAll('[data-palette]:not(html)');
    expect([...previews].map((p) => p.getAttribute('data-palette'))).toEqual(PALETTES.map((p) => p.id));
    previews.forEach((p) => expect(p).toHaveAttribute('data-theme', 'light'));
  });
});
