# Bloom Elements Form Components Guide

Este documento descreve todos os componentes de formulário refatorados para seguir 100% os padrões Bloom Elements.

## Design System Colors
- `primary` - Cor principal (azul/destaque)
- `secondary` - Cores de fundo suave
- `success` - Verde para sucesso
- `warning` - Amarelo para avisos
- `destructive` - Vermelho para erros
- `info` - Azul claro para informações
- `muted-foreground` - Texto desabilitado/secundário
- `border` - Bordas
- `card` - Fundo de card/elemento
- `foreground` - Texto principal

## Componentes Refatorados

### 1. TextInput (`text-input.tsx`)
Input de texto simples com suporte a label, hint e erro.

**Props:**
- `label?: string` - Label do input
- `hint?: string` - Texto de ajuda (mostrado apenas sem erro)
- `error?: boolean` - Estado de erro
- `type?: string` - Tipo de input (text, email, password, etc)
- Herda todas as props do `HTMLInputElement`

**Styling:**
- Base: `bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium`
- Label: `text-xs font-display font-bold uppercase tracking-widest mb-2 block`
- Focus: `focus:ring-2 focus:ring-primary/20 focus:border-primary`
- Error: `border-2 border-destructive bg-destructive/5`
- Disabled: `opacity-60 cursor-not-allowed`
- Placeholder: `placeholder:text-muted-foreground`
- Transição suave: `transition-all duration-200 ease-out`
- Hover: `hover:border-primary/40`

**Exemplo:**
```tsx
<TextInput
  label="Email"
  type="email"
  placeholder="seu@email.com"
  hint="Usaremos para login e comunicações"
/>

<TextInput
  label="Senha"
  type="password"
  error={true}
  placeholder="Digite sua senha"
/>
```

---

### 2. Textarea (`textarea.tsx`)
Área de texto multi-linha com os mesmos recursos do TextInput.

**Props:**
- `label?: string` - Label do textarea
- `hint?: string` - Texto de ajuda
- `error?: boolean` - Estado de erro
- `resizable?: "none" | "vertical" | "both"` - Controla redimensionamento
- Herda todas as props do `HTMLTextAreaElement`

**Styling:**
- Mesmo que TextInput
- Min-height: `min-h-[120px]`
- Resize: `resize-vertical` (padrão)
- Transição suave: `transition-all duration-200 ease-out`

**Exemplo:**
```tsx
<Textarea
  label="Descrição"
  hint="Máximo 500 caracteres"
  placeholder="Descreva o serviço..."
  resizable="vertical"
/>
```

---

### 3. Select (`select.tsx`)
Dropdown/seletor com rótulo, ícone chevron e estados.

**Props:**
- `label?: string` - Label do select
- `error?: boolean` - Estado de erro
- Usa composição Radix UI

**Componentes:**
- `SelectTrigger` - Botão que dispara o dropdown
- `SelectContent` - Container do dropdown
- `SelectItem` - Opção individual
- `SelectGroup` - Grupo de opções
- `SelectLabel` - Label de grupo

**Styling:**
- Trigger: `bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium`
- Focus: `focus:ring-2 focus:ring-primary/20 focus:border-primary`
- Content: `rounded-2xl border border-border bg-card shadow-elevated`
- Item: `rounded-lg py-2.5 pl-8 pr-2 text-sm font-medium` com hover e focus
- Transição: `transition-all duration-200 ease-out` e `transition-colors duration-150 ease-out`

**Exemplo:**
```tsx
<Select>
  <SelectTrigger label="Tipo de Serviço">
    <SelectValue placeholder="Escolha um tipo..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="nurse">Enfermeira</SelectItem>
    <SelectItem value="care">Cuidador</SelectItem>
    <SelectItem value="therapy">Terapeuta</SelectItem>
  </SelectContent>
</Select>
```

---

### 4. Checkbox (`checkbox.tsx`)
Caixa de seleção com ícone check e estados.

**Props:**
- Herda todas as props do `CheckboxPrimitive.Root`
- `checked?: boolean` - Estado controlado
- `disabled?: boolean` - Desabilitado

**Styling:**
- Size: `h-5 w-5`
- Border: `border-2 border-border` com `group-hover:border-primary/60`
- Checked: `bg-primary border-primary`
- Icon: Check de lucide-react
- Focus: `focus:ring-2 focus:ring-primary/20`
- Disabled: `disabled:opacity-60 disabled:cursor-not-allowed`
- Transição: `transition-all duration-200 ease-out`

**Exemplo:**
```tsx
<div className="flex items-center gap-2 group">
  <Checkbox id="accept" />
  <label htmlFor="accept" className="text-sm cursor-pointer">
    Aceito os termos de serviço
  </label>
</div>
```

---

### 5. RadioGroup & RadioGroupItem (`radio.tsx`)
Grupo de rádio com ícone de seleção (dot) interna.

**Props:**
- `RadioGroup` - Container do grupo
- `RadioGroupItem` - Item individual

**Styling:**
- Size: `h-5 w-5`
- Border: `border-2 border-border`
- Checked: `border-primary bg-white`
- Inner dot: `w-2.5 h-2.5 rounded-full bg-primary`
- Focus: `focus:ring-2 focus:ring-primary/20`
- Hover: `hover:border-primary/40`
- Transição: `transition-all duration-200 ease-out`

**Exemplo:**
```tsx
<RadioGroup defaultValue="option1">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option1" id="option1" />
    <label htmlFor="option1" className="text-sm cursor-pointer">Opção 1</label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option2" id="option2" />
    <label htmlFor="option2" className="text-sm cursor-pointer">Opção 2</label>
  </div>
</RadioGroup>
```

---

### 6. ToggleSwitch (`toggle.tsx`)
Switch/Toggle com animação suave de transição.

**Props:**
- `checked?: boolean` - Estado controlado
- `disabled?: boolean` - Desabilitado
- Usa `SwitchPrimitive` do Radix UI

**Styling:**
- Size: `w-12 h-7` (base) com thumb `w-5 h-5`
- Inactive: `bg-border`
- Active: `bg-primary`
- Thumb: `bg-card shadow-sm rounded-full`
- Thumb position: `data-[state=checked]:translate-x-5`
- Focus: `focus:ring-2 focus:ring-primary/20`
- Transição: `transition-all duration-200 ease-out`

**Exemplo:**
```tsx
<div className="flex items-center gap-3">
  <label htmlFor="notifications" className="text-sm font-medium">
    Notificações habilitadas
  </label>
  <ToggleSwitch id="notifications" />
</div>
```

---

### 7. Slider (`slider.tsx`)
Range input com track e thumb.

**Props:**
- `min?: number` - Valor mínimo
- `max?: number` - Valor máximo
- `step?: number` - Incremento
- `defaultValue?: number[]` - Valor padrão
- Herda props do `SliderPrimitive.Root`

**Styling:**
- Track: `h-2 rounded-full bg-secondary`
- Range (preenchida): `h-full bg-primary` com transição
- Thumb: `h-5 w-5 rounded-full bg-primary shadow-md`
- Focus: `focus:ring-2 focus:ring-primary/20`
- Hover: `hover:shadow-lg`
- Disabled: `disabled:opacity-60 disabled:bg-muted-foreground`
- Transição: `transition-all duration-200 ease-out`

**Exemplo:**
```tsx
<Slider
  defaultValue={[30]}
  min={0}
  max={100}
  step={1}
  className="w-full"
/>
```

---

### 8. FileUpload (`file-upload.tsx`)
Upload de arquivo com drag-and-drop e preview.

**Props:**
- `label?: string` - Label do input
- `description?: string` - Descrição do formato
- `icon?: React.ReactNode` - Ícone customizado
- `error?: boolean` - Estado de erro
- `errorMessage?: string` - Mensagem de erro
- `accept?: string` - Tipos MIME aceitos
- Herda props do `HTMLInputElement`

**Styling:**
- Container: `border-2 border-dashed border-border rounded-3xl p-10`
- Hover: `hover:border-primary/40 hover:bg-primary/5`
- Drag active: `border-primary bg-primary/10`
- Error: `border-destructive bg-destructive/5`
- Transição: `transition-all duration-200 ease-out`

**Exemplo:**
```tsx
<FileUpload
  label="Documento de Identidade"
  description="PNG, JPG até 5MB"
  accept="image/png,image/jpeg"
  icon={<Upload className="h-8 w-8" />}
/>
```

---

## Padrões Bloom 100% Implementados

### Transições
- Duração padrão: `duration-200` ou `duration-150`
- Easing: `ease-out`
- Propriedade: `transition-all`
- Exemplo: `transition-all duration-200 ease-out`

### Estados de Foco
- Padrão: `focus:ring-2 focus:ring-primary/20`
- Erro: `focus:ring-2 focus:ring-destructive/20`
- Todos os inputs e botões seguem este padrão

### Estados Hover
- Inputs: `hover:border-primary/40`
- Items de select: `hover:bg-primary/5`
- Padrão suave sem mudança brusca

### Estados Desabilitados
- Padrão: `disabled:opacity-60 disabled:cursor-not-allowed`
- Fundo: `disabled:bg-muted` ou `disabled:bg-muted-foreground`

### Arredondamento
- Inputs e textareas: `rounded-2xl`
- Checkboxes e RadioGroups: `rounded-lg`
- FileUpload: `rounded-3xl`
- Select dropdown: `rounded-2xl`

### Bordas
- Padrão: `border border-border`
- Erro: `border-2 border-destructive`
- Focus: Usa ring em vez de mudar border color

### Shadows
- Dropdown: `shadow-elevated`
- Slider thumb hover: `hover:shadow-lg`
- FileUpload: Nenhuma shadow (design limpo)

---

## Cores Utilizado

Todos os componentes usam o sistema de cores Bloom:
- **Primary**: Azul (acento principal)
- **Secondary**: Cinza claro (fundos)
- **Destructive**: Vermelho (erros)
- **Border**: Cinza médio (bordas)
- **Muted-foreground**: Texto secundário (dicas, placeholders)

---

## Acessibilidade

Todos os componentes mantêm:
- IDs únicos para labels (usando `React.useId()`)
- Atributos `htmlFor` apropriados
- Ordem de tabulação correta
- Estados focáveis via teclado
- Contraste adequado entre cores

---

## Estrutura de Componentes

```
src/components/ui/
├── text-input.tsx         ✓ Refatorado
├── textarea.tsx           ✓ Refatorado
├── select.tsx             ✓ Refatorado
├── checkbox.tsx           ✓ Refatorado
├── radio.tsx              ✓ Refatorado
├── toggle.tsx             ✓ Refatorado (com ToggleSwitch)
├── slider.tsx             ✓ Refatorado
└── file-upload.tsx        ✓ Refatorado
```

---

## Notas de Implementação

1. **Font Weight**: Todos os inputs usam `font-medium` para melhor legibilidade
2. **Transições**: Todas as mudanças de estado têm transições suaves
3. **Acessibilidade**: Labels ligadas via `htmlFor` e IDs únicos
4. **Composição**: Select e RadioGroup usam Radix UI para máxima flexibilidade
5. **Error States**: Diferenciados com border-2 e cor destructive
6. **Dicas (Hints)**: Mostradas apenas quando sem erro para não poluir

---

**Atualizado em:** 2026-04-13
**Versão:** 1.0.0 - 100% Bloom Elements
