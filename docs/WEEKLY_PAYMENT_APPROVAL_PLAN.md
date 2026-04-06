# Sistema de Aprovação Semanal para Contratos
## Plano Completo de Implementação

**Data de Aprovação:** 2026-04-06  
**Status:** ✅ APROVADO E DOCUMENTADO  
**Estimativa:** 3-4 semanas (1 dev)

---

## 1. Contexto do Problema

### Situação Atual
- Contratos de longa duração (30+ dias) precisam de modelo de pagamento seguro
- Se família pagar tudo no dia 1 e cuidador desaparecer no dia 20: **família perde dinheiro**
- Se família paga só no final: **cuidador fica inseguro**

### Exemplo de Cenário Problemático
```
Contrato: 30 dias entre Família Silva e Cuidador João
Valor: €150 (€5/dia)

Cenário 1 (Atual - Pagar Tudo Antes):
├─ Dia 1: Família paga €155 (€150 serviço + €5 taxa)
├─ Dias 2-20: João trabalha normalmente
├─ Dia 20: João sofre acidente e desaparece
└─ Resultado: Família perdeu €150, João perdeu dias trabalhados

Cenário 2 (Novo - Aprovação Semanal):
├─ Dia 1: Família paga €5 (taxa de ativação) + autoriza €150 em escrow
├─ Semana 1: Família aprova €35 (7 dias × €5/dia)
├─ Semana 2: Família aprova €35
├─ Dia 15: João sofre acidente
├─ Semana 3: Família disputa €35 (explica acidente)
│            → Admin arbitra → Família pagará €20 (dias reais trabalhados)
└─ Resultado: João recebe €90 (pelo que trabalhou), Família paga €110
```

### Solução Proposta

**Aprovação Semanal com Controle da Família**
- ✅ Máximo 30 dias por contrato
- ✅ Família aprova pagamento **cada semana** (4 aprovações = 4 semanas)
- ✅ Stripe segura o dinheiro até aprovação
- ✅ Nova taxa de contrato (€5) a cada **renovação de 30 dias**
- ✅ Auto-aprovação após 48-72h (proteção para cuidador)
- ✅ Cálculo por **dias reais** (proporcional)

---

## 2. Por Que É Juridicamente Seguro

| Aspecto | Como Protege | Detalhe |
|--------|-------------|--------|
| **Controle da Família** | Família aprova antes de cada pagamento | Nenhuma captura automática |
| **Stripe Custódia** | Stripe segura fundos, não Evyra | Evyra = intermediária, não custodiária |
| **Sem Arbiter** | Evyra não arbitra disputas | Moderador apenas, decision final = família + admin |
| **Contrato Curto** | Máximo 30 dias = não é vínculo emprego | Renovável a cada período |
| **Renovação Voluntária** | Ambos decidem continuar ou não | Breakpoint natural a cada mês |
| **Auto-Aprovação com Prazo** | 48-72h após vencimento = proteção cuidador | Família tem janela para contestar |

---

## 3. Fluxo de Pagamento Detalhado

### Semana 1 (Dias 1-7)

```
DIA 1 - CONTRATO ATIVA:
├─ Família paga €5 (taxa de ativação)
│  └─ Stripe captura para Evyra imediatamente
├─ Família autoriza hold de €150 (escrow)
│  └─ Stripe autoriza sem capturar (AUTHORIZED status)
├─ Contrato status = "ACTIVE"
├─ Sistema cria 4 registros WeeklyPaymentApproval
│  ├─ Semana 1: €35 (7 dias × €5/dia), vencimento sexta 17h
│  ├─ Semana 2: €35, vencimento próxima sexta 17h
│  ├─ Semana 3: €35
│  └─ Semana 4: €35
└─ Cuidador recebe notificação que contrato ativou

DIAS 2-7 - TRABALHO:
├─ Cuidador trabalha
├─ Pode adicionar "Notas de Trabalho" no app (opcional)
│  └─ Família vê em tempo real
└─ Família monitora o trabalho
```

### Final da Semana 1 (Sexta 17h - DEADLINE)

```
Opção A - FAMÍLIA APROVA:
├─ Clica "✓ Aprovar" na app
├─ Stripe captura €35 (hold para authorized)
├─ Sistema cria CaregiverTransfer (€35)
├─ Cuidador recebe notificação "Semana 1 aprovada"
├─ Sistema auto-autoriza hold da Semana 2
└─ Cuidador recebe € em conta (Stripe Connect)

Opção B - FAMÍLIA DISPUTA:
├─ Clica "✗ Disputar"
├─ Digite motivo: "Trabalho não foi feito como combinado"
├─ Sistema VOID a hold (não captura)
├─ Sistema cria SupportTicket para admin
├─ Admin medeia entre família e cuidador
├─ Se resolução:
│  ├─ Família aprova €25 (parcial) + €10 refund
│  └─ Cuidador recebe €25
└─ Se não resolver: Chargeback / Arbitragem

Opção C - NINGUÉM FALA (Timeout):
├─ Sistema aguarda 48-72h após vencimento
├─ Se ainda não aprovado/disputado:
│  ├─ Sistema **AUTO-APROVA** €35
│  ├─ Cuidador recebe notificação
│  └─ Proteção: garante que cuidador não perde dinheiro
└─ Família ainda pode contestar depois se quiser
```

### Semanas 2-4

Mesmo processo se repete:
- Cada sexta 17h: família aprova ou disputa
- Auto-aprovação após 48-72h
- Cuidador recebe semanalmente

### Renovação no Dia 30

```
DIA 27 (Auto-Renew Trigger):
├─ Sistema detecta contrato vencendo
├─ Cria NOVO contrato com mesmos termos
│  └─ Status = "PENDING_ACCEPTANCE"
├─ Notifica: "Seu contrato com João renova em 3 dias"
└─ Família e Cuidador veem novo contrato

DIA 28-29:
├─ Família e Cuidador aceitam novo contrato
└─ Família aprova novo contrato

DIA 29 (Aprovação):
├─ Contrato novo status = "PENDING_PAYMENT"
├─ Família paga novo €5 (taxa recorrente)
└─ Stripe captura para Evyra

DIA 30 (Contrato Novo Ativa):
├─ Sistema cria 4 novos WeeklyPaymentApproval
├─ Família autoriza novo escrow de €150
├─ Contrato velho fecha automaticamente
└─ Semana 5 começa com novo contrato
```

---

## 4. Arquitetura de Dados

### Novo Model: WeeklyPaymentApproval

```prisma
model WeeklyPaymentApproval {
  // Chaves
  id                      String   @id @default(cuid())
  contractId              String
  contract                Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  // Identificação
  weekNumber              Int      // 1-4
  
  // Valores (cálculo: totalEurCents / 30 * diasReaisDaSemana)
  weeklyAmountCents       Int      // Ex: 3500 (€35)
  platformFeeCents        Int      // Ex: 525 (15%)
  caregiverAmountCents    Int      // Ex: 2975 (€29.75)
  
  // Timeline
  approvalDueAt           DateTime // Ex: sexta 17h
  createdAt               DateTime @default(now())
  approvedAt              DateTime?
  capturedAt              DateTime?
  
  // Decisão da Família
  familyDecision          String?  // null | "APPROVED" | "DISPUTED"
  familyDecidedAt         DateTime?
  familyNotes             String?  // Motivo se disputado
  
  // Integração Stripe
  stripePaymentHoldId     String?  // Link a StripePaymentHold
  familyPaymentId         String?  // Link a FamilyPayment
  caregiverTransferId     String?  // Link a CaregiverTransfer
  
  // Status
  status                  String   // "PENDING" | "APPROVED" | "CAPTURED" | "DISPUTED" | "REFUNDED"
  
  // Índices para performance
  @@index([contractId, weekNumber])
  @@index([familyDecision, status])
  @@index([approvalDueAt, status])
}
```

### Mudanças ao Model Contract

```prisma
model Contract {
  // ... campos existentes ...
  
  // Novos campos (opcionais, backward compatible)
  weeklyPaymentEnabled    Boolean        @default(false)
  paymentCycleStartDate   DateTime?      // Quando começou ciclo de 30 dias
  renewalContractId       String?        // Link ao próximo contrato (se renovado)
  
  // Relação com aprovações semanais
  weeklyApprovals         WeeklyPaymentApproval[]
}
```

### Reutilização de Models Existentes

```prisma
// Já existem e serão reutilizados:
- FamilyPayment        // Um registro por semana aprovada
- StripePaymentHold    // Um por semana (autorizar sem capturar)
- CaregiverTransfer    // Um por semana (quando captura)
- CaregiverWallet      // Rastreamento de saldo total
- StripePaymentHold    // Holds do Stripe para Escrow
```

---

## 5. API Endpoints

### POST `/api/contracts/{id}/weekly-approvals/create`

**Triggerado por:** Webhook Easypay (após €5 taxa pago)

**Validação:**
- Contract owner = authenticated user
- Contract status = PENDING_PAYMENT
- Contract fee just paid

**Lógica:**
1. Calcula: `dailyRate = contract.totalEurCents / 30`
2. Para cada semana 1-4:
   - Calcula dias reais (semana 1 pode ter X dias, 2-4 = 7 dias)
   - `weeklyAmountCents = dailyRate * daysInWeek`
   - `platformFeeCents = weeklyAmountCents * contract.platformFeePct`
   - `caregiverAmountCents = weeklyAmountCents - platformFeeCents`
   - Cria WeeklyPaymentApproval com status PENDING
3. Cria StripePaymentHold para semana 1 (status AUTHORIZED)

**Response:**
```json
{
  "success": true,
  "weeklyApprovals": [
    {
      "id": "wpa_001",
      "weekNumber": 1,
      "weeklyAmountCents": 3500,
      "platformFeeCents": 525,
      "caregiverAmountCents": 2975,
      "approvalDueAt": "2026-04-10T17:00:00Z",
      "status": "PENDING"
    },
    // ... weeks 2-4
  ],
  "stripePaymentHoldId": "ph_001"
}
```

---

### POST `/api/contracts/{id}/weekly-approvals/{week}/approve`

**Validação:**
- Family owns contract
- Week approval not past due + 72h
- Stripe hold still valid

**Lógica:**
1. Marca: `familyDecision = "APPROVED"`, `status = "APPROVED"`
2. Captura hold Stripe: `stripe.confirmPaymentIntent(holdId)`
3. Cria CaregiverTransfer (Stripe Connect)
4. Cria FamilyPayment (status COMPLETED)
5. Se week < 4: Auto-autoriza próxima semana's hold
6. Envia notificação cuidador

**Response:**
```json
{
  "success": true,
  "approval": {
    "weekNumber": 1,
    "status": "APPROVED",
    "capturedAt": "2026-04-08T14:30:00Z",
    "caregiverReceives": 2975,
    "nextWeekAuthorized": true
  }
}
```

---

### POST `/api/contracts/{id}/weekly-approvals/{week}/dispute`

**Payload:**
```json
{
  "reason": "Trabalho não foi feito como combinado"
}
```

**Lógica:**
1. Marca: `familyDecision = "DISPUTED"`, `familyNotes = reason`
2. VOID Stripe hold (não captura)
3. Cria SupportTicket (para admin mediar)
4. Envia notificação cuidador

**Response:**
```json
{
  "success": true,
  "dispute": {
    "weekNumber": 1,
    "status": "DISPUTED",
    "reason": "Trabalho não foi feito como combinado",
    "supportTicketId": "st_001",
    "adminWillReviewBy": "2026-04-10T17:00:00Z"
  }
}
```

---

### POST `/api/contracts/{id}/weekly-approvals/auto-approve-overdue`

**Trigger:** Cron job (a cada hora)

**Critério:**
- `status = "PENDING"`
- `approvalDueAt < now - 48 hours`
- `familyDecision = null`

**Lógica:**
1. Para cada aprovação expirada:
   - Executa lógica de aprovação (mesma do `/approve`)
   - Envia notificação: "Seu pagamento foi aprovado automaticamente"

**Purpose:** Garante que cuidador não perde dinheiro por indiferença da família

---

### GET `/api/contracts/{id}/weekly-approvals`

**Response:**
```json
{
  "contractId": "c_001",
  "totalApprovals": 4,
  "weeklyApprovals": [
    {
      "id": "wpa_001",
      "weekNumber": 1,
      "weeklyAmountCents": 3500,
      "approvalDueAt": "2026-04-10T17:00:00Z",
      "familyDecision": null,
      "status": "PENDING",
      "hoursUntilAutoApprove": 48,
      "canApprove": true,
      "canDispute": true
    },
    {
      "id": "wpa_002",
      "weekNumber": 2,
      "weeklyAmountCents": 3500,
      "approvalDueAt": "2026-04-17T17:00:00Z",
      "familyDecision": null,
      "status": "PENDING",
      "canApprove": false,  // Future week
      "canDispute": false
    }
  ]
}
```

---

### POST `/api/contracts/auto-renew`

**Trigger:** Background job (diariamente, verifica 3 dias antes do vencimento)

**Critério:**
- `status = "ACTIVE"`
- `endDate <= now + 3 days`
- `weeklyPaymentEnabled = true`

**Lógica:**
1. Para cada contrato:
   - Cria novo Contract (cópia dos termos)
   - `renewalContractId = newContractId`
   - Status novo = "PENDING_ACCEPTANCE"
   - Envia notificação: "Seu contrato com João renova em 3 dias"

---

## 6. Integração Stripe

### Novos Métodos em `src/lib/services/stripe.ts`

#### 1. `createPaymentHold()`

```typescript
async createPaymentHold(
  contractId: string,
  familyUserId: string,
  weeklyAmountCents: number,
  weekNumber: number
): Promise<{ paymentIntentId: string; clientSecret: string }> {
  // Cria PaymentIntent com setup_future_usage: 'off_session'
  // Status inicial: requires_confirmation (hold, não captura)
}
```

#### 2. `capturePaymentHold()`

```typescript
async capturePaymentHold(
  paymentIntentId: string
): Promise<{ chargeId: string; success: boolean }> {
  // Confirma PaymentIntent (captura a hold)
  // Cria charge na conta do Stripe
}
```

#### 3. `voidPaymentHold()`

```typescript
async voidPaymentHold(paymentIntentId: string): Promise<boolean> {
  // Cancela PaymentIntent (libera hold)
  // Sem cobrar a família
}
```

#### 4. `transferToCaregiverAccount()`

```typescript
async transferToCaregiverAccount(
  amountCents: number,
  caregiverConnectAccountId: string,
  metadata: { contractId: string; weekNumber: number }
): Promise<{ transferId: string }> {
  // Transfere fundos da conta Evyra para Caregiver's Stripe Connect
  // Usa Stripe Connect Transfers API
}
```

---

## 7. UI Components

### WeeklyApprovalPanel.tsx (NEW)

**Localização:** `/src/components/contracts/weekly-approval-panel.tsx`

**Props:**
```typescript
interface WeeklyApprovalPanelProps {
  contractId: string;
  weeklyApprovals: WeeklyPaymentApproval[];
  isFamily: boolean;
}
```

**Features:**
- Timeline visual com 4 semanas
- Cards por semana:
  - ✓ APPROVED (verde)
  - ⏳ PENDING (azul)
  - ✗ DISPUTED (vermelho)
  - ⭕ REFUNDED (cinzento)
- Semana atual com:
  - Botão "Aprovar" (verde, prominent)
  - Botão "Disputar" (vermelho)
  - Text area para motivo
- Countdown timer: "Auto-aprova em 48 horas"
- Cards mostrando:
  - Valor semanal
  - Platform fee
  - O que cuidador recebe

---

## 8. Fluxo de Dados Completo

```
FASE 1: INICIALIZAÇÃO (Dia 1)
├─ Family cria contrato
├─ Caregiver aceita
├─ Family paga €5 taxa
│  └─ Webhook: POST /api/contracts/{id}/weekly-approvals/create
│     ├─ Cria 4 WeeklyPaymentApproval
│     └─ Cria StripePaymentHold semana 1
└─ Notificação: Contrato ACTIVE

FASE 2: SEMANAS 1-4 (Cada Sexta 17h)
├─ Family aprova OU disputa OU deixa timeout
│
├─ SE APROVA:
│  ├─ POST /api/contracts/{id}/weekly-approvals/{week}/approve
│  ├─ Captura Stripe hold
│  ├─ Cria CaregiverTransfer
│  ├─ Cria FamilyPayment (COMPLETED)
│  ├─ Auto-autoriza próxima semana
│  └─ Notificação: Caregiver recebe €X
│
├─ SE DISPUTA:
│  ├─ POST /api/contracts/{id}/weekly-approvals/{week}/dispute
│  ├─ VOID Stripe hold
│  ├─ Cria SupportTicket
│  ├─ Admin medeia
│  └─ Resultado: aprovação parcial ou reembolso
│
└─ SE TIMEOUT (48-72h):
   ├─ Cron: POST /api/api/contracts/{id}/weekly-approvals/auto-approve-overdue
   ├─ Auto-aprova
   ├─ Notificação: "Aprovado automaticamente"
   └─ Caregiver recebe €X

FASE 3: RENOVAÇÃO (Dia 27-30)
├─ Cron: POST /api/contracts/auto-renew
├─ Cria novo contrato (PENDING_ACCEPTANCE)
├─ Ambos aceitam
├─ Family paga €5 nova
├─ Novo contrato ACTIVE
├─ Cria 4 novos WeeklyPaymentApproval
└─ Contrato velho fecha

FASE 4: CICLOS CONTÍNUOS
└─ Repetir FASE 2 e 3 indefinidamente
```

---

## 9. Segurança e Conformidade

### Proteção Legal

| Ponto | Implementação | Rationale |
|-------|--------------|-----------|
| **Não é escrow legal** | Stripe segura fundos, Evyra não | Evyra = intermediária, não custodiária |
| **Não cria vínculo emprego** | Contrato curto (30 dias) + renovável | Não é relação contínua |
| **Família tem controle** | Aprovação semanal obrigatória | Família decide cada pagamento |
| **Cuidador protegido** | Auto-aprovação após 48-72h | Garante recebimento |
| **Admin não arbitra** | Apenas modera, decision = família | Evyra não responsável |
| **Auditoria completa** | Todos eventos logados com timestamp | Transparência total |

### Edge Cases Tratados

| Cenário | Handling | Objetivo |
|---------|----------|----------|
| Hold Stripe expira (7 dias) | Cron recria + estende prazo 48h | Não perder pagamento |
| Caregiver Stripe desconecta | Auto-hold, não captura, avisa admin | Proteção fundos |
| Disputa + payment capturado | Reembolso automático | Justiça |
| Contrato cancela mid-cycle | Void todos holds + refund captures | Integridade |
| Week 4 approved mas não renova | Auto-renew garante novo antes | Continuidade |

---

## 10. Changelog e Rastreamento

### Mudanças de Schema

1. **Novo Model:** `WeeklyPaymentApproval`
   - Tabela com 14 campos
   - 3 índices para performance

2. **Contract Model - Adicionar 3 campos:**
   - `weeklyPaymentEnabled: Boolean @default(false)`
   - `paymentCycleStartDate: DateTime?`
   - `renewalContractId: String?`

3. **Reutilização (0 mudanças):**
   - `FamilyPayment`
   - `StripePaymentHold`
   - `CaregiverTransfer`
   - `CaregiverWallet`

### Novos Endpoints (5 cores + 1 helper)

1. `POST /api/contracts/{id}/weekly-approvals/create`
2. `POST /api/contracts/{id}/weekly-approvals/{week}/approve`
3. `POST /api/contracts/{id}/weekly-approvals/{week}/dispute`
4. `POST /api/contracts/{id}/weekly-approvals/auto-approve-overdue`
5. `GET /api/contracts/{id}/weekly-approvals`
6. `POST /api/contracts/auto-renew`

### Novos Métodos Stripe (4)

1. `createPaymentHold()`
2. `capturePaymentHold()`
3. `voidPaymentHold()`
4. `transferToCaregiverAccount()`

### UI Components (1 novo + 3 edições)

1. **NEW:** `WeeklyApprovalPanel.tsx`
2. **EDIT:** `/app/contracts/[id]/page.tsx` - add tab
3. **EDIT:** `/app/caregiver/dashboard/page.tsx` - add widget
4. **EDIT:** `/admin/contracts/[id]/page.tsx` - add tab

---

## 11. Timeline de Implementação

| Fase | Duração | Tasks |
|------|---------|-------|
| **1. Database** | 3 dias | Schema + migration + índices |
| **2. Stripe** | 4 dias | 4 novos métodos + webhooks |
| **3. API Endpoints** | 5 dias | 6 endpoints + validações |
| **4. Auto-Renew** | 3 dias | Lógica + scheduler |
| **5. UI** | 4 dias | Components + pages |
| **6. Testing** | 3 dias | Unit + integration + E2E |
| **7. Docs** | 2 dias | README + user guides |

**Total: 24 dias = ~3-4 semanas (1 dev)**

---

## 12. Decisões de Design (USER CHOICES)

✅ **Auto-Approve Decision:** Após 48-72h de vencimento  
✅ **Weekly Amount Calculation:** Valor diário × dias reais da semana  
✅ **Contract Max Duration:** 30 dias (renovável)  
✅ **Tax Recurrence:** Nova €5 taxa a cada renovação de 30 dias  
✅ **Dispute Handling:** Admin modera, family final decision  
✅ **Backward Compatibility:** 100% - campos opcionais, contratos antigos não afetados  

---

## 13. Próximas Ações

### Phase 1: Database (Semana 1)
- [ ] Criar migration para WeeklyPaymentApproval
- [ ] Adicionar 3 campos a Contract
- [ ] Criar índices
- [ ] Testar schema

### Phase 2: Stripe (Semana 1-2)
- [ ] Implementar 4 novos métodos em stripe.ts
- [ ] Estender webhook handler
- [ ] Testes Stripe com account teste

### Phase 3: API (Semana 2)
- [ ] POST /create endpoint
- [ ] POST /approve endpoint
- [ ] POST /dispute endpoint
- [ ] GET endpoint
- [ ] POST /auto-approve-overdue
- [ ] POST /auto-renew

### Phase 4: UI (Semana 3)
- [ ] WeeklyApprovalPanel component
- [ ] Contract detail page updates
- [ ] Caregiver dashboard widget
- [ ] Admin panel updates

### Phase 5: Testing (Semana 3-4)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual QA

---

## Referências

- **Documentos Relacionados:**
  - `/docs/PAYMENT_ARCHITECTURE.md` - Arquitetura geral de pagamentos
  - `/docs/IMPLEMENTATION_ROADMAP.md` - Roadmap de 10 semanas
  
- **Modelos Existentes (Reutilizar):**
  - `prisma/schema.prisma` - FamilyPayment, StripePaymentHold, CaregiverTransfer
  
- **Padrões Existentes (Seguir):**
  - `src/lib/services/stripe.ts` - Método createContractFeeCheckout()
  - `src/app/api/webhooks/stripe/route.ts` - handleWebhook() pattern
  - `src/components/contracts/payment-section.tsx` - UI pattern

---

**Documento criado:** 2026-04-06  
**Status:** ✅ APROVADO E DOCUMENTADO  
**Pronto para Implementação**
