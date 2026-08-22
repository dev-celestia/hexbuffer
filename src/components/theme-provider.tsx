import * as React from 'react';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { PrimaryColor } from '@/constants/theme';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  primaryColor: PrimaryColor;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPrimaryColor?: PrimaryColor;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  defaultPrimaryColor = 'emerald',
}: ThemeProviderProps) {
  // ponytail: read initial value from persisted store; fall back to prop
  const storedTheme = useAppSettingsStore((s) => s.theme);
  const setStoredTheme = useAppSettingsStore((s) => s.setTheme);
  const storedPrimaryColor = useAppSettingsStore((s) => s.primaryColor);
  const setStoredPrimaryColor = useAppSettingsStore((s) => s.setPrimaryColor);

  const initialPrimary =
    (storedPrimaryColor as string) === 'neutral'
      ? 'emerald'
      : (storedPrimaryColor ?? defaultPrimaryColor);

  const [theme, setThemeState] = React.useState<Theme>(storedTheme ?? defaultTheme);
  const [primaryColor, setPrimaryColorState] = React.useState<PrimaryColor>(initialPrimary);

  // Apply class to <html> whenever theme changes
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Apply data-primary-color to <html> whenever primary color changes
  React.useEffect(() => {
    const root = document.documentElement;
    if (primaryColor) {
      root.setAttribute('data-primary-color', primaryColor);
    } else {
      root.removeAttribute('data-primary-color');
    }
  }, [primaryColor]);

  // Sync from store
  React.useEffect(() => {
    setThemeState(storedTheme);
  }, [storedTheme]);

  React.useEffect(() => {
    if (storedPrimaryColor) {
      setPrimaryColorState(storedPrimaryColor);
    }
  }, [storedPrimaryColor]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  }, [setStoredTheme]);

  const setPrimaryColor = React.useCallback((newColor: PrimaryColor) => {
    setPrimaryColorState(newColor);
    setStoredPrimaryColor(newColor);
  }, [setStoredPrimaryColor]);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        primaryColor,
        toggleTheme,
        setTheme,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}