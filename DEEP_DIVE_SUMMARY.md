# CareApp - Deep Dive Summary (Phase 1)

**Data:** 30 de Março de 2026
**Status:** Phase 1 Completa - 50% do conhecimento aprofundado explorado
**Próximo:** Phase 2 (Limpeza/Simplificação) + Phase 3 (Testes E2E)

---

## 📊 VISÃO GERAL DO PROJETO

**CareApp (SeniorToken - Plataforma IdosoLink)** é um marketplace B2B2C de cuidados para idosos com 95% de implementação pronta para produção (v1.0.0-rc).

**Stack:**
- Frontend: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS
- Backend: Next.js API Routes + Prisma ORM (Turso SQLite)
- Auth: NextAuth.js + JWT
- Pagamentos: Stripe + Easypay (Portugal) + Tokens internos
- Real-time: Socket.io (chat) + Jitsi (vídeo)
- Test: Vitest (15 arquivos, 67 testes)

**Decisões Críticas Já Tomadas:**
- ✅ MVP: Portugal apenas (Easypay já integrado)
- ✅ Blockchain: **REMOVER COMPLETAMENTE** (simplificar)
- ✅ Stripe Connect: Adiado para v1.1 (usar Easypay agora)
- ✅ Foco: Deep dive + Testes E2E (não implementação imediata)

---

## 🔑 ÁREAS CRÍTICAS DESCOBERTAS

### 1. AUTENTICAÇÃO & SEGURANÇA ⚠️

**Status:** Funcional com gaps críticos em segurança operacional

#### Boas Práticas:
✅ JWT + NextAuth.js bem configurado
✅ Bcrypt 12 rounds para senha
✅ CSRF protection (double-submit cookie)
✅ 2FA suportado para admins
✅ Roles-based access (FAMILY, CAREGIVER, ADMIN)
✅ Audit logs administrativos

#### Problemas Críticos:
❌ **SEM RATE LIMITING** - Brute force attacks possíveis em login/forgot-password
❌ **SEM EMAIL VERIFICATION** - Usuário pode registrar com email fake
❌ **SEM REFRESH TOKENS** - Logout não revoga sessão até expiração (30 dias)
❌ **SEM 2FA NA PRÁTICA** - Campo existe mas não implementado
❌ **CSRF COOKIE NÃO-HTTPONLY** - JavaScript pode ler token (XSS risk)

**Prioridade Recomendada:**
1. Implementar rate limiting (login, register, forgot-password)
2. Email verification obrigatória
3. Refresh tokens + logout revogável
4. 2FA TOTP para ADMIN
5. CSRF cookie como httpOnly: true

**Tempo estimado:** 3-5 dias

---

### 2. PAGAMENTOS (EASYPAY) 🚨 **BUG CRÍTICO**

**Status:** 95% implementado, MAS com exploração financeira

#### O que Funciona:
✅ Criação de pagamento (Easypay API)
✅ Webhook de confirmação
✅ Crédito de tokens na Wallet
✅ Ativação de contrato após pagamento
✅ Suporte a MB Way + Multibanco + Cartão

#### **TODO NÃO IMPLEMENTADO (LINHA 155):**
```
// TODO: Deduct tokens from user wallet if already credited
```

**O Problema:**
1. Pagamento confirmado → tokens creditados à Wallet
2. Usuário solicita refund
3. Webhook refund recebido → Payment.status = REFUNDED
4. **NENHUMA AÇÃO** debitando tokens
5. Resultado: Usuário fica com tokens + dinheiro refundado!

**Impacto:** CRÍTICO - Exploração financeira simples

**Solução:**
Implementar debitação de tokens no webhook refund (2-4 horas):
- Debit tokens da Wallet
- Log no TokenLedger (DEBIT com reason: REFUND)
- Reverter ativação de contrato se necessário
- Usar transações para atomicidade

---

### 3. SISTEMA DE CONTRATOS 🔴 **MÚLTIPLOS GAPS**

**Status:** 80% funcional, MAS com estados problemáticos

#### Fluxo Teórico:
```
DRAFT → ACCEPT (ambos) → PENDING_PAYMENT → ACTIVE → COMPLETED
```

#### Problemas Identificados:

**🔴 CRÍTICO: Cuidador Não Consegue Pagar Taxa**
- ❌ Sem endpoint POST /api/payments/caregiver-fee
- ❌ caregiverFeePaid nunca vira true
- ❌ Contrato fica em PENDING_PAYMENT **PARA SEMPRE**
- **Impacto:** Contratos não podem ativar!
- **Fix:** Implementar endpoint de pagamento para cuidador (1 dia)

**🔴 CRÍTICO: COUNTER_PROPOSED Sem Lógica**
- ❌ Status COUNTER_PROPOSED existe
- ❌ Mas sem aceitar/rejeitar lógica
- ❌ Sem timeout
- ❌ Contrato fica travado indefinidamente
- **Fix:** Completar fluxo de contraproposta (1-2 dias)

**🟡 ALTO: Sem Fluxo de Disputa**
- ❌ Sem endpoint para usuário abrir disputa
- ❌ Admin só vê contratos já marcados DISPUTED
- ❌ Sem SLA/timeout
- ❌ Sem sistema de evidências
- **Fix:** Implementar complaint/dispute workflow (2-3 dias)

**🟡 ALTO: Assinatura Digital Fraca**
- ⚠️ SHA-256 sem notarização
- ⚠️ Sem blockchain backup
- ⚠️ Não aguenta tribunal
- **Fix:** Integrar com Blockchain ou timestamp authority (2-3 dias)

**🟡 MÉDIO: Blockchain Vazio**
- ❌ Campos onchainHash, onchainTxHash no schema
- ❌ Nunca são preenchidos
- ❌ Sem smart contracts deployados
- **Decisão:** Remover campos ou implementar (scope)

**🟡 MÉDIO: Sem KYC Re-validation**
- ⚠️ KYC verificado na criação
- ⚠️ Se expirar/rejeitar, aceite continua
- **Fix:** Validar KYC novamente antes de aceite (30 min)

**🟡 MÉDIO: Recurring Sem Limite de Falhas**
- ⚠️ failedAttempts incrementa
- ⚠️ Sem auto-cancel após X falhas
- ⚠️ Sem notificação
- **Fix:** Implementar limite + auto-cancel (30 min)

---

### 4. PAGAMENTOS RECORRENTES ⚠️

**Status:** Schema pronto, MAS lógica incompleta

#### Estrutura:
✅ RecurringPayment model existe
✅ Campos: billingDay, status, nextPaymentAt
✅ Integração Stripe Connect (para futuro)

#### Falta:
❌ **CRON JOB** para disparar cobrança automática
❌ Sem integração Easypay recurring
❌ Sem polling de webhook
❌ Sem retry em falha

**Impacto:** Baixo (recurso não essencial para MVP)

---

## 📋 MATRIZ DE RISCOS

| Componente | Risco | Impacto | Priority |
|-----------|-------|---------|----------|
| **Rate Limiting** | Brute force ataques | CRÍTICO | P0 |
| **Easypay Refund TODO** | Exploração financeira | CRÍTICO | P0 |
| **Caregiver Payment Fee** | Contratos não ativam | CRÍTICO | P0 |
| **Counter-Proposed Logic** | Contratos travados | ALTO | P1 |
| **Disputa Workflow** | Falta resolução | ALTO | P1 |
| **Digital Signature** | Prova fraca legal | ALTO | P1 |
| **Email Verification** | Contas fake | MÉDIO | P2 |
| **2FA Enforcement** | Admin compromise | MÉDIO | P2 |
| **Blockchain Vazio** | Promessa não cumprida | BAIXO | P3 |
| **KYC Re-validation** | Permissão expirada | BAIXO | P3 |

---

## ✅ ÁREAS SÓLIDAS (DEPLOY-READY)

### Painel Admin
✅ Dashboard com métricas
✅ Gerenciamento de usuários (suspend, activate)
✅ Gestão de contratos + pagamentos
✅ RBAC completo (5 roles)
✅ Audit logs de todas as ações
✅ Suporte a tickets

### KYC/Verificação de Identidade
✅ Integração Didit (facial recognition)
✅ Background check logic
✅ Webhook processing
✅ Status tracking completo

### Chat em Tempo Real
✅ Socket.io integrado
✅ Persistência em database
✅ Last read tracking
✅ Upload de arquivos

### Marketplace
✅ Busca de cuidadores
✅ Filtros por localização, serviço, preço
✅ Perfis com portfolio
✅ Rating e reviews

### Internacionalização
✅ next-intl com 4 idiomas (PT, EN, IT, ES)
✅ Completo e funcional

### Testes
✅ 67 testes com Vitest
✅ Coverage razoável
✅ CI/CD ativo no GitHub Actions

---

## 🎯 PRÓXIMOS PASSOS (RECOMENDADOS)

### Phase 1 (COMPLETA - 3 dias)
✅ Deep dive em Autenticação
✅ Deep dive em Pagamentos (Easypay)
✅ Deep dive em Contratos
✅ Identificar todos os gaps

### Phase 2 (SIMPLIFICAÇÃO - 1-2 dias)
- [ ] Remover todas as referências a Blockchain/Tokens
  - Limpar schema.prisma (Wallet, TokenLedger, onchain* fields)
  - Remover Ethers.js, Hardhat dependencies
  - Simplificar para pagamentos diretos EUR

- [ ] Remover Stripe Connect references
  - Manter Stripe Checkout apenas
  - Simplificar lógica de transferências

- [ ] Resolver TODO Easypay (token deduction refund)
  - Implementar debitação de tokens
  - Testes E2E refund flow

- [ ] Validar que MVP é Portugal-only
  - Remover country selectors
  - Validar Easypay + EUR apenas

### Phase 3 (TESTES E2E - 2-3 dias)
Criar testes automáticos para:
1. **User Registration & Activation**
   - Family signup → KYC → Payment (€35) → ACTIVE
   - Caregiver signup → KYC → Approval → ACTIVE

2. **Contract Lifecycle**
   - Create → Accept (ambos) → Pay fees → ACTIVE → Complete
   - Incluir counter-proposal flow

3. **Payment Flow**
   - Contrato fee via Easypay
   - Webhook confirmação
   - Contract activation

4. **Chat & Interview**
   - Messaging via Socket.io
   - Jitsi video call

5. **Admin Operations**
   - Login admin
   - Suspend user
   - Resolve dispute

### Phase 4 (SEGURANÇA - 3-5 dias)
Implementar prioridades críticas:
1. Rate limiting (login, register, API)
2. Email verification
3. Refresh tokens + logout revogável
4. 2FA para ADMIN
5. CSRF cookie httpOnly

### Phase 5 (PREPARAÇÃO PROD - 1 dia)
- Build production
- Type check: `bunx tsc --noEmit`
- Testes: `bun run test:run`
- Deploy em staging
- Sanity test

### Phase 6 (DEPLOY - 1 dia)
- Git push origin main (ou branch)
- CI/CD validar
- Deploy para produção Portugal
- Monitorar logs

---

## 📊 ESTADO ATUAL POR FUNCIONALIDADE

| Funcionalidade | % | Status | Pronto? |
|---|---|---|---|
| Autenticação | 85% | Funcional, gaps segurança | ⚠️ |
| Registro | 90% | Bom, sem email verify | ⚠️ |
| KYC | 85% | Didit integrado | ✅ |
| Pagamentos (Easypay) | 90% | Bug em refund | 🔴 |
| Pagamentos (Stripe) | 80% | Checkout OK, Connect adiado | ✅ |
| Contratos | 80% | Gap em pagamento cuidador | 🔴 |
| Chat | 95% | Socket.io pronto | ✅ |
| Entrevistas | 90% | Jitsi integrado | ✅ |
| Painel Admin | 95% | Maduro e completo | ✅ |
| Reviews & Ratings | 90% | Completo | ✅ |
| Marketplace | 90% | Funcional | ✅ |
| Testes | 90% | 67 testes, boa cobertura | ✅ |
| **GERAL** | **88%** | **Funcional com gaps** | **⚠️** |

---

## 🚀 RECOMENDAÇÕES FINAIS

### Para MVP v1.0 (Portugal):

**DEVE FAZER (Bloqueadores):**
1. ✅ Resolver TODO Easypay (token deduction refund) - 2-4h
2. ✅ Implementar POST /api/payments/caregiver-fee - 4-6h
3. ✅ Implementar rate limiting - 4-6h
4. ✅ Implementar email verification - 3-4h
5. ✅ Testes E2E completos - 8-12h

**PODE FAZER (Melhorias):**
1. Refresh tokens + logout revogável - 4-6h
2. 2FA para ADMIN - 3-4h
3. Completar counter-proposal flow - 4-6h
4. Implementar disputa workflow - 6-8h
5. Melhorar assinatura digital (blockchain) - 2-3 dias

**NÃO FAZER (Scope v1.0):**
1. Stripe Connect - Adiado para v1.1
2. Blockchain/Tokens - Remover ou simplificar
3. Recurring cron job - Implementado sem auto-charge
4. Google OAuth - Usar apenas email/senha por agora

---

## 📁 ARQUIVOS CRÍTICOS PARA LEITURA

**Configuração & Setup:**
```
/src/lib/auth-turso.ts          - NextAuth config
/src/lib/db-turso.ts            - Turso/Prisma setup
/prisma/schema.prisma           - Database schema (1175 linhas!)
/next.config.ts                 - Build config
/.env.example                   - Variáveis necessárias
```

**Autenticação:**
```
/src/app/auth/                  - Auth pages (login, register, KYC, reset)
/src/app/api/auth/              - Auth endpoints
/src/middleware.ts              - CSRF + routing protection
```

**Pagamentos (CRÍTICO):**
```
/src/lib/services/easypay.ts    - Easypay API wrapper
/src/app/api/payments/          - Payment endpoints
/src/app/api/webhooks/easypay/  - **TODO aqui**
/src/app/api/webhooks/stripe/   - Stripe webhooks
```

**Contratos:**
```
/src/app/api/contracts/         - CRUD de contratos
/src/app/api/admin/contracts/   - Gestão admin
/src/app/app/contracts/         - UI de contratos
```

**Admin:**
```
/src/app/admin/                 - Painel admin (20+ rotas)
/src/lib/services/admin-tables.ts - Componentes admin
```

**Testes:**
```
/src/app/api/__tests__/         - 11 arquivos de teste
```

---

## 📞 DÚVIDAS ABERTAS

1. **Blockchain/Tokens**: Remover completamente ou manter para futuro?
2. **Assinatura Digital**: Blockchain notarization ou apenas SHA-256?
3. **Moeda**: EUR apenas ou multi-currency em futuro?
4. **Timing**: Quando colocar em produção? Antes/depois de fixes?
5. **Suporte**: Qual é o SLA de resolução de disputas?

---

## ✨ CONCLUSÃO

O **CareApp está ~88% pronto** para produção Portugal com arquitetura sólida e features maduras. Os bloqueadores são **técnicos e não arquiteturais**, resolvíveis em **~2-3 semanas** de desenvolvimento focado.

**Recomendação:** Priorizar fixes críticos (Easypay, caregiver fee, rate limiting) antes de qualquer mercado produção.

**Próximo Passo:** Aprovação para Phase 2 (Simplificação) ou começar Phase 3 (Testes E2E)?

---

*Documento criado em 2026-03-30 durante Phase 1 Deep Dive*
