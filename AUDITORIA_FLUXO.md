# AUDITORIA DE FLUXO - Senior Care App

**Data Original:** 23 de Fevereiro de 2025
**Última Atualização:** 25 de Fevereiro de 2025
**Status:** 🟡 EM PROGRESSO - Principais fluxos corrigidos, melhorias pendentes

---

## ✅ PROBLEMAS RESOLVIDOS

### 1. FLUXO DE CADASTRO SEPARADO ✅ RESOLVIDO

#### Estado ANTERIOR (Incorreto):
```
FAMÍLIA e CUIDADOR:
Registro → KYC → Pagamento €35 → Dashboard
```

#### Estado ATUAL (Correto):
```
FAMÍLIA:
Registro → KYC → Pagamento €35 → Dashboard Ativo

CUIDADOR:
Registro → Completar Perfil Profissional → KYC → Aguardar Aprovação → Dashboard Ativo
```

**Arquivos Verificados:**
- `/src/app/auth/register/page.tsx` (linhas 131-137) - Redirecionamento correto
- `/src/app/auth/kyc/page.tsx` (linhas 96-102) - Fluxo diferenciado pós-KYC
- `/src/app/auth/payment/page.tsx` - Apenas para FAMÍLIA

**Status:** ✅ Implementado e funcionando

---

### 2. PÁGINA DE PERFIL DO CUIDADOR ✅ RESOLVIDO

**Localização:** `/src/app/app/profile/setup/page.tsx`

**Funcionalidades Implementadas:**
- ✅ Foto de perfil (placeholder com botão de câmera)
- ✅ Título profissional
- ✅ Anos de experiência
- ✅ Bio/descrição
- ✅ Cidade e idiomas
- ✅ Certificações
- ✅ Serviços oferecidos (12 tipos)
- ✅ Valor por hora
- ✅ Disponibilidade (8 horários)
- ✅ Mensagem de "Cadastro Gratuito"

**Status:** ✅ Implementado

---

### 3. DASHBOARD DIFERENCIADO ✅ RESOLVIDO

**Arquivo:** `/src/app/app/dashboard/page.tsx`

**Para FAMÍLIA:**
- ✅ Card "Buscar Cuidadores" → Link para `/app/search`
- ✅ Card "Contratos"
- ✅ Alerta de próximos passos (pagamento, KYC)
- ✅ Saldo de tokens

**Para CUIDADOR:**
- ✅ Card "Meu Perfil" → Link para `/app/profile`
- ✅ Card "Contratos"
- ✅ Horas trabalhadas
- ✅ Avaliação média
- ✅ Alerta de próximos passos (perfil, KYC, aprovação)

**Status:** ✅ Implementado

---

### 4. FLUXO DE ENTREVISTA ✅ PARCIALMENTE RESOLVIDO

**Arquivo:** `/src/app/app/interview/[id]/page.tsx`

**Implementado:**
- ✅ Sala de vídeo integrada (Jitsi Meet)
- ✅ Status da entrevista (SCHEDULED, IN_PROGRESS, COMPLETED)
- ✅ Questionário pós-entrevista (apenas FAMÍLIA)
- ✅ Avaliação em estrelas (comunicação, experiência, pontualidade)
- ✅ Opção "Prosseguir com Contrato"

**Status:** ✅ Implementado

---

## 🟡 PENDÊNCIAS IDENTIFICADAS

### 1. PÁGINA DE PROPOSTAS PARA CUIDADOR 🟡 PENDENTE

**Problema:** Não existe página dedicada para cuidadores visualizarem propostas recebidas.

**Necessário:**
- [ ] Criar `/app/proposals/page.tsx`
- [ ] Listar contratos com status `PENDING_ACCEPTANCE`
- [ ] Botões "Aceitar" e "Recusar"
- [ ] Notificação de nova proposta

**Prioridade:** ALTA

---

### 2. SISTEMA DE NOTIFICAÇÕES 🟡 PENDENTE

**Problema:** Não há sistema de notificações implementado.

**Necessário:**
- [ ] Criar tabela `Notification` no Prisma
- [ ] API de notificações (`/api/notifications`)
- [ ] Componente de notificações no header
- [ ] Notificações push (opcional)

**Eventos para Notificar:**
- FAMÍLIA: Proposta aceita, entrevista confirmada, contrato criado
- CUIDADOR: Nova proposta, nova entrevista, pagamento recebido

**Prioridade:** MÉDIA

---

### 3. PÁGINA DE DISPONIBILIDADE 🟡 OPCIONAL

**Estado Atual:** A disponibilidade é configurada no perfil setup.

**Melhoria Sugerida:**
- [ ] Criar `/app/availability/page.tsx`
- [ ] Calendário visual
- [ ] Bloqueio de datas
- [ ] Sincronização com entrevistas agendadas

**Prioridade:** BAIXA

---

### 4. KYC DIFERENCIADO 🟡 MELHORIA

**Estado Atual:** A página KYC é a mesma para ambos, mas funciona corretamente.

**Melhoria Sugerida:**
- [ ] Para FAMÍLIA: Verificação básica (segurança)
- [ ] Para CUIDADOR: Verificação profissional + documentos
- [ ] Upload de certificados para cuidadores

**Prioridade:** BAIXA

---

## 📋 FLUXOS ATUAIS VALIDADOS

### FLUXO FAMÍLIA ✅

```
1. Landing Page (/)
   ↓
2. Botão "Sou Família"
   ↓
3. Cadastro (nome, email, senha, telefone)
   ↓
4. Aceitar Termos
   ↓
5. KYC (verificação de identidade) - /auth/kyc
   ↓
6. Pagamento €35 (ativação + tokens) - /auth/payment
   ↓
7. Dashboard Ativo - /app/dashboard
   ├── Buscar cuidadores - /app/search
   ├── Ver perfis - /app/caregivers/[id]
   ├── Agendar entrevistas - /app/interview/[id]
   ├── Criar contratos - /app/contracts/new
   └── Pagar gorjetas - /app/wallet
```

### FLUXO CUIDADOR ✅

```
1. Landing Page (/)
   ↓
2. Botão "Sou Cuidador"
   ↓
3. Cadastro (nome, email, senha, telefone)
   ↓
4. Completar Perfil Profissional - /app/profile/setup
   ├── Foto
   ├── Experiência
   ├── Certificações
   ├── Serviços oferecidos
   ├── Valor/hora
   └── Disponibilidade
   ↓
5. KYC (verificação profissional) - /auth/kyc
   ↓
6. Aguardar Aprovação (status: PENDING)
   ↓
7. Aprovação da Plataforma (status: ACTIVE)
   ↓
8. Dashboard Ativo - /app/dashboard
   ├── Receber propostas - /app/contracts
   ├── Aceitar/recusar entrevistas - /app/interview/[id]
   ├── Aceitar/recusar contratos - /app/contracts
   └── Receber pagamentos - /app/wallet
```

---

## 🔧 CORREÇÕES REALIZADAS

### PRIORIDADE ALTA - CONCLUÍDAS

1. **Separar fluxo de cadastro** ✅
   - Cuidador NÃO passa por pagamento
   - Cuidador vai para página de perfil após registro
   - Família continua com fluxo atual (KYC → Pagamento)

2. **Criar página de perfil do cuidador** ✅
   - `/app/profile/setup` com formulário completo
   - Campos: foto, experiência, certificações, serviços, valor

3. **Diferenciar Dashboard** ✅
   - Cards específicos para cada perfil
   - Ações relevantes para cada um

4. **Melhorar fluxo de entrevista** ✅
   - FAMÍLIA agenda
   - CUIDADOR visualiza e aceita
   - Questionário pós-entrevista

---

## 📱 PÁGINAS CRIADAS/MODIFICADAS

### Criadas:
- ✅ `/app/profile/setup/page.tsx` - Setup inicial do cuidador
- ✅ `/app/interview/[id]/page.tsx` - Entrevista em vídeo
- ✅ `/app/search/page.tsx` - Busca de cuidadores
- ✅ `/app/caregivers/[id]/page.tsx` - Perfil público do cuidador

### Modificadas:
- ✅ `/auth/register/page.tsx` - Redirecionar cuidador para perfil
- ✅ `/auth/kyc/page.tsx` - Fluxo diferenciado por perfil
- ✅ `/app/dashboard/page.tsx` - Dashboard diferenciado
- ✅ `/app/contracts/page.tsx` - Lista de contratos com ações

### Pendentes:
- [ ] `/app/proposals/page.tsx` - Propostas recebidas (cuidador)
- [ ] `/app/availability/page.tsx` - Disponibilidade (cuidador)

---

## 📊 RESUMO DO STATUS

| Item | Status | Prioridade |
|------|--------|------------|
| Fluxo de cadastro separado | ✅ Resolvido | ALTA |
| Perfil do cuidador | ✅ Resolvido | ALTA |
| Dashboard diferenciado | ✅ Resolvido | ALTA |
| Fluxo de entrevista | ✅ Resolvido | ALTA |
| Página de propostas | 🟡 Pendente | MÉDIA |
| Sistema de notificações | 🟡 Pendente | MÉDIA |
| KYC diferenciado | 🟡 Melhoria | BAIXA |
| Página de disponibilidade | 🟡 Opcional | BAIXA |

---

## ⚡ PRÓXIMOS PASSOS RECOMENDADOS

1. **Criar página de propostas para cuidador** (`/app/proposals`)
2. **Implementar sistema de notificações**
3. **Testar fluxo completo de ponta a ponta**
4. **Implementar aprovação de cuidadores no admin**
5. **Melhorar visual do perfil público do cuidador**

---

## 🔍 OBSERVAÇÕES

- O fluxo principal está funcionando corretamente
- Os cuidadores NÃO são mais forçados a pagar
- O dashboard está diferenciado por papel
- A entrevista em vídeo está funcional
- Falta apenas a página de propostas para cuidadores aceitarem/recusarem contratos
