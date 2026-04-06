# 📚 PESQUISA: Modelos de Pagamento em Plataformas de Marketplace

## 🔍 O Que Aprendi de Upwork, Workana e Freelancer.pt

---

## 1️⃣ UPWORK

### Como Funciona
- **Modelo**: Project Funds (não é escrow legal, mas funciona como tal)
- **Quem segura dinheiro**: Upwork (em conta própria, não em contas segregadas)
- **Fluxo Fixed-Price**:
  1. Cliente deposita primeira milestone
  2. Upwork **segura** (não cobra cartão ainda)
  3. Freelancer entrega trabalho
  4. Cliente aprova em até 14 dias
  5. Se não aprova/disputa: Upwork arbitra
  6. Upwork libera para freelancer

### Proteção
- ✅ **Cliente**: Não paga se não gostar
- ✅ **Freelancer**: Sabe que dinheiro existe antes de trabalhar
- ❌ **Custo**: Upwork não revela % exato da comissão

### Importante
- Se cliente não deposita, Upwork **não pode ajudar** a recuperar pagamento depois
- Upwork trabalha como intermediário entre cliente e freelancer
- Upwork **NÃO** é Payment Institution (é empresa de serviços)

**Fonte**: [Upwork Payment Protection](https://support.upwork.com/hc/en-us/articles/211062568-How-Upwork-protects-your-payments)

---

## 2️⃣ WORKANA

### Como Funciona
- **Modelo**: Escrow LEGAL (terceira parte segura oficialmente)
- **Quem segura dinheiro**: Workana (conta regulada/segregada)
- **Fluxo**:
  1. Cliente faz "Security Deposit" (escrow)
  2. Dinheiro para **definitivamente** em Workana
  3. Freelancer trabalha
  4. Cliente aprova trabalho
  5. Workana **libera para freelancer**
  6. Se não aprova: Workana **devolve ao cliente**

### Proteção
- ✅ **Cliente**: Dinheiro 100% seguro (Workana assume risco)
- ✅ **Freelancer**: Sabe que dinheiro EXISTE e está seguro
- ✅ **Ambos**: Workana arbitra disputas (com ativo real)

### Diferença Crítica
- Workana tem **conta bancária própria** onde segura fundos
- Escrow é legal porque Workana é intermediário regulado
- Comissão está incluída no "escrow fee"

**Fonte**: [Workana Escrow System](https://i.workana.com/glossary/what-is-escrow/)

---

## 3️⃣ STRIPE CONNECT - A SOLUÇÃO MODERNA

### Como Plataformas Modernas Evitam Ser Custódia

```
ANTES (Modelo Antigo):
├─ Plataforma recebe $
├─ Plataforma segura em conta própria
└─ ⚠️ Plataforma RESPONSÁVEL por fundos (risco legal/financeiro)

AGORA (Stripe Connect):
├─ Cliente paga → Stripe captura
├─ Stripe segura (não plataforma!)
├─ Plataforma aprova/libera (lógica business)
└─ Stripe transfere para prestador
     └─ ✅ Plataforma é "invisível" no fluxo de $
```

### Vantagens Stripe Connect
1. **Zero custódia**: Plataforma nunca toca $ real
2. **PSD2 compliant**: Stripe é Payment Institution regulada
3. **Proteção automática**: 30 dias de hold máximo
4. **Comissão automática**: Stripe deduz % direto
5. **Saques diretos**: Prestador tira $ diretamente para banco

### Como Funciona Escrow-like com Stripe

```typescript
// SEM CAPTURAR AINDA (hold)
payment_intent = stripe.PaymentIntents.create({
  amount: 5000,
  currency: 'eur',
  capture_method: 'manual'  // 🔑 CHAVE!
})

// Família aprova trabalho
stripe.PaymentIntents.capture(payment_intent.id)

// Stripe automaticamente:
// 1. Cobra a cartão da Família
// 2. Deduz comissão (15% de Evyra)
// 3. Transfere resto para Cuidador
```

**Fonte**: [Stripe Connect Documentation](https://stripe.com/resources/more/how-to-accept-payments-as-a-freelancer-and-how-to-choose-the-right-payment-methods)

---

## 🏛️ REGULAÇÃO EUROPEIA (PSD2)

### O Que É PSD2?
- **Diretiva Europeia**: Payment Services Directive 2
- **Objetivo**: Segurança, transparência, proteção do consumidor em pagamentos
- **Impacto**: Portugal está **100% vinculado** (Lei n. 10/2018)

### Quem Precisa de Licença PSD2?
- ✅ **Payment Institutions** (plataformas que seguram dinheiro)
- ✅ **EMI** (Electronic Money Institutions)
- ✅ **Banks**
- ❌ **Software Providers** (Evyra é isso! - não precisa licença se usar Stripe)

### Por Que Stripe + Evyra é Compliant?

```
Regra PSD2:
"Apenas instituições financeiras podem segur fundos de clientes"

Solução:
Evyra (Software) + Stripe (Payment Institution) = LEGAL ✅

Evyra:
├─ Não segura $
├─ Não é Payment Institution
├─ Apenas gerencia lógica
└─ Risco = ZERO

Stripe:
├─ É Payment Institution (licença regulatória)
├─ Segura fundos legalmente
├─ Responsável por proteção
└─ Segurado até €100k (garantia EU)
```

**Fonte**: [Banco de Portugal - PSD2](https://www.bportugal.pt/en/page/legislation-and-regulations-psd2)

---

## 📊 COMPARATIVO FINAL

| Feature | Upwork | Workana | Freelancer.pt | Evyra (Proposto) |
|---------|--------|---------|---------------|------------------|
| **Quem segura $** | Upwork (conta própria) | Workana (escrow legal) | Não encontrado | Stripe (regulado) |
| **PSD2 Compliant** | ⚠️ Não regulado | ⚠️ Depende de país | ⚠️ Desconhecido | ✅ Sim (via Stripe) |
| **Saques diretos** | ❌ Apenas via Upwork | ❌ Apenas via Workana | ❌ Desconhecido | ✅ Stripe Connect |
| **Carteira permanente** | ✅ Sim | ✅ Sim | ❌ Desconhecido | ⚠️ Apenas Cuidador |
| **Comissão transparente** | ❌ Não divulga | ✅ Sim | ❌ Desconhecido | ✅ 15% clara |
| **Disputa/arbitragem** | ✅ Upwork arbitra | ✅ Workana arbitra | ❌ Desconhecido | ✅ Stripe + Evyra |

---

## ⚠️ ERRO CRÍTICO A EVITAR

### ❌ NUNCA FAÇA ISSO
```
Família deposita € em conta Evyra
    ↓
Evyra segura enquanto cuidador trabalha
    ↓
Evyra transfere para cuidador
```

**Por quê?**
1. Evyra vira **Money Transmitter** (regulação PSD2)
2. Precisa de **licença** (muito caro/complexo)
3. Responsável legalmente pelos fundos
4. **Seguro de custódia** obrigatório (€100k+)
5. **Auditoria anual** (externo)
6. Risco de congelamento de contas

### ✅ FAÇA ASSIM (Stripe)
```
Família fornece cartão
    ↓
Stripe captura + segura (não Evyra!)
    ↓
Evyra aprova (lógica business)
    ↓
Stripe transfere para Cuidador
```

**Por quê?**
1. Evyra é apenas **Software Provider**
2. Sem licença necessária
3. Stripe assume responsabilidade
4. Stripe é segurado/regulado
5. Zero risco jurídico para Evyra

---

## 🎯 INSIGHTS CRÍTICOS

### 1. Upwork ≠ Modelo Ideal para Portugal
- Upwork não é regulado como Payment Institution
- Modelo é arriscado para UE (PSD2)
- Funciona porque é baseado em US (diferente regulação)
- **Não replicar para Evyra**

### 2. Workana = Modelo Correto, Mas Complexo
- Escrow legal é melhor proteção
- Mas requer conta bancária segregada
- Requer regulação/licença
- Muito custo/complexidade para startup

### 3. Stripe Connect = Sweet Spot para Evyra
- Plataforma não segura nada
- Stripe faz todo trabalho pesado
- Stripe assume risco legal
- PSD2 compliant automaticamente
- Menos custo, menos complexidade
- Mais fácil de escalar

### 4. Diferença Família vs Cuidador é REAL
- Cuidador precisa de carteira (segura fundos temporários)
- Família não precisa de carteira (paga direto)
- Modelos completamente diferentes
- Não podem ser misturados

---

## 💡 ARQUITETURA EVYRA = HYBRID

```
VISIBILIDADE (Boost):
├─ Paga direto via Stripe
├─ Stripe credita Evyra (revenue)
└─ Sem escrow (serviço entregue)

SERVIÇO (Contract):
├─ Paga via Stripe (manual hold)
├─ Stripe segura enquanto trabalha
├─ Evyra aprova
├─ Stripe transfere para Cuidador
└─ Com escrow-like (proteção)

SAQUES (Cuidador):
├─ Cuidador via Stripe Connect
├─ Direto para conta bancária
└─ Sem Evyra (invisível)
```

---

## 📋 DOCUMENTAÇÃO LEGAL NECESSÁRIA

### Antes de Produção
1. ✅ Consultar advogado (PSD2/GDPR/Portugal)
2. ✅ Rever Termos de Serviço (clarificar Evyra = intermediário)
3. ✅ Rever Política Privacidade (compartilhamento Stripe)
4. ✅ Criar Política de Reembolso (quando devolve)
5. ✅ Termos Stripe (linked/aceitos no pagamento)

---

## 🚀 PRÓXIMAS AÇÕES

1. **Conversa com advogado**: Validar modelo Stripe + Evyra (PSD2 compliance)
2. **Setup Stripe Connect**: Integração dev/testing
3. **Reescrever Wallet**: Separar Família/Cuidador
4. **Webhook handlers**: Payment, transfer, payout
5. **Testes e/2e**: Simular fluxos completos
6. **Deploy gradual**: Beta users antes de 100%

