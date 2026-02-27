# Senior Care App - Development Worklog

## Project Overview
**Name:** Senior Care App (antigo IdosoLink)  
**Mission:** Marketplace de cuidados para idosos com pagamentos seguros  
**Tech Stack:** Next.js 16, TypeScript, Turso DB, Prisma, NextAuth, shadcn/ui, Stripe

---

## Estado Atual do Projeto (Fev 2025)

### ✅ Funcionalidades Completas:

#### 1. Sistema de Autenticação
- Login com email/senha
- Registro com seleção de role (FAMILY/CAREGIVER)
- Pagamento de ativação (€35) via Stripe
- Perfil completo após ativação

#### 2. Dashboard (Design Mobile-First Compacto)
- Visão diferenciada para Família e Cuidador
- Stats em grid compacto (4 colunas)
- Próximos passos com alertas
- Atividade recente em lista simples
- Quick actions em grid 2x

#### 3. Perfil (Design Mobile-First Compacto)
- Tabs: Info, Documentos, Serviços (cuidador), Idoso (família), Contato, Config
- Edição inline com formulários compactos
- Stats para cuidador (contratos, avaliações, nota, valor/hora)
- Configurações integradas (push, tema, idioma, logout, apagar conta)
- **Upload de foto de perfil**
- **Campo de NIF (Número de Identificação Fiscal)**
- **Campo de documento de identificação**
- **Seção de antecedentes criminais (cuidadores)**

#### 4. Propostas (Cuidador) - Design Compacto
- Lista de propostas recebidas
- Tabs: Novas / Aceitas
- Cards compactos com info essencial
- Ações: Aceitar / Recusar
- Diálogos simplificados

#### 5. Carteira (Wallet) - Design Compacto
- Balance principal em EUR
- Histórico de transações em lista simples
- Pagamentos via Stripe

#### 6. Busca de Cuidadores
- Filtros por serviços, localização, preço
- Cards de cuidadores com rating
- Visualização de perfil

#### 7. Contratos
- Lista de contratos com status
- Criação de novo contrato (multi-step)
- Detalhes do contrato com aceite legal

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

#### 11. KYC (Verificação de Identidade)
- Schema preparado (verificationStatus, documentType, etc.)
- API Didit criada e integrada
- Página de verificação com AppShell
- Restrito apenas para CAREGIVERS
- Design mobile-first compacto
- Modal com iframe do widget Didit
- Polling automático para atualização de status

#### 12. i18n (Traduções)
- Sistema implementado (useI18n hook)
- **100% das páginas traduzidas**
- 4 idiomas: Português, English, Italiano, Español

#### 13. Admin Panel
- Dashboard com KPIs e alertas
- Gestão de Usuários (listar, suspender, ativar)
- Gestão de Cuidadores (KYC approval/rejection, featured)
- Gestão de Contratos
- Logs e Analytics

#### 14. Entrevista em Vídeo
- Integração com Jitsi Meet
- Agendamento e status
- Questionário pós-entrevista
- Avaliação do cuidador

#### 15. Guia de Boas Práticas
- Seções educacionais para cuidadores
- Checklist de aceitação
- Recursos de emergência

---

### ⚠️ Funcionalidades Parciais:

#### 1. Sistema de Pagamentos
- Stripe configurado para ativação
- Escrow preparado mas não totalmente implementado
- Stripe Connect para cuidadores não implementado

---

### ❌ Funcionalidades Pendentes:

#### 1. Push Notifications
- VAPID keys precisam ser configuradas
- Service Worker registrado mas sem servidor push

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
│   │   ├── profile/       # Perfil + configurações + documentos
│   │   ├── proposals/     # Propostas (cuidador)
│   │   ├── wallet/        # Carteira
│   │   ├── search/        # Busca cuidadores
│   │   ├── contracts/     # Contratos
│   │   ├── chat/          # Chat em tempo real
│   │   ├── caregivers/    # Perfil público cuidador
│   │   ├── interview/     # Entrevista em vídeo
│   │   └── guide/         # Guia de boas práticas
│   ├── auth/              # Autenticação
│   │   ├── login/
│   │   ├── register/
│   │   ├── payment/
│   │   └── kyc/
│   ├── admin/             # Painel administrativo
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── caregivers/
│   │   ├── contracts/
│   │   ├── payments/
│   │   ├── analytics/
│   │   └── ...
│   └── api/               # APIs
│       ├── auth/
│       ├── user/
│       ├── caregivers/
│       ├── contracts/
│       ├── chat/
│       ├── notifications/
│       ├── upload/        # Upload de arquivos
│       ├── kyc/
│       └── admin/
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # AppShell, Header, Footer
│   ├── notifications/     # NotificationDropdown
│   ├── video/             # VideoRoom (Jitsi)
│   └── admin/             # Admin components
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

---

## Correções Recentes (Fev 2025)

### Header Duplicado
- Removido header duplicado da página de perfil
- O AppShell já contém o header principal

### Menus Transparentes
- Adicionado `bg-background border shadow-lg` aos DropdownMenuContent
- Corrigido no AppShell e Header público

### Perfil Completo
- Adicionado upload de foto de perfil
- Adicionado campo de NIF
- Adicionado campo de documento de identificação
- Adicionado seção de antecedentes criminais (cuidadores)
- Nova aba "Documentos" com todos os campos de documentos

### Schema Atualizado
- User: nif, documentType, documentNumber, backgroundCheckStatus, backgroundCheckUrl
- Upload API criada para fotos e documentos

---

*Última atualização: Fevereiro 2025*
