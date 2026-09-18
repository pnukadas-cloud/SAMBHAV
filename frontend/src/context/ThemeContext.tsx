import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = "sambhav_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch {
      // ignore
    }
    return "dark"; // Default to dark theme (the present colors)
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }

    // Apply data-theme attribute and classes
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
    document.body.setAttribute("data-theme", theme);
    document.body.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
