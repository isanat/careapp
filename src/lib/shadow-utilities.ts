/**
 * Bloom Elements Shadow System
 * Consistent shadow applications following the design system
 *
 * Shadow Hierarchy:
 * - shadow-card: Base shadow for cards (0 1px 3px 0 rgba(0, 0, 0, 0.1))
 * - shadow-elevated: Hover/elevated state (0 10px 15px -3px rgba(0, 0, 0, 0.1))
 * - shadow-glow: Glowing effect for highlights (0 0 20px rgba(59, 130, 246, 0.25))
 * - shadow-soft: Subtle shadow (0 2px 8px -2px rgba(76, 147, 206, 0.06))
 * - shadow-soft-md: Medium soft shadow
 * - shadow-soft-lg: Large soft shadow
 * - shadow-soft-xl: Extra large soft shadow
 */

// Base shadow classes - use in Tailwind classNames
export const SHADOW_CLASSES = {
  // Base shadows
  card: "shadow-card",
  elevated: "shadow-elevated",
  glow: "shadow-glow",

  // Soft shadows (subtle)
  soft: "shadow-soft",
  softMd: "shadow-soft-md",
  softLg: "shadow-soft-lg",
  softXl: "shadow-soft-xl",

  // Special shadows
  cardHover: "shadow-card-hover",
  innerSoft: "shadow-inner-soft",
  primaryGlow: "shadow-primary-glow",
  accentGlow: "shadow-accent-glow",
} as const;

/**
 * Shadow utility types for component props
 */
export type ShadowVariant = keyof typeof SHADOW_CLASSES;

/**
 * Get shadow class for a variant
 */
export function getShadowClass(variant: ShadowVariant | string): string {
  return SHADOW_CLASSES[variant as ShadowVariant] || "";
}

/**
 * Bloom Elements Card Shadow Pattern
 * Used for all card components
 *
 * Base card: shadow-card
 * Interactive card: shadow-card hover:shadow-elevated transition-all
 * Premium card: shadow-soft-lg
 */
export const cardShadowBase = "shadow-card";
export const cardShadowHover =
  "shadow-card hover:shadow-elevated transition-all duration-300";
export const cardShadowPremium = "shadow-soft-lg";

/**
 * Bloom Elements Button Shadow Pattern
 * Used for interactive button states
 *
 * Base button: shadow-soft
 * Hover button: shadow-soft-md
 * Active button: shadow-soft (reduce on press)
 */
export const buttonShadowBase = "shadow-soft";
export const buttonShadowHover = "shadow-soft-md";
export const buttonShadowActive = "shadow-soft";

/**
 * Bloom Elements Dropdown Shadow Pattern
 * Used for dropdowns, menus, popovers
 */
export const dropdownShadow = "shadow-elevated";

/**
 * Bloom Elements Input Shadow Pattern
 * Used for form inputs when focused
 */
export const inputShadowFocus = "shadow-soft-md";

/**
 * Bloom Elements Elevation System
 * Maps elevation levels to appropriate shadows
 */
export const elevationLevels = {
  0: "", // No shadow
  1: "shadow-soft", // Subtle elevation
  2: "shadow-card", // Standard elevation
  3: "shadow-soft-md", // Medium elevation
  4: "shadow-elevated", // High elevation
  5: "shadow-soft-lg", // Premium elevation
} as const;

export type ElevationLevel = keyof typeof elevationLevels;

/**
 * Get elevation shadow class
 */
export function getElevationShadow(level: ElevationLevel): string {
  return elevationLevels[level] || "";
}

/**
 * Common shadow combinations used in Bloom Elements
 */
export const shadowCombos = {
  // Card patterns
  cardBase: `${cardShadowBase}`,
  cardInteractive: `${cardShadowHover}`,
  cardPremium: `${cardShadowPremium}`,

  // Button patterns
  buttonBase: `${buttonShadowBase}`,
  buttonHover: `${buttonShadowHover}`,

  // Container patterns
  containerBase: `${cardShadowBase}`,
  containerElevated: `${cardShadowHover}`,

  // Floating elements (dropdowns, tooltips, popovers)
  floatingBase: `${dropdownShadow}`,
} as const;
