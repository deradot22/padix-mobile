// Colors converted from the web's oklch palette (dark theme)
// Source: web/src/ui/v0/tailwind.css

export const colors = {
  // Backgrounds
  bg: '#1e1e1e',          // oklch(0.12 0 0) — background
  bgCard: '#262626',      // oklch(0.16 0 0) — card / popover
  secondary: '#363636',   // oklch(0.22 0 0) — secondary / muted / input
  border: '#474747',      // oklch(0.28 0 0) — border

  // Foregrounds
  text: '#fafafa',        // oklch(0.98 0 0) — foreground
  textMuted: '#a3a3a3',   // oklch(0.65 0 0) — muted-foreground
  textDim: '#737373',     // slightly darker than muted

  // Brand
  primary: '#22c55e',     // oklch(0.65 0.18 145) — green
  primaryDark: '#16a34a',
  primaryFg: '#1e1e1e',   // dark text on primary buttons

  // Semantic
  danger: '#ef4444',      // oklch(0.55 0.22 25)
  warning: '#f59e0b',     // amber-500
  warningFg: '#fbbf24',   // amber-400 (text on warning surfaces)
  success: '#22c55e',
  rose: '#f43f5e',

  // Tinted backgrounds (used as `bg-primary/20`, `bg-amber-500/20` etc)
  primaryTint: 'rgba(34,197,94,0.20)',
  primaryTintBorder: 'rgba(34,197,94,0.30)',
  primaryTintStrong: 'rgba(34,197,94,0.15)',
  amberTint: 'rgba(245,158,11,0.20)',
  amberTintBorder: 'rgba(245,158,11,0.30)',
  destructiveTint: 'rgba(239,68,68,0.18)',
  destructiveTintBorder: 'rgba(239,68,68,0.35)',

  // Hover/overlay
  secondaryHover: 'rgba(54,54,54,0.5)',  // secondary/30
};

// Radii — web uses --radius: 0.75rem (12px)
export const radii = {
  sm: 6,   // calc(var(--radius) - 6) — used as "rounded-sm"
  md: 8,   // calc(var(--radius) - 4)
  lg: 12,  // var(--radius)
  xl: 16,
  full: 999,
};

// Font sizes (matches Tailwind text-*)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};
