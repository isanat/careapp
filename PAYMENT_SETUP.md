# Guia de Configuração de Pagamentos - IdosoLink

## 🇵🇹 Easypay (Principal - Portugal)

### Obter Credenciais Easypay

1. Acesse: **https://backoffice.easypay.pt/**
2. Crie uma conta ou faça login
3. Vá em **API Keys** ou **Configurações** → **API**
4. Copie:
   - **API Key**
   - **Account ID**

### Configurar no .env

```env
EASYPAY_ENV=test
EASYPAY_API_KEY=sua_api_key_aqui
EASYPAY_ACCOUNT_ID=seu_account_id_aqui
```

### Métodos de Pagamento Suportados

| Método | Descrição | Status |
|--------|-----------|--------|
| MB Way | Pagamento por telemóvel | ✅ |
| Multibanco | Referência bancária | ✅ |
| Cartão | Crédito/Débito | ✅ |

### Webhook Easypay

1. No backoffice Easypay, vá em **Configurações** → **Callbacks**
2. Adicione URL: `https://careapp-pied.vercel.app/api/webhooks/easypay`
3. Selecione eventos de pagamento

---

## 🌍 Stripe (Secundário - Europa)

### Credenciais já configuradas ✅

```
STRIPE_SECRET_KEY=sk_live_... ✅
STRIPE_PUBLISHABLE_KEY=pk_live_... ✅
STRIPE_WEBHOOK_SECRET=whsec_... ✅
```

### Faltando: Client ID para Stripe Connect

1. Acesse: **https://dashboard.stripe.com/settings/connect**
2. Ative o Stripe Connect
3. Copie o **Client ID** (`ca_...`)

---

## 📋 Resumo de Arquivos Criados

```
src/lib/services/easypay.ts           # Serviço Easypay
src/app/api/payments/easypay/route.ts # API de pagamentos
src/app/api/webhooks/easypay/route.ts # Webhook handler
src/components/payment/payment-method-selector.tsx # UI
```

---

## 🔐 Variáveis de Ambiente

| Variável | Obrigatório | Status |
|----------|-------------|--------|
| `EASYPAY_API_KEY` | ✅ Sim | ❌ Pendente |
| `EASYPAY_ACCOUNT_ID` | ✅ Sim | ❌ Pendente |
| `EASYPAY_ENV` | ✅ Sim | ✅ test |
| `STRIPE_SECRET_KEY` | ⚠️ Opcional | ✅ Configurado |
| `STRIPE_PUBLISHABLE_KEY` | ⚠️ Opcional | ✅ Configurado |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Opcional | ✅ Configurado |
| `STRIPE_CLIENT_ID` | ⚠️ Opcional | ❌ Pendente |

---

## 🚀 Próximos Passos

1. **Criar conta Easypay** em https://backoffice.easypay.pt/
2. **Obter API Key e Account ID**
3. **Adicionar ao .env:**
   ```
   EASYPAY_API_KEY=sua_chave
   EASYPAY_ACCOUNT_ID=seu_account_id
   ```
4. **Testar pagamentos** em modo de teste
5. **Passar para produção** alterando `EASYPAY_ENV=production`

---

## 📞 Links Úteis

- Easypay Dashboard: https://backoffice.easypay.pt/
- Easypay Docs: https://docs.easypay.pt/docs
- Stripe Dashboard: https://dashboard.stripe.com/
- Stripe Connect: https://dashboard.stripe.com/settings/connect
