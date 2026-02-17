// contexts/theme-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CustomTheme, defaultThemes } from '@/types/theme';

interface ThemeContextType {
  currentTheme: CustomTheme;
  themes: CustomTheme[];
  setTheme: (themeId: string) => void;
  addCustomTheme: (theme: CustomTheme) => void;
  removeCustomTheme: (themeId: string) => void;
  updateCustomTheme: (theme: CustomTheme) => void;
  isCustomTheme: (themeId: string) => boolean;
  isLoaded: boolean;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>(defaultThemes[0]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const themes = [...defaultThemes, ...customThemes];

  const applyThemeToDOM = useCallback((theme: CustomTheme) => {
    const root = document.documentElement;
    
    setIsTransitioning(true);
    root.classList.add('theme-transitioning');
    
    root.classList.remove('light', 'dark', 'custom-theme');
    
    if (theme.id === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
      clearCustomThemeVariables(root);
    } else if (theme.id === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      clearCustomThemeVariables(root);
    } else {
      root.classList.add('custom-theme');
      root.style.colorScheme = theme.isDark ? 'dark' : 'light';
      
      Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVarName, value);
      });
    }
    
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 150);
  }, []);

  const clearCustomThemeVariables = (root: HTMLElement) => {
    const customVars = [
      '--background', '--foreground', '--card', '--card-foreground',
      '--popover', '--popover-foreground', '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
      '--border', '--input', '--ring', '--disguisting-green', '--disguisting-green-dark',
      '--shadow-color', '--shadow-strength'
    ];
    
    customVars.forEach(varName => {
      root.style.removeProperty(varName);
    });
  };

  // ✅ FIXED: Dodaj prazan dependency array da se izvršava SAMO JEDNOM
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedThemeId = localStorage.getItem('theme') || 'light';
        const savedCustomThemes = JSON.parse(localStorage.getItem('customThemes') || '[]');
        
        setCustomThemes(savedCustomThemes);
        
        const allThemes = [...defaultThemes, ...savedCustomThemes];
        const theme = allThemes.find(t => t.id === savedThemeId) || defaultThemes[0];
        
        setCurrentTheme(theme);
        
        if (!document.documentElement.className.includes(theme.id === 'light' ? 'light' : theme.id === 'dark' ? 'dark' : 'custom-theme')) {
          applyThemeToDOM(theme);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading theme:', error);
        setCurrentTheme(defaultThemes[0]);
        setIsLoaded(true);
      }
    };

    requestAnimationFrame(loadTheme);
  }, []); // ✅ PRAZAN dependency array - izvršava se SAMO na mount!

  const setTheme = useCallback((themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      applyThemeToDOM(theme);
      try {
        localStorage.setItem('theme', themeId);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
      }
    }
  }, [themes, applyThemeToDOM]);

  const addCustomTheme = useCallback((theme: CustomTheme) => {
    const newCustomThemes = [...customThemes, theme];
    setCustomThemes(newCustomThemes);
    try {
      localStorage.setItem('customThemes', JSON.stringify(newCustomThemes));
    } catch (error) {
      console.error('Failed to save custom themes:', error);
    }
  }, [customThemes]);

  const updateCustomTheme = useCallback((updatedTheme: CustomTheme) => {
    const newCustomThemes = customThemes.map(theme => 
      theme.id === updatedTheme.id ? updatedTheme : theme
    );
    setCustomThemes(newCustomThemes);
    
    if (currentTheme.id === updatedTheme.id) {
      setCurrentTheme(updatedTheme);
      applyThemeToDOM(updatedTheme);
    }
    
    try {
      localStorage.setItem('customThemes', JSON.stringify(newCustomThemes));
    } catch (error) {
      console.error('Failed to update custom themes:', error);
    }
  }, [customThemes, currentTheme.id, applyThemeToDOM]);

  const removeCustomTheme = useCallback((themeId: string) => {
    const newCustomThemes = customThemes.filter(t => t.id !== themeId);
    setCustomThemes(newCustomThemes);
    
    try {
      localStorage.setItem('customThemes', JSON.stringify(newCustomThemes));
    } catch (error) {
      console.error('Failed to remove custom theme:', error);
    }
    
    if (currentTheme.id === themeId) {
      setTheme('light');
    }
  }, [customThemes, currentTheme.id, setTheme]);

  const isCustomTheme = useCallback((themeId: string) => {
    return !defaultThemes.some(t => t.id === themeId);
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themes,
      setTheme,
      addCustomTheme,
      removeCustomTheme,
      updateCustomTheme,
      isCustomTheme,
      isLoaded,
      isTransitioning
    }}>
      {children}
    </ThemeContext.Provider>
  );
}