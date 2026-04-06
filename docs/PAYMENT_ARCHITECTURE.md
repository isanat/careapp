# 🏛️ ARQUITETURA DE PAGAMENTOS - EVYRA
## Modelo Legal, Seguro e Compliant com PSD2

---

## 📊 COMPARATIVO: UPWORK vs WORKANA vs EVYRA

| Aspecto | Upwork | Workana | Evyra (Proposto) |
|---------|--------|---------|------------------|
| **Escrow Legal?** | Não (project funds) | Sim (terceira parte) | Não (Stripe hold) |
| **Quem segura $?** | Upwork | Workana | Stripe (não Evyra) |
| **Proteção Payer** | ✅ Sim (14 dias) | ✅ Sim (até conclusão) | ✅ Sim (até aprovação) |
| **Proteção Receiver** | ✅ Sim (auto-release) | ✅ Sim (mediação) | ✅ Sim (Stripe hold) |
| **Saques diretos?** | Não (via Upwork) | Não (via Workana) | ✅ Sim (Stripe Connect) |
| **Carteira permanente?** | ✅ Sim | ✅ Sim | ❌ Não (flow-through) |

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS PARA EVYRA

```
┌─────────────────────────────────────────────────────────────┐
│ Evyra é um INTERMEDIÁRIO, NÃO um CUSTODIANTE              │
│                                                              │
│ ❌ Não segura dinheiro                                      │
│ ❌ Não tem conta bancária com fundos dos usuários          │
│ ✅ Apenas facilita conexão entre Payer e Receiver         │
│ ✅ Todo dinheiro flui via Stripe → Contas dos usuários    │
└─────────────────────────────────────────────────────────────┘
```

---

## 💳 ARQUITETURA STRIPE: O CORAÇÃO DO SISTEMA

### Como Evyra não segura dinheiro usando Stripe Connect

```
FLUXO CORRETO:

Família (Payer)
    ↓
Fornece cartão/PayPal via Stripe
    ↓
Stripe captura pagamento
    ↓
$ fica em Stripe (não em Evyra!)
    ↓
Evyra aprova/libera (business logic)
    ↓
Stripe transfer para Cuidador (Stripe Connect)
    ↓
Cuidador recebe em conta bancária real

🔑 CHAVE: Dinheiro NUNCA toca servidores Evyra
```

---

## 🔐 TRÊS TIPOS DE PAGAMENTOS EM EVYRA

### 1️⃣ VISIBILIDADE DE DEMANDA (Boost)
**Fluxo: Família → Stripe → Evyra (revenue)**

```typescript
// PAGAMENTO DIRETO - SEM ESCROW
POST /api/demands/[id]/boost

Flow:
├─ Família clica "Ir para Pagamento (€8)"
├─ Stripe Checkout Session criado
│  └─ amount: 800 (centavos)
│  └─ metadata: { demandId, type: "VISIBILITY_BOOST", package: "PREMIUM" }
├─ Stripe cobra cartão da Família
├─ Stripe webhook: checkout.session.completed
│  └─ Stripe transfer €8 para Evyra Stripe account (revenue)
│  └─ Database: Update Demand.visibilityPackage = PREMIUM
│  └─ Database: Create VisibilityPurchase.status = COMPLETED
│  └─ Webhook: SUCESSO ✅

⚠️ IMPORTANTE:
- Evyra recebe 100% (sem intermediários)
- Não há escrow (pagamento direto)
- Familia não pode recuperar $ (é serviço entregue)
```

**Compliance PSD2**: ✅ Stripe é instituição financeira regulada

---

### 2️⃣ PAGAMENTO DE SERVIÇO (Contract)
**Fluxo: Família → Stripe → HOLD → Cuidador (Stripe Connect)**

```typescript
// COM ESCROW-LIKE BEHAVIOR (hold temporário)
POST /api/contracts/[id]/pay-deposit

Flow:
├─ Contrato criado (hourly ou fixed-price)
├─ Família fornece cartão
├─ Stripe cria Payment Intent
│  └─ amount: 5000 (€50 deposit)
│  └─ metadata: { contractId, type: "SERVICE_PAYMENT" }
│  └─ capture_method: "manual" (HOLD, não captura já!)
├─ Stripe SEGURA $ (Stripe's escrow-like hold)
│  ⏸️ Dinheiro fica em standby
├─ Cuidador trabalha...
├─ Família aprova trabalho
├─ Webhook: Manual capture
│  └─ Stripe captura (cobra a verdade da Família)
│  └─ Create Transfer: Cuidador's Stripe Connect account
│  └─ Database: Update Contract.status = PAYMENT_RELEASED
└─ Cuidador recebe em conta bancária

⏹️ SE CANCELA ANTES:
├─ Webhook: Void payment intent
├─ Stripe devolve para Família (zero cobrado)
└─ Database: Update Contract.status = CANCELLED

🔑 ONDE EVYRA ENTRA:
├─ Gerencia business logic (approvals, disputes)
├─ Não segura dinheiro (Stripe segura)
├─ Recebe comissão % da transferência
│  └─ Exemplo: Transfer €45 → Cuidador
│             Comissão 15% (€7.50) → Evyra
└─ Stripe deduz automaticamente comissão
```

**Compliance PSD2**: ✅ Stripe (não Evyra) é o "escrow holder"

---

### 3️⃣ SAQUES DO CUIDADOR (Withdrawals)
**Fluxo: Cuidador → Stripe Connect → Conta Bancária**

```typescript
// PAYOUT DIRETO - SEM INTERMEDIÁRIOS
POST /api/caregiver/wallet/withdraw

Flow:
├─ Cuidador tem saldo: €150 (de transfers completados)
├─ Solicita saque para conta bancária: €150
├─ Evyra valida:
│  ├─ Saldo disponível? ✅ €150
│  ├─ Documento verificado? ✅ KYC completo
│  └─ Sem disputas pendentes? ✅
├─ Stripe Payout criado
│  └─ Envia direto para conta bancária do Cuidador
│  └─ Tempo: 1-3 dias úteis
│  └─ Stripe taxa: ~2.5% (cuidador paga)
├─ Database: CaregiverWallet.balance -= 150
├─ Database: Create Withdrawal record (auditoria)
└─ Email: "Saque de €150 em processamento"

⚠️ IMPORTANTE:
- Evyra NÃO toca no dinheiro
- Stripe conecta direto com banco do Cuidador
- Evyra é invisível no fluxo
- Apenas gerencia e autoriza
```

**Compliance PSD2**: ✅ Stripe Connect é regulado, Evyra não intervém

---

## 📋 MODELOS DE DADOS (REVISADO)

### ❌ ERRADO - Carteira Mista
```typescript
model Wallet {
  userId: String
  balance: Int
  type: "FAMILY" | "CAREGIVER" // ❌ CONFUNDIR!
}
```

### ✅ CORRETO - Separado

```typescript
// APENAS PARA CUIDADOR
model CaregiverWallet {
  userId: String (CAREGIVER only)
  
  // Saldos
  totalEarned: Int        // Total ganho (€)
  totalWithdrawn: Int     // Total sacado (€)
  pendingPayments: Int    // Aguardando aprovação
  availableBalance: Int   // Pode sacar agora
  
  // Stripe Connect
  stripeConnectAccountId: String (onboarded)
  
  // Auditoria
  lastWithdrawalAt: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}

// Transfer History (para cuidador)
model CaregiverTransfer {
  id: String
  caregiverId: String
  contractId: String
  
  // Valores
  grossAmount: Int (antes de comissão)
  platformFeePercent: Int (default 15%)
  platformFeeCents: Int (calculado)
  netAmount: Int (o que cuidador recebe)
  
  // Stripe
  stripeTransferId: String
  
  // Status
  status: "PENDING" | "COMPLETED" | "FAILED"
  createdAt: DateTime
  completedAt: DateTime
}

// Payout/Saque do cuidador
model CaregiverWithdrawal {
  id: String
  caregiverId: String
  
  // Valores
  amount: Int
  stripeFee: Int (2.5%)
  netAmount: Int (amount - fee)
  
  // Banco
  bankAccountLast4: String (privacidade)
  
  // Stripe
  stripePayoutId: String
  
  // Status
  status: "PENDING" | "IN_TRANSIT" | "COMPLETED" | "FAILED"
  requestedAt: DateTime
  arrivedAt: DateTime
}

// ⚠️ SEM CARTEIRA PERMANENTE PARA FAMÍLIA
// Apenas créditos temporários:
model FamilyCredit {
  id: String
  familyUserId: String
  
  // Tipos de crédito
  type: "PROMOTIONAL" | "REFUND" | "CASHBACK"
  amount: Int
  
  // Como foi ganho
  reason: String (ex: "First boost free")
  sourceId: String (ex: promoId)
  
  // Uso
  usedAt: DateTime?
  spentOnDemandId: String?
  
  // Validade
  expiresAt: DateTime
  
  createdAt: DateTime
}

// Histórico de pagamentos (Família)
model FamilyPayment {
  id: String
  familyUserId: String
  
  // O que foi pago
  type: "VISIBILITY_BOOST" | "SERVICE_PAYMENT" | "CONTRACT_FEE"
  amount: Int
  
  // Referência
  demandId?: String
  contractId?: String
  
  // Stripe
  stripePaymentIntentId: String
  stripeChargeId: String
  
  // Status
  status: "PENDING" | "COMPLETED" | "FAILED"
  
  createdAt: DateTime
  completedAt: DateTime
}
```

---

## 🎬 FLUXOS DETALHADOS

### FLUXO 1: Visibilidade (Mais Simples)

```
┌─────────────────────────────────────────────────────┐
│ BOOST DE DEMANDA                                    │
└─────────────────────────────────────────────────────┘

1. Família cria demanda
   └─ Passo 1-4: Preenchimento do formulário

2. Passo 5: Seleciona pacote (PREMIUM = €8)
   ├─ Clica "Ir para Pagamento (€8)"
   └─ Redireciona para /app/family/demands/[id]/boost?package=PREMIUM

3. Página de checkout
   ├─ Resume da demanda
   ├─ Pacote: PREMIUM (€8)
   ├─ Benefícios: 30 dias, destacado no topo
   └─ Botão: "Pagar com Stripe" (ou dados cartão)

4. Stripe Checkout
   ├─ Família insere cartão
   ├─ Stripe valida (CVC, 3D Secure se necessário)
   ├─ Confirmação: "€8 cobrado com sucesso"
   └─ Redireciona: /app/family/demands/[id]/success

5. Backend (Webhook Stripe)
   ├─ Event: checkout.session.completed
   ├─ Stripe.handle_webhook():
   │  ├─ Valida assinatura
   │  ├─ session_id = check
   │  └─ Processa...
   ├─ Database:
   │  ├─ UPDATE Demand SET visibilityPackage = 'PREMIUM'
   │  ├─ UPDATE Demand SET visibilityExpiresAt = NOW + 30 days
   │  ├─ INSERT VisibilityPurchase (status = COMPLETED)
   │  └─ UPDATE Demand SET status = 'ACTIVE'
   └─ Analytics:
      ├─ Admin Dashboard: +€8 revenue
      └─ Demand metrics: boost conversion = +1

6. Frontend confirmation
   ├─ Familia vê: "Demanda publicada com visibilidade PREMIUM!"
   ├─ Email: Confirmação pagamento
   ├─ Dashboard: Demanda agora destaca no ranking
   └─ Marketplace: Cuidadores veem demanda melhorada

💰 RECEITA EVYRA: €8 (100%)
⏱️ TEMPO: ~30 segundos
```

---

### FLUXO 2: Serviço (Mais Complexo)

```
┌──────────────────────────────────────────────────────────┐
│ CONTRATO + ESCROW-LIKE PAYMENT                          │
└──────────────────────────────────────────────────────────┘

FASE 1: CRIAÇÃO
═════════════════

1. Cuidador envia proposta para demanda
   ├─ "Posso fazer em €12/hora"
   ├─ "20 horas = €240 total"
   └─ Proposta status: PENDING

2. Família aprova proposta
   ├─ Clica "Aceitar proposta"
   ├─ Sistema cria Contract
   │  └─ status: PENDING_PAYMENT
   └─ Envia email ao Cuidador: "Proposta aceita!"

FASE 2: PAGAMENTO (ESCROW)
═════════════════════════════

3. Família clica "Confirmar e Pagar"
   ├─ Exibe resumo:
   │  ├─ Serviço: 20h × €12 = €240
   │  ├─ Você pagará: €240
   │  ├─ Quando: Após conclusão e aprovação
   │  └─ Proteção Stripe: 30 dias
   └─ Botão: "Proceder ao Pagamento"

4. Stripe Checkout Session (HOLD)
   ├─ Cria Payment Intent
   │  ├─ amount: 24000 (centavos)
   │  ├─ capture_method: "manual" (❌ NÃO captura ainda!)
   │  ├─ metadata: { contractId, type: "SERVICE" }
   │  └─ description: "Contrato #123 - 20h cuidados"
   ├─ Família insere cartão
   ├─ Stripe autoriza (soft reserve)
   ├─ Confirmação: "Pagamento autorizado - Trabalho iniciado!"
   └─ Redireciona: /app/family/contracts/[id]

5. Backend (Webhook)
   ├─ Event: payment_intent.amount_capturable_updated
   ├─ Database:
   │  ├─ INSERT StripePaymentHold:
   │  │  ├─ contractId
   │  │  ├─ paymentIntentId
   │  │  ├─ amount: 24000
   │  │  ├─ status: AUTHORIZED
   │  │  └─ expiresAt: NOW + 7 days
   │  └─ UPDATE Contract SET status = 'ACTIVE'
   ├─ Email Família: "Pagamento autorizado, trabalho iniciado"
   └─ Email Cuidador: "Você foi selecionado, comece!"

💰 STRIPE HOLD: €240 (não cobra cartão ainda!)
📝 CONTRATO: ACTIVE

FASE 3: EXECUÇÃO
════════════════

6-20. Cuidador trabalha (20 horas ao longo de dias)
      └─ Sistema rastreia horas/conclusão

21. Cuidador marca como "Trabalho Completo"
    ├─ Envia para revisão
    └─ Status: PENDING_APPROVAL

FASE 4: APROVAÇÃO
═══════════════════

22. Família revisa trabalho
    ├─ Opções:
    │  ├─ ✅ "Aprovo - Pagar agora"
    │  ├─ ⚠️ "Solicitar revisão"
    │  └─ ❌ "Rejeitar (disputar)"
    └─ Clica: "Aprovo e Liberar Pagamento"

23. Família confirma
    ├─ Exibe: "Você liberará €240 para o cuidador"
    └─ Botão: "CONFIRMAR LIBERAÇÃO"

24. Backend - CAPTURA REAL
    ├─ Stripe.capture_payment_intent()
    │  ├─ payment_intent_id: xxx
    │  └─ amount_to_capture: 24000
    ├─ Stripe COBRA a Família (agora sim!)
    ├─ Stripe transfer automática:
    │  ├─ gross: €240
    │  ├─ platform_fee (15%): €36 → Evyra
    │  └─ net: €204 → Cuidador Stripe Connect account
    └─ Email: "Pagamento processado!"

25. Database updates
    ├─ UPDATE Contract SET status = 'PAYMENT_RELEASED'
    ├─ DELETE StripePaymentHold
    ├─ INSERT CaregiverTransfer:
    │  ├─ contractId
    │  ├─ grossAmount: 24000
    │  ├─ platformFeeCents: 3600
    │  ├─ netAmount: 20400
    │  └─ status: COMPLETED
    └─ UPDATE CaregiverWallet.availableBalance += 20400

26. Notificações
    ├─ Email Cuidador: "Você recebeu €204! Saque em 1-2 dias"
    ├─ Email Família: "Pagamento confirmado"
    └─ Dashboard Cuidador: Saldo €204 disponível para saque

FASE 5: SAQUE (Opcional)
═════════════════════════

27. Cuidador clica "Sacar €204"
    ├─ Seleciona conta bancária (registrada na onboarding)
    └─ Clica "Sacar agora"

28. Stripe Payout
    ├─ Cria payout request
    │  ├─ amount: 20400
    │  ├─ currency: EUR
    │  ├─ destination: Cuidador's bank account
    │  └─ method: manual_payout
    ├─ Stripe processa (1-3 dias úteis)
    └─ Cuidador recebe em conta real

29. Database
    ├─ INSERT CaregiverWithdrawal:
    │  ├─ amount: 20400
    │  ├─ stripePayoutId: po_xxx
    │  └─ status: IN_TRANSIT
    └─ UPDATE CaregiverWallet.totalWithdrawn += 20400

⚠️ FLUXO ALTERNATIVO: SE REJEITA
═════════════════════════════════

22b. Família clica "Rejeitar - Trabalho insatisfatório"
     └─ Sistema abre disputa

23b. Stripe Dispute (via payment_intent)
     ├─ Família explica problema
     ├─ Cuidador responde (evidência)
     └─ Stripe arbitra (72h)

24b. Resultado:
     ├─ ✅ Favor Família: Stripe void, devolve €240
     ├─ ✅ Favor Cuidador: Stripe libera €240
     └─ ❌ Impasse: Ambos podem escalar para suporte

25b. Se Família vence:
     ├─ Stripe void payment
     ├─ Cartão da Família não cobra
     └─ Database: Contract status = REJECTED

💰 PROTEÇÃO: 30 dias (Stripe hold máximo)
```

---

## 🏛️ COMPLIANCE & REGULAÇÃO

### PSD2 - Payment Services Directive 2

```
✅ EVYRA SEM RISCO:
├─ Não segura dinheiro
├─ Não é Money Transmitter
├─ Não é Payment Institution
└─ É apenas Software Provider (intermediário)

✅ STRIPE SIM (Regulado):
├─ Licença de Payment Institution (EU)
├─ Seguro de depósitos até €100k
├─ Compliance PSD2, GDPR, etc.
└─ Auditoria independente anual

MODELO SEGURO:
┌─────────────────────────────┐
│ Evyra (Platform)            │
│ - Gerencia contracts        │
│ - Lógica de negócio         │
│ - ZERO acesso a fundos      │
└──────────┬──────────────────┘
           │
           │ API calls
           ↓
┌─────────────────────────────┐
│ Stripe (Payment Processor)  │
│ - Recebe fundos             │
│ - Segura (escrow-like)      │
│ - Transfere para contas     │
│ - Regulado PSD2/GDPR        │
└─────────────────────────────┘
```

### Documentação Legal Necessária

```
1. TERMOS DE SERVIÇO
   ├─ Explicar que Evyra é intermediário
   ├─ Stripe é processador de pagamento regulado
   ├─ Clarificar responsabilidades de cada parte
   └─ Proteger Evyra de liability

2. POLÍTICA DE PRIVACIDADE
   ├─ Como dados são compartilhados com Stripe
   ├─ Retenção de dados
   └─ Direitos do usuário GDPR

3. ACORDO DE USO STRIPE
   ├─ Linked na plataforma
   └─ Aceitar ao fazer pagamento

4. POLÍTICA DE REEMBOLSO
   ├─ Esclarecendo quando reembolsa
   ├─ Processo de disputa
   └─ Timeouts
```

---

## 🚀 IMPLEMENTAÇÃO: ROADMAP

### Phase 1: Infraestrutura Básica (2 semanas)
```
├─ Setup Stripe Connect (integração)
├─ Criar models (CaregiverWallet, CaregiverTransfer, etc)
├─ Webhook handlers (payment_intent, charge, payout)
└─ Testes unitários
```

### Phase 2: Fluxo Visibilidade (1 semana)
```
├─ POST /api/demands/[id]/boost → Stripe
├─ Webhook: checkout.session.completed
├─ Update Demand status
└─ Admin analytics
```

### Phase 3: Fluxo Serviço (2 semanas)
```
├─ Contract creation
├─ Payment authorization (soft hold)
├─ Manual capture flow
├─ Dispute handling
└─ Withdrawal flow
```

### Phase 4: Saques (1 semana)
```
├─ CaregiverWallet view
├─ Withdraw request
├─ Stripe payout integration
└─ Bank account management
```

### Phase 5: Compliance (ongoing)
```
├─ Legal review
├─ Testes de segurança
├─ Auditoria PSD2
└─ Documentação
```

---

## 💡 RESUMO EXECUTIVO

**Evyra NUNCA segura dinheiro.**

```
FLUXO:
Usuário → Stripe (captura fundos) → Lógica Evyra → Stripe (transfere)

SEGURANÇA:
├─ PSD2 compliant ✅
├─ Stripe regulado ✅
├─ Zero liability Evyra ✅
├─ Auditoria automática ✅
└─ Usuários protegidos ✅

DIFERENÇAS:

FAMÍLIA (Payer):
- Paga direto via Stripe
- Sem "carteira permanente"
- Apenas créditos temp. (reembolsos)
- Vê histórico de pagamentos
- Pagar = transferência

CUIDADOR (Receiver):
- Recebe transfers Stripe
- TEM "carteira permanente" (saldo)
- Gerencia saques
- Vê histórico de ganhos
- Saque = payout bancário
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Validar com advogado (compliance PSD2/GDPR/Portugal)
2. ✅ Integrar Stripe Connect no development
3. ✅ Criar webhook handlers
4. ✅ Implementar models corrigidos
5. ✅ Testar fluxos completos
6. ✅ Deploy gradual (beta users)

