# Automated Testing Setup Guide

## Overview

Este guia configura agentes automáticos que executam testes abrangentes a cada hora e geram relatórios detalhados.

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Banco de dados Turso configurado (ou SQLite local)

## Passo 1: Setup Inicial (Zera BD, Cria Admin, Roda Testes)

Execute uma única vez para configurar tudo:

```bash
npm run setup:test
```

Isso irá:
1. ✅ Zerar o banco de dados completamente
2. 🔄 Executar todas as migrações Prisma
3. 👤 Criar usuário admin com credenciais
4. 📋 Executar suite de testes automáticos
5. 📊 Gerar relatórios detalhados

## Passo 2: Credenciais Admin

Depois de executar o setup, você terá:

**Email:** `admin@evyra.pt`
**Senha:** `EvyraAdmin@2024!`

Use essas credenciais para acessar:
- Admin Panel: `http://localhost:3000/admin/dashboard`
- Login: `http://localhost:3000/auth/login`

## Passo 3: Agendar Testes Automáticos

### Opção A: Linux/Mac (usando cron)

Editar crontab:
```bash
crontab -e
```

Adicionar linha para executar a cada hora:
```cron
0 * * * * cd /path/to/careapp && npx ts-node scripts/run-automated-tests.ts >> logs/tests.log 2>&1
```

Criar diretório de logs:
```bash
mkdir -p logs
```

### Opção B: Windows (usando Task Scheduler)

1. Abrir **Task Scheduler**
2. Criar nova tarefa:
   - Nome: "Evyra Automated Tests"
   - Trigger: Daily/Hourly
   - Action: `cmd.exe /c "cd C:\path\to\careapp && npm run test:automated"`

### Opção C: Docker (Recomendado para Produção)

Criar arquivo `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.tests
    environment:
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - DATABASE_URL=file:./test.db
    volumes:
      - ./test-reports:/app/test-reports
      - ./logs:/app/logs
    restart: always
    command: |
      /bin/bash -c "
        while true; do
          npm run test:automated
          sleep 3600
        done
      "
```

Executar:
```bash
docker-compose -f docker-compose.test.yml up -d
```

## Executando Testes Manualmente

### Executar Suite Completa de Testes
```bash
npm run test:automated
```

### Executar Testes Específicos
```bash
npm run test:run -- --grep "Authentication"
npm run test:run -- --grep "Payment"
```

### Com Coverage Report
```bash
npm run test:coverage
```

## Estrutura de Relatórios

Testes geram relatórios em `test-reports/`:

```
test-reports/
├── latest-report.md          # Resumo mais recente
├── report-2024-04-05T10-30-45-123Z.json  # Relatório JSON detalhado
└── report-2024-04-05T11-30-45-456Z.json
```

### Conteúdo do Relatório

```markdown
# Test Report
Generated: 2024-04-05T10:30:45.123Z
Duration: 5.42s

## Summary
- **Total Tests**: 45
- **Passed**: 43 ✅
- **Failed**: 2 ❌
- **Skipped**: 0 ⏭️
- **Success Rate**: 95.56%

## Results by Category
### Database Schema
- Success Rate: 100% (8/8)

### Authentication
- Success Rate: 100% (4/4)

### Payment System
- Success Rate: 100% (6/6)

## Difficulties Found
- ⚠️ Missing column: wallets.balance_tokens
- ⚠️ Admin user missing AdminUser profile

## Recommendations
- 🔧 Review and fix reported difficulties
- 📊 Continue monitoring in next test cycle
```

## Scripts NPM Disponíveis

Adicione a `package.json`:

```json
{
  "scripts": {
    "setup:test": "npx ts-node scripts/setup-and-test.ts",
    "test:automated": "npx ts-node scripts/run-automated-tests.ts",
    "test:reset-db": "npx ts-node scripts/reset-database.ts",
    "test:create-admin": "npx ts-node scripts/create-admin-user.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Monitorando Testes

### Ver Logs em Tempo Real
```bash
tail -f logs/tests.log
```

### Ver Último Relatório
```bash
cat test-reports/latest-report.md
```

### Análise de Histórico
```bash
ls -la test-reports/ | tail -20
```

## Troubleshooting

### Problema: Testes falhando após setup
**Solução:**
```bash
npm run db:reset
npm run setup:test
```

### Problema: Admin não consegue fazer login
**Solução:**
1. Checar credenciais em `test-reports/latest-report.md`
2. Recriar admin: `npm run test:create-admin`

### Problema: Testes muito lentos
**Solução:**
- Aumentar intervalo entre testes em cron (ex: `0 */2 * * *` para a cada 2 horas)
- Rodar testes em máquina mais potente
- Usar Docker para melhor isolamento

## Integração com CI/CD

### GitHub Actions

Criar `.github/workflows/tests.yml`:

```yaml
name: Automated Tests

on:
  schedule:
    - cron: '0 * * * *'  # A cada hora
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:automated
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: test-reports/
```

### GitLab CI

Criar `.gitlab-ci.yml`:

```yaml
test:automated:
  script:
    - npm install
    - npm run test:automated
  artifacts:
    paths:
      - test-reports/
    expire_in: 30 days
  schedule:
    - cron: "0 * * * *"
```

## Métricas Rastreadas

Os testes verificam:

✅ **Database Schema**
- Tabelas críticas existem
- Colunas necessárias estão presentes
- Integridade referencial

✅ **Authentication**
- Usuário admin configurado
- Roles de usuário suportados
- Profiles de admin existem

✅ **Payment System**
- Registros de pagamento acessíveis
- Tipos de pagamento configurados
- Statuses de pagamento válidos

✅ **Contract System**
- Contratos acessíveis
- Statuses disponíveis
- Relacionamentos corretos

✅ **Chat System**
- Salas de chat funcionando
- Mensagens registrando corretamente

✅ **KYC System**
- Verificação rastreando status
- Múltiplos statuses suportados

✅ **QR Code System**
- Confirmações de presença registrando
- Status tracking funcionando

✅ **Interview System**
- Entrevistas acessíveis
- Statuses disponíveis

✅ **Admin System**
- Usuários admin configurados
- Log de ações funcionando
- Notificações disponíveis

## Alertas e Notificações

Para adicionar notificações de email quando testes falham:

Editar `scripts/run-automated-tests.ts`:

```typescript
// Adicionar ao final do generateReport()
if (report.summary.failed > 0) {
  await sendEmailAlert({
    to: 'admin@evyra.pt',
    subject: `⚠️ Test Alert: ${report.summary.failed} tests failed`,
    body: report.difficulties.join('\n')
  });
}
```

## Limpeza de Relatórios Antigos

Adicionar script de limpeza:

```bash
# Manter últimos 30 dias de relatórios
find test-reports/ -name "report-*.json" -mtime +30 -delete
```

Agendar em cron:
```cron
0 0 * * * cd /path/to/careapp && find test-reports/ -name "report-*.json" -mtime +30 -delete
```

## Suporte

Para problemas ou questões sobre o setup de testes automáticos:

1. Verificar logs em `logs/tests.log`
2. Revisar último relatório em `test-reports/latest-report.md`
3. Executar setup novamente: `npm run setup:test`

## Próximos Passos

1. ✅ Executar `npm run setup:test` uma vez
2. ✅ Agendar testes usando uma das opções acima
3. ✅ Monitorar relatórios em `test-reports/`
4. ✅ Revisar dificuldades e recomendações
5. ✅ Iterar e melhorar conforme necessário

---

**Última atualização:** 2024-04-05
**Status:** ✅ Pronto para produção
