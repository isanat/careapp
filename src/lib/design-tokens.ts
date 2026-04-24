/**
 * Bloom Elements Design Tokens
 * Complete design system extracted from Bloom Elements UI Kit
 * All values follow Bloom design patterns and are semantic/reusable
 *
 * Usage:
 * import { tokens, cn, getButtonClasses, getCardClasses } from '@/lib/design-tokens'
 */

export const tokens = {
  // ============= TYPOGRAPHY =============
  typography: {
    fonts: {
      display: "font-display", // Space Grotesk
      body: "font-body", // Inter
    },
    sizes: {
      // Headings
      h1: "text-4xl sm:text-5xl",
      h2: "text-3xl sm:text-4xl",
      h3: "text-2xl sm:text-3xl",
      h4: "text-xl sm:text-2xl",
      // Body text
      lg: "text-base",
      base: "text-sm",
      sm: "text-xs",
      xs: "text-[10px]",
      xxs: "text-[9px]",
    },
    weights: {
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      black: "font-black",
    },
    lineHeight: {
      tight: "leading-none",
      normal: "leading-relaxed",
      relaxed: "leading-loose",
    },
    tracking: {
      tight: "tracking-tighter",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-widest",
      widest: "tracking-[0.4em]",
    },
    // Semantic combinations
    heading: {
      pageTitle: "text-3xl sm:text-4xl font-display font-black tracking-tighter leading-none",
      sectionTitle: "text-2xl sm:text-3xl font-display font-black tracking-tighter leading-none",
      cardTitle: "text-lg sm:text-xl font-display font-black",
      label: "text-xs font-display font-black uppercase tracking-widest",
      subLabel: "text-[10px] font-display font-black uppercase tracking-widest",
      tinyLabel: "text-[9px] font-display font-black uppercase tracking-widest",
    },
    body: {
      lg: "text-base text-foreground",
      base: "text-sm text-foreground",
      sm: "text-xs text-muted-foreground",
      xs: "text-[10px] text-muted-foreground font-medium",
    },
  },

  // ============= COLORS =============
  colors: {
    semantic: {
      primary: "primary",
      secondary: "secondary",
      success: "success",
      warning: "warning",
      destructive: "destructive",
      info: "info",
      muted: "muted",
      accent: "accent",
    },
    // Background + foreground combos
    backgrounds: {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      success: "bg-success text-success-foreground",
      warning: "bg-warning text-warning-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      info: "bg-info text-info-foreground",
      card: "bg-card",
      muted: "bg-muted text-muted-foreground",
    },
    // Opacity variants (use for badges, overlays, etc)
    badges: {
      primary: "bg-primary/10 text-primary border border-primary/30",
      secondary: "bg-secondary/10 text-secondary border border-secondary/30",
      success: "bg-success/10 text-success border border-success/30",
      warning: "bg-warning/10 text-warning border border-warning/30",
      destructive: "bg-destructive/10 text-destructive border border-destructive/30",
      info: "bg-info/10 text-info border border-info/30",
      muted: "bg-muted text-muted-foreground",
    },
    text: {
      primary: "text-foreground",
      secondary: "text-muted-foreground",
      accent: "text-primary",
    },
  },

  // ============= SPACING =============
  spacing: {
    // Card & container padding
    padding: {
      card: "p-5 sm:p-7",
      cardLarge: "p-6 sm:p-8",
      cardSmall: "p-4 sm:p-5",
      tight: "p-3",
      normal: "p-4",
      loose: "p-6",
    },
    // Horizontal padding for content areas
    paddingX: {
      mobile: "px-4",
      tablet: "md:px-6",
      desktop: "lg:px-8",
      responsive: "px-4 md:px-6 lg:px-8",
    },
    // Vertical padding for content areas
    paddingY: {
      mobile: "py-6",
      tablet: "md:py-8",
      desktop: "lg:py-10",
      responsive: "py-6 md:py-8 lg:py-10",
    },
    // Gap values for grids and flex
    gap: {
      xs: "gap-2",
      sm: "gap-3",
      base: "gap-4",
      lg: "gap-5",
      xl: "gap-6",
      xxl: "gap-8",
    },
    // Vertical spacing for stacked content
    space: {
      xs: "space-y-2",
      sm: "space-y-3",
      base: "space-y-4",
      md: "space-y-6",
      lg: "space-y-8",
      xl: "space-y-10",
      xxl: "space-y-12",
    },
  },

  // ============= BORDER RADIUS =============
  radius: {
    sm: "rounded-lg",
    base: "rounded-xl",
    md: "rounded-2xl",
    lg: "rounded-3xl",
    full: "rounded-full",
    // Semantic usage
    button: "rounded-2xl",
    buttonLarge: "rounded-3xl",
    card: "rounded-3xl",
    input: "rounded-2xl",
    select: "rounded-2xl",
    badge: "rounded-2xl",
    avatar: "rounded-2xl",
  },

  // ============= SHADOWS =============
  shadows: {
    none: "shadow-none",
    card: "shadow-card",
    elevated: "shadow-elevated",
    glow: "shadow-glow",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  },

  // ============= COMPONENTS =============
  components: {
    // ===== BUTTONS =====
    button: {
      base: "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-bold uppercase tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
      variants: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-md",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline !tracking-normal !font-medium !normal-case",
      },
      sizes: {
        sm: "h-9 px-4 text-[10px] rounded-xl",
        default: "h-11 px-6 text-xs rounded-2xl",
        lg: "h-14 px-10 text-xs rounded-2xl",
        xl: "h-16 px-12 text-sm rounded-3xl",
      },
    },

    // ===== CARDS =====
    card: {
      base: "bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card",
      interactive: "hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer",
      header: "flex flex-col space-y-1.5 pb-4",
      title: "text-lg font-display font-black text-foreground",
      description: "text-xs text-muted-foreground font-medium",
      content: "space-y-4",
      footer: "flex items-center gap-2 pt-4 border-t border-border/50",
    },

    // ===== STAT BLOCK (Dashboard Stats) =====
    statBlock: {
      container: "bg-card p-5 sm:p-7 rounded-3xl border border-border shadow-card space-y-3 sm:space-y-4 hover:shadow-elevated transition-all group",
      iconContainer: "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform",
      label: "text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest",
      value: "text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter leading-none",
    },

    // ===== SECTION HEADER =====
    sectionHeader: {
      container: "space-y-1 sm:space-y-2",
      title: "text-3xl sm:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase",
      description: "text-sm text-muted-foreground font-medium",
    },

    // ===== DOC CARD (Bloom Pattern) =====
    docCard: {
      container: "space-y-4",
      titleBar: "text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4",
      contentBox: "bg-card p-5 sm:p-8 rounded-3xl border border-border shadow-card",
    },

    // ===== BADGE =====
    badge: {
      base: "inline-flex items-center px-2.5 py-1 text-[9px] font-display font-black rounded-2xl border uppercase tracking-widest",
      variants: {
        primary: "bg-primary/10 text-primary border-primary/30",
        secondary: "bg-secondary/10 text-secondary border-secondary/30",
        success: "bg-success/10 text-success border-success/30",
        warning: "bg-warning/10 text-warning border-warning/30",
        destructive: "bg-destructive/10 text-destructive border-destructive/30",
        info: "bg-info/10 text-info border-info/30",
        muted: "bg-muted text-muted-foreground border-border/30",
      },
    },

    // ===== INPUT & FORM =====
    input: {
      base: "flex h-11 w-full rounded-2xl border border-border bg-secondary px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      helperText: "mt-1.5 text-xs font-medium",
    },

    // ===== DIALOG/MODAL =====
    dialog: {
      overlay: "fixed inset-0 bg-black/50 z-50 transition-opacity",
      content: "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-2xl rounded-3xl duration-200",
      header: "flex flex-col space-y-1.5",
      title: "text-2xl font-display font-black leading-none tracking-tight",
      description: "text-sm text-muted-foreground",
      footer: "flex gap-2 pt-4 border-t border-border/50",
    },

    // ===== TABS =====
    tabs: {
      list: "inline-flex h-11 w-full items-center justify-center rounded-2xl bg-muted/50 p-1 border border-border/30 space-x-1",
      trigger: "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-xs font-display font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
    },
  },

  // ============= ANIMATIONS =============
  animations: {
    fadeIn: "animate-fade-in",
    slideUp: "animate-slide-up",
    slideRight: "animate-slide-right",
    scaleIn: "animate-scale-in",
    pulse: "animate-pulse-soft",
  },

  // ============= LAYOUT PATTERNS =====
  layout: {
    // Page structure
    pageContainer: "min-h-screen bg-background text-foreground",
    contentArea: "w-full px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10",
    maxWidth: "max-w-7xl mx-auto w-full",

    // Grid layouts
    grid: {
      responsive1: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
      responsive2: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6",
      responsive4: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6",
      responsive5: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6",
    },

    // Flex layouts
    flexCenter: "flex items-center justify-center",
    flexBetween: "flex items-center justify-between",
    flexCol: "flex flex-col",

    // Spacing
    sectionSpacing: "space-y-8 sm:space-y-10",
    cardSpacing: "space-y-4 sm:space-y-6",
  },

  // ============= UTILITIES =============
  utilities: {
    truncate: "truncate",
    lineClamp: {
      1: "line-clamp-1",
      2: "line-clamp-2",
      3: "line-clamp-3",
    },
    transitions: {
      fast: "transition-all duration-200",
      normal: "transition-all duration-300",
      slow: "transition-all duration-500",
    },
  },
};

// ============= HELPER FUNCTIONS =============

/**
 * Combine multiple token classes safely
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Get responsive padding
 */
export function getResponsivePadding(
  size: keyof typeof tokens.spacing.padding = "normal"
): string {
  return tokens.spacing.padding[size] || tokens.spacing.padding.normal;
}

/**
 * Get button classes
 */
export function getButtonClasses(
  variant: keyof typeof tokens.components.button.variants = "primary",
  size: keyof typeof tokens.components.button.sizes = "default"
): string {
  return cn(
    tokens.components.button.base,
    tokens.components.button.variants[variant],
    tokens.components.button.sizes[size]
  );
}

/**
 * Get card classes
 */
export function getCardClasses(interactive: boolean = false): string {
  return cn(tokens.components.card.base, interactive && tokens.components.card.interactive);
}

/**
 * Get badge classes
 */
export function getBadgeClasses(
  variant: keyof typeof tokens.components.badge.variants = "primary"
): string {
  return cn(tokens.components.badge.base, tokens.components.badge.variants[variant]);
}

/**
 * Get heading classes
 */
export function getHeadingClasses(
  level: "pageTitle" | "sectionTitle" | "cardTitle" = "sectionTitle"
): string {
  return tokens.typography.heading[level];
}

// Export all tokens
export default tokens;
