import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { resolveInitialTheme, THEME_STORAGE_KEY } from '@/theme/theme';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { mediaState } from './setup';

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

describe('tema', () => {
  it('preferência salva tem prioridade sobre o sistema', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('segue o tema do sistema na primeira utilização', () => {
    mediaState.systemPrefersDark = true;
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByTestId('theme-toggle')).toHaveAccessibleName(/Tema escuro ativo/);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('alterna globalmente e persiste a escolha', async () => {
    const user = userEvent.setup();
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByTestId('theme-toggle').textContent).toBe('light_mode');

    await user.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByTestId('theme-toggle').textContent).toBe('dark_mode');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('usa a preferência salva mesmo com o sistema escuro', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    mediaState.systemPrefersDark = true;
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
