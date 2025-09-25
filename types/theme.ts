// types/theme.ts - Updated interface
export interface CustomTheme {
  id: string;
  name: string;
  isDark?: boolean; // Added for proper color scheme detection
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    disguistingGreen: string;
    disguistingGreenDark: string;
    shadowColor: string;
    shadowStrength: string;
  };
}

export const defaultThemes: CustomTheme[] = [
  {
    id: 'light',
    name: 'Light',
    isDark: false,
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '150 8% 12%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '240 5.9% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
      disguistingGreen: '90 55% 30%',
      disguistingGreenDark: '90 45% 30%',
      shadowColor: '330 100% 71%',
      shadowStrength: '1',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    colors: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      cardForeground: '0 0% 98%',
      popover: '240 10% 3.9%',
      popoverForeground: '0 0% 98%',
      primary: '0 0% 98%',
      primaryForeground: '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      secondaryForeground: '0 0% 98%', // Fixed: was pointing to itself
      muted: '240 3.7% 15.9%',
      mutedForeground: '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      accentForeground: '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
      disguistingGreen: '90 45% 30%',
      disguistingGreenDark: '90 45% 30%',
      shadowColor: '330 100% 71%',
      shadowStrength: '1',
    }
  }
];