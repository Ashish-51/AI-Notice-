import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-all shadow-sm active:scale-95 group"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform group-hover:rotate-12" />
      ) : (
        <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
}
