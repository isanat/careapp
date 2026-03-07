# Guia de Configuração do Stripe

## 🔐 Suas Credenciais (já configuradas no .env)

```
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SvjgYJVhqFkiHpsfhfcO4yIyTXYM0fSLqQb6R876Dn15JiHcZz3VXbLf48HP0OAiVVMQ1GWyzrvDR90apniSIWR00unSHtKck
```

⚠️ **IMPORTANTE**: Estas são chaves de **PRODUÇÃO** (sk_live_). Transações reais serão cobradas!

---

## 📋 Passo 1: Criar o Webhook

1. Acesse: **https://dashboard.stripe.com/webhooks**
2. Clique no botão **"+ Add endpoint"**
3. Preencha:

   **Endpoint URL:**
   ```
   https://careapp-pied.vercel.app/api/webhooks/stripe
   ```

   **Events to listen to** (clique em "Select events"):
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.captured`
   - ✅ `charge.refunded`
   - ✅ `account.updated` (para Stripe Connect)

4. Clique em **"Add endpoint"**

5. Após criar, você verá o **Signing secret** que começa com `whsec_...`
   
   **Copie esse valor e coloque no .env:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
   ```

---

## 📋 Passo 2: Ativar Stripe Connect (para Escrow)

1. Acesse: **https://dashboard.stripe.com/settings/connect**
2. Clique em **"Get started"** ou **"Enable Connect"**
3. Preencha as informações da sua plataforma:
   - Platform name: `Senior Care`
   - Platform URL: `https://careapp-pied.vercel.app`
   
4. Após ativar, vá em **Settings** → **Connect** → **Settings**
5. Procure por **"Client ID"** (começa com `ca_...`)

   **Copie e coloque no .env:**
   ```
   STRIPE_CLIENT_ID=ca_xxxxxxxxxxxxxxxxx
   ```

---

## 📋 Passo 3: Atualizar o .env

Após obter os valores, edite o arquivo `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_SEU_WEBHOOK_SECRET_AQUI
STRIPE_CLIENT_ID=ca_SEU_CLIENT_ID_AQUI
```

---

## 🧪 Recomendação: Usar Modo de Teste Primeiro

Para testar sem cobrar dinheiro real:

1. No dashboard do Stripe, clique no botão **"Test mode"** no topo
2. Vá em **Developers** → **API keys**
3. Copie as chaves de TESTE:
   - `pk_test_...` (Publishable key)
   - `sk_test_...` (Secret key)
4. Substitua no .env:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
5. Crie um novo webhook para o modo de teste (mesmo processo)

---

## 📞 Próximos Passos

Após configurar:
1. Me avise que tenho o webhook secret
2. Vou implementar o sistema de Escrow Payments
3. Testaremos o fluxo completo de pagamentos

---

## 🔗 Links Úteis

- Dashboard Stripe: https://dashboard.stripe.com/
- Webhooks: https://dashboard.stripe.com/webhooks
- Connect Settings: https://dashboard.stripe.com/settings/connect
- API Keys: https://dashboard.stripe.com/test/apikeys (modo teste)
- API Keys (produção): https://dashboard.stripe.com/apikeys
