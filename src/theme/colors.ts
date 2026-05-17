// Color palettes converted from the web's oklch values.
// Source: web/src/ui/v0/tailwind.css

export type ThemeColors = {
  bg: string;
  bgCard: string;
  secondary: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryDark: string;
  primaryFg: string;
  danger: string;
  warning: string;
  warningFg: string;
  success: string;
  rose: string;
  primaryTint: string;
  primaryTintBorder: string;
  primaryTintStrong: string;
  amberTint: string;
  amberTintBorder: string;
  destructiveTint: string;
  destructiveTintBorder: string;
  secondaryHover: string;
  overlay: string;
};

export const darkColors: ThemeColors = {
  bg: '#1e1e1e',
  bgCard: '#262626',
  secondary: '#363636',
  border: '#474747',
  text: '#fafafa',
  textMuted: '#a3a3a3',
  textDim: '#737373',
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryFg: '#1e1e1e',
  danger: '#ef4444',
  warning: '#f59e0b',
  warningFg: '#fbbf24',
  success: '#22c55e',
  rose: '#f43f5e',
  primaryTint: 'rgba(34,197,94,0.20)',
  primaryTintBorder: 'rgba(34,197,94,0.30)',
  primaryTintStrong: 'rgba(34,197,94,0.15)',
  amberTint: 'rgba(245,158,11,0.20)',
  amberTintBorder: 'rgba(245,158,11,0.30)',
  destructiveTint: 'rgba(239,68,68,0.18)',
  destructiveTintBorder: 'rgba(239,68,68,0.35)',
  secondaryHover: 'rgba(54,54,54,0.5)',
  overlay: 'rgba(0,0,0,0.6)',
};

export const lightColors: ThemeColors = {
  bg: '#fafafa',
  bgCard: '#ffffff',
  secondary: '#f0f0f0',
  border: '#e5e5e5',
  text: '#1e1e1e',
  textMuted: '#737373',
  textDim: '#a3a3a3',
  primary: '#16a34a',
  primaryDark: '#15803d',
  primaryFg: '#ffffff',
  danger: '#dc2626',
  warning: '#f59e0b',
  warningFg: '#b45309',
  success: '#16a34a',
  rose: '#e11d48',
  primaryTint: 'rgba(22,163,74,0.12)',
  primaryTintBorder: 'rgba(22,163,74,0.30)',
  primaryTintStrong: 'rgba(22,163,74,0.10)',
  amberTint: 'rgba(245,158,11,0.12)',
  amberTintBorder: 'rgba(245,158,11,0.30)',
  destructiveTint: 'rgba(220,38,38,0.10)',
  destructiveTintBorder: 'rgba(220,38,38,0.30)',
  secondaryHover: 'rgba(229,229,229,0.5)',
  overlay: 'rgba(0,0,0,0.4)',
};

// Default export keeps backward compatibility with existing imports.
// All existing code imports `colors` directly — this stays as dark theme
// until we wire in the ThemeProvider, then we'll migrate screens.
export const colors = darkColors;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const fontSize = {
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30,
};
