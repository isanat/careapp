# IdosoLink Design System

## 🎯 Visão Geral

O Design System do **IdosoLink** foi criado para uma plataforma de cuidados de idosos, com foco em **saúde, bem-estar, confiança e profissionalismo**.

### ⚠️ Importante

**NÃO é uma estética fintech, trading ou crypto especulativo.**

O design transmite:
- Calor humano e acolhimento
- Confiança e segurança
- Profissionalismo sem frieza
- Acessibilidade para idosos

---

## 🎨 Paleta de Cores

### Cores Principais

| Nome | Hex | Uso |
|------|-----|-----|
| **Primary** | `#2F6F6D` | Teal - Confiança, saúde, calma |
| **Secondary** | `#6FA8A3` | Teal claro - Ações secundárias |
| **Accent** | `#A8DADC` | Cian suave - Destaques sutis |
| **Warm** | `#F1C27D` | Dourado quente - Cuidado, acolhimento |

### Cores de Base

| Nome | Hex | Uso |
|------|-----|-----|
| **Background** | `#F7FAF9` | Fundo principal |
| **Surface** | `#FFFFFF` | Cartões, modais |
| **Text Primary** | `#1F2933` | Texto principal |
| **Text Secondary** | `#6B7280` | Texto secundário |

### Cores Semânticas

| Nome | Hex | Uso |
|------|-----|-----|
| **Success** | `#5B9A6F` | Verde suave - Sucesso, confirmação |
| **Warning** | `#E8A65D` | Laranja suave - Atenção |
| **Error** | `#C96B6B` | Vermelho suave - Erro |

---

## 📝 Tipografia

### Fontes

- **Headings**: Poppins - Moderna, legível, amigável
- **Body**: Inter - Alta legibilidade, otimizada para telas

### Tamanhos (Acessibilidade)

O tamanho base é **17px** (maior que o padrão 16px) para melhor legibilidade em usuários idosos.

```css
--font-size-base: 17px;
--font-size-lg: 19px;
--font-size-xl: 22px;
--font-size-2xl: 26px;
--font-size-3xl: 32px;
--font-size-4xl: 40px;
```

---

## 🔲 Border Radius

Bordas arredondadas transmitem **amigabilidade e acessibilidade**:

```css
--radius-sm: 6px;    /* Sutil */
--radius-md: 10px;   /* Padrão */
--radius-lg: 14px;   /* Cards */
--radius-xl: 18px;   /* Elementos maiores */
--radius-2xl: 24px;  /* Modais */
--radius-3xl: 32px;  /* Feature cards */
```

---

## 🌑 Sem Dark Mode

**Intencionalmente não implementamos dark mode.**

Razões:
1. Melhor legibilidade para idosos
2. Menos confusão visual
3. Consistência de cores
4. Contraste otimizado para o tema claro

---

## 📦 Componentes

### Button

```tsx
import { Button } from "@/components/ui-kit";

// Variantes
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="warm">Warm</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Estados
<Button loading>Carregando</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui-kit";

<Card variant="default|info|warning|success|error|elevated|outline">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
```

### Alert

```tsx
import { Alert } from "@/components/ui-kit";

<Alert variant="info|success|warning|error" title="Título">
  Mensagem do alerta
</Alert>
```

### Badge

```tsx
import { Badge, StatusBadge } from "@/components/ui-kit";

<Badge variant="default|success|warning|error">Texto</Badge>
<Badge dot>Com indicador</Badge>
<StatusBadge status="active|pending|completed|cancelled" />
```

### Input

```tsx
import { Input, Textarea, Select } from "@/components/ui-kit";

<Input label="Nome" placeholder="Digite..." error="Erro" hint="Dica" />
<Textarea label="Descrição" />
<Select label="Opção" options={[{ value: "1", label: "Um" }]} />
```

### Modal

```tsx
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui-kit";

// Ou use os modais prontos:
import { ActivationModal, PaymentModal, TipModal } from "@/components/ui-kit";

<ActivationModal open={open} onOpenChange={setOpen} onConfirm={handleConfirm} />
<TipModal open={open} onOpenChange={setOpen} caregiverName="Maria" onConfirm={handleTip} />
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui-kit";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Conteúdo 1</TabsContent>
  <TabsContent value="tab2">Conteúdo 2</TabsContent>
</Tabs>
```

### BottomNav

```tsx
import { BottomNav } from "@/components/ui-kit";

<BottomNav items={[
  { href: "/home", label: "Home", icon: <Icon /> },
  { href: "/wallet", label: "Carteira", icon: <Icon />, badge: 3 },
]} />
```

---

## 🎭 Ícones

Ícones SVG próprios com estilo **rounded, line icons, stroke médio**:

```tsx
import { 
  IconHealthCare,
  IconHealthFamily,
  IconHealthCaregiver,
  IconHealthContract,
  IconHealthWallet,
  IconHealthToken,
  IconHealthReputation,
  IconHealthSchedule,
  IconHealthPayment,
  IconHealthBurn,
  IconHealthSupport,
  IconHealthTrust,
} from "@/components/icons/health-icons";
```

---

## ♿ Acessibilidade

### Touch Targets

- **Mínimo**: 44x44px (WCAG 2.1)
- **Recomendado**: 48x48px para idosos

### Contraste

- Todos os textos seguem WCAG AA
- Texto principal: ratio 7:1+
- Texto secundário: ratio 4.5:1+

### Focus Indicators

- Outline visível em todos os elementos interativos
- Ring color: Primary (#2F6F6D)
- Ring width: 2px

### Keyboard Navigation

- Todos os componentes são navegáveis por teclado
- Focus trap em modais
- Skip links implementados

---

## 📱 Mobile First

O design system é **mobile-first**:

1. Bottom navigation para navegação principal
2. Touch targets otimizados
3. Gestos suportados
4. Responsivo em todos os breakpoints

---

## 🚀 Uso

### Importação

```tsx
// Importar componentes individuais
import { Button } from "@/components/ui-kit/button";
import { Card } from "@/components/ui-kit/card";

// Ou importar tudo
import { Button, Card, Alert, Badge } from "@/components/ui-kit";
```

### Design Tokens

```tsx
import { colors, typography, spacing, radius } from "@/lib/design-tokens";

// Usar tokens
const primaryColor = colors.primary.DEFAULT; // #2F6F6D
const largeText = typography.fontSize['2xl']; // 26px
```

---

## 📄 Página de Demonstração

Acesse `/ui-kit` para ver todos os componentes em ação.

---

## 🤝 Contribuição

Ao adicionar novos componentes, siga:

1. Use a paleta de cores definida
2. Mantenha touch targets de 44px+
3. Não use efeitos neon/glow
4. Priorize espaçamento generoso
5. Teste com usuários idosos quando possível

---

**IdosoLink Design System** - *Care, Trust & Value*
