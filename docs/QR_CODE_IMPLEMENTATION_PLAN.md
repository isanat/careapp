# Plano de Implementação: Confirmação de Presença via QR Code

**Data:** 2026-04-01  
**Timeline Estimado:** 2 dias de desenvolvimento  
**Status:** Planejamento Detalhado (Sem Código)

---

## 1. Visão Geral

Feature para permitir que profissionais confirmem presença voluntariamente através de QR code diário. Família gera QR aleatório (válido 24h), profissional escaneia quando chega, Evyra registra timestamp + audit trail.

**Responsabilidades (per RESPONSIBILITY_ARCHITECTURE.md):**
- Evyra: Fornece mecanismo, gera QR, registra scan
- Profissional: Responsável por escanear quando chega
- Família: Responsável por comunicar QR ao profissional

---

## 2. Modelo de Dados (Prisma)

### 2.1 Nova Tabela: `PresenceConfirmation`

```
Model PresenceConfirmation {
  id                    String      @id @default(cuid())
  contractId            String
  contract              Contract    @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  // QR Code Generation
  qrCode                String      @unique           // Random token (24h validity)
  qrGeneratedAt         DateTime    @default(now())
  qrExpiresAt           DateTime    // today + 24h
  
  // Scan Record
  scannedAt             DateTime?
  scannedByUserId       String?
  scannedByUser         User?       @relation(fields: [scannedByUserId], references: [id])
  
  // Audit Trail
  ipAddress             String?
  userAgent             String?
  location              String?     // GPS coords if available (future)
  
  // Status
  status                String      @default("pending")  // pending | confirmed | expired
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([contractId])
  @@index([qrCode])
  @@index([scannedByUserId])
  @@index([qrExpiresAt])
}
```

### 2.2 Alterações a Tabelas Existentes

**Contract Model:**
- Adicionar campo booleano: `presenceConfirmationEnabled` (default: false)
- Permite ativar/desativar feature por contrato

**Notification Model:**
- Já existe, será usado para:
  - Notificar família quando QR é escaneado
  - Notificar profissional quando QR expira

---

## 3. API Endpoints

### 3.1 Endpoint 1: Gerar QR Code Diário

**Route:** `POST /api/contracts/{contractId}/qr/generate`

**Autorização:**
- User role: FAMILY
- Validação: User é proprietário do contrato

**Requisição:**
```
POST /api/contracts/123/qr/generate
Content-Type: application/json

{}
```

**Validações de Negócio:**
1. Contrato existe e está ativo (status: "active")
2. `presenceConfirmationEnabled` é true
3. Máximo 1 QR ativo por contrato por dia
4. Se QR anterior ainda válido (< 24h), retorna esse (não cria novo)
5. Verificar se há tentativas fraudulentas (múltiplas requisições em segundos)

**Resposta Sucesso (200):**
```json
{
  "qrCodeId": "cjd8h2k3j2k3",
  "qrCode": "EVY-ABC123DEF456",
  "expiresAt": "2026-04-02T14:30:00Z",
  "status": "active",
  "createdAt": "2026-04-01T14:30:00Z",
  "generatedByFamilyId": "user_123"
}
```

**Resposta Erro:**
- 400: Contrato inválido ou feature desativada
- 401: Não autorizado
- 429: Rate limit (máx 5 gerações por hora)
- 500: Erro interno

**Lógica de Implementação:**
1. Validar autenticação + autorização via NextAuth
2. Buscar contrato em Turso
3. Verificar se QR ativo existe (scannedAt IS NULL AND qrExpiresAt > NOW)
4. Se existe e válido, retornar esse
5. Se não existe, gerar novo:
   - token = generateRandomString(16) + timestamp hash
   - expiresAt = now() + 24 horas
   - Inserir em PresenceConfirmation
6. Retornar QR code formatado

---

### 3.2 Endpoint 2: Escanear QR Code

**Route:** `POST /api/qr/scan`

**Autorização:**
- User role: CAREGIVER
- Pode vir de qualquer profissional (não precisa estar no contrato)

**Requisição:**
```
POST /api/qr/scan
Content-Type: application/json

{
  "qrCode": "EVY-ABC123DEF456"
}
```

**Validações de Negócio:**
1. QR code existe
2. QR code não expirou (qrExpiresAt > NOW)
3. QR code ainda não foi escaneado (scannedAt IS NULL)
4. Profissional autenticado
5. Rate limit: máx 10 scans por minuto (prevent brute force)
6. Profissional deve estar associado ao contrato

**Resposta Sucesso (200):**
```json
{
  "qrCodeId": "cjd8h2k3j2k3",
  "status": "confirmed",
  "confirmedAt": "2026-04-01T14:35:22Z",
  "confirmedBy": {
    "id": "caregiver_456",
    "name": "Maria Silva"
  },
  "contractId": "contract_789"
}
```

**Resposta Erro:**
- 400: QR inválido, expirado, ou já escaneado
- 401: Não autorizado
- 403: Profissional não está no contrato
- 429: Rate limit excedido
- 404: QR code não encontrado
- 500: Erro interno

**Lógica de Implementação:**
1. Validar autenticação (deve ser CAREGIVER)
2. Buscar PresenceConfirmation pelo qrCode
3. Validações:
   - Existe?
   - qrExpiresAt > NOW()?
   - scannedAt IS NULL?
   - Profissional está no contract?
4. Se válido, atualizar:
   - scannedAt = NOW()
   - scannedByUserId = session.user.id
   - status = "confirmed"
   - ipAddress = req.headers['x-forwarded-for']
   - userAgent = req.headers['user-agent']
5. Trigger notificação para família
6. Retornar dados confirmados

---

### 3.3 Endpoint 3: Histórico de Confirmações

**Route:** `GET /api/contracts/{contractId}/qr/history`

**Autorização:**
- User role: FAMILY (proprietário) ou CAREGIVER (no contrato)
- Validação: Acesso ao contrato

**Query Parameters:**
```
GET /api/contracts/123/qr/history?limit=30&offset=0&status=confirmed
```

- `limit`: default 30, max 100
- `offset`: pagination, default 0
- `status`: opcional (pending | confirmed | expired | all)
- `from`: data ISO (filtrar por data)
- `to`: data ISO (filtrar por data)

**Resposta (200):**
```json
{
  "total": 28,
  "limit": 30,
  "offset": 0,
  "history": [
    {
      "qrCodeId": "cjd8h2k3j2k3",
      "generatedAt": "2026-04-01T14:30:00Z",
      "expiresAt": "2026-04-02T14:30:00Z",
      "status": "confirmed",
      "scannedAt": "2026-04-01T14:35:22Z",
      "scannedBy": {
        "id": "caregiver_456",
        "name": "Maria Silva"
      }
    },
    {
      "qrCodeId": "cjd8h2k3j2k2",
      "generatedAt": "2026-03-31T14:30:00Z",
      "expiresAt": "2026-04-01T14:30:00Z",
      "status": "expired",
      "scannedAt": null
    }
  ]
}
```

**Lógica de Implementação:**
1. Validar autenticação + acesso ao contrato
2. Buscar PresenceConfirmation com filtros:
   - contractId = {contractId}
   - status IN (status param ou all)
   - qrGeneratedAt BETWEEN from AND to (se especificado)
3. Ordenar por qrGeneratedAt DESC
4. Aplicar limit + offset
5. Retornar com count total

---

## 4. Componentes Frontend

### 4.1 Componente: QR Generator (Family Dashboard)

**Localização:** `src/components/qr/QRGenerator.tsx`

**Props:**
```
{
  contractId: string
  caregiverName: string
  onQRGenerated: (data) => void
}
```

**Funcionalidade:**
- Botão "Gerar QR do Dia"
- Chama `POST /api/contracts/{contractId}/qr/generate`
- Exibe QR code formatado (EVY-ABC123DEF456)
- Mostra tempo de expiração (24h)
- Botões de ação:
  - Copiar para clipboard
  - Abrir WhatsApp pré-preenchido (compartilhar via link)
  - Imprimir QR
  - Ver histórico

**Estados:**
- `idle`: Botão pronto
- `loading`: "Gerando QR..."
- `success`: QR exibido
- `error`: Erro ao gerar

**Comportamento:**
- Se QR ativo já existe (< 24h), mostra esse (não permite gerar novo)
- Atualiza countdown até expiração em tempo real
- Auto-refresh a cada 1 minuto para verificar se foi escaneado

---

### 4.2 Componente: QR Scanner (Caregiver Mobile/Web)

**Localização:** `src/components/qr/QRScanner.tsx`

**Props:**
```
{
  onScanSuccess: (data) => void
  onScanError: (error) => void
}
```

**Funcionalidade:**
- Integração com biblioteca de câmera (recomendação: `html5-qrcode` ou `qr-scanner`)
- Leitor de QR code em tempo real
- Fallback: input manual de QR code (copiar/colar)
- Exibe confirmação visual + áudio ao escanear

**Fluxo:**
1. Pedir permissão de câmera (browser native)
2. Capturar vídeo em tempo real
3. Decodificar QR code encontrado
4. Extrair `qrCode` (EVY-ABC123DEF456)
5. Chamar `POST /api/qr/scan` com qrCode
6. Exibir resultado:
   - ✅ Confirmado em [hora] por Maria Silva
   - ❌ QR inválido ou expirado
   - ⏳ QR já foi escaneado hoje

**Segurança:**
- Validar formato QR (deve começar com "EVY-")
- Rate limiting no client (feedback visual)
- Não armazenar QR em local storage

---

### 4.3 Componente: QR History (Family Dashboard)

**Localização:** `src/components/qr/QRHistory.tsx`

**Props:**
```
{
  contractId: string
}
```

**Funcionalidade:**
- Tabela com histórico de 30 últimas confirmações
- Colunas: Data | Status | Horário | Confirmado por
- Filtros: Status (todas | confirmadas | expiradas), Período
- Exportar como CSV
- Indicador visual:
  - ✅ Verde: confirmada
  - ⏳ Cinza: expirada

**Paginação:**
- 30 por página
- Scroll infinito ou botão "Carregar mais"

---

## 5. Fluxo de Notificações

### 5.1 Quando Profissional Escaneia

**Trigger:** POST /api/qr/scan sucede

**Notificação para Família:**
```json
{
  "type": "QR_CONFIRMED",
  "title": "Maria Silva confirmou presença",
  "message": "Maria confirmou presença em 14:35 de hoje",
  "contractId": "contract_789",
  "relatedUserId": "caregiver_456",
  "deepLink": "/dashboard/contratos/contract_789/qr-history"
}
```

**Delivery:**
- In-app notification (adicionar badge no dashboard)
- Email (opcional, configurável)
- Push notification (se app mobile)

---

### 5.2 Quando QR Expira

**Trigger:** Cron job diário (ou lazy check) às 23:59

**Notificação para Família:**
```json
{
  "type": "QR_EXPIRED",
  "title": "QR de hoje não foi confirmado",
  "message": "O profissional não confirmou presença com o QR gerado às 14:30",
  "contractId": "contract_789",
  "severity": "warning"
}
```

**Implementação:**
- Script cron que roda diariamente
- Busca QR com expiresAt <= NOW() e status = "pending"
- Atualiza status = "expired"
- Cria notificação para family_user_id

---

## 6. Segurança e Autorizações

### 6.1 Authorization Matrix

| Ação | FAMILY | CAREGIVER | ADMIN | Detalhe |
|------|--------|-----------|-------|---------|
| Gerar QR | ✅ | ❌ | ✅ | Apenas proprietário do contrato |
| Escanear QR | ❌ | ✅ | ❌ | Qualquer profissional, mas validar se está no contrato |
| Ver histórico | ✅ | ✅ | ✅ | Family vê seu próprio, Caregiver vê seus contratos |
| Deletar QR | ✅ | ❌ | ✅ | Apenas family (revogar QR) |

### 6.2 Rate Limiting

**Gerar QR:**
- Máx 5 por hora por família
- Janela: 1 hora
- Status: 429 Too Many Requests

**Escanear QR:**
- Máx 10 scans por minuto por profissional
- Janela: 1 minuto
- Status: 429 Too Many Requests

**Implementação:**
- Redis-based rate limiter (se disponível)
- Fallback: in-memory contador com TTL

### 6.3 Validações de Integridade

1. **Formato QR:** Padrão EVY-{16 chars}
2. **Profissional no Contrato:** Validar scannedByUserId em Contract.caregiverUserId
3. **Contrato Ativo:** status = "active"
4. **Timestamp:** scannedAt <= qrExpiresAt
5. **Audit Trail:** Registar IP + User-Agent (compliance)

---

## 7. Migrations

### 7.1 Criar Tabela PresenceConfirmation

**Arquivo:** `prisma/migrations/[timestamp]_add_presence_confirmation/migration.sql`

**Operações:**
1. Criar tabela `PresenceConfirmation` com schema descrito em 2.1
2. Criar índices em:
   - contractId (busca por contrato)
   - qrCode (lookup por QR)
   - scannedByUserId (histórico por profissional)
   - qrExpiresAt (cleanup de expirados)
3. Adicionar foreign key com cascade delete em contractId

### 7.2 Alterar Contract

**Operações:**
1. Adicionar coluna `presenceConfirmationEnabled` (boolean, default false)
2. Índice em contractId + presenceConfirmationEnabled (busca contratos com feature ativa)

### 7.3 Executar Migrations

```bash
bunx prisma migrate dev --name add_presence_confirmation
bunx prisma generate
```

---

## 8. Estrutura de Pastas

```
src/
├── app/
│   ├── api/
│   │   ├── contracts/
│   │   │   ├── [id]/
│   │   │   │   ├── qr/
│   │   │   │   │   ├── generate/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── history/
│   │   │   │   │       └── route.ts
│   ├── qr/
│   │   ├── scan/
│   │   │   └── route.ts
├── components/
│   ├── qr/
│   │   ├── QRGenerator.tsx
│   │   ├── QRScanner.tsx
│   │   ├── QRHistory.tsx
│   │   └── QRDisplay.tsx
├── lib/
│   ├── qr/
│   │   ├── qr-utils.ts (helpers: generate token, validate format)
│   │   ├── rate-limiter.ts
│   │   └── qr-service.ts (business logic)
└── hooks/
    └── useQRCode.ts (React hook for QR operations)

prisma/
└── migrations/
    └── [timestamp]_add_presence_confirmation/
        └── migration.sql

docs/
└── QR_CODE_IMPLEMENTATION_PLAN.md (este arquivo)
```

---

## 9. Checklist de Implementação

### Dia 1 (Backend + Database)

- [ ] Criar migration e schema `PresenceConfirmation`
- [ ] Gerar Prisma client (`bunx prisma generate`)
- [ ] Implementar endpoint `POST /api/contracts/{id}/qr/generate`
- [ ] Implementar endpoint `POST /api/qr/scan`
- [ ] Implementar endpoint `GET /api/contracts/{id}/qr/history`
- [ ] Adicionar validações de negócio (expiração, duplicatas, etc)
- [ ] Implementar rate limiting
- [ ] Implementar notificação após escanear
- [ ] Testes manuais dos 3 endpoints via curl/Postman
- [ ] Validar auth + authorization

### Dia 2 (Frontend + Integration)

- [ ] Criar componente `QRGenerator.tsx`
- [ ] Criar componente `QRScanner.tsx`
- [ ] Criar componente `QRHistory.tsx`
- [ ] Integrar QR Generator no Family Dashboard
- [ ] Integrar QR Scanner em página dedicada (ou modal)
- [ ] Integrar QR History no Contract Details
- [ ] Implementar hook `useQRCode` para state management
- [ ] Testes E2E: gerar → compartilhar → escanear → confirmar
- [ ] Testes mobile (responsividade do scanner)
- [ ] Deploy em preview branch
- [ ] Validar notificações aparecem corretamente

---

## 10. Testes (Test Plan)

### 10.1 Unit Tests (Backend)

**Arquivo:** `src/lib/qr/__tests__/qr-service.test.ts`

- ✅ Gerar QR com token único
- ✅ Validar formato EVY-{16}
- ✅ Prevenir múltiplas gerações em 24h
- ✅ Detectar QR expirado
- ✅ Verificar profissional no contrato
- ✅ Rate limiting bloqueia > 5 gerações/hora
- ❌ Rejeitar scan em QR inválido
- ❌ Rejeitar scan em QR expirado
- ❌ Rejeitar scan de profissional não no contrato
- ❌ Rate limiting bloqueia > 10 scans/min

### 10.2 Integration Tests (API)

**Arquivo:** `src/app/api/__tests__/qr-endpoints.test.ts`

- POST /api/contracts/123/qr/generate → 200 + QR data
- POST /api/contracts/123/qr/generate (2x) → 200 + same QR (idempotent)
- POST /api/qr/scan com valid QR → 200 + confirmed
- POST /api/qr/scan com expired QR → 400
- GET /api/contracts/123/qr/history → 200 + array de confirmações
- GET /api/contracts/123/qr/history?status=confirmed → filtrado

### 10.3 E2E Tests (Frontend)

**Arquivo:** `e2e/qr-flow.spec.ts`

1. **Family Flow:**
   - Login como família
   - Gerar QR
   - Copiar e compartilhar
   - Ver contador até expiração
   - Ver histórico (ainda pendente)

2. **Caregiver Flow:**
   - Login como profissional
   - Ir para "Escanear QR"
   - Permitir acesso câmera
   - Escanear QR código
   - Ver confirmação: "Confirmado em 14:35"
   - Verificar notificação para família

3. **History Validation:**
   - Family vê confirmação no histórico após 5s
   - Mostra hora exata + nome profissional

---

## 11. Considerações de Performance

### 11.1 Índices (já no schema)

- `PresenceConfirmation.contractId` → buscas por contrato
- `PresenceConfirmation.qrCode` → lookup por QR
- `PresenceConfirmation.scannedByUserId` → histórico por profissional
- `PresenceConfirmation.qrExpiresAt` → cleanup de expirados

### 11.2 Query Optimization

**Endpoint history:**
- Usar cursor-based pagination (não offset)
- Buscar 31 registos (determinar se há next page)
- Cachear por 30 segundos (stale-while-revalidate)

**Endpoint scan:**
- Prepared statement (prevent SQL injection)
- Índice em qrCode (lookup O(1))

### 11.3 Rate Limiting

- Redis (ideal) ou in-memory com TTL
- Não bloquear requests validas
- Retornar `Retry-After` header em 429

---

## 12. Responsabilidade Arquitetural (Reminder)

Todas as strings/messaging devem seguir RESPONSIBILITY_ARCHITECTURE.md:

❌ **Evitar:** "A Evyra confirma presença", "Monitorização do cuidador"  
✅ **Usar:** "O profissional confirmou presença", "Visibilidade sobre confirmações"

Exemplo em resposta de sucesso:
```json
{
  "message": "Presença confirmada por Maria Silva em 14:35",
  "note": "Este é o registo voluntário de confirmação do profissional"
}
```

---

## 13. Deployment & Monitoring

### 13.1 Pre-Deploy Checklist

- [ ] Todos os tests passam (unit + integration + E2E)
- [ ] Código review completo
- [ ] Verificar SQL injection (prepared statements)
- [ ] Validar rate limiting funciona
- [ ] Testar com dados reais em preview
- [ ] Notification delivery testada
- [ ] Copy validada contra RESPONSIBILITY_ARCHITECTURE.md

### 13.2 Monitoring em Produção

**Métricas a rastrear:**
- Taxa de geração de QR por dia
- Taxa de sucesso vs falha em scans
- Tempo médio entre geração e scan
- Taxa de QR expirados (% sem confirmação)
- Latência do endpoint scan (deve ser <200ms)
- Erros em notificações

**Alertas:**
- Erro rate > 5% em qualquer endpoint
- Latência p99 > 500ms em scan
- Taxa de expiração > 40% (pode indicar problema)

---

## 14. Próximos Passos Após MVP

- [ ] Geolocalização (GPS no scan)
- [ ] Histórico com foto do profissional (reconhecimento facial?)
- [ ] Notificações SMS/WhatsApp (não apenas in-app)
- [ ] Integração com sistema de pagamento (trigger automático)
- [ ] Analytics dashboard (para admin)
- [ ] Relatórios exportáveis (PDF/Excel)

---

## 15. Referências

- **Responsibility Architecture:** `/docs/RESPONSIBILITY_ARCHITECTURE.md`
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth.js:** https://next-auth.js.org
- **Turso SQLite:** https://turso.tech

---

**Aprovado para implementação:** 2026-04-01  
**Próxima fase:** Iniciar desenvolvimento (Dia 1 - Backend)
