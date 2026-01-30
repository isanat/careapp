# IdosoLink PWA Marketplace

IdosoLink é um marketplace web (PWA) para cuidados de idosos com contratos digitais, pagamentos em euro via Stripe e uma camada de token utilitário pronta para Web3.

## ✅ Como rodar com Docker

```bash
docker compose up --build
```

Acesse: `http://localhost:3000`.

## Variáveis de ambiente

Crie `.env` (ou edite no `docker-compose.yml`):

```
DATABASE_URL=postgresql://idosolink:idosolink@localhost:5432/idosolink
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
STRIPE_SECRET_KEY=sk_test_replace
STRIPE_WEBHOOK_SECRET=whsec_replace
STRIPE_PUBLISHABLE_KEY=pk_test_replace
TOKEN_RATE=10
```

## Fluxos do sistema

1. **Login** → OTP/magic link.
2. **Onboarding** → escolha perfil Familiar ou Cuidador.
3. **Ativação (€25)** → Stripe → créditos em tokens na carteira.
4. **Contrato** → criação, aceite e hash on-chain (stub).
5. **Pagamentos** → comissão 15% e taxas de contrato em tokens.
6. **Gorjetas/Bonus** → tokens e possibilidade de conversão (burn).

## Onde integrar Web3 real

- `packages/web3/src/*` contém stubs (WalletService, TokenService, ContractOnchainService).
- Substitua pelos contratos ERC-20 e contrato de registro, mantendo a mesma interface.

## Banco de dados

Prisma schema: `packages/db/prisma/schema.prisma`

### Seed

```bash
npm run db:seed
```

Cria:
- 1 Familiar demo
- 3 Cuidadores demo
- 1 Contrato demo

## Estrutura

```
/idosolink
  /apps/web
  /packages/db
  /packages/core
  /packages/web3
  /packages/payments
```

