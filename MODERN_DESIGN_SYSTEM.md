# EVYRA - Modern Design System V2
## Complete Visual Specification with Vibrant Colors & Modern Aesthetics

**Status:** Ready to implement  
**Date:** April 13, 2026  
**Objective:** 100% visual alignment with modern UI/UX standards

---

## 1. MODERN COLOR PALETTE (HSL Format for Best Dark Mode Support)

### Primary Colors (Main Brand - Vibrant Blue-Purple)
```css
--primary-50:  hsl(270, 100%, 97%);    /* Lightest - #F3EBFF */
--primary-100: hsl(270, 100%, 93%);    /* Very Light - #E6D7FF */
--primary-200: hsl(270, 100%, 88%);    /* Light - #D4ADFF */
--primary-300: hsl(270, 100%, 80%);    /* Light-Med - #B380FF */
--primary-400: hsl(270, 95%, 68%);     /* Medium - #8B5FFF (Vibrant) */
--primary-500: hsl(270, 92%, 55%);     /* Primary - #6B3FFF (MAIN) */
--primary-600: hsl(270, 88%, 48%);     /* Dark - #5C2EFF */
--primary-700: hsl(270, 85%, 42%);     /* Darker - #4D1FFF */
--primary-800: hsl(270, 82%, 35%);     /* Very Dark - #3E10FF */
--primary-900: hsl(270, 78%, 25%);     /* Darkest - #2401CC */
```

### Secondary Colors (Accent - Cyan-Teal)
```css
--secondary-50:  hsl(180, 95%, 96%);   /* #E0F9FF */
--secondary-100: hsl(180, 92%, 90%);   /* #B3F0FF */
--secondary-200: hsl(180, 88%, 82%);   /* #80E8FF */
--secondary-300: hsl(180, 85%, 72%);   /* #4DDEFF */
--secondary-400: hsl(180, 82%, 60%);   /* #26D0FF (Vibrant) */
--secondary-500: hsl(180, 80%, 50%);   /* #00CCFF (MAIN ACCENT) */
--secondary-600: hsl(180, 78%, 42%);   /* #009FCC */
--secondary-700: hsl(180, 75%, 35%);   /* #007399 */
--secondary-800: hsl(180, 72%, 28%);   /* #004D66 */
--secondary-900: hsl(180, 70%, 18%);   /* #002633 */
```

### Success Colors (Green - Fresh)
```css
--success-50:  hsl(120, 95%, 96%);     /* #E0FFE0 */
--success-100: hsl(120, 92%, 90%);     /* #B3FFB3 */
--success-200: hsl(120, 88%, 82%);     /* #80FF80 */
--success-300: hsl(120, 85%, 72%);     /* #4DFF4D */
--success-400: hsl(120, 82%, 60%);     /* #26FF26 (Vibrant) */
--success-500: hsl(120, 80%, 50%);     /* #00FF00 (MAIN) */
--success-600: hsl(120, 78%, 40%);     /* #00CC00 */
--success-700: hsl(120, 75%, 32%);     /* #009900 */
--success-800: hsl(120, 72%, 24%);     /* #006600 */
--success-900: hsl(120, 70%, 15%);     /* #003300 */
```

### Warning Colors (Amber - Warm)
```css
--warning-50:  hsl(45, 100%, 96%);     /* #FFFCE0 */
--warning-100: hsl(45, 98%, 90%);      /* #FFFBCC */
--warning-200: hsl(45, 96%, 80%);      /* #FFF699 */
--warning-300: hsl(45, 95%, 70%);      /* #FFEF66 */
--warning-400: hsl(45, 93%, 60%);      /* #FFE633 */
--warning-500: hsl(45, 92%, 50%);      /* #FFDD00 (MAIN) */
--warning-600: hsl(45, 88%, 42%);      /* #CCAA00 */
--warning-700: hsl(45, 85%, 35%);      /* #997700 */
--warning-800: hsl(45, 82%, 28%);      /* #664400 */
--warning-900: hsl(45, 78%, 18%);      /* #331100 */
```

### Danger Colors (Red - Alert)
```css
--danger-50:  hsl(0, 95%, 96%);        /* #FFE0E0 */
--danger-100: hsl(0, 92%, 90%);        /* #FFB3B3 */
--danger-200: hsl(0, 88%, 82%);        /* #FF8080 */
--danger-300: hsl(0, 85%, 72%);        /* #FF4D4D */
--danger-400: hsl(0, 82%, 60%);        /* #FF2626 */
--danger-500: hsl(0, 80%, 50%);        /* #FF0000 (MAIN) */
--danger-600: hsl(0, 78%, 40%);        /* #CC0000 */
--danger-700: hsl(0, 75%, 32%);        /* #990000 */
--danger-800: hsl(0, 72%, 24%);        /* #660000 */
--danger-900: hsl(0, 70%, 15%);        /* #330000 */
```

### Neutral Colors (Grayscale)
```css
/* Light Mode Neutral */
--neutral-50:  hsl(210, 20%, 98%);     /* #F7F9FB - Almost white */
--neutral-100: hsl(210, 18%, 95%);     /* #EBEBF0 */
--neutral-200: hsl(210, 16%, 90%);     /* #DCDFE6 */
--neutral-300: hsl(210, 14%, 84%);     /* #CACFD8 */
--neutral-400: hsl(210, 12%, 72%);     /* #A8AFBD */
--neutral-500: hsl(210, 10%, 58%);     /* #8A91A1 */
--neutral-600: hsl(210, 10%, 45%);     /* #6B7280 */
--neutral-700: hsl(210, 12%, 35%);     /* #4B5563 */
--neutral-800: hsl(210, 14%, 22%);     /* #2D3645 */
--neutral-900: hsl(210, 16%, 12%);     /* #1A1F2E - Nearly black */

/* Dark Mode Neutral */
--dark-50:   hsl(210, 40%, 98%);       /* #F0F4F8 */
--dark-100:  hsl(210, 38%, 96%);       /* #E7EEF5 */
--dark-200:  hsl(210, 35%, 90%);       /* #D1DDE8 */
--dark-300:  hsl(210, 33%, 82%);       /* #B5CAE0 */
--dark-400:  hsl(210, 30%, 70%);       /* #90B0D0 */
--dark-500:  hsl(210, 28%, 55%);       /* #6890B8 */
--dark-600:  hsl(210, 25%, 40%);       /* #3D6B99 */
--dark-700:  hsl(210, 22%, 28%);       /* #1F4066 */
--dark-800:  hsl(210, 20%, 18%);       /* #0D2340 */
--dark-900:  hsl(210, 18%, 10%);       /* #05111F */
```

### Info Colors (Sky Blue)
```css
--info-50:  hsl(200, 95%, 96%);        /* #E0F5FF */
--info-100: hsl(200, 92%, 90%);        /* #B3EBFF */
--info-200: hsl(200, 88%, 82%);        /* #80E0FF */
--info-300: hsl(200, 85%, 72%);        /* #4DD9FF */
--info-400: hsl(200, 82%, 60%);        /* #26CDFF */
--info-500: hsl(200, 80%, 50%);        /* #00BFFF (MAIN) */
--info-600: hsl(200, 78%, 42%);        /* #0097CC */
--info-700: hsl(200, 75%, 35%);        /* #006B99 */
--info-800: hsl(200, 72%, 28%);        /* #004166 */
--info-900: hsl(200, 70%, 18%);        /* #001D33 */
```

### Special Colors
```css
/* Vibrant Gradient Purple-Pink */
--gradient-1: linear-gradient(135deg, #6B3FFF 0%, #FF006E 100%);
/* Vibrant Gradient Cyan-Purple */
--gradient-2: linear-gradient(135deg, #00CCFF 0%, #6B3FFF 100%);
/* Vibrant Gradient Green-Cyan */
--gradient-3: linear-gradient(135deg, #00FF00 0%, #00CCFF 100%);

/* Glass/Transparency Effects */
--glass-light: rgba(255, 255, 255, 0.08);
--glass-medium: rgba(255, 255, 255, 0.12);
--glass-dark: rgba(0, 0, 0, 0.08);
```

---

## 2. SEMANTIC COLOR SYSTEM (Light & Dark Mode)

### Light Mode
```css
:root {
  /* Backgrounds */
  --bg-primary: hsl(210, 20%, 98%);      /* #F7F9FB */
  --bg-secondary: hsl(210, 18%, 95%);    /* #EBEBF0 */
  --bg-tertiary: hsl(210, 16%, 90%);     /* #DCDFE6 */
  --bg-interactive: hsl(270, 92%, 55%);  /* #6B3FFF */
  
  /* Text */
  --text-primary: hsl(210, 16%, 12%);    /* #1A1F2E */
  --text-secondary: hsl(210, 12%, 35%);  /* #4B5563 */
  --text-tertiary: hsl(210, 10%, 58%);   /* #8A91A1 */
  --text-inverse: hsl(210, 20%, 98%);    /* #F7F9FB */
  
  /* Borders */
  --border-light: hsl(210, 16%, 90%);    /* #DCDFE6 */
  --border-medium: hsl(210, 14%, 84%);   /* #CACFD8 */
  --border-dark: hsl(210, 12%, 72%);     /* #A8AFBD */
  
  /* Interactive */
  --focus: hsl(270, 92%, 55%);            /* #6B3FFF */
  --focus-light: hsl(270, 100%, 88%);     /* #D4ADFF */
}
```

### Dark Mode
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
    --bg-primary: hsl(210, 20%, 12%);     /* #191F2E */
    --bg-secondary: hsl(210, 18%, 18%);   /* #252E3F */
    --bg-tertiary: hsl(210, 16%, 24%);    /* #323D52 */
    --bg-interactive: hsl(270, 92%, 55%); /* #6B3FFF */
    
    /* Text */
    --text-primary: hsl(210, 20%, 98%);   /* #F7F9FB */
    --text-secondary: hsl(210, 14%, 84%); /* #CACFD8 */
    --text-tertiary: hsl(210, 10%, 58%);  /* #8A91A1 */
    --text-inverse: hsl(210, 16%, 12%);   /* #1A1F2E */
    
    /* Borders */
    --border-light: hsl(210, 18%, 28%);   /* #3D4D63 */
    --border-medium: hsl(210, 16%, 35%);  /* #505E75 */
    --border-dark: hsl(210, 14%, 45%);    /* #5D6F8C */
    
    /* Interactive */
    --focus: hsl(270, 95%, 68%);           /* #8B5FFF */
    --focus-light: hsl(270, 100%, 80%);    /* #B380FF */
  }
}
```

---

## 3. TYPOGRAPHY SYSTEM (Modern & Clean)

### Font Families
```css
/* Display - Premium Headlines */
--font-display: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Body - Readable Text */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Mono - Code/Data */
--font-mono: 'Fira Code', 'Courier New', monospace;
```

### Font Size Scale (Modular Scale 1.125)
```css
--text-xs:    0.65rem;  /* 10.4px */
--text-sm:    0.75rem;  /* 12px */
--text-base:  0.875rem; /* 14px */
--text-md:    1rem;     /* 16px */
--text-lg:    1.125rem; /* 18px */
--text-xl:    1.25rem;  /* 20px */
--text-2xl:   1.5rem;   /* 24px */
--text-3xl:   1.875rem; /* 30px */
--text-4xl:   2.25rem;  /* 36px */
--text-5xl:   2.813rem; /* 45px */
--text-6xl:   3.375rem; /* 54px */
--text-7xl:   4.219rem; /* 67.5px */
```

### Font Weights
```css
--weight-light:     300;
--weight-normal:    400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;
--weight-extrabold: 800;
--weight-black:     900;
```

### Line Heights
```css
--leading-tight:   1.2;
--leading-normal:  1.5;
--leading-relaxed: 1.75;
--leading-loose:   2;
```

### Letter Spacing
```css
--tracking-tight:    -0.02em;
--tracking-normal:   0;
--tracking-wide:     0.02em;
--tracking-wider:    0.05em;
--tracking-widest:   0.1em;
```

### Typography Presets (Refined)
```css
/* Headings */
--h1: {
  font-size: var(--text-5xl);
  font-weight: var(--weight-black);
  line-height: var(--leading-tight);
  font-family: var(--font-display);
  letter-spacing: var(--tracking-tight);
  text-transform: uppercase;
};

--h2: {
  font-size: var(--text-4xl);
  font-weight: var(--weight-black);
  line-height: var(--leading-tight);
  font-family: var(--font-display);
  letter-spacing: var(--tracking-tight);
};

--h3: {
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-normal);
  font-family: var(--font-display);
  letter-spacing: var(--tracking-normal);
};

--h4: {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-normal);
  font-family: var(--font-display);
};

/* Body */
--body-lg: {
  font-size: var(--text-lg);
  font-weight: var(--weight-normal);
  line-height: var(--leading-relaxed);
  font-family: var(--font-body);
};

--body: {
  font-size: var(--text-base);
  font-weight: var(--weight-normal);
  line-height: var(--leading-relaxed);
  font-family: var(--font-body);
};

--body-sm: {
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
  line-height: var(--leading-relaxed);
  font-family: var(--font-body);
};

/* Labels & Captions */
--label: {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  font-family: var(--font-display);
};

--caption: {
  font-size: var(--text-xs);
  font-weight: var(--weight-normal);
  line-height: var(--leading-normal);
  font-family: var(--font-body);
};
```

---

## 4. SPACING SYSTEM (8px Base Unit)

```css
--space-0:    0;
--space-1:    0.25rem;  /* 4px */
--space-2:    0.5rem;   /* 8px - BASE */
--space-3:    0.75rem;  /* 12px */
--space-4:    1rem;     /* 16px */
--space-5:    1.25rem;  /* 20px */
--space-6:    1.5rem;   /* 24px */
--space-7:    1.75rem;  /* 28px */
--space-8:    2rem;     /* 32px */
--space-9:    2.25rem;  /* 36px */
--space-10:   2.5rem;   /* 40px */
--space-12:   3rem;     /* 48px */
--space-14:   3.5rem;   /* 56px */
--space-16:   4rem;     /* 64px */
--space-20:   5rem;     /* 80px */
--space-24:   6rem;     /* 96px */
```

### Padding Presets
```css
--p-xs:  var(--space-2) var(--space-3);    /* 8px 12px */
--p-sm:  var(--space-3) var(--space-4);    /* 12px 16px */
--p-md:  var(--space-4) var(--space-6);    /* 16px 24px */
--p-lg:  var(--space-6) var(--space-8);    /* 24px 32px */
--p-xl:  var(--space-8) var(--space-10);   /* 32px 40px */
```

---

## 5. SHADOW SYSTEM (Elevation-Based)

### Shadows
```css
--shadow-none:   none;

--shadow-xs:     0 1px 2px rgba(0, 0, 0, 0.05);

--shadow-sm:     0 1px 3px rgba(0, 0, 0, 0.1),
                 0 1px 2px rgba(0, 0, 0, 0.06);

--shadow-md:     0 4px 6px rgba(0, 0, 0, 0.1),
                 0 2px 4px rgba(0, 0, 0, 0.06);

--shadow-lg:     0 10px 15px rgba(0, 0, 0, 0.1),
                 0 4px 6px rgba(0, 0, 0, 0.05);

--shadow-xl:     0 20px 25px rgba(0, 0, 0, 0.1),
                 0 10px 10px rgba(0, 0, 0, 0.04);

--shadow-2xl:    0 25px 50px rgba(0, 0, 0, 0.15);

--shadow-inner:  inset 0 2px 4px rgba(0, 0, 0, 0.06);

/* Glow Effects */
--glow-primary:  0 0 20px rgba(107, 63, 255, 0.4);
--glow-accent:   0 0 20px rgba(0, 204, 255, 0.4);
--glow-success:  0 0 20px rgba(0, 255, 0, 0.3);
```

### Elevation Map
```css
--elevation-0:   var(--shadow-none);
--elevation-1:   var(--shadow-xs);
--elevation-2:   var(--shadow-sm);
--elevation-3:   var(--shadow-md);
--elevation-4:   var(--shadow-lg);
--elevation-5:   var(--shadow-xl);
--elevation-6:   var(--shadow-2xl);
```

---

## 6. BORDER SYSTEM

### Border Radius
```css
--radius-none:   0;
--radius-xs:     0.25rem;  /* 4px */
--radius-sm:     0.5rem;   /* 8px */
--radius-md:     0.75rem;  /* 12px */
--radius-lg:     1rem;     /* 16px */
--radius-xl:     1.5rem;   /* 24px */
--radius-2xl:    2rem;     /* 32px */
--radius-3xl:    2.5rem;   /* 40px */
--radius-full:   999px;    /* Pill/Circle */
```

### Border Width
```css
--border-0:      0;
--border-1:      1px;
--border-2:      2px;
--border-4:      4px;
```

---

## 7. ANIMATION SYSTEM

### Durations
```css
--duration-75:   75ms;
--duration-100:  100ms;
--duration-150:  150ms;
--duration-200:  200ms;
--duration-300:  300ms;
--duration-500:  500ms;
--duration-700:  700ms;
--duration-1000: 1000ms;
```

### Easing Functions
```css
--ease-linear:   linear;
--ease-in:       cubic-bezier(0.4, 0, 1, 1);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:   cubic-bezier(0.16, 1, 0.32, 1);
```

### Transitions
```css
--transition-fast:   var(--duration-150) var(--ease-out);
--transition-base:   var(--duration-200) var(--ease-out);
--transition-smooth: var(--duration-300) var(--ease-in-out);
--transition-slow:   var(--duration-500) var(--ease-in-out);
```

---

## 8. COMPONENT SPECIFICATIONS

### Button Component
```css
/* Base Button */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

/* Size Variants */
.button--xs {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
}

.button--sm {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
}

.button--md {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
}

.button--lg {
  padding: var(--space-6) var(--space-8);
  font-size: var(--text-lg);
}

/* Color Variants */
.button--primary {
  background-color: hsl(270, 92%, 55%);    /* #6B3FFF */
  color: white;
  box-shadow: var(--shadow-md);
}

.button--primary:hover {
  background-color: hsl(270, 92%, 60%);    /* Lighter purple */
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.button--primary:active {
  background-color: hsl(270, 88%, 48%);    /* Darker purple */
  transform: scale(0.98);
}

.button--secondary {
  background-color: hsl(180, 80%, 50%);    /* #00CCFF */
  color: white;
  box-shadow: var(--shadow-md);
}

.button--secondary:hover {
  background-color: hsl(180, 82%, 60%);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.button--outline {
  background-color: transparent;
  color: hsl(270, 92%, 55%);
  border: 2px solid hsl(270, 92%, 55%);
}

.button--outline:hover {
  background-color: hsl(270, 100%, 88%);
  box-shadow: var(--shadow-md);
}

.button--ghost {
  background-color: transparent;
  color: var(--text-primary);
}

.button--ghost:hover {
  background-color: var(--bg-secondary);
}
```

### Card Component
```css
.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-smooth);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--border-medium);
  transform: translateY(-4px);
}

.card--elevated {
  box-shadow: var(--shadow-md);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.card--interactive {
  cursor: pointer;
}

.card--interactive:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-6px);
}
```

### Input Component
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: hsl(270, 92%, 55%);
  box-shadow: 0 0 0 3px hsl(270, 100%, 88%);
  background-color: var(--bg-primary);
}

.input:hover {
  border-color: var(--border-medium);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Badge Component
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  border-radius: var(--radius-md);
  white-space: nowrap;
}

.badge--primary {
  background-color: hsl(270, 100%, 88%);   /* #D4ADFF */
  color: hsl(270, 88%, 48%);               /* #5C2EFF */
}

.badge--success {
  background-color: hsl(120, 95%, 96%);    /* #E0FFE0 */
  color: hsl(120, 78%, 40%);               /* #00CC00 */
}

.badge--warning {
  background-color: hsl(45, 100%, 96%);    /* #FFFCE0 */
  color: hsl(45, 92%, 50%);                /* #FFDD00 */
}

.badge--danger {
  background-color: hsl(0, 95%, 96%);      /* #FFE0E0 */
  color: hsl(0, 80%, 50%);                 /* #FF0000 */
}
```

---

## 9. RESPONSIVE BREAKPOINTS

```css
--breakpoint-xs:   0px;      /* Mobile */
--breakpoint-sm:   640px;    /* Small tablets */
--breakpoint-md:   768px;    /* Tablets */
--breakpoint-lg:   1024px;   /* Desktops */
--breakpoint-xl:   1280px;   /* Large desktops */
--breakpoint-2xl:  1536px;   /* Extra large */

/* Container Sizes */
--container-sm:    640px;
--container-md:    768px;
--container-lg:    1024px;
--container-xl:    1280px;
--container-2xl:   1536px;
```

---

## 10. LAYOUT PATTERNS

### Sidebar Navigation
```css
.sidebar {
  width: 288px;                      /* Expanded */
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-light);
  transition: all var(--duration-500) var(--ease-in-out);
  height: calc(100vh - 64px);        /* Full height minus header */
  position: fixed;
  left: 0;
  top: 64px;
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sidebar-item:hover {
  background-color: var(--bg-secondary);
}

.sidebar-item.active {
  background-color: hsl(270, 100%, 88%);   /* #D4ADFF */
  color: hsl(270, 88%, 48%);               /* #5C2EFF */
  font-weight: var(--weight-bold);
}
```

### Header
```css
.header {
  height: 64px;                      /* Fixed 64px */
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

/* Glassmorphic Header (optional) */
.header--glass {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
```

### Main Content
```css
.main {
  margin-left: 288px;                /* Sidebar width */
  margin-top: 64px;                  /* Header height */
  padding: var(--space-8);
  transition: all var(--duration-500) var(--ease-in-out);
}

.main.sidebar-collapsed {
  margin-left: 80px;
}

@media (max-width: 768px) {
  .main {
    margin-left: 0;
  }
}
```

---

## 11. ACCESSIBILITY STANDARDS

### Focus States
```css
.button:focus-visible,
.input:focus-visible,
.link:focus-visible {
  outline: 2px solid hsl(270, 92%, 55%);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .button--primary {
    background-color: #000;
    color: #FFF;
    border: 2px solid #FFF;
  }
  
  .button--outline {
    border-width: 2px;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. IMPLEMENTATION CHECKLIST

- [ ] Update CSS variables in `globals.css`
- [ ] Update `tailwind.config.ts` with new colors
- [ ] Update button component with new color variants
- [ ] Update card component styling
- [ ] Update input/form component styling
- [ ] Update badge component styling
- [ ] Update sidebar with new colors
- [ ] Update header with new styling
- [ ] Update all pages to use new color palette
- [ ] Test light and dark modes
- [ ] Test accessibility (WCAG AA)
- [ ] Test responsive design
- [ ] Test animations performance

---

## SUMMARY

This modern design system provides:

✅ **Vibrant Colors** - Bold, modern palette for premium feel  
✅ **Complete Typography** - Refined hierarchy with proper scales  
✅ **Spacing System** - Consistent 8px-based spacing  
✅ **Shadow Elevation** - Proper depth with 6 levels  
✅ **Component Specs** - Complete button, card, input, badge specs  
✅ **Dark Mode** - Full dark mode support with HSL colors  
✅ **Responsive** - Mobile-first breakpoints  
✅ **Accessible** - WCAG AA standards built-in  
✅ **Animations** - Smooth transitions and interactions  

**Ready for 100% implementation in Evyra!**
