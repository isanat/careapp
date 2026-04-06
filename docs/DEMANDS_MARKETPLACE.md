# Marketplace de Demandas - Sistema de Visibilidade

## Visão Geral

Sistema complementar ao Evyra que implementa um **marketplace de oportunidades** onde famílias criam demandas e pagam para aumentar sua visibilidade. Oferece uma nova fonte de receita (€3-15 por boost) com volume acessível.

### Por que?

1. **Cuidadores** têm melhor experiência (demandas aparecem no feed ranking)
2. **Famílias** conseguem propostas mais rápido (visibilidade paga)
3. **Plataforma** gera receita (€3k-8k/ano estimado em volume)
4. **Design simples** - preços baixos para rápida adoção

---

## Arquitetura

### Database (Turso/SQLite)

#### Tabelas Principais

```sql
-- Demandas criadas por famílias
Demand
  - id, familyUserId, title, description
  - serviceTypes (JSON), address, city, latitude, longitude
  - requiredExperienceLevel, requiredCertifications, careType
  - desiredStartDate, desiredEndDate, hoursPerWeek
  - visibilityPackage, visibilityExpiresAt
  - status (ACTIVE/CLOSED/PAUSED/EXPIRED)
  - createdAt, updatedAt, closedAt

-- Rastreia cada visualização (para analytics)
DemandView
  - id, demandId, caregiverId, viewedAt
  - UNIQUE(demandId, caregiverId, viewedAt)

-- Rastreia cada compra de boost
VisibilityPurchase
  - id, demandId, familyUserId
  - package (BASIC/PREMIUM/URGENT)
  - amountEurCents, status (PENDING/COMPLETED/FAILED/REFUNDED)
  - purchasedAt, expiresAt, completedAt
  - stripePaymentIntentId, stripeCheckoutSessionId

-- Propostas enviadas por cuidadores
Proposal
  - id, demandId, caregiverId
  - message, proposedHourlyRate, estimatedStartDate
  - status (PENDING/ACCEPTED/REJECTED/EXPIRED)
  - createdAt, updatedAt

-- Notificações para cuidadores
DemandNotification
  - id, demandId, caregiverId
  - type (new_demand/updated/reminder)
  - sentAt, readAt, emailSent, pushSent
```

### Enums

```
DemandStatus: ACTIVE, CLOSED, PAUSED, EXPIRED
ExperienceLevel: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
VisibilityPackage: NONE, BASIC (€3), PREMIUM (€8), URGENT (€15)
CareType: URGENT, RECURRING, BOTH
```

---

## APIs

### Demandas (Público)

**GET /api/demands**
- Lista demandas abertas (ranking: URGENT > PREMIUM > BASIC > NONE)
- Filtros: `city`, `serviceType`
- Rastreia visualizações automaticamente
- Response: `{ demands[], pagination }`

**GET /api/demands/[id]**
- Detalhes completo + métricas dinâmicas
- Rastreia view automaticamente
- Response: `{ id, title, description, metrics: { viewCount, proposalCount, conversionRate, visibilitySpent, daysActive } }`

**POST /api/demands**
- Criar nova demanda (família)
- Validação: min 100 chars descrição
- Response: `{ id, message }`

**PUT /api/demands/[id]**
- Atualizar demanda (apenas criador)
- Campos: title, description, status, hoursPerWeek, datas
- Response: `{ message }`

### Propostas

**POST /api/demands/[id]/proposals**
- Enviar proposta (cuidador)
- Validação: min 20 chars mensagem, max 1 proposta ativa
- Body: `{ message, proposedHourlyRate?, estimatedStartDate? }`
- Response: `{ id, message }`

**GET /api/demands/[id]/proposals**
- Listar propostas (apenas criador)
- Response: `{ proposals[] }`

### Analytics

**GET /api/family/demands**
- Lista demandas da família com métricas
- Status filter: ACTIVE, CLOSED, PAUSED
- Response: `{ demands: [{ id, title, metrics: { viewCount, proposalCount, conversionRate, visibilitySpent } }] }`

**GET /api/family/demands/analytics**
- Agregado de todas demandas da família
- Response:
  ```json
  {
    "totalVisibilitySpent": 42.50,
    "avgProposalsPerDemand": 3.2,
    "avgViewsPerDemand": 24.5,
    "activeDemands": 5,
    "closedDemands": 2
  }
  ```

**GET /api/admin/demands/metrics?period=7**
- Métricas globais (admin only)
- Period: 7, 30, 90 dias
- Response:
  ```json
  {
    "periodDays": 7,
    "totalRevenue": 150.00,
    "totalDemandsCreated": 12,
    "avgConversionRate": 18.5,
    "avgTimeToFirstProposal": 2,
    "avgTicket": 12.50,
    "chartData": [{ date, revenue }],
    "demandsSummary": { byStatus: {}, byVisibility: {} }
  }
  ```

---

## Frontend

### Páginas Família

**`/app/family/demands`** - Dashboard
- Cards de KPI: demandas ativas/fechadas, gasto visibilidade, propostas/views médios
- Tabela: título, localidade, visibilidade, views, propostas, conversão, gasto
- Filtro por status
- Botão "Criar Demanda"

**`/app/family/demands/new`** - Criar Demanda
- Formulário completo: título, descrição (100+ chars), serviços, localidade
- Nível experiência, certificações, tipo cuidado
- Datas, horas/semana
- POST → `/api/demands` → redireciona para `/app/family/demands/[id]`

**`/app/family/demands/[id]`** - Detalhes Demanda
- Descrição completa, serviços, requisitos
- Analytics: views, propostas, conversão, gasto
- Lista de propostas recebidas com botões: Aceitar, Rejeitar, Contatar

### Páginas Cuidador

**`/app/demands`** - Marketplace
- Grid de demandas com badges de visibilidade
- Filtros: localidade, tipo serviço
- Ranking visual: URGENT 🔴, PREMIUM ⭐, BASIC ✓, NORMAL
- Cards: título, descrição (snippet), serviços, localidade, stats (views/propostas)
- Link "Ver Detalhes & Propor"

**`/app/demands/[id]`** - Detalhes Demanda
- Layout completo: descrição, requisitos, detalhes práticos
- Metrics: views, propostas, conversão, dias ativo
- Formulário de proposta: mensagem (20+ chars), taxa horária, data início
- POST → `/api/demands/[id]/proposals`

### Painel Admin

**`/admin/demands`** - Marketplace Analytics
- Seletor período: 7, 30, 90 dias
- KPI Cards (dinâmicos):
  - Receita total visibilidade
  - Demandas criadas
  - Taxa conversão média
  - Dias até 1ª proposta
  - Ticket médio
- Gráfico: receita diária (bar chart)
- Tabelas: demandas por Status, demandas por Visibilidade
- Botões: Atualizar, Exportar CSV

---

## Cálculos Dinâmicos (SEM HARDCODING)

Todos os valores são calculados em tempo real via APIs:

### Métricas por Demanda
```sql
viewCount = COUNT(DemandView WHERE demandId = X)
proposalCount = COUNT(Proposal WHERE demandId = X AND status != 'REJECTED'/'EXPIRED')
conversionRate = proposalCount / viewCount * 100 (%)
visibilitySpent = SUM(VisibilityPurchase.amountEurCents WHERE demandId = X) / 100 (€)
daysActive = DATEDIFF(day, Demand.createdAt, TODAY)
```

### Métricas Globais (Admin)
```sql
totalRevenue = SUM(VisibilityPurchase.amountEurCents) / 100 (€) [período]
totalDemandsCreated = COUNT(Demand) [período]
avgConversionRate = AVG(proposalCount / viewCount) [todas demandas]
avgTimeToFirstProposal = AVG(DATEDIFF(day, Demand.createdAt, MIN(Proposal.createdAt)))
avgTicket = totalRevenue / COUNT(VisibilityPurchase)
```

---

## Fluxo de Uso

### Fluxo Família

1. Acessa `/app/family/demands` → Dashboard vazia
2. Clica "Criar Demanda" → `/app/family/demands/new`
3. Preenche formulário → POST `/api/demands` → criada com `visibilityPackage: 'NONE'`
4. Redireciona para `/app/family/demands/[id]` → ainda nenhuma proposta
5. Pode "Aumentar Visibilidade" (implementar modal com Stripe depois)
6. Conforme cuidadores veem a demanda (tracking em GET `/api/demands`):
   - viewCount aumenta
   - Se proposta é enviada, proposalCount aumenta
   - taxa conversão atualiza em tempo real
7. Dashboard mostra analytics atualizadas

### Fluxo Cuidador

1. Acessa `/app/demands` → Marketplace com ranking
2. Vê demandas ordenadas por: URGENT (topo) → PREMIUM → BASIC → NONE + recentes
3. Clica em demanda → `/app/demands/[id]`
4. Vê detalhes completos + analytics
5. Preenche "Enviar Proposta":
   - Mensagem (20+ chars obrigatório)
   - Taxa horária (opcional)
   - Data início (opcional)
6. POST `/api/demands/[id]/proposals` → cria Proposal com status PENDING
7. Notificação para família sobre nova proposta (TODO: sistema notificações)

### Fluxo Admin

1. Acessa `/admin/demands` → Dashboard com KPIs
2. Seleciona período (7/30/90 dias)
3. Vê métricas em tempo real:
   - Receita (dinâmica)
   - Demandas criadas
   - Taxa conversão
   - Tempo até proposta
   - Ticket médio
4. Gráfico de receita diária
5. Tabelas: demandas por status/visibilidade
6. Botão "Exportar CSV" para relatório

---

## Ranking de Demandas

**Ordem de exibição em `/api/demands`:**

```sql
ORDER BY
  CASE
    WHEN visibilityPackage = 'URGENT' THEN 0      -- Topo
    WHEN visibilityPackage = 'PREMIUM' THEN 1     -- Destaque
    WHEN visibilityPackage = 'BASIC' THEN 2       -- Normal
    ELSE 3                                        -- Sem boost
  END,
  visibilityExpiresAt DESC NULLS LAST,            -- Mais próximo de expirar
  createdAt DESC                                  -- Mais recentes
```

Demandas com boost aparecem primeiro, ordenadas por data de expiração (urgência).

---

## Preços de Visibilidade (Stripe)

| Package | Preço | Duração | Uso |
|---------|-------|---------|-----|
| BASIC | €3 | 7 dias | Audiência padrão |
| PREMIUM | €8 | 30 dias | Destaque no ranking |
| URGENT | €15 | 3 dias | Topo da lista |

Preços baixos para impulsionar adoção rápida.

---

## Status de Implementação

### ✅ Concluído (Fase 1-2)

- [x] Schema Prisma com models Demand, DemandView, VisibilityPurchase, Proposal
- [x] Auto-migrações SQL (Turso)
- [x] APIs base: GET/POST demands, proposals, analytics, admin metrics
- [x] Métricas dinâmicas (viewCount, proposalCount, conversionRate, etc)
- [x] Dashboard Família com KPIs e analytics
- [x] Criar Demanda (formulário + validação)
- [x] Marketplace de Demandas (ranking, filtros, cards)
- [x] Detalhes Demanda (cuidador + família)
- [x] Formulário Proposta (com validação)
- [x] Painel Admin (KPIs, gráfico, relatório CSV)
- [x] Tracking automático de views

### 🔄 Em Progresso / TODO

- [ ] Integração Stripe (checkout para boosts)
- [ ] Sistema notificações (email, push)
- [ ] Aceitar/Rejeitar propostas
- [ ] Criar contrato a partir de proposta aceita
- [ ] Chat entre família e cuidador (proposta)
- [ ] Rate limiting por família
- [ ] Validações geográficas
- [ ] Testes unitários e E2E
- [ ] Go-live e onboarding

---

## Files Críticos

| Arquivo | Descrição |
|---------|-----------|
| `prisma/schema.prisma` | Models: Demand, DemandView, VisibilityPurchase, Proposal |
| `src/lib/db-migrate.ts` | Auto-migrações SQL para tabelas |
| `src/lib/demands/metrics.ts` | Cálculos dinâmicos de métricas |
| `src/app/api/demands/route.ts` | GET (lista + ranking), POST (criar) |
| `src/app/api/demands/[id]/route.ts` | GET (detalhes), PUT (atualizar) |
| `src/app/api/demands/[id]/proposals/route.ts` | POST (proposta), GET (listar) |
| `src/app/api/family/demands/route.ts` | GET (demandas da família com métricas) |
| `src/app/api/family/demands/analytics/route.ts` | GET (agregado da família) |
| `src/app/api/admin/demands/metrics/route.ts` | GET (métricas globais + admin) |
| `src/app/app/family/demands/page.tsx` | Dashboard Família |
| `src/app/app/family/demands/new/page.tsx` | Criar Demanda |
| `src/app/app/family/demands/[id]/page.tsx` | Detalhes Demanda (Família) |
| `src/app/app/demands/page.tsx` | Marketplace (Cuidador) |
| `src/app/app/demands/[id]/page.tsx` | Detalhes Demanda (Cuidador) |
| `src/app/admin/demands/page.tsx` | Painel Admin Analytics |

---

## Próximos Passos

1. **Integração Stripe**
   - Criar Products para cada visibility package
   - Implementar checkout via Stripe Elements
   - Webhook para completar VisibilityPurchase

2. **Notificações**
   - Email quando nova proposta recebida
   - Email para cuidadores sobre demandas novas (weekly digest)
   - Push notifications (mobile)

3. **Workflow de Proposta**
   - Família aceita proposta → cria Contract
   - Chat entre partes antes de aceitar
   - Integração com escrow/pagamentos

4. **Validações**
   - Limite de 1 demanda grátis/mês (depois pagar)
   - Descrição min 100 chars (implementado)
   - Proximidade geográfica (filtro opcional)
   - Rate limiting

5. **Testes**
   - Unit tests para metrics.ts
   - Integration tests para fluxo completo
   - E2E tests com Cypress/Playwright

---

## Versão

- **Data**: Abril 2026
- **Status**: Fase 2 (Dashboards + Marketplace)
- **Próxima**: Fase 3 (Stripe + Notificações)
