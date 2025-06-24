// web/src/components/theme-provider.tsx

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // 1. Initialize with the default theme. This is safe to run on the server
  //    because it doesn't access any browser APIs.
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // 2. Use useEffect to handle all browser-specific logic.
  //    This hook will only run on the client side after the component mounts.
  useEffect(() => {
    // Read the theme from localStorage.
    const storedTheme =
      (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    // Update the state with the stored or default theme.
    setTheme(storedTheme);
  }, []); // The empty dependency array ensures this runs only once on mount.

  // This second useEffect handles applying the theme to the DOM.
  // It will run whenever the `theme` state changes.
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    root.classList.add(effectiveTheme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
