import { IconButton } from '@/components/common/Button';
import { useTheme } from '@/theme/ThemeProvider';

/** Sol no tema claro, lua no escuro (ícone indica o tema atual). */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <IconButton
      icon={isDark ? 'dark_mode' : 'light_mode'}
      label={isDark ? 'Tema escuro ativo. Mudar para o tema claro' : 'Tema claro ativo. Mudar para o tema escuro'}
      aria-pressed={isDark}
      onClick={toggleTheme}
      data-testid="theme-toggle"
    />
  );
}
