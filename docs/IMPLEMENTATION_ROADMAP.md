# 🗓️ ROADMAP DE IMPLEMENTAÇÃO - ARQUITETURA DE PAGAMENTOS

## TIMELINE COMPLETA

```
SEMANA 1: Setup Stripe Connect (2-3 dias)
├─ ✅ Criar conta Stripe Connect
├─ ✅ APIs e chaves configuradas
├─ ✅ Webhook endpoints criados (/api/webhooks/stripe)
├─ ✅ Testes de conexão (unit tests)
└─ ENTREGA: Stripe integrado e funcionando

SEMANA 2: Modelos de Dados (3-4 dias)
├─ ✅ Deletar Wallet (antiga)
├─ ✅ Criar CaregiverWallet
├─ ✅ Criar CaregiverTransfer
├─ ✅ Criar CaregiverWithdrawal
├─ ✅ Criar FamilyCredit
├─ ✅ Criar FamilyPayment
├─ ✅ Migrations
├─ ✅ Testes de schema
└─ ENTREGA: Schema novo em produção

SEMANA 3: Fluxo Visibilidade/Boost (1 semana)
├─ ✅ POST /api/demands/[id]/boost (Stripe checkout)
├─ ✅ Webhook: checkout.session.completed
├─ ✅ Update Demand.visibilityPackage
├─ ✅ Create VisibilityPurchase
├─ ✅ Frontend: Boost checkout page
├─ ✅ Success/cancel pages
├─ ✅ Testes e/2e
└─ ENTREGA: Boost funcionando (nova Demanda com visibilidade paga)

SEMANA 4: Fluxo Serviço Parte 1 (1 semana)
├─ ✅ POST /api/contracts (criar contrato)
├─ ✅ GET /api/contracts (listar contratos)
├─ ✅ PUT /api/contracts/[id] (atualizar status)
├─ ✅ POST /api/proposals (enviar proposta)
├─ ✅ POST /api/proposals/[id]/accept (aceitar)
├─ ✅ Testes
└─ ENTREGA: Contrato e propostas funcionando

SEMANA 5: Fluxo Serviço Parte 2 (1 semana)
├─ ✅ POST /api/contracts/[id]/authorize-payment
│  └─ Stripe Payment Intent (capture_method: manual)
├─ ✅ Webhook: payment_intent.amount_capturable_updated
├─ ✅ Create StripePaymentHold
├─ ✅ Frontend: Payment confirmation
├─ ✅ Email notifications
├─ ✅ Testes
└─ ENTREGA: Pagamento autorizado (em hold)

SEMANA 6: Fluxo Serviço Parte 3 (1 semana)
├─ ✅ PUT /api/contracts/[id]/mark-complete (cuidador)
├─ ✅ PUT /api/contracts/[id]/approve (família)
├─ ✅ Webhook: payment_intent.capture()
├─ ✅ Stripe automatic transfer to Caregiver
├─ ✅ Update CaregiverWallet
├─ ✅ Create CaregiverTransfer
├─ ✅ Testes
└─ ENTREGA: Pagamento capturado e transferido

SEMANA 7: Saques (1 semana)
├─ ✅ GET /api/caregiver/wallet (ver saldo)
├─ ✅ POST /api/caregiver/withdraw (sacar)
├─ ✅ Stripe Payout integration
├─ ✅ Create CaregiverWithdrawal
├─ ✅ Frontend: Wallet page + withdraw button
├─ ✅ Testes
└─ ENTREGA: Cuidador consegue sacar

SEMANA 8: Disputas & Compliance (1 semana)
├─ ✅ Dispute flow (rejeitar trabalho)
├─ ✅ Stripe dispute handling
├─ ✅ Refund flow (se disputado)
├─ ✅ Admin dashboard para disputas
├─ ✅ Compliance docs (termos, privacidade)
├─ ✅ Legal review
└─ ENTREGA: Sistema completo + docs legais

SEMANA 9: Testes, Polish, Deploy (1 semana)
├─ ✅ Testes e/2e completos
├─ ✅ Load testing (Stripe webhooks)
├─ ✅ Security audit
├─ ✅ Performance optimization
├─ ✅ UX polish
└─ ENTREGA: Beta ready

SEMANA 10: Beta Deployment (1 semana)
├─ ✅ Deploy para ambiente beta
├─ ✅ Monitoramento 24/7
├─ ✅ Bug fixes rápidos
├─ ✅ User feedback collection
└─ ENTREGA: Live com beta users (5-10 pessoas)

TOTAL: ~10 semanas para produção completa
```

---

## 📊 ROADMAP VISUAL

```
         SETUP STRIPE    MODELOS   BOOST   SERVIÇO  SAQUES  DISPUTAS  TESTES  BETA
         ────────────────────────────────────────────────────────────────────────
SEMANA 1 [████░░░░░░░░]
SEMANA 2 [░░████░░░░░░]
SEMANA 3 [░░░░████░░░░]
SEMANA 4 [░░░░░░████░░]
SEMANA 5 [░░░░░░░░████]
SEMANA 6 [░░░░░░░░░░██]
SEMANA 7 [░░░░░░░░░░░░]
SEMANA 8 [░░░░░░░░░░░░]
SEMANA 9 [░░░░░░░░░░░░]
SEMANA 10[░░░░░░░░░░░░]
         ────────────────────────────────────────────────────────────────────────
```

---

## 🎯 MILESTONES CRÍTICOS

### Milestone 1: ✅ STRIPE PRONTO
- [ ] Conta Stripe verificada
- [ ] Keys configuradas (.env)
- [ ] Webhook secret adicionado
- [ ] Primeira transação de teste bem-sucedida

**Blocker**: Nenhum - continua mesmo que falhe

---

### Milestone 2: ✅ BOOST FUNCIONANDO
- [ ] Família cria demanda
- [ ] Seleciona pacote PREMIUM
- [ ] Paga €8 via Stripe
- [ ] Recebe confirmação
- [ ] Demanda mostra "PREMIUM" no marketplace

**Blocker**: Crítico - testa fluxo Stripe completo

---

### Milestone 3: ✅ PROPOSTA → CONTRATO
- [ ] Cuidador propõe (€12/h, 20h)
- [ ] Família aceita
- [ ] Contrato criado (status: PENDING_PAYMENT)
- [ ] Ambos recebem emails

**Blocker**: Médio - valida lógica de contrato

---

### Milestone 4: ✅ PAGAMENTO AUTORIZADO
- [ ] Família clica "Confirmar Pagamento"
- [ ] Stripe autoriza (soft hold) €240
- [ ] Cuidador vê "Em andamento"
- [ ] Família vê "Aguardando conclusão"

**Blocker**: Crítico - valida escrow-like

---

### Milestone 5: ✅ PAGAMENTO CAPTURADO
- [ ] Cuidador marca "Trabalho completo"
- [ ] Família aprova
- [ ] Stripe **captura** (cobra de verdade) €240
- [ ] Stripe transfere €204 para Cuidador
- [ ] CaregiverWallet mostra +€204

**Blocker**: Crítico - valida transfer automático

---

### Milestone 6: ✅ SAQUE FUNCIONANDO
- [ ] Cuidador ve saldo €204
- [ ] Clica "Sacar €204"
- [ ] Stripe payout iniciado
- [ ] 1-3 dias depois: dinheiro em conta real do Cuidador

**Blocker**: Crítico - valida fluxo completo

---

## 🏁 CRITÉRIO DE SUCESSO

### Antes de Produção 100%
```
✅ Stripe configurado e testado
✅ Todos 4 fluxos funcionando (boost, auth, capture, payout)
✅ Webhooks confiáveis (retry logic, idempotência)
✅ UX clara (família entende o que paga)
✅ Documentação legal revisada por advogado
✅ Testes e/2e cobrindo 90% dos fluxos
✅ Zero transações perdidas em bancos de dados
✅ Alerts configurados (Stripe errors, failed payouts)
```

---

## 📋 TAREFAS POR PRIORIDADE

### 🔴 CRÍTICAS (Bloqueia tudo)
- [ ] Setup Stripe Connect
- [ ] Implementar CaregiverWallet
- [ ] Fluxo boost (boost deve funcionar)
- [ ] Manual capture (family approval triggers charge)

### 🟡 IMPORTANTES (Afeta UX)
- [ ] Fluxo contrato completo
- [ ] Saques funcionando
- [ ] Disputas/refunds

### 🟢 NICE-TO-HAVE
- [ ] Analytics por package type
- [ ] Email templates premium
- [ ] Mobile optimization

---

## 🛑 RISCOS TÉCNICOS

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Webhook Stripe não confiável | Alto | Retry logic (exponential backoff) |
| Transação perdida | Crítico | Idempotência (idempotency keys) |
| Family cancela, não reembolsa | Alto | Void payment intent antes de capture |
| Stripe transfer falha | Alto | Queue + alertas + manual recovery |
| Taxa de comissão incorreta | Médio | Unit tests para cálculos |
| Cuidador não consegue sacar | Crítico | Support manual + escalation |

---

## 💾 BACKUP & DISASTER RECOVERY

```
Cenário 1: Stripe down (raro)
├─ Payment Intent criado (status = unknown)
├─ Retry em 5 min
├─ Se continua: escalação manual + alert

Cenário 2: Transfer falha
├─ VisibilityPurchase criado (status = PENDING)
├─ Retry automático via job queue
├─ Se falha 3x: suporte manual

Cenário 3: Webhook duplicado
├─ Idempotency key previne duplicata
├─ Database: unique constraint em stripeXXXId
├─ Log de tentativas

Cenário 4: Database inconsistência
├─ Backup diário do Turso
├─ Reconciliation job (verifica Stripe vs DB)
├─ Alertas se divergências encontradas
```

---

## 📞 SUPORTE & ESCALAÇÃO

### Nível 1: Automático
```
Webhook recebido
  ├─ Processa com retry logic
  ├─ Se falha 3x: escalação para Nível 2
  └─ Alert no Slack #payments
```

### Nível 2: Manual Investigation
```
Payment status ambíguo
  ├─ Verificar status em Stripe Dashboard
  ├─ Reconciliar com database
  ├─ Se OK: sync (não fazer nada)
  └─ Se problema: escalação Nível 3
```

### Nível 3: Manual Intervention
```
Transferência falhada ou cancelada
  ├─ Admin pode redirecionar/reembolsar manualmente
  ├─ Requer logging/auditoria
  └─ Notificar usuário + suporte
```

---

## 🎯 PRÓXIMAS AÇÕES (Este Mês)

### Semana 1
- [ ] Reunião com advogado (validar PSD2 compliance)
- [ ] Setup Stripe Connect (account + API keys)
- [ ] Start implementação models

### Semana 2-3
- [ ] Fluxo boost completo
- [ ] Deploy para staging
- [ ] Testes manuais

### Semana 4+
- [ ] Fluxo serviço
- [ ] Saques
- [ ] Beta deployment

