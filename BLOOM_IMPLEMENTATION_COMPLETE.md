# 🎨 Plano Completo: 100% Bloom Elements no Evyra

## STATUS ATUAL vs ALVO

Referência Visual: https://bloom-elements.lovable.app/

### FASE 1: COMPONENTES BASE (CRÍTICO) 🔴

#### 1.1 Buttons
**Status:** ✅ EXISTE (`src/components/ui/button.tsx`)
**Problema:** Precisa 100% dos variants do Bloom:
- [x] default (primary)
- [x] dark
- [x] premium (gradient)
- [x] secondary
- [x] outline
- [x] ghost
- [x] link
- [x] destructive
- [x] success
- [x] warning
- [ ] FALTA: Todos os sizes (sm, default, lg, xl, icon, icon-sm, icon-lg)
- [ ] FALTA: Loading states com animation
- [ ] FALTA: Disabled states styling

**Action:** Refatorar button.tsx com TODOS os variants e sizes do Bloom

#### 1.2 Cards
**Status:** ✅ PARCIAL (`BloomCard.tsx` criado mas básico)
**Variantes faltando:**
- [ ] Card simples com shadow-card
- [ ] Card com hover effect (shadow-elevated)
- [ ] Card com top border accent (colored bar at top)
- [ ] Card com gradient (premium)
- [ ] Interactive card with motion
- [ ] Card com icon + text layout
- [ ] Card com action button

**Action:** Expandir BloomCard.tsx com TODOS os variants

#### 1.3 Badges
**Status:** ✅ EXISTE (`BloomBadge.tsx`) 
**Variantes faltando:**
- [ ] Status badge (success, warning, error, info, pending)
- [ ] Pill badge (rounded-full)
- [ ] Badge com icon
- [ ] Badge animated/pulsing
- [ ] Badge com count (notification)

**Action:** Expandir BloomBadge.tsx com todos variants

#### 1.4 Form Inputs
**Status:** ⚠️ PARCIAL (`input.tsx` existe mas não é Bloom)
**Precisa:**
- [ ] Text input com Bloom styling
- [ ] Email input
- [ ] Password input (com show/hide)
- [ ] Search input
- [ ] Textarea com Bloom styling
- [ ] Select/Dropdown com Bloom styling
- [ ] Checkbox com Bloom styling
- [ ] Radio button com Bloom styling
- [ ] Toggle/Switch com Bloom styling
- [ ] Slider/Range com Bloom styling
- [ ] File upload (drag & drop)
- [ ] Date picker
- [ ] Time picker

**Action:** Refatorar/criar todos os input components com Bloom

#### 1.5 Labels
**Status:** ⚠️ EXISTE mas não segue Bloom
**Padrão Bloom:**
```
text-xs font-display font-bold text-foreground uppercase tracking-widest
```
**Action:** Refatorar `label.tsx` com este padrão

#### 1.6 Alerts & Feedback
**Status:** ❌ NÃO IMPLEMENTADO 100%
**Faltando:**
- [ ] Alert banner (success, error, warning, info)
- [ ] Toast (Sonner já existe, mas precisa Bloom styling)
- [ ] Empty state com icon + message
- [ ] Loading states (spinner, dots, shimmer, skeleton)
- [ ] Progress bar
- [ ] Progress ring/circular
- [ ] Status indicator/dot

**Action:** Criar componentes de feedback com Bloom

---

### FASE 2: COMPONENTES COMPLEXOS (IMPORTANTE) 🟡

#### 2.1 Navigation
**Status:** ⚠️ PARCIAL
- [x] Sidebar (refatorado para EvyraSidebar)
- [ ] Tabs com Bloom styling (rounded, underline, pill variants)
- [ ] Breadcrumbs com Bloom styling
- [ ] Accordion com Bloom styling
- [ ] Stepper/Progress com Bloom styling
- [ ] Menu/Dropdown com Bloom styling
- [ ] Bottom nav mobile com Bloom styling

**Action:** Refatorar tabs.tsx, accordion.tsx, breadcrumb.tsx

#### 2.2 Overlays & Modals
**Status:** ⚠️ EXISTE mas não é Bloom
- [ ] Dialog/Modal com Bloom styling
- [ ] Drawer/Sidebar com Bloom styling
- [ ] Tooltip com Bloom styling
- [ ] Popover com Bloom styling
- [ ] Context menu com Bloom styling

**Action:** Refatorar dialog.tsx, drawer.tsx, tooltip.tsx

#### 2.3 Tables & Data
**Status:** ❌ NÃO IMPLEMENTADO
- [ ] Table com Bloom styling
- [ ] Pagination com Bloom styling
- [ ] Data list com Bloom cards
- [ ] Sortable columns
- [ ] Filter UI

**Action:** Criar table.tsx, pagination.tsx com Bloom

---

### FASE 3: TIPOGRAFIA & UTILITÁRIOS 🟢

#### 3.1 Typography System
**Status:** ⚠️ PARCIAL
**Verificar em `tailwind.config.ts`:**
- [x] font-display (Space Grotesk)
- [x] font-body (Inter)
- [ ] ALL font sizes (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- [ ] ALL font weights (400, 500, 600, 700, 800, 900)
- [ ] Text utilities (tracking, leading, line-clamp)
- [ ] Heading utilities (h1, h2, h3, h4, h5, h6)

**Action:** Verificar/expandir typography no tailwind.config

#### 3.2 Color System
**Status:** ✅ EXISTE em HSL
**Verificar:**
- [x] Primary, secondary, success, warning, error, info
- [x] Foreground, background, muted, border
- [ ] Color contrast ratios (AA/AAA accessibility)
- [ ] Dark mode colors

**Action:** Auditar cores em tailwind.config

#### 3.3 Shadow System
**Status:** ⚠️ PARCIAL
**Precisa:**
- [x] shadow-card (base)
- [x] shadow-elevated (hover)
- [ ] shadow-glow (accent)
- [ ] shadow-sm (subtle)
- [ ] shadow-lg (large)
- [ ] shadow-xl (extra large)

**Action:** Expandir shadow utilities em tailwind.config

#### 3.4 Spacing System
**Status:** ⚠️ PARCIAL
**Verificar:**
- [x] Base spacing (4px = 1 unit)
- [ ] Consistent use in all components
- [ ] Responsive spacing (sm:, md:, lg: variants)

**Action:** Auditar spacing em todos componentes

#### 3.5 Border Radius
**Status:** ⚠️ PARCIAL
**Padrão Bloom:**
- rounded-lg = 8px (small elements)
- rounded-xl = 12px (medium elements)
- rounded-2xl = 16px (forms, inputs)
- rounded-3xl = 24px (cards, large elements)

**Action:** Verificar uso consistente

---

## TABELA DE PRIORIDADE

| Componente | Criticidade | Status | Esforço | Deps |
|-----------|-------------|--------|---------|------|
| Buttons | 🔴 CRÍTICO | ⚠️ Parcial | MÉDIO | - |
| Cards | 🔴 CRÍTICO | ✅ Existe | MÉDIO | - |
| Form Inputs | 🔴 CRÍTICO | ❌ Falta | ALTO | Labels |
| Labels | 🔴 CRÍTICO | ⚠️ Parcial | BAIXO | - |
| Alerts | 🔴 CRÍTICO | ❌ Falta | MÉDIO | - |
| Tabs | 🟡 IMPORTANTE | ⚠️ Parcial | MÉDIO | - |
| Breadcrumbs | 🟡 IMPORTANTE | ⚠️ Parcial | BAIXO | - |
| Modal/Dialog | 🟡 IMPORTANTE | ⚠️ Parcial | MÉDIO | - |
| Tables | 🟡 IMPORTANTE | ❌ Falta | ALTO | - |
| Tooltip | 🟡 IMPORTANTE | ⚠️ Parcial | BAIXO | - |
| Typography | 🟢 POLISH | ✅ OK | BAIXO | - |
| Colors | 🟢 POLISH | ✅ OK | - | - |
| Shadows | 🟢 POLISH | ⚠️ Parcial | BAIXO | - |
| Spacing | 🟢 POLISH | ⚠️ Parcial | MÉDIO | - |

---

## PRÓXIMOS PASSOS (ORDEM RECOMENDADA)

### Semana 1: Fase 1 - Base
1. ✅ Refatorar Button com TODOS os variants/sizes
2. ✅ Expandir BloomCard com todos os layouts
3. ✅ Refatorar form inputs (text, email, password, textarea, select)
4. ✅ Refatorar Labels com padrão Bloom
5. ✅ Criar Alert/Feedback components
6. ✅ Criar Empty State component
7. ✅ Criar Loading states (spinner, skeleton, shimmer)

### Semana 2: Fase 2 - Complex
8. ✅ Refatorar Tabs com Bloom styling
9. ✅ Refatorar Breadcrumbs
10. ✅ Refatorar Accordion
11. ✅ Refatorar Modal/Dialog
12. ✅ Refatorar Tooltip/Popover
13. ✅ Criar Table component com Bloom
14. ✅ Refatorar Pagination

### Semana 3: Fase 3 + Pages
15. ✅ Auditar/expandir Typography utilities
16. ✅ Auditar Shadow system
17. ✅ Refatorar TODAS as páginas (já feitas mas falta polish)
18. ✅ Adicionar Framer Motion animations em cards/lists
19. ✅ Dark mode final polish
20. ✅ Responsive breakpoints audit

---

## VISÃO GERAL: O QUE ESTÁ FALTANDO

### ✅ JÁ IMPLEMENTADO (24 páginas)
- Dashboard, Demands, Payments, Interviews, Contracts
- Chat, Proposals, Notifications, Profile, Wallet
- Search, Family demands, Admin pages
- Setup/onboarding pages
- Sidebar EvyraSidebar com collapse animation

### ❌ PRECISA COMPLETAR
1. **Componentes reutilizáveis** - Criar TODOS com Bloom
2. **Utilitários** - Expandir Typography, Shadows, Spacing
3. **Formulários** - Refatorar 100% dos inputs
4. **Navegação** - Tabs, Breadcrumbs, Accordion
5. **Feedback** - Alerts, Empty states, Loading states
6. **Overlays** - Modals, Tooltips, Popovers
7. **Tabelas** - Data display components
8. **Animações** - Framer Motion em TUDO
9. **Dark mode** - Verificar 100% de coverage
10. **Responsivo** - Auditar todos breakpoints

---

## ESTIMATIVA TOTAL

- **Componentes Base:** 40-50 horas
- **Componentes Complexos:** 30-40 horas  
- **Utilitários & Polish:** 20-30 horas
- **Testes & Refinamento:** 20 horas

**TOTAL: ~130 horas de trabalho focado**

---

## PRÓXIMA AÇÃO

Qual fase quer começar? Recomendo:

1. **Opção A (Rápido):** Focar só em componentes base (buttons, cards, forms) e deixar o resto
2. **Opção B (Completo):** Implementar 100% em 3 semanas sistemáticas
3. **Opção C (Balanceado):** Fase 1 + Fase 2, deixar Phase 3 para depois

---

Gerado: 2026-04-13
Referência: https://bloom-elements.lovable.app/
