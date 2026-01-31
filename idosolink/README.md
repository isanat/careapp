# IdosoLink UI Kit

UI Kit completo para o PWA **IdosoLink** (senior care / healthtech), com foco em cuidado, bem-estar e confiança.

## Stack
- Next.js (App Router)
- TypeScript
- TailwindCSS
- class-variance-authority (cva)
- clsx + tailwind-merge
- Radix UI (Dialog + Tabs)

## Rodando o projeto
```bash
npm install
npm run dev:web
```
Acesse: `http://localhost:3000`.

## Fluxo principal (passo a passo)
1. `/onboarding` → escolha perfil Familiar ou Cuidador.
2. `/app/activation` → simula ativação com €25 e cria a carteira.
3. `/app` → dashboard adaptativo.
4. `/app/search` → busca de cuidadores (ou propostas se cuidador).
5. `/app/contracts/new` → proposta de contrato com taxa de €5 em créditos.
6. `/app/contracts` → lista e filtros por status.
7. `/app/contracts/[id]` → detalhe, aceite e prova digital.
8. `/app/wallet` → saldo, histórico, compra de créditos, gorjetas, conversão.
9. `/app/settings` → perfil, modo simples/avançado e serviços do cuidador.

## UI Kit / Storybook-lite
As páginas do UI Kit estão em `/ui`:
- `/ui` → hub
- `/ui/tokens` → cores, tipografia, espaçamento e foco
- `/ui/icons` → pack de ícones (tamanhos e snippets)
- `/ui/components` → componentes e variações
- `/ui/screens` → telas mock (onboarding, activation, contract, wallet, modais)

## Stubs e integrações futuras
- **Stripe**: substituir `addTokens` e `redeemTokens` em `app/store.ts` por chamadas reais de checkout e payouts.
- **Web3**: o `sha256` e o hash do contrato são gerados em `lib/crypto.ts` para prova digital local.
  Em produção, troque o `txHash` por um registro on-chain real.
- **Backend**: conecte as entidades `contracts`, `caregivers` e `ledger` com a API real mantendo o formato do store.

## Estrutura principal
```
apps/web
  app/
    ui/
      page.tsx
      tokens/page.tsx
      icons/page.tsx
      components/page.tsx
      screens/page.tsx
    app/
      ...rotas do app
    layout.tsx
    page.tsx
  components/
    icons/
    ui/
  lib/
    cn.ts
    finance.ts
    crypto.ts
  styles/
    globals.css
```

## Componentes disponíveis
- Button (variants + sizes)
- Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- Input + Label + HelperText + ErrorText
- Select (nativo estilizado)
- Badge (success/info/warning/danger/neutral)
- Alert
- Tabs (Radix)
- Modal + Drawer
- BottomNav
- StatCard
- ListRow
- TokenAmount
- Stepper
- Skeleton

## Observações
- Design tokens via CSS variables em `styles/globals.css`.
- Paleta care-first com foco em acessibilidade e legibilidade.
