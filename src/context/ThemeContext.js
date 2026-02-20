import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const lightTheme = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a',
  bg: '#f8f4ee',
  cardBg: 'white',
  text: '#3d5c41',
  textSecondary: '#7a9e7e',
  border: 'rgba(61,92,65,0.2)',
  inputBg: '#f8f4ee',
};

const darkTheme = {
  sageDark: '#a8d5ae',
  sage: '#5a8a5e',
  cream: '#1a1a2e',
  gold: '#d4a76a',
  orange: '#e8923c',
  bg: '#0f0f1a',
  cardBg: '#1e1e30',
  text: '#e0e0e0',
  textSecondary: '#a0a0b0',
  border: 'rgba(160,160,176,0.2)',
  inputBg: '#2a2a3e',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('anabienestar-theme') === 'dark';
    } catch {
      return false;
    }
  });

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('anabienestar-theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
