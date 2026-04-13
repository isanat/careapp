# FASE 3 - Quick Start Guide
## Typography + Shadows + Framer Motion (Ready to Use)

**Status:** ✅ Complete and Committed
**Build Status:** ✅ Successful (138 pages, 0 errors)
**Implementation Time:** Immediate (all systems ready)

---

## 🎯 What's New

### 1. **Automatic Page Transitions**
✨ Every page automatically fades in and slides up on navigation
- No code needed - already integrated globally
- Smooth 300ms transition with ease-out timing

### 2. **Interactive Card Animations**
```jsx
import { CardMotion } from "@/components/motion";

<CardMotion className="bg-card rounded-3xl p-5 border border-border shadow-card">
  Content
</CardMotion>
// Automatically lifts on hover with shadow elevation
```

### 3. **List Stagger Animations**
```jsx
import { ListMotion, ListItemMotion } from "@/components/motion";

<ListMotion>
  {items.map((item, i) => (
    <ListItemMotion key={item.id} index={i}>
      {/* item */}
    </ListItemMotion>
  ))}
</ListMotion>
// Children animate in sequence with 70ms stagger
```

### 4. **Unified Typography System**
```jsx
import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities";

<h2 className={TYPOGRAPHY_PRESETS.sectionHeader}>
  Recent Activities
</h2>

<p className={TYPOGRAPHY_PRESETS.description}>
  This is body text with proper sizing
</p>

<span className={TYPOGRAPHY_PRESETS.labelSmall}>
  STATUS
</span>
```

**30+ presets available:**
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Page: `pageTitle`, `pageSubtitle`
- Sections: `sectionHeader`, `sectionSubHeader`
- Body: `body`, `bodySmall`, `bodyXs`
- Values: `value`, `valueLarge`, `valueSmall`
- Labels: `label`, `labelSmall`, `labelMuted`
- Badges: `badge`, `status`, `statusSmall`
- And more...

### 5. **Shadow System**
```jsx
// Base card
<div className="bg-card rounded-3xl p-5 border border-border shadow-card">
  Content
</div>

// Interactive (hover effect)
<div className="shadow-card hover:shadow-elevated transition-all duration-300">
  Hovers with elevation
</div>

// Use shadow utilities
import { shadowCombos } from "@/lib/shadow-utilities";
<div className={shadowCombos.cardInteractive}>
  Auto-transitions on hover
</div>
```

---

## 📊 Files Created

| File | Purpose |
|------|---------|
| `src/lib/animations.ts` | 12+ animation presets (Framer Motion variants) |
| `src/lib/typography-utilities.ts` | 35+ typography presets and combinations |
| `src/lib/shadow-utilities.ts` | Shadow system documentation and utilities |
| `src/components/motion/PageTransition.tsx` | Page transition wrapper |
| `src/components/motion/CardMotion.tsx` | Card hover animations |
| `src/components/motion/ListMotion.tsx` | List stagger animations |
| `src/components/motion/ModalMotion.tsx` | Modal/dialog animations |
| `src/components/motion/AnimatePresenceWrapper.tsx` | Global animation provider (integrated) |
| `src/components/motion/index.ts` | Barrel export |
| `FASE_3_IMPLEMENTATION_GUIDE.md` | Complete 500+ line guide with examples |

---

## 🚀 How to Use

### Example 1: Update a Page
```jsx
import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities";
import { ListMotion, ListItemMotion } from "@/components/motion";
import { CardMotion } from "@/components/motion";

export default function DemandsList({ demands }) {
  return (
    <>
      <h1 className={TYPOGRAPHY_PRESETS.pageTitle}>
        All Demands
      </h1>

      <ListMotion className="space-y-3">
        {demands.map((demand, i) => (
          <ListItemMotion key={demand.id} index={i}>
            <CardMotion className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
              <h3 className={TYPOGRAPHY_PRESETS.h4}>
                {demand.title}
              </h3>
              <p className={TYPOGRAPHY_PRESETS.description}>
                {demand.description}
              </p>
              <span className={TYPOGRAPHY_PRESETS.labelSmall}>
                {demand.status}
              </span>
            </CardMotion>
          </ListItemMotion>
        ))}
      </ListMotion>
    </>
  );
}
```

### Example 2: Use Typography Combinations
```jsx
import { typographyCombos } from "@/lib/typography-utilities";

<div className="bg-card rounded-3xl p-5 border border-border shadow-card">
  <h3 className={typographyCombos.cardTitle}>
    Card Title
  </h3>
  <p className={typographyCombos.cardDescription}>
    Description text
  </p>
  <p className={typographyCombos.cardValue}>
    €2,500.00
  </p>
</div>
```

### Example 3: Form with Typography
```jsx
import { typographyCombos } from "@/lib/typography-utilities";

<form className="space-y-6">
  <div>
    <label className={typographyCombos.formLabel}>
      Email Address
    </label>
    <input
      className="mt-2 w-full bg-secondary border border-border rounded-2xl px-4 py-3"
      placeholder="you@example.com"
    />
    <p className={typographyCombos.formHint}>
      We'll never share your email
    </p>
  </div>
</form>
```

---

## 📋 Animation Presets Available

### Page Transitions (Automatic)
- Fade in + slide up on entry (300ms)
- Fade out + slide down on exit (200ms)
- Already integrated - no code needed!

### Card Animations
- Hover: lift up 4px with shadow elevation
- Duration: 200ms
- Easing: easeOut
- Use `CardMotion` component

### List Animations
- Children stagger: 70ms between animations
- Each item: fade in + slide left
- Duration: 300ms per item
- Use `ListMotion` + `ListItemMotion`

### Modal Animations
- Scale in: 0.95 → 1.0
- Fade in: 0 → 1
- Duration: 200ms
- Use `ModalMotion` component

### Dropdown/Menu Animations
- Slide down + fade in
- Duration: 200ms
- Already used in Radix UI components

### Tooltip Animations
- Fade in quickly
- Duration: 150ms
- Already used in Radix UI components

---

## 🎨 Typography Classes Quick Reference

```jsx
// Headings (all uppercase, font-display)
text-5xl text-4xl text-3xl text-2xl text-xl text-lg
font-display font-black font-bold
uppercase tracking-tight

// Body (font-body, relaxed leading)
text-base text-sm text-xs
font-body
leading-relaxed

// Labels (very small, uppercase)
text-[9px] text-xs
font-display font-bold
uppercase tracking-widest

// Values (bold, tight tracking)
text-xl text-2xl text-3xl
font-display font-black
tracking-tighter
```

---

## 🔄 Shadow Classes Quick Reference

```jsx
// Base shadows
shadow-card         // 0 1px 3px - standard cards
shadow-elevated     // 0 10px 15px - hover/elevated state
shadow-glow         // 0 0 20px - highlight effect

// Soft shadows (subtle)
shadow-soft         // lightest
shadow-soft-md      // medium
shadow-soft-lg      // large
shadow-soft-xl      // extra large

// Special
shadow-inner-soft   // inset shadow
shadow-card-hover   // card hover effect
shadow-primary-glow // primary color glow
shadow-accent-glow  // accent color glow
```

---

## 📚 Complete Documentation

For detailed guides, examples, best practices, and troubleshooting:
👉 **Read:** `FASE_3_IMPLEMENTATION_GUIDE.md`

---

## ✅ Checklist for Using FASE 3

When updating a page:

- [ ] Import typography: `import { TYPOGRAPHY_PRESETS } from "@/lib/typography-utilities"`
- [ ] Replace font sizes with presets (h1-h6, body, label, value, etc.)
- [ ] Import motion components: `import { CardMotion, ListMotion, ListItemMotion } from "@/components/motion"`
- [ ] Wrap cards with `CardMotion` for hover effects
- [ ] Wrap lists with `ListMotion` and `ListItemMotion` for stagger
- [ ] Verify page transitions work (automatic)
- [ ] Test animations smoothly (no jank)
- [ ] Test typography on mobile (responsive)
- [ ] Test shadows in dark mode

---

## 🎯 Next Steps

### Now (Immediate):
1. ✅ FASE 1 - Base Components (Complete)
2. ✅ FASE 2 - Complex Components (Complete)
3. ✅ FASE 3 - Typography + Shadows + Animations (Complete)

### Future (Optional Polish):
- Update individual pages with typography presets
- Add CardMotion to interactive cards
- Add ListMotion to list pages
- Create dark mode color variations
- Add custom motion animations to specific pages

---

## 🆘 Quick Troubleshooting

**Animations not working?**
```
✓ Check "use client" at top of component
✓ Verify imports are correct
✓ Check browser console for errors
✓ Reload page (Cmd+R or Ctrl+R)
```

**Typography looks wrong?**
```
✓ Import from @/lib/typography-utilities
✓ Verify font is loaded (check globals.css)
✓ Check className is on right element
```

**Shadows not showing?**
```
✓ Use shadow-card, shadow-elevated, etc.
✓ Check tailwind.config.ts has shadows
✓ Test in both light and dark mode
```

---

## 📊 Stats

- **12** animation presets ready to use
- **35+** typography presets for every text size
- **8+** shadow variants with elevation levels
- **5** motion wrapper components
- **500+** lines of documentation
- **0** breaking changes to existing code
- **138** pages built successfully

---

## 🎉 Summary

FASE 3 is **100% complete** and **ready to use immediately**. All animation systems, typography utilities, and shadow documentation are in place and integrated globally.

The app now has:
✅ Automatic page transitions
✅ Interactive card hover animations
✅ Staggered list animations
✅ Complete typography system (35+ presets)
✅ Unified shadow system (8+ variants)
✅ Zero breaking changes
✅ Full documentation

**Start using it today!** Import from `@/components/motion` and `@/lib/typography-utilities`.
