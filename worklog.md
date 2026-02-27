# Senior Care App - Development Worklog

## Project Overview
**Name:** Senior Care App (antigo IdosoLink)  
**Mission:** Marketplace de cuidados para idosos com sistema de tokens  
**Tech Stack:** Next.js 16, TypeScript, Turso DB, Prisma, NextAuth, shadcn/ui, Stripe

---

## Estado Atual do Projeto (Fev 2025)

### ✅ Funcionalidades Completas:

#### 1. Sistema de Autenticação
- Login com email/senha
- Registro com seleção de role (FAMILY/CAREGIVER)
- Pagamento de ativação (€35) via Stripe
- Criação automática de wallet com tokens iniciais

#### 2. Dashboard (Design Mobile-First Compacto)
- Visão diferenciada para Família e Cuidador
- Stats em grid compacto (4 colunas)
- Próximos passos com alertas
- Atividade recente em lista simples
- Quick actions em grid 2x

#### 3. Perfil (Design Mobile-First Compacto)
- Tabs: Info, Serviços (cuidador), Idoso (família), Contato, Config
- Edição inline com formulários compactos
- Stats para cuidador (contratos, avaliações, nota, valor/hora)
- Configurações integradas (push, tema, idioma, logout, apagar conta)

#### 4. Propostas (Cuidador) - Design Compacto
- Lista de propostas recebidas
- Tabs: Novas / Aceitas
- Cards compactos com info essencial
- Ações: Aceitar / Recusar
- Diálogos simplificados

#### 5. Carteira (Wallet) - Design Compacto
- Balance principal com ações inline
- Histórico de transações em lista simples
- Comprar tokens via Stripe
- Vender tokens (processamento simulado)

#### 6. Busca de Cuidadores
- Filtros por serviços, localização, preço
- Cards de cuidadores com rating
- Visualização de perfil

#### 7. Contratos
- Lista de contratos com status
- Criação de novo contrato (multi-step)
- Detalhes do contrato

#### 8. Chat em Tempo Real
- Socket.io microservice (porta 3003)
- Lista de conversas
- Mensagens em tempo real
- Status online/offline

#### 9. Sistema de Notificações
- API de notificações
- Dropdown no header
- Web Push preparado (VAPID keys necessárias)

#### 10. PWA (Progressive Web App)
- Manifest configurado
- Service Worker preparado
- Instalável em dispositivos móveis

### ⚠️ Funcionalidades Parciais:

#### 1. KYC (Verificação de Identidade)
- Schema preparado (verificationStatus, documentType, etc.)
- API Didit criada mas não integrada no frontend
- Página de verificação precisa ser criada

#### 2. Sistema de Pagamentos
- Stripe configurado para ativação e compra de tokens
- Escrow preparado mas não totalmente implementado
- Stripe Connect para cuidadores não implementado

#### 3. i18n (Traduções)
- Sistema implementado (useI18n hook)
- Apenas ~30% das páginas traduzidas
- Maioria ainda com texto hardcoded em português

### ❌ Funcionalidades Pendentes:

#### 1. Admin Panel
- APIs criadas mas UI incompleta
- Dashboard admin parcial
- Gestão de usuários, cuidadores, contratos

#### 2. Entrevista em Vídeo
- Validação da família pelo cuidador
- Integração com serviço de vídeo

#### 3. Sistema de Gorjetas (Tips)
- API criada
- UI não implementada

#### 4. Integração Blockchain
- Smart contracts criados (SeniorToken, ContractRegistry)
- Não deployados nem integrados

#### 5. Guia de Boas Práticas
- Seção educacional para cuidadores
- Não implementado

---

## Credenciais de Teste

| Email | Senha | Role | Status |
|-------|-------|------|--------|
| familia@teste.com | teste123 | FAMILY | ACTIVE |
| cuidador@teste.com | teste123 | CAREGIVER | ACTIVE |

---

## Estrutura de Arquivos Principal

```
src/
├── app/
│   ├── (public)/          # Páginas públicas (landing, como-funciona, etc.)
│   ├── app/               # App autenticado
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── profile/       # Perfil + configurações
│   │   ├── proposals/     # Propostas (cuidador)
│   │   ├── wallet/        # Carteira de tokens
│   │   ├── search/        # Busca cuidadores
│   │   ├── contracts/     # Contratos
│   │   └── chat/          # Chat em tempo real
│   ├── auth/              # Autenticação
│   │   ├── login/
│   │   ├── register/
│   │   ├── payment/
│   │   └── kyc/
│   └── api/               # APIs
│       ├── auth/
│       ├── user/
│       ├── caregivers/
│       ├── contracts/
│       ├── chat/
│       ├── notifications/
│       └── admin/
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # AppShell, Header, Footer
│   └── notifications/     # NotificationDropdown
├── hooks/
│   ├── useI18n.ts
│   └── useNotifications.ts
├── lib/
│   ├── db.ts              # Prisma client
│   ├── db-turso.ts        # Turso client
│   ├── auth-turso.ts      # NextAuth config
│   ├── i18n.ts            # Traduções
│   └── constants.ts       # Constantes do app
└── prisma/
    └── schema.prisma      # Schema do banco
```

---

## Constantes do App

| Constante | Valor |
|-----------|-------|
| Taxa de Ativação | €35 |
| Comissão Platform | 10% |
| Cuidador recebe | 90% |
| Valor Token | €0.01 |
| Bônus Ativação | 100 tokens |

---

## Próximos Passos Prioritários

### P0 - Crítico:
1. Implementar página de KYC para cuidadores
2. Traduzir todas as páginas (i18n)
3. Completar Admin Panel

### P1 - Alto:
1. Implementar gorjetas (tips) UI
2. Entrevista em vídeo
3. Push notifications (configurar VAPID)

### P2 - Médio:
1. Deploy smart contracts
2. Guia de boas práticas
3. Melhorar PWA offline

---

## Commits Recentes

| Commit | Descrição |
|--------|-----------|
| d7a2fef | refactor: compact mobile-first design, remove settings page |
| cc43238 | fix: merge profile and settings |
| ... | ... |

---

## Notas Técnicas

### Banco de Dados
- Usando Turso (SQLite edge) em produção
- Prisma para schema e migrações
- Sincronização feita manualmente entre Prisma e Turso

### Autenticação
- NextAuth.js v4
- Credentials provider
- Sessões JWT

### Styling
- Tailwind CSS 4
- shadcn/ui (New York style)
- Design mobile-first
- Tema claro/escuro

### Real-time
- Socket.io para chat
- Polling para notificações (30s)

---

*Última atualização: Fevereiro 2025*
