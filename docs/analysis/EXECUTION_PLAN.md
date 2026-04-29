# Plano de Ação - Correção Profile Pages
## Baseado em Auditoria Completa do Repositório

**Data:** 29 de abril de 2026  
**Status:** Ready to Execute  
**Risco:** BAIXO (código limpo, sem TODOs, bem documentado)

---

## 🔍 O Que a Auditoria Encontrou

### ✅ Código LIMPO (Sem Problemas Óbvios)
- ✅ Sem TODO/FIXME comments
- ✅ Sem arquivos duplicados (v2, old, backup)
- ✅ Sem código abandonado (exceto 1 placeholder)
- ✅ Código está em estado estável

### ⚠️ Problemas Identificados
1. **Monolítico:** profile/page.tsx (1544 linhas) + setup/page.tsx (752 linhas)
2. **Duplicate Constants:** SERVICE_TYPES em 3 arquivos:
   - `/src/app/app/profile/page.tsx` (linha 62)
   - `/src/app/app/profile/setup/page.tsx`
   - `/src/app/app/family/demands/new/page.tsx`
3. **Unused Code:** BloomProfileModal.tsx (não é usado em lugar nenhum)
4. **Testes Incompletos:** Apenas GET testado, PUT não testado
5. **Design Tokens Parcial:** Importados mas não totalmente aplicados (commit e92f09d)

### 📊 Tentativas Anteriores (Por que falharam?)
1. **Commit e92f09d** - "refactor: apply Bloom design tokens"
   - ✗ Falhou porque: Design tokens importados mas CSS não atualizado
   - ✗ Deixou aplicação meio-caminho
   
2. **Commits a660eb1/0540a69** - AppShell wrappers
   - ✗ Falhou porque: Ciclo adicionar/remover sem resolver raiz
   - ✗ Não resolveu o problema arquitetural
   
3. **Commit 277dc08** - "Fix family account bugs"
   - ✓ Funcionou para bugs específicos
   - ✗ Não tocou na estrutura de profile

---

## 🎯 PLANO EM 3 FASES (ZERO RISCO)

### **FASE 0: LIMPEZA (1 dia) - ANTES DE QUALQUER COISA**

#### Task 0.1: Remove Unused Component
**Arquivo:** `src/components/bloom-custom/BloomProfileModal.tsx`

```bash
# Verificar se é realmente usado
grep -r "BloomProfileModal" /home/user/careapp/src --include="*.tsx"
# Resultado esperado: Apenas export em index.ts, nenhum import real

# Ação:
# 1. Deletar: src/components/bloom-custom/BloomProfileModal.tsx
# 2. Remover export de: src/components/bloom-custom/index.ts
# 3. npm run build - Verificar se compila sem erros
# 4. Commit: "Remove unused BloomProfileModal placeholder component"
```

**Status:** ✓ Seguro deletar

---

#### Task 0.2: Centralize Duplicate Constants
**Problema:** SERVICE_TYPES definido em 3 lugares (código duplicado)

```bash
# 1. Verificar o que está em cada lugar:
grep -A 15 "const SERVICE_TYPES = \[" /src/app/app/profile/page.tsx
grep -A 15 "const SERVICE_TYPES = \[" /src/app/app/profile/setup/page.tsx
grep -A 15 "const SERVICE_TYPES = \[" /src/app/app/family/demands/new/page.tsx

# 2. Comparar se são idênticas
# 3. Se forem, mover para: src/lib/constants.ts
# 4. Importar de lá em todos os 3 arquivos
# 5. npm run build - Verificar
# 6. npm run test - Se houver testes
# 7. Commit: "Centralize SERVICE_TYPES constant to avoid duplication"
```

**Impacto:** Zero - apenas reorganização

---

#### Task 0.3: Verify API & Data Flow
**Arquivo:** `src/app/api/user/profile/route.ts`

Analisar como o endpoint atual funciona:
```bash
# Verificar:
grep -n "GET\|PUT\|POST\|DELETE" /src/app/api/user/profile/route.ts

# Esperado encontrar:
# - GET: Retorna profile completo (User + ProfileFamily + ProfileCaregiver)
# - PUT: Atualiza os campos

# Documentar:
# - Quais campos cada role pode editar
# - Quais validações existem
# - Como funciona o INSERT OR IGNORE
```

**Por que?** Antes de criar nova estrutura, entender exatamente o que existe.

---

#### Task 0.4: Analyze Previous Bloom Design Token Attempt
**Commit:** e92f09d

```bash
git show e92f09d -- src/app/app/profile/page.tsx | head -100
git show e92f09d -- src/lib/design-tokens.ts

# Perguntas a responder:
# 1. Quais tokens foram importados?
# 2. Quais foram aplicados?
# 3. Por que ficou incompleto?
# 4. O que faltava para completar?
```

**Por que?** Não repetir o mesmo erro.

---

## **FASE 1: SEPARAÇÃO DE RESPONSABILIDADES (3-5 dias)**

### Objetivo
Transformar o arquivo monolítico em componentes menores, mas MANTENDO a mesma funcionalidade.

### Task 1.1: Extract Constants to Modules
```
src/lib/profile-constants.ts (NOVO)
├── SERVICE_TYPES (centralizado)
├── DOCUMENT_TYPES (extraído de profile/page.tsx)
├── MEDICAL_CONDITIONS
├── LANGUAGES
└── FORM_DEFAULTS
```

**Código:**
```tsx
// src/lib/profile-constants.ts
export const SERVICE_TYPES = [
  { id: "PERSONAL_CARE", label: "Cuidados Pessoais" },
  // ...
];

export const DOCUMENT_TYPES = [
  { id: "CC", label: "Cartão de Cidadão", placeholder: "12345678 1 ZZ2", maxLength: 15 },
  // ...
];

// ... outros
```

**Como validar:**
```bash
# Depois de criar o arquivo:
# 1. Importar em todos os 3 arquivos que usam SERVICE_TYPES
# 2. npm run build - Deve compilar
# 3. Verificar que não quebrou nada
```

---

### Task 1.2: Extract Utility Functions
```
src/lib/profile-utils.ts (NOVO)
├── parseElderNeeds(raw: string)
├── validateNIF(nif: string)
├── formatPhonePT(value: string)
└── outras funções de validação
```

**Código:**
```tsx
// src/lib/profile-utils.ts
export function validateNIF(nif: string): boolean {
  // Código existente em profile/page.tsx linhas 146-155
}

export function formatPhonePT(value: string): string {
  // Código existente em profile/page.tsx linhas 157-169
}

// ... etc
```

---

### Task 1.3: Extract Profile Type Definitions
```
src/types/profile.ts (CRIAR/ATUALIZAR)
├── ProfileData interface (já existe em profile/page.tsx)
├── CaregiverProfileData (NOVO - especializado)
└── FamilyProfileData (NOVO - especializado)
```

---

## **FASE 2: CRIAR COMPONENTES SEPARADOS (5-7 dias)**

### IMPORTANTE: Não deletar profile/page.tsx ainda!

Criar em paralelo:
```
src/app/app/profile/
├── page.tsx (MANTÉM FUNCIONANDO)
├── components/ (NOVO)
│   ├── caregiver-profile.tsx
│   ├── family-profile.tsx
│   ├── profile-header.tsx
│   ├── metrics-block.tsx
│   ├── info-tab.tsx
│   ├── docs-tab.tsx
│   ├── services-tab.tsx (caregiver only)
│   ├── familiar-tab.tsx (family only)
│   ├── contact-tab.tsx
│   └── config-tab.tsx
└── hooks/ (NOVO)
    └── useProfileForm.ts
```

### Task 2.1: Create CaregiverProfile Component
**Arquivo:** `src/app/app/profile/components/caregiver-profile.tsx`

**Copiar de:** `/src/app/app/profile/page.tsx` - tudo que tem `if (isCaregiver)`

**Estrutura:**
```tsx
export function CaregiverProfile() {
  const { profile, isLoading, isSaving, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  
  // TODO: Implementar apenas lógica CAREGIVER
  return (
    <div>
      <ProfileHeader role="CAREGIVER" />
      <MetricsBlock role="CAREGIVER" />
      <CaregiverTabs />
    </div>
  );
}
```

---

### Task 2.2: Create FamilyProfile Component
**Similar ao Task 2.1, mas para Family role**

---

### Task 2.3: Update Main Profile Page (AINDA SEM QUEBRAR)
```tsx
// src/app/app/profile/page.tsx (ATUALIZAR, não deletar)

import CaregiverProfile from './components/caregiver-profile';
import FamilyProfile from './components/family-profile';

export default function ProfilePage() {
  const { session } = useSession();
  const isCaregiver = session?.user?.role === "CAREGIVER";
  
  return isCaregiver ? <CaregiverProfile /> : <FamilyProfile />;
}
```

---

## **FASE 3: APLICAR DESIGN TOKENS (3-5 dias)**

### Task 3.1: Complete Bloom Design Token Application
**De:** Commit e92f09d (incomplete)  
**Para:** Aplicação 100%

```tsx
// Aplicar em:
- ProfileHeader - hero section, avatar, badges
- MetricsBlock - card styling, icons, spacing
- Tabs - consistent styling
- Forms - input, textarea styling
- Buttons - consistent button styling
```

**Tokens a aplicar:**
```tsx
import { tokens, cn, getCardClasses, getHeadingClasses } from "@/lib/design-tokens";

// Usar:
- tokens.layout.grid.responsive4
- tokens.colors.badges
- getHeadingClasses("pageTitle")
- getCardClasses()
- cn() para combinações
```

---

### Task 3.2: Responsive Design
Verificar em breakpoints:
- Mobile (320px)
- Tablet (768px)
- Desktop (1920px)

---

## **FASE 4: TESTES (2-3 dias)**

### Task 4.1: Complete API Tests
**Arquivo:** `src/app/api/__tests__/user-profile.test.ts`

Adicionar testes PUT:
```typescript
describe("PUT /api/user/profile", () => {
  test("should update caregiver profile", () => {});
  test("should update family profile", () => {});
  test("should validate required fields", () => {});
  test("should handle role-specific updates", () => {});
});
```

---

### Task 4.2: Component Tests
Criar testes para componentes novos.

---

## 📋 CHECKLIST EXECUÇÃO

### Dia 1 (FASE 0)
- [ ] Remove BloomProfileModal (Arquivo + export)
- [ ] npm run build ✓
- [ ] Commit & Push

- [ ] Centralize SERVICE_TYPES
- [ ] npm run build ✓
- [ ] Commit & Push

- [ ] Verify API & Data Flow (documentação)
- [ ] Analyze previous Bloom attempt

### Dias 2-5 (FASE 1)
- [ ] Create profile-constants.ts
- [ ] npm run build ✓
- [ ] Create profile-utils.ts
- [ ] Update profile.ts types
- [ ] Commits incrementais

### Dias 6-12 (FASE 2)
- [ ] Create CaregiverProfile component
- [ ] npm run build ✓
- [ ] Create FamilyProfile component
- [ ] npm run build ✓
- [ ] Update page.tsx (router only)
- [ ] Test em navegador
- [ ] Commits incrementais

### Dias 13-17 (FASE 3)
- [ ] Apply design tokens completamente
- [ ] npm run build ✓
- [ ] Responsive testing
- [ ] Commit

### Dias 18-20 (FASE 4)
- [ ] Complete API tests
- [ ] npm run test ✓
- [ ] Component tests
- [ ] Final commit

---

## 🚀 COMEÇAR AGORA

**Recomendo começar por:** Task 0.1 (Remove BloomProfileModal)

Por que?
1. ✅ Risco ZERO (código não usado)
2. ✅ Fácil de validar (grep)
3. ✅ Fácil de revert se der algo errado
4. ✅ Limpa a base para próximos passos
5. ✅ Toma ~15 minutos

Depois: Task 0.2 (Centralizar SERVICE_TYPES)

**Quer que eu comece?**

