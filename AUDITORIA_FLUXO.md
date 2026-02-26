# AUDITORIA DE FLUXO - IdosoLink

**Data:** 23 de Fevereiro de 2025
**Status:** 🔴 CRÍTICO - Fluxos incorretos

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. FLUXO DE CADASTRO INCORRETO

#### Fluxo ATUAL (Incorreto):
```
FAMÍLIA e CUIDADOR:
Registro → KYC → Pagamento €35 → Dashboard
```

#### Fluxo CORRETO:
```
FAMÍLIA:
Registro → KYC → Pagamento €35 → Dashboard Ativo

CUIDADOR:
Registro → Completar Perfil Profissional → KYC → Aguardar Aprovação → Dashboard Ativo
```

**Problema:** O cuidador está sendo forçado a pagar €35, mas ele NÃO deve pagar para se cadastrar!

---

### 2. PÁGINA KYC GENÉRICA

#### Problema:
A página `/auth/kyc` é a mesma para FAMÍLIA e CUIDADOR.

#### Deveria ser:
- **FAMÍLIA:** Verificação de identidade básica (segurança)
- **CUIDADOR:** Verificação profissional + documentos + foto

---

### 3. DASHBOARD NÃO DIFERENCIADO

#### Problema:
O Dashboard mostra as mesmas informações para ambos.

#### Deveria mostrar:

**Para FAMÍLIA:**
- Buscar cuidadores
- Meus contratos ativos
- Agendar entrevistas
- Historico de pagamentos

**Para CUIDADOR:**
- Completar meu perfil
- Propostas recebidas
- Minha disponibilidade
- Avaliações recebidas
- Ganhos

---

### 4. FLUXO DE ENTREVISTA CONFUSO

#### Problema:
- Não está claro quem agenda
- Não há fluxo de notificação para o cuidador

#### Correto:
1. FAMÍLIA busca cuidador
2. FAMÍLIA agenda entrevista
3. CUIDADOR recebe notificação
4. Ambos entram na sala de vídeo
5. Após entrevista, FAMÍLIA preenche questionário
6. Se aprovado, FAMÍLIA propõe contrato
7. CUIDADOR aceita ou recusa

---

### 5. PERFIL DO CUIDADOR

#### Problema:
O cuidador não tem uma página dedicada para completar seu perfil profissional.

#### Necessário:
- Foto de perfil
- Experiência profissional
- Certificações
- Serviços oferecidos
- Disponibilidade
- Valor por hora

---

## 📋 FLUXOS CORRETOS

### FLUXO FAMÍLIA

```
1. Landing Page
   ↓
2. Botão "Sou Família"
   ↓
3. Cadastro (nome, email, senha, telefone)
   ↓
4. Aceitar Termos
   ↓
5. KYC (verificação de identidade)
   ↓
6. Pagamento €35 (ativação + tokens)
   ↓
7. Dashboard Ativo
   ├── Buscar cuidadores
   ├── Ver perfis
   ├── Agendar entrevistas
   ├── Criar contratos
   └── Pagar gorjetas
```

### FLUXO CUIDADOR

```
1. Landing Page
   ↓
2. Botão "Sou Cuidador"
   ↓
3. Cadastro (nome, email, senha, telefone)
   ↓
4. Completar Perfil Profissional
   ├── Foto
   ├── Experiência
   ├── Certificações
   ├── Serviços oferecidos
   ├── Valor/hora
   └── Disponibilidade
   ↓
5. KYC (verificação profissional)
   ├── Documento de identidade
   ├── Comprovante de residência
   ├── Certificados profissionais
   └── Selfie
   ↓
6. Aguardar Aprovação (status: PENDING)
   ↓
7. Aprovação da Plataforma (status: ACTIVE)
   ↓
8. Dashboard Ativo
   ├── Receber propostas
   ├── Aceitar/recusar entrevistas
   ├── Aceitar/recusar contratos
   └── Receber pagamentos
```

---

## 🔧 CORREÇÕES NECESSÁRIAS

### PRIORIDADE ALTA

1. **Separar fluxo de cadastro**
   - [ ] Cuidador NÃO passa por pagamento
   - [ ] Cuidador vai para página de perfil após registro
   - [ ] Família continua com fluxo atual (KYC → Pagamento)

2. **Criar página de perfil do cuidador**
   - [ ] `/app/profile` com formulário completo
   - [ ] Campos: foto, experiência, certificações, serviços, valor

3. **Diferenciar Dashboard**
   - [ ] Cards específicos para cada perfil
   - [ ] Ações relevantes para cada um

4. **Melhorar fluxo de entrevista**
   - [ ] FAMÍLIA agenda
   - [ ] CUIDADOR visualiza e aceita

### PRIORIDADE MÉDIA

5. **Criar página de propostas para cuidador**
   - [ ] Listar propostas recebidas
   - [ ] Aceitar/recusar

6. **Notificações diferenciadas**
   - [ ] FAMÍLIA: nova proposta aceita, entrevista confirmada
   - [ ] CUIDADOR: nova proposta, nova entrevista

---

## 📱 PÁGINAS A CRIAR/MODIFICAR

### Modificar:
- `/auth/register/page.tsx` - Redirecionar cuidador para perfil
- `/auth/kyc/page.tsx` - Conteúdo diferente por perfil
- `/app/dashboard/page.tsx` - Dashboard diferenciado

### Criar:
- `/app/profile/setup/page.tsx` - Setup inicial do cuidador
- `/app/proposals/page.tsx` - Propostas recebidas (cuidador)
- `/app/availability/page.tsx` - Disponibilidade (cuidador)

---

## ⚡ AÇÃO IMEDIATA

Vou começar corrigindo o fluxo de cadastro para que:
1. FAMÍLIA vá para KYC → Pagamento
2. CUIDADOR vá para completar perfil (sem pagamento)
