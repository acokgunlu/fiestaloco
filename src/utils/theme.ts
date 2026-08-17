import { useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark';

const THEME_KEY = 'fiestaloco_app_theme';

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light'; // Default to bright cheerful light arcade mode
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme: AppTheme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } catch {}
}

export function useAppTheme() {
  const [theme, setThemeState] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    setStoredTheme(nextTheme);
  };

  return { theme, toggleTheme, setTheme: setThemeState };
}
