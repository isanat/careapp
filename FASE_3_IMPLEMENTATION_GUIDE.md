# FASE 3 - Complete Implementation Guide
## Typography + Shadows + Framer Motion Animations

This guide documents all FASE 3 enhancements to the Bloom Elements design system implementation.

---

## 1. Typography Utilities System

### Quick Reference

Import typography utilities:
```typescript
import { TYPOGRAPHY_PRESETS, getTypography } from "@/lib/typography-utilities";
```

### Heading Hierarchy (Always Uppercase, font-display)

```jsx
// Page titles
<h1 className={TYPOGRAPHY_PRESETS.pageTitle}>
  Welcome to Dashboard
</h1>

// Section headers
<h2 className={TYPOGRAPHY_PRESETS.sectionHeader}>
  Recent Activities
</h2>

// Subsection headers
<h3 className={TYPOGRAPHY_PRESETS.sectionSubHeader}>
  Family Members
</h3>

// Individual headings
<h1 className={TYPOGRAPHY_PRESETS.h1}>H1 Heading</h1>
<h2 className={TYPOGRAPHY_PRESETS.h2}>H2 Heading</h2>
<h3 className={TYPOGRAPHY_PRESETS.h3}>H3 Heading</h3>
<h4 className={TYPOGRAPHY_PRESETS.h4}>H4 Heading</h4>
<h5 className={TYPOGRAPHY_PRESETS.h5}>H5 Heading</h5>
<h6 className={TYPOGRAPHY_PRESETS.h6}>H6 Heading</h6>
```

### Body Text

```jsx
// Standard body text
<p className={TYPOGRAPHY_PRESETS.body}>
  This is body text with good readability and relaxed leading.
</p>

// Small body text
<p className={TYPOGRAPHY_PRESETS.bodySmall}>
  This is smaller body text for less prominent information.
</p>

// Extra small text
<span className={TYPOGRAPHY_PRESETS.bodyXs}>Xs text</span>
```

### Labels (Form, Badges)

```jsx
// Form label
<label className={TYPOGRAPHY_PRESETS.label}>
  Full Name
</label>

// Badge label
<span className={TYPOGRAPHY_PRESETS.labelSmall}>
  PENDING
</span>

// Muted label
<span className={TYPOGRAPHY_PRESETS.labelMuted}>
  Optional field
</span>
```

### Values (Numbers, Important Data)

```jsx
// Standard value
<div className={TYPOGRAPHY_PRESETS.value}>
  €2,500.00
</div>

// Large value
<div className={TYPOGRAPHY_PRESETS.valueLarge}>
  42
</div>

// Small value
<span className={TYPOGRAPHY_PRESETS.valueSmall}>
  €50
</span>
```

### Descriptions & Helper Text

```jsx
// Description
<p className={TYPOGRAPHY_PRESETS.description}>
  This field is required for account verification.
</p>

// Small description
<p className={TYPOGRAPHY_PRESETS.descriptionSmall}>
  Subcopy text with reduced emphasis
</p>

// Helper text (validation messages)
<span className={TYPOGRAPHY_PRESETS.helper}>
  Must be at least 8 characters
</span>
```

### Pre-made Combinations

Use `typographyCombos` for common combinations:

```typescript
import { typographyCombos } from "@/lib/typography-utilities";

// Card title + description
<div>
  <h3 className={typographyCombos.cardTitle}>Card Title</h3>
  <p className={typographyCombos.cardDescription}>Description</p>
  <p className={typographyCombos.cardValue}>€1,000</p>
</div>

// Form label + input + hint
<div>
  <label className={typographyCombos.formLabel}>Email</label>
  <input className={typographyCombos.formInput} />
  <span className={typographyCombos.formHint}>hint text</span>
</div>

// Table header + cell + value
<tr>
  <th className={typographyCombos.tableHeader}>Header</th>
  <td className={typographyCombos.tableCell}>Cell</td>
  <td className={typographyCombos.tableValue}>Value</td>
</tr>

// Stat block
<div>
  <p className={typographyCombos.statLabel}>Label</p>
  <p className={typographyCombos.statValue}>999</p>
  <p className={typographyCombos.statChange}>+12%</p>
</div>
```

---

## 2. Shadow System

### Quick Reference

Import shadow utilities:
```typescript
import { SHADOW_CLASSES, getShadowClass, shadowCombos } from "@/lib/shadow-utilities";
```

### Shadow Hierarchy

```jsx
// Base card shadow
<div className="shadow-card">Card</div>

// Elevated shadow (hover state)
<div className="shadow-elevated">Elevated Card</div>

// Glowing effect
<div className="shadow-glow">Glowing Element</div>

// Soft shadows (subtle)
<div className="shadow-soft">Subtle Shadow</div>
<div className="shadow-soft-md">Medium Shadow</div>
<div className="shadow-soft-lg">Large Shadow</div>
<div className="shadow-soft-xl">Extra Large Shadow</div>
```

### Card Shadow Pattern

```jsx
// Interactive card (hover effect with shadow transition)
<div className={shadowCombos.cardInteractive}>
  Interactive Card - hovers smoothly from shadow-card to shadow-elevated
</div>

// Premium card (always elevated)
<div className={shadowCombos.cardPremium}>
  Premium Card - always has elevated shadow
</div>

// Button shadow pattern
<button className={shadowCombos.buttonBase}>
  Base Button
</button>

<button className={shadowCombos.buttonHover}>
  Hover Button
</button>
```

### Elevation Levels

```typescript
import { getElevationShadow, type ElevationLevel } from "@/lib/shadow-utilities";

// Use elevation levels for consistent depth
<div className={getElevationShadow(0)}>No shadow</div>
<div className={getElevationShadow(1)}>Subtle elevation</div>
<div className={getElevationShadow(2)}>Standard elevation</div>
<div className={getElevationShadow(3)}>Medium elevation</div>
<div className={getElevationShadow(4)}>High elevation</div>
<div className={getElevationShadow(5)}>Premium elevation</div>
```

### Common Patterns

```jsx
// Card base
<div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
  Content
</div>

// Interactive card (hover effect)
<div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated transition-all duration-300">
  Hover for effect
</div>

// Floating element (dropdown, tooltip, popover)
<div className="bg-card rounded-2xl border border-border shadow-elevated">
  Floating content
</div>

// Button
<button className="px-6 py-3 rounded-2xl font-display font-bold shadow-soft hover:shadow-soft-md transition-all">
  Click me
</button>
```

---

## 3. Framer Motion Animations

### Quick Reference

Import animation utilities:
```typescript
import {
  PageTransition,
  CardMotion,
  ListMotion,
  ListItemMotion,
  ModalMotion,
  AnimatePresenceWrapper,
  pageTransitionVariants,
  cardHoverVariants,
  containerVariants,
  itemVariants,
  modalVariants,
} from "@/components/motion";
```

### Page Transitions

**Automatically enabled globally** - AnimatePresenceWrapper is already integrated in the app layout.

```jsx
// Pages automatically fade in and slide up on navigation
// No additional code needed!
```

If you want to wrap specific sections:
```jsx
import { PageTransition } from "@/components/motion";

export default function Page() {
  return (
    <PageTransition>
      {/* Page content automatically animates on route change */}
    </PageTransition>
  );
}
```

### Card Hover Animations

```jsx
import { CardMotion } from "@/components/motion";

// Interactive card with hover lift effect
<CardMotion className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
  Content automatically lifts on hover
</CardMotion>

// Non-interactive card (no hover effect)
<CardMotion interactive={false} className="bg-card rounded-3xl ...">
  Static card
</CardMotion>

// Card with custom delay (stagger in lists)
<CardMotion delay={0.1} className="...">
  Appears with slight delay
</CardMotion>
```

### List Animations with Stagger

```jsx
import { ListMotion, ListItemMotion } from "@/components/motion";

// Container for staggered animations
<ListMotion className="space-y-3">
  {items.map((item, index) => (
    <ListItemMotion key={item.id} index={index}>
      <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
        {item.name}
      </div>
    </ListItemMotion>
  ))}
</ListMotion>

// Custom stagger settings
<ListMotion staggerDelay={0.1} initialDelay={0.2}>
  {/* children animate with custom timing */}
</ListMotion>
```

### Modal/Dialog Animations

```jsx
import { ModalMotion } from "@/components/motion";

// Modal automatically scales in and fades
<ModalMotion isOpen={isOpen} className="fixed inset-0">
  <div className="bg-card rounded-3xl p-6 shadow-elevated">
    Modal content
  </div>
</ModalMotion>
```

### Custom Animations with Variants

```jsx
import { motion } from "framer-motion";
import { pageTransitionVariants, cardHoverVariants } from "@/components/motion";

// Use pre-defined variants
<motion.div variants={pageTransitionVariants} initial="initial" animate="animate">
  Content
</motion.div>

// Or use directly with motion.div
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3 }}
>
  Custom animation
</motion.div>
```

---

## 4. Integration Examples

### Complete Card Component with All FASE 3 Features

```jsx
import { CardMotion } from "@/components/motion";
import { TYPOGRAPHY_PRESETS, typographyCombos } from "@/lib/typography-utilities";
import { shadowCombos } from "@/lib/shadow-utilities";

export function ActivityCard({ activity }) {
  return (
    <CardMotion
      className={`bg-card rounded-3xl p-5 sm:p-7 border border-border ${shadowCombos.cardInteractive}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className={typographyCombos.cardTitle}>
          {activity.title}
        </h3>
        <span className={TYPOGRAPHY_PRESETS.labelSmall}>
          {activity.status}
        </span>
      </div>

      {/* Description */}
      <p className={typographyCombos.cardDescription}>
        {activity.description}
      </p>

      {/* Value */}
      <div className="mt-4">
        <p className={typographyCombos.statLabel}>Amount</p>
        <p className={typographyCombos.cardValue}>
          {activity.amount}
        </p>
      </div>

      {/* Footer */}
      <p className={TYPOGRAPHY_PRESETS.helper}>
        {activity.date}
      </p>
    </CardMotion>
  );
}
```

### List with Staggered Animations

```jsx
import { ListMotion, ListItemMotion } from "@/components/motion";
import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities";

export function ActivityList({ activities }) {
  return (
    <div>
      <h2 className={TYPOGRAPHY_PRESETS.sectionHeader}>
        Recent Activities
      </h2>

      <ListMotion className="mt-6 space-y-3">
        {activities.map((activity, index) => (
          <ListItemMotion key={activity.id} index={index}>
            <ActivityCard activity={activity} />
          </ListItemMotion>
        ))}
      </ListMotion>
    </div>
  );
}
```

### Form with Typography Utilities

```jsx
import { TYPOGRAPHY_PRESETS, typographyCombos } from "@/lib/typography-utilities";

export function ContactForm() {
  return (
    <form className="space-y-6">
      {/* Form group */}
      <div>
        <label htmlFor="email" className={typographyCombos.formLabel}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          className={`mt-2 w-full ${typographyCombos.formInput} bg-secondary border border-border rounded-2xl px-4 py-3`}
          placeholder="you@example.com"
        />
        <p className={typographyCombos.formHint}>
          We'll never share your email
        </p>
      </div>

      {/* Validation message */}
      <p className={TYPOGRAPHY_PRESETS.helper}>
        This field is required
      </p>
    </form>
  );
}
```

### Table with Typography System

```jsx
import { TYPOGRAPHY_PRESETS, typographyCombos } from "@/lib/typography-utilities";

export function DataTable({ data }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={typographyCombos.tableHeader}>Name</th>
          <th className={typographyCombos.tableHeader}>Status</th>
          <th className={typographyCombos.tableHeader}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            <td className={typographyCombos.tableCell}>
              {row.name}
            </td>
            <td className={typographyCombos.tableCell}>
              <span className={TYPOGRAPHY_PRESETS.labelSmall}>
                {row.status}
              </span>
            </td>
            <td className={typographyCombos.tableValue}>
              {row.amount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 5. File Structure

New files created for FASE 3:

```
src/
├── lib/
│   ├── animations.ts           # Animation variants and presets
│   ├── shadow-utilities.ts    # Shadow system documentation
│   ├── typography-utilities.ts # Typography presets and combinations
│   └── ...
├── components/
│   ├── motion/
│   │   ├── PageTransition.tsx     # Page transition wrapper
│   │   ├── CardMotion.tsx         # Card hover animations
│   │   ├── ListMotion.tsx         # List stagger animations
│   │   ├── ModalMotion.tsx        # Modal animations
│   │   ├── AnimatePresenceWrapper.tsx  # Global animation provider
│   │   └── index.ts
│   └── ...
└── ...

tailwind.config.ts             # Enhanced with animation keyframes
```

---

## 6. Checklist for Using FASE 3

When updating pages to use FASE 3:

- [ ] Import typography presets: `import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities"`
- [ ] Replace hardcoded font sizes with presets (h1-h6, body, label, etc.)
- [ ] Use shadow utilities: `import { shadowCombos } from "@/lib/shadow-utilities"`
- [ ] Replace inline shadows with `shadow-card`, `shadow-elevated` patterns
- [ ] Wrap interactive cards with `CardMotion`
- [ ] Wrap lists with `ListMotion` and `ListItemMotion`
- [ ] Verify page transitions work (already enabled globally)
- [ ] Test animations in browser (smooth, no jank)
- [ ] Test typography on mobile (responsive sizes)
- [ ] Test shadows in dark mode

---

## 7. Best Practices

### Typography

1. **Always use presets** - Don't mix and match individual classes
2. **Uppercase labels** - All labels, badges, and button text should be uppercase
3. **font-display for headings** - Headings always use Space Grotesk
4. **font-body for body** - Body text always uses Inter
5. **Responsive text** - Use `sm:text-xl md:text-2xl` for responsive sizing
6. **tracking-widest for small text** - Very small text (badges, labels) need `tracking-widest`

### Shadows

1. **Use shadow-card as base** - All cards start with `shadow-card`
2. **Animate to shadow-elevated** - Interactive cards transition smoothly to `shadow-elevated` on hover
3. **No color shadows** - Use `shadow-soft`, `shadow-soft-md`, etc. for colored shadows (already defined)
4. **Consistent elevation** - Use elevation levels (0-5) for consistent depth

### Animations

1. **Page transitions enabled globally** - Don't add custom page transitions
2. **CardMotion for interactive cards** - Use component instead of manual motion.div
3. **ListMotion for lists** - Ensures consistent stagger timing
4. **Avoid overanimating** - Keep transitions under 400ms for responsive feel
5. **Test performance** - Animations should be smooth on mobile

---

## 8. Tailwind Classes Quick Reference

### Typography
```
font-display    font-body      font-mono
font-black      font-bold      font-semibold
font-medium     font-normal
uppercase       lowercase      capitalize
tracking-tight  tracking-wide  tracking-widest
leading-tight   leading-relaxed
text-xs         text-sm        text-base
text-lg         text-xl        text-2xl
text-3xl        text-4xl       text-5xl
```

### Shadows
```
shadow-card         shadow-elevated      shadow-glow
shadow-soft         shadow-soft-md       shadow-soft-lg
shadow-soft-xl      shadow-inner-soft    shadow-card-hover
shadow-primary-glow shadow-accent-glow
```

### Animations
```
animate-fade-in    animate-fade-out    animate-slide-up
animate-slide-down animate-slide-left  animate-slide-right
animate-scale-in   animate-scale-out   animate-float
animate-bounce-soft animate-pulse-soft animate-shimmer
```

---

## 9. Common Patterns

### Empty State
```jsx
import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities";

<div className="text-center py-12">
  <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
  <h3 className={TYPOGRAPHY_PRESETS.sectionHeader}>
    No items found
  </h3>
  <p className={TYPOGRAPHY_PRESETS.description}>
    Try adjusting your filters or search query
  </p>
</div>
```

### Status Badge
```jsx
import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities";

<span className={`${TYPOGRAPHY_PRESETS.labelSmall} px-2.5 py-1 rounded-lg border ${statusColor}`}>
  {status}
</span>
```

### Stat Block
```jsx
import { typographyCombos } from "@/lib/typography-utilities";

<div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
  <p className={typographyCombos.statLabel}>Total Families</p>
  <p className={typographyCombos.statValue}>24</p>
  <p className={typographyCombos.statChange}>+5 this month</p>
</div>
```

---

## 10. Migration Guide

To update an existing page to FASE 3:

1. **Find and replace typography:**
   ```
   OLD: className="text-lg font-bold"
   NEW: className={TYPOGRAPHY_PRESETS.h5}
   ```

2. **Find and replace shadows:**
   ```
   OLD: className="shadow-md hover:shadow-lg"
   NEW: className="shadow-card hover:shadow-elevated transition-all"
   ```

3. **Add CardMotion to interactive cards:**
   ```jsx
   <CardMotion className="bg-card rounded-3xl p-5 border border-border shadow-card">
     ...
   </CardMotion>
   ```

4. **Wrap lists with ListMotion:**
   ```jsx
   <ListMotion>
     {items.map((item, i) => (
       <ListItemMotion key={item.id} index={i}>
         {/* item */}
       </ListItemMotion>
     ))}
   </ListMotion>
   ```

5. **Test in browser** - Verify animations are smooth and typography is correct

---

## 11. Troubleshooting

**Animations not working:**
- Check that `"use client"` is at top of component
- Verify framer-motion is imported
- Check browser console for errors

**Typography looks wrong:**
- Verify import path: `@/lib/typography-utilities`
- Check font is loaded in globals.css
- Verify className is applied to correct element

**Shadows not showing:**
- Check Tailwind is configured correctly
- Verify shadow utilities are in tailwind.config.ts
- Check dark mode colors

**Build errors:**
- Run `npm run build` to test
- Check all imports are correct
- Verify no circular dependencies

---

## Summary

FASE 3 provides complete animation, typography, and shadow systems:

✅ **Typography:** 30+ presets for all text sizes, weights, and styles
✅ **Shadows:** 8+ shadow variants with elevation levels
✅ **Animations:** Page transitions, card hovers, list stagger, modals
✅ **Global:** AnimatePresenceWrapper integrated in app layout
✅ **Components:** Reusable motion wrappers for common patterns
✅ **Documentation:** Complete reference and examples

**Result:** Bloom Elements 100% implemented with premium animations and consistent typography across entire app.
