# BLOOM ELEMENTS - DESIGN SYSTEM COMPLETE REFERENCE
## Guia de Implementação 100% Fiel para EVYRA

**Status**: Documento de Referência Oficial para Implementação
**Versão**: 1.0
**Data**: 2024
**Fonte**: https://github.com/isanat/bloom-elements

---

## 📋 INDICE

1. [Tipografia](#tipografia)
2. [Cores](#cores)
3. [Spacing & Layout](#spacing--layout)
4. [Border Radius](#border-radius)
5. [Shadows](#shadows)
6. [Componentes Base](#componentes-base)
7. [Padrões de Páginas](#padrões-de-páginas)
8. [Animações](#animações)
9. [Formulários](#formulários)
10. [Feedback & Alerts](#feedback--alerts)
11. [Tabelas & Dados](#tabelas--dados)

---

## 🔤 TIPOGRAFIA

### Fontes
```
Display Font: Space Grotesk (400, 500, 600, 700)
Body Font: Inter (400, 500, 600, 700, 800, 900)
```

### Tamanhos & Pesos

#### Títulos
```tsx
// H1 - Seção Principal
className="text-5xl md:text-5xl font-display font-black text-foreground uppercase tracking-tighter leading-none"

// H2 - Section Header
className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase"

// H3 - Card Titles
className="font-display font-black text-foreground uppercase text-sm"

// H4 - DocCard Title (Label)
className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4"

// H5 - SubTitles
className="text-lg font-display font-bold text-foreground uppercase"
```

#### Corpo de Texto
```tsx
// Descrição padrão
className="text-base text-muted-foreground font-medium"

// Label (inputs, captions)
className="text-xs font-display font-bold text-foreground uppercase tracking-widest"

// Micro Label (badges, small info)
className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest"

// Valor grande (números, preços)
className="text-3xl font-display font-black text-foreground tracking-tighter leading-none"

// Valor médio
className="text-xl font-display font-black tracking-tighter"

// Small text (helper, hints)
className="text-xs text-muted-foreground font-medium"

// Extra small (timestamp, subtle info)
className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest"
```

### Tracking & Line Height
```
tracking-tighter = -0.02em (headings)
tracking-tight = -0.01em
tracking-normal = 0
tracking-wide = 0.025em
tracking-widest = 0.05em (labels, badges)
tracking-[0.3em] = 0.3em (special labels)
tracking-[0.4em] = 0.4em (DocCard title)
tracking-[0.5em] = 0.5em (emphasis)

leading-none = 1 (headings)
leading-tight = 1.25
leading-relaxed = 1.625 (body text)
```

---

## 🎨 CORES

### Palette Definida (CSS Variables)
```
Primary: hsl(221 83% 53%) - Vibrant Blue
Foreground: hsl(215 28% 10%) - Dark Navy
Background: hsl(210 20% 98%) - Off White

Success: hsl(160 84% 39%) - Green
Warning: hsl(38 92% 50%) - Amber Orange
Destructive: hsl(0 84% 60%) - Red
Info: hsl(199 89% 48%) - Cyan Blue

Card: hsl(0 0% 100%) - White
Secondary: hsl(210 20% 96%) - Light Gray
Muted: hsl(210 20% 96%) - Light Gray
Border: hsl(214 32% 91%) - Subtle Gray
```

### Uso de Cores

#### Backgrounds
```
Primário: bg-card (white)
Secundário: bg-secondary (light gray) - inputs, list items, badges
Muted: bg-muted (light gray) - disabled states
Primary accent: bg-primary (blue) - CTA buttons, active states
```

#### Texto
```
Principal: text-foreground (dark navy) - títulos, labels
Secundário: text-muted-foreground (gray) - descrições, helper text
Success: text-success (green) - approved, complete
Warning: text-warning (orange) - caution, pending
Destructive: text-destructive (red) - errors, delete
Info: text-info (cyan) - information
```

#### Variantes com Opacidade
```
bg-primary/10 - Fundo light primary (badges, highlights)
bg-primary/5 - Muito light (hover states)
text-muted-foreground/50 - Semi-transparent text
border-border/30 - Subtle borders
border-border/50 - Medium borders
```

---

## 🗂️ SPACING & LAYOUT

### Sistema de Spacing
```
Base unit = 4px (Tailwind)

Spacing values used:
p-3, p-4, p-5, p-6, p-7, p-8, p-10
m-1, m-2, m-3, m-4, m-5, m-6
gap-1, gap-2, gap-3, gap-4, gap-5, gap-6
space-y-2, space-y-3, space-y-4, space-y-6, space-y-8, space-y-12
```

### Padrões de Spacing

#### Cards
```
Card padding:
- DocCard: p-8
- Item Card: p-5, p-6, p-7
- Profile/Stat Card: p-6, p-7

Interior spacing:
- space-y-4 (para seções dentro do card)
- gap-3, gap-4, gap-5 (para grids/flex)
```

#### Seções
```tsx
// Entre seções
className="space-y-8"

// Entre grupos
className="space-y-4"

// Dentro de grupos
className="gap-3"
```

#### Padrão Típico de Layout
```tsx
<div className="space-y-6 max-w-4xl">
  {/* Header */}
  <BloomSectionHeader title="..." desc="..." />
  
  {/* Grid of Stats */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    {/* 3 cards */}
  </div>
  
  {/* Content section */}
  <section className="space-y-4">
    <h4 className="...">Título</h4>
    <div className="bg-card p-8 rounded-3xl ...">
      {/* content */}
    </div>
  </section>
</div>
```

### Grid System
```
2 colunas:
grid-cols-1 md:grid-cols-2 gap-5

3 colunas:
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5

4 colunas:
grid-cols-2 md:grid-cols-4 gap-5

Espaçamento:
gap-3, gap-4, gap-5, gap-6
```

---

## 🔲 BORDER RADIUS

### Valores Padronizados
```
rounded-lg = 0.5rem (buttons small, inputs)
rounded-xl = 0.75rem (small components)
rounded-2xl = 1rem (cards pequenos, buttons default)
rounded-3xl = 1.5rem (cards grandes, section containers)
rounded-full = 50% (avatars, badges)
```

### Uso por Componente
```
Avatar/Profile pic: rounded-2xl ou rounded-full
Buttons: rounded-xl (sm), rounded-2xl (default), rounded-3xl (xl)
Inputs: rounded-2xl
Cards: rounded-2xl (items), rounded-3xl (sections)
Badges: rounded-lg, rounded-full (pill)
Modal: rounded-3xl
```

---

## 💫 SHADOWS

### 3-Level Shadow System

#### Level 1: Shadow Card (Default)
```css
box-shadow: 0 1px 3px 0 hsl(215 28% 10% / 0.04), 
            0 1px 2px -1px hsl(215 28% 10% / 0.04);
```
**Uso**: Cards normais, containers, base UI
**Classe**: `shadow-card`

#### Level 2: Shadow Elevated (Hover/Focus)
```css
box-shadow: 0 10px 40px -10px hsl(221 83% 53% / 0.12), 
            0 4px 16px -4px hsl(215 28% 10% / 0.06);
```
**Uso**: Cards on hover, modals, elevated content
**Classe**: `shadow-elevated`
**Trigger**: `hover:shadow-elevated transition-all`

#### Level 3: Shadow Glow (Accent)
```css
box-shadow: 0 0 30px -5px hsl(221 83% 53% / 0.25);
```
**Uso**: Primary CTAs, featured elements
**Classe**: `shadow-glow`

### Padrão Típico de Card com Hover
```tsx
className="bg-card rounded-3xl border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer"
```

---

## 🧩 COMPONENTES BASE

### SectionHeader
```tsx
<div className="space-y-2">
  <h2 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
    Título da Seção
  </h2>
  <p className="text-base text-muted-foreground font-medium">
    Descrição secundária
  </p>
</div>
```

### DocCard (Container)
```tsx
<section className="space-y-4">
  <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
    Título do Card
  </h4>
  <div className="bg-card p-8 rounded-3xl border border-border shadow-card relative overflow-hidden">
    {/* Content */}
  </div>
</section>
```
**Key Points**:
- Title é FORA do card (label style com border-left)
- Card tem padding p-8
- Border é subtle (border-border, 1px)
- Shadow é card level (não elevated)

### StatBlock
```tsx
<div className="bg-card p-7 rounded-3xl border border-border shadow-card space-y-4 hover:shadow-elevated transition-all group">
  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
    <Icon className="text-primary" />
  </div>
  <div>
    <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
      Label
    </div>
    <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
      Valor
    </div>
  </div>
</div>
```
**Key Points**:
- Icon container: 12x12 rounded-2xl bg-secondary
- Icon scales on hover (group-hover:scale-110)
- Valor é text-3xl font-black
- Hover state: shadow-elevated

### Badge/Tag
```tsx
// Variante colored (padrão)
<span className="px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary">
  Label
</span>

// Variante pill (filled)
<span className="px-4 py-1.5 text-[10px] font-display font-bold rounded-full uppercase tracking-widest bg-primary text-primary-foreground">
  Label
</span>

// Variante outline
<span className="px-3 py-1 text-[9px] font-display font-bold border border-border rounded-lg uppercase tracking-widest text-muted-foreground">
  Label
</span>
```
**Variantes de Cores**:
```
Primary: bg-primary/10 text-primary
Success: bg-success/10 text-success
Warning: bg-warning/10 text-warning
Destructive: bg-destructive/10 text-destructive
Info: bg-info/10 text-info
Muted: bg-muted text-muted-foreground
```

### Icon Container (dentro de cards)
```tsx
// Padrão
<div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
  <Icon className="h-6 w-6" />
</div>

// Dentro de list items (smaller)
<div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center border border-border shadow-sm text-primary">
  <Icon className="h-4 w-4" />
</div>
```

---

## 📄 PADRÕES DE PÁGINAS

### Marketplace/Demands View Pattern
```tsx
<div className="space-y-8">
  {/* Header */}
  <BloomSectionHeader title="Explorar Profissionais" desc="..." />
  
  {/* Filters */}
  <div className="bg-card p-8 rounded-3xl border border-border shadow-card">
    {/* Filter inputs */}
  </div>
  
  {/* Grid de Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(item => (
      <div className="bg-card rounded-3xl p-7 border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group">
        {/* Content */}
      </div>
    ))}
  </div>
</div>
```

### Payments View Pattern
```tsx
<div className="space-y-10">
  {/* Header */}
  <BloomSectionHeader title="Finanças & Pagamentos" desc="..." />
  
  {/* Stats - 3 columns */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    <StatBlock ... />
    <StatBlock ... />
    <StatBlock ... />
  </div>
  
  {/* List in DocCard */}
  <section className="space-y-4">
    <h4 className="...">Histórico</h4>
    <div className="bg-card p-8 rounded-3xl border border-border shadow-card">
      <div className="space-y-3">
        {items.map(item => (
          <div className="flex items-center justify-between p-5 bg-secondary rounded-2xl border border-border/50">
            {/* Item content */}
          </div>
        ))}
      </div>
    </div>
  </section>
</div>
```

### Proposals/List View Pattern
```tsx
<div className="space-y-8">
  <BloomSectionHeader title="As Minhas Propostas" desc="..." />
  
  <div className="grid grid-cols-1 gap-4">
    {proposals.map(prop => (
      <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group hover:border-primary/30 transition-all">
        {/* Left side: image + info */}
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-secondary overflow-hidden ring-4 ring-secondary shrink-0">
            <img src="..." />
          </div>
          <div>
            <h4 className="text-lg font-display font-black text-foreground uppercase">Mariana Costa</h4>
            <p className="text-sm font-medium text-muted-foreground">Enfermeira Especialista • Apoio Pós-Operatório</p>
          </div>
        </div>
        
        {/* Right side: value + actions */}
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-display font-bold text-muted-foreground/50 uppercase tracking-widest">Valor</p>
            <p className="text-2xl font-display font-black text-foreground tracking-tighter">450€</p>
          </div>
          <Button variant="dark" size="sm">Ver Detalhes</Button>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 🎬 ANIMAÇÕES

### Entrada de Página
```tsx
className="animate-fade-in"
// opacity: 0 → 1, 0.5s
```

### Movimento Vertical
```tsx
className="animate-slide-up"
// translateY(10px) → 0, opacity: 0 → 1, 0.5s
```

### Scale Suave
```tsx
className="group-hover:scale-110 transition-transform"
// Icon scale on parent hover
```

### Transições Padrão
```tsx
// Cards on hover
className="transition-all duration-200"

// Shadow transitions
className="hover:shadow-elevated transition-all"

// Border transitions
className="hover:border-primary/30 transition-all"
```

### Estados de Carregamento
```
Loading spinner: animate-spin
Pulse soft: animate-pulse-soft (com delay para stagger)
Shimmer: animate-shimmer (gradient shimmer)
```

---

## 📋 FORMULÁRIOS

### Input Padrão
```tsx
<div className="space-y-2">
  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
    Label
  </label>
  <input 
    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground" 
    placeholder="Placeholder" 
  />
</div>
```

### Input com Icon (esquerda)
```tsx
<div className="space-y-2">
  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
    Email
  </label>
  <div className="relative">
    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <input 
      className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" 
      placeholder="email@example.com" 
    />
  </div>
</div>
```

### Input com Icon (direita - toggle visibility)
```tsx
<div className="relative">
  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <input 
    type={showPassword ? 'text' : 'password'} 
    className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-11 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" 
  />
  <button 
    onClick={() => setShowPassword(!showPassword)} 
    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
  >
    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
  </button>
</div>
```

### Textarea
```tsx
<textarea 
  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground" 
  rows={4} 
  placeholder="Descreva..." 
/>
```

### Select/Dropdown
```tsx
<div className="relative">
  <select className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-foreground cursor-pointer">
    <option>Opção 1</option>
    <option>Opção 2</option>
  </select>
  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">▾</div>
</div>
```

### Checkbox
```tsx
<label className="flex items-center gap-3 cursor-pointer group">
  <div className="w-5 h-5 rounded-md border-2 border-border group-hover:border-primary flex items-center justify-center transition-all">
    <Check size={12} className="text-primary-foreground" />
  </div>
  <span className="text-sm font-medium text-foreground">Label</span>
</label>
```

### Radio Button
```tsx
<label className="flex items-center gap-3 cursor-pointer group">
  <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary flex items-center justify-center transition-all">
    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
  </div>
  <span className="text-sm font-medium text-foreground">Label</span>
</label>
```

### Toggle/Switch
```tsx
<button
  className={`w-12 h-7 rounded-full transition-all relative ${state ? 'bg-primary' : 'bg-border'}`}
>
  <div className={`w-5 h-5 rounded-full bg-card shadow-sm absolute top-1 transition-all ${state ? 'left-6' : 'left-1'}`} />
</button>
```

### Input com Erro
```tsx
<div className="space-y-2">
  <label className="text-xs font-display font-bold text-destructive uppercase tracking-widest">
    Campo Obrigatório
  </label>
  <input 
    className="w-full bg-secondary border-2 border-destructive rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-destructive/20 transition-all text-foreground" 
  />
  <p className="text-xs text-destructive font-medium">Mensagem de erro</p>
</div>
```

### Input Disabled
```tsx
<input 
  disabled 
  className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none text-muted-foreground cursor-not-allowed opacity-60" 
/>
```

---

## 🔔 FEEDBACK & ALERTS

### Alert Banner (Success)
```tsx
<div className="flex items-start gap-4 p-5 bg-success/5 border border-success/20 rounded-2xl">
  <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
  <div className="flex-1">
    <p className="font-display font-bold text-foreground text-sm">Título</p>
    <p className="text-xs text-muted-foreground mt-1">Descrição</p>
  </div>
  <button onClick={...} className="text-muted-foreground hover:text-foreground">
    <X size={16} />
  </button>
</div>
```

### Padrão para Outras Cores
```
Success: bg-success/5 border border-success/20 text-success
Error: bg-destructive/5 border border-destructive/20 text-destructive
Warning: bg-warning/5 border border-warning/20 text-warning
Info: bg-info/5 border border-info/20 text-info
```

### Empty State
```tsx
<div className="text-center py-12 max-w-sm mx-auto">
  <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
    <Icon size={28} className="text-muted-foreground" />
  </div>
  <h4 className="font-display font-bold text-foreground text-lg mb-2">Sem notificações</h4>
  <p className="text-sm text-muted-foreground mb-6">Descrição</p>
  <Button variant="default" size="sm">Ação</Button>
</div>
```

### Progress Bar
```tsx
<div className="space-y-2">
  <div className="flex justify-between items-center">
    <span className="text-xs font-display font-bold text-foreground">Label</span>
    <span className="text-xs font-display font-bold text-muted-foreground">85%</span>
  </div>
  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: '85%' }} />
  </div>
</div>
```

### Loading States
```
Spinner: <Loader2 className="animate-spin text-primary" />
Dots: 3 dots com animate-pulse-soft e animation-delay
Shimmer: gradient animation across container
Skeleton: bg-secondary animate-pulse-soft
```

---

## 📊 TABELAS & DADOS

### Data Table
```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-border/50">
      <th className="text-left px-6 py-4 text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Coluna</th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-primary/5 border-b border-border/50">
      <td className="px-6 py-4 text-sm font-medium text-foreground">Dados</td>
    </tr>
  </tbody>
</table>
```

### List Item (Horizontal Card)
```tsx
<div className="flex items-center justify-between p-5 bg-secondary rounded-2xl border border-border/50">
  {/* Left: Avatar + Info */}
  <div className="flex items-center gap-4">
    <div className="w-11 h-11 rounded-2xl bg-card overflow-hidden">
      <img src="..." />
    </div>
    <div>
      <p className="text-sm font-display font-bold text-foreground">Title</p>
      <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-widest">Subtitle</p>
    </div>
  </div>
  
  {/* Right: Value + Action */}
  <div className="flex items-center gap-4">
    <div className="text-right">
      <p className="text-sm font-display font-black text-success">+€250</p>
      <p className="text-[9px] font-display font-bold text-success uppercase">Libertado</p>
    </div>
    <button className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary">
      <ChevronRight size={16} />
    </button>
  </div>
</div>
```

### Timeline/Steps
```tsx
<div className="flex items-center justify-between max-w-lg mx-auto">
  {steps.map((step, i) => (
    <React.Fragment key={step}>
      <div className="flex flex-col items-center gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold transition-all ${
          i <= current ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground border border-border'
        }`}>
          {i <= current ? '✓' : i + 1}
        </div>
        <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${i <= current ? 'text-primary' : 'text-muted-foreground'}`}>
          {step}
        </span>
      </div>
      {i < steps.length - 1 && (
        <div className={`flex-1 h-0.5 mx-2 mb-6 rounded-full ${i < current ? 'bg-primary' : 'bg-border'}`} />
      )}
    </React.Fragment>
  ))}
</div>
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Por Página

#### [ ] Demands/Marketplace
- [ ] SectionHeader com título + descrição
- [ ] Filter card com bg-card p-8
- [ ] Grid de cards com `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- [ ] Cada card: `bg-card rounded-3xl p-7 border shadow-card hover:shadow-elevated`
- [ ] Skill tags: `text-[9px] border border-border rounded-lg`
- [ ] Stats row na base: flex com icons + números
- [ ] Hover transitions: `hover:border-primary/30 transition-all`

#### [ ] Payments
- [ ] SectionHeader
- [ ] 3 StatBlocks em grid: `grid-cols-1 md:grid-cols-3 gap-5`
- [ ] DocCard com seção de histórico
- [ ] Items dentro: `p-5 bg-secondary rounded-2xl border border-border/50`
- [ ] Valores grandes: `text-lg font-display font-black`
- [ ] Status badges coloridas

#### [ ] Interviews/Proposals
- [ ] SectionHeader
- [ ] Cards em layout horizontal: `flex flex-col md:flex-row items-start md:items-center`
- [ ] Imagem + info à esquerda
- [ ] Data + ação à direita
- [ ] Hover states com shadow elevation
- [ ] Badges de status

#### [ ] Dashboard
- [ ] SectionHeader + welcome
- [ ] 4 StatBlocks: `grid-cols-2 md:grid-cols-4 gap-5`
- [ ] Quick actions: cards menores com ícones
- [ ] Benefits grid: `grid-cols-2 gap-3`
- [ ] Recent activity list: items dentro de card

#### [ ] Formulários
- [ ] Labels: `text-xs font-display font-bold uppercase tracking-widest`
- [ ] Inputs: `bg-secondary border border-border rounded-2xl px-4 py-3`
- [ ] Focus states: `focus:ring-2 focus:ring-primary/20 focus:border-primary`
- [ ] Icons bem posicionados (left/right)
- [ ] Error states: `border-2 border-destructive`
- [ ] Helper text: `text-xs text-muted-foreground`

---

## 🚀 PRÓXIMOS PASSOS

1. **Aplicar este guia em CADA página**
2. **Testar visuais contra https://bloom-elements.lovable.app/**
3. **Garantir 100% de fidelidade aos padrões**
4. **Revisar responsividade em mobile/tablet/desktop**
5. **Testar todos os hover states e transições**
6. **Verificar accessibility (contraste, focus states)**

---

**Documento criado**: 2024
**Último atualizado**: $(date)
**Referência**: https://github.com/isanat/bloom-elements
