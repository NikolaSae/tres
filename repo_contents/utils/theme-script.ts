// utils/theme-script.ts
export const themeScript = `
(function() {
  try {
    const theme = localStorage.getItem('theme') || 'light';
    const customThemes = JSON.parse(localStorage.getItem('customThemes') || '[]');
    const root = document.documentElement;
    
    // Add transition class to prevent jarring changes
    root.classList.add('theme-transitioning');
    
    // Clear any existing theme classes
    root.classList.remove('light', 'dark', 'custom-theme');
    
    // Apply theme immediately to prevent FOUC
    if (theme === 'dark') {
      root.style.colorScheme = 'dark';
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.style.colorScheme = 'light';
      root.classList.add('light');
    } else {
      // Handle custom themes
      const customTheme = customThemes.find(t => t.id === theme);
      if (customTheme?.colors) {
        root.classList.add('custom-theme');
        root.style.colorScheme = customTheme.isDark ? 'dark' : 'light';
        
        // Apply custom theme CSS variables immediately
        Object.entries(customTheme.colors).forEach(([key, value]) => {
          const cssVarName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
          root.style.setProperty(cssVarName, value);
        });
      } else {
        // Fallback to light if custom theme not found
        root.style.colorScheme = 'light';
        root.classList.add('light');
        localStorage.setItem('theme', 'light'); // Fix corrupted state
      }
    }
    
    // Remove transition class after a brief delay
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 150);
    
  } catch (e) {
    // Silent fallback - just set light theme
    const root = document.documentElement;
    root.style.colorScheme = 'light';
    root.classList.add('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
  }
})();
`;