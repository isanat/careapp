/**
 * Bloom Elements Typography System
 * Complete reference for all typography patterns
 *
 * Fonts:
 * - font-display: Space Grotesk (headings, labels, premium text)
 * - font-body: Inter (body text, descriptions)
 *
 * Principles:
 * - Use uppercase for labels, headings, and badges
 * - Use tracking-widest for very small text (<0.75rem)
 * - Use tracking-wide for labels (0.75rem - 0.875rem)
 * - Use leading-relaxed for longer body text
 * - Use font-black for premium headings, font-bold for standard headings
 */

/**
 * Typography Presets - Use these classNames directly
 * Format: "fontSize lineHeight fontFamily fontWeight textTransform tracking"
 */

export const TYPOGRAPHY_PRESETS = {
  // Headings - Always font-display, uppercase, font-black
  h1: "text-5xl sm:text-5xl md:text-5xl font-display font-black uppercase tracking-tight leading-[1.15]",
  h2: "text-4xl sm:text-4xl md:text-4xl font-display font-black uppercase tracking-tight leading-[1.2]",
  h3: "text-3xl sm:text-3xl md:text-3xl font-display font-black uppercase tracking-tight leading-[1.3]",
  h4: "text-2xl sm:text-2xl md:text-2xl font-display font-black uppercase tracking-tight leading-[1.35]",
  h5: "text-xl sm:text-xl md:text-xl font-display font-bold uppercase tracking-wide leading-[1.4]",
  h6: "text-lg sm:text-lg md:text-lg font-display font-bold uppercase tracking-wide leading-[1.5]",

  // Section Headers (used in pages)
  sectionHeader:
    "text-2xl sm:text-3xl md:text-4xl font-display font-black uppercase tracking-tight",
  sectionSubHeader:
    "text-lg sm:text-xl md:text-2xl font-display font-bold uppercase tracking-wide",

  // Page Title (large prominent text)
  pageTitle:
    "text-3xl sm:text-4xl md:text-5xl font-display font-black uppercase tracking-tight",
  pageSubtitle:
    "text-xl sm:text-2xl md:text-3xl font-display font-bold uppercase tracking-wide",

  // Body Text
  body: "text-base leading-relaxed font-body text-foreground",
  bodySmall: "text-sm leading-relaxed font-body text-muted-foreground",
  bodyXs: "text-xs font-body text-muted-foreground",

  // Descriptions (used for explanatory text)
  description: "text-sm leading-relaxed text-muted-foreground",
  descriptionSmall: "text-xs leading-relaxed text-muted-foreground/60",

  // Captions (very small text, like table captions)
  caption: "text-xs font-body text-muted-foreground/60",

  // Labels (form labels, badge labels) - Always uppercase, font-display, tracking-widest
  label: "text-xs font-display font-bold uppercase tracking-widest text-foreground",
  labelSmall: "text-[9px] font-display font-bold uppercase tracking-widest text-foreground",
  labelMuted:
    "text-xs font-display font-bold uppercase tracking-widest text-muted-foreground/70",

  // Value Text (numbers, prices, important data)
  value: "text-xl sm:text-2xl font-display font-black tracking-tighter",
  valueLarge: "text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tighter",
  valueSmall: "text-lg font-display font-bold tracking-tighter",

  // Badge Text - Always uppercase, small, tracking-widest
  badge: "text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1",

  // Button Text - Always font-display, bold, uppercase
  button: "text-sm sm:text-base font-display font-bold uppercase tracking-wide",
  buttonSmall: "text-xs font-display font-bold uppercase tracking-widest",
  buttonLarge: "text-base sm:text-lg font-display font-bold uppercase tracking-wide",

  // Navigation Text
  nav: "text-sm font-display font-bold uppercase tracking-wide",
  navSmall: "text-xs font-display font-bold uppercase tracking-widest",

  // Status/Badge Text
  status: "text-xs font-display font-bold uppercase tracking-widest",
  statusSmall: "text-[9px] font-display font-bold uppercase tracking-widest",

  // Helper Text (validation messages, hints)
  helper: "text-xs text-muted-foreground",
  helperSmall: "text-[9px] text-muted-foreground/70",

  // Error/Success Messages
  message: "text-sm font-body leading-relaxed",
  messageLarge: "text-base font-body leading-relaxed",

  // Link Text
  link: "text-sm font-body underline hover:no-underline text-primary",
  linkSmall: "text-xs font-body underline hover:no-underline text-primary",

  // Code/Monospace Text
  code: "font-mono text-sm bg-secondary px-2 py-1 rounded",
  codeBlock: "font-mono text-sm bg-secondary p-4 rounded-2xl overflow-x-auto",
} as const;

export type TypographyPreset = keyof typeof TYPOGRAPHY_PRESETS;

/**
 * Get typography class name by preset
 */
export function getTypography(preset: TypographyPreset): string {
  return TYPOGRAPHY_PRESETS[preset] || "";
}

/**
 * Typography Combinations - Common patterns
 */
export const typographyCombos = {
  // Card titles and descriptions
  cardTitle: "text-lg font-display font-bold uppercase tracking-wide",
  cardDescription: "text-sm text-muted-foreground leading-relaxed",
  cardValue: "text-2xl sm:text-3xl font-display font-black tracking-tighter",

  // Form elements
  formLabel: "text-xs font-display font-bold uppercase tracking-widest",
  formInput: "text-base font-body text-foreground",
  formHint: "text-xs text-muted-foreground/60",

  // Dialog/Modal
  dialogTitle: "text-2xl font-display font-bold uppercase tracking-wide",
  dialogDescription: "text-sm text-muted-foreground leading-relaxed",

  // List items
  listItemTitle: "text-sm font-display font-bold text-foreground",
  listItemDescription: "text-xs text-muted-foreground/70",
  listItemValue: "text-lg font-display font-bold tracking-tighter",

  // Table
  tableHeader: "text-xs font-display font-bold uppercase tracking-widest",
  tableCell: "text-sm font-body text-foreground",
  tableValue: "text-sm font-display font-bold text-foreground",

  // Badge
  badgeText: "text-[9px] font-display font-bold uppercase tracking-widest",

  // Stat blocks
  statLabel: "text-xs font-display font-bold uppercase tracking-widest text-muted-foreground",
  statValue: "text-3xl font-display font-black tracking-tighter",
  statChange: "text-sm font-display font-bold text-success",
} as const;

/**
 * Font family utilities
 */
export const fonts = {
  display: "font-display",
  body: "font-body",
  mono: "font-mono",
} as const;

/**
 * Font weight utilities
 */
export const weights = {
  thin: "font-thin",
  extralight: "font-extralight",
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
  black: "font-black",
} as const;

/**
 * Text transform utilities
 */
export const textTransform = {
  uppercase: "uppercase",
  lowercase: "lowercase",
  capitalize: "capitalize",
  normal: "normal-case",
} as const;

/**
 * Letter spacing utilities
 */
export const tracking = {
  tighter: "tracking-tighter",
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-wide",
  wider: "tracking-wider",
  widest: "tracking-widest",
} as const;

/**
 * Line height utilities
 */
export const leading = {
  tight: "leading-tight",
  snug: "leading-snug",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
} as const;
