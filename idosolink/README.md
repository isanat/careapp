# IdosoLink · Bloom Visual System

Interface do IdosoLink migrada para linguagem visual inspirada no **Bloom Elements** (fonte única de layout), preservando as rotas e fluxos existentes.

## Stack
- Next.js (App Router)
- TypeScript
- TailwindCSS
- class-variance-authority (cva)
- clsx + tailwind-merge
- Radix UI (Dialog + Tabs)
- Zustand (persistência local)

## Como rodar
```bash
npm install
npm run dev:web
```
Acesse: `http://localhost:3000`.

## Fluxos principais
1. `/onboarding`
2. `/app/activation`
3. `/app` (dashboard)
4. `/app/search`
5. `/app/contracts/new`
6. `/app/contracts`
7. `/app/contracts/[id]`
8. `/app/wallet`
9. `/app/settings`

## UI hub
- `/ui`
- `/ui/tokens`
- `/ui/icons`
- `/ui/components`
- `/ui/screens`

## Integrações futuras (stubs)
- Stripe: conectar checkout real nos handlers de compra/ativação.
- Web3: substituir `txHash` stub por registro on-chain real.
- Backend: sincronizar contratos/carteira/ledger do store para API.
