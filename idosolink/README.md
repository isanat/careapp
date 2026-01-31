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

## UI Kit / Storybook-lite
As páginas do UI Kit estão em `/ui`:
- `/ui` → hub
- `/ui/tokens` → cores, tipografia, espaçamento e foco
- `/ui/icons` → pack de ícones
- `/ui/components` → componentes e variações
- `/ui/screens` → telas mock (Dashboard, Wallet, Contracts, Onboarding)

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
    layout.tsx
    page.tsx
  components/
    icons/
    ui/
  lib/
    cn.ts
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
