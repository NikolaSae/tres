// components/theme-toggle.tsx
"use client";

import { useTheme } from '@/contexts/theme-context';
import { useState, useEffect, useRef } from 'react';
import { ThemeCustomizer } from './theme-customizer';

export function ThemeToggle() {
  const { currentTheme, themes, setTheme, isLoaded, isTransitioning } = useTheme();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen]);

  // Render loading state to prevent layout shift
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 opacity-0 animate-pulse">
        <div className="h-10 w-24 bg-muted rounded-md" />
        <div className="h-10 w-12 bg-muted rounded-md" />
      </div>
    );
  }

  const getThemeIcon = (themeId: string) => {
    switch (themeId) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      default: return '🎨';
    }
  };

  const cycleMainThemes = () => {
    if (isTransitioning) return; // Prevent rapid theme changes
    
    const customThemes = themes.filter(t => !['light', 'dark'].includes(t.id));
    
    if (currentTheme.id === 'light') {
      setTheme('dark');
    } else if (currentTheme.id === 'dark') {
      if (customThemes.length > 0) {
        setTheme(customThemes[0].id);
      } else {
        setShowCustomizer(true);
      }
    } else {
      setTheme('light');
    }
  };

  const getMainToggleText = () => {
    const customThemes = themes.filter(t => !['light', 'dark'].includes(t.id));
    
    if (currentTheme.id === 'light') {
      return '🌙 Dark';
    } else if (currentTheme.id === 'dark') {
      if (customThemes.length > 0) {
        return '🎨 Custom';
      } else {
        return '🎨 Create';
      }
    } else {
      return '☀️ Light';
    }
  };

  const defaultThemes = themes.filter(t => ['light', 'dark'].includes(t.id));
  const customThemes = themes.filter(t => !['light', 'dark'].includes(t.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={cycleMainThemes}
          disabled={isTransitioning}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-ring transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Current: ${currentTheme.name} - Click to cycle themes`}
          aria-label={`Current theme: ${currentTheme.name}. Click to cycle to next theme.`}
        >
          {getMainToggleText()}
        </button>

        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 px-2 py-2 rounded-md bg-secondary hover:bg-accent focus-ring transition-colors"
          title="All theme options"
          aria-label="Open theme options menu"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <span className="text-xs" aria-hidden="true">⚙️</span>
          <span className={`text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true">
            ▼
          </span>
        </button>
      </div>

      {isDropdownOpen && (
        <div 
          className="absolute right-0 mt-2 w-52 bg-popover border border-border rounded-md shadow-lg z-50 animate-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-label="Theme selection menu"
        >
          <div className="py-1">
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b border-border">
              Default Themes
            </div>
            {defaultThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent focus-ring rounded-none flex items-center gap-2 ${
                  currentTheme.id === theme.id ? 'bg-accent' : ''
                }`}
                role="menuitem"
                aria-current={currentTheme.id === theme.id ? 'true' : 'false'}
              >
                <span aria-hidden="true">{getThemeIcon(theme.id)}</span>
                <span>{theme.name}</span>
                {currentTheme.id === theme.id && <span className="ml-auto text-xs" aria-hidden="true">✓</span>}
              </button>
            ))}
            
            {customThemes.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b border-t border-border">
                  Custom Themes ({customThemes.length})
                </div>
                {customThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent focus-ring rounded-none flex items-center gap-2 ${
                      currentTheme.id === theme.id ? 'bg-accent' : ''
                    }`}
                    role="menuitem"
                    aria-current={currentTheme.id === theme.id ? 'true' : 'false'}
                  >
                    <span aria-hidden="true">{getThemeIcon(theme.id)}</span>
                    <span className="truncate">{theme.name}</span>
                    {currentTheme.id === theme.id && <span className="ml-auto text-xs" aria-hidden="true">✓</span>}
                  </button>
                ))}
              </>
            )}
            
            <hr className="my-1 border-border" />
            <button
              onClick={() => {
                setShowCustomizer(true);
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent focus-ring rounded-none flex items-center gap-2 font-medium"
              role="menuitem"
            >
              <span aria-hidden="true">➕</span>
              <span>Create New Theme</span>
            </button>
          </div>
        </div>
      )}

      {showCustomizer && (
        <ThemeCustomizer onClose={() => setShowCustomizer(false)} />
      )}
    </div>
  );
}