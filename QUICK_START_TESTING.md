# ⚡ Quick Start - Automated Testing Setup

## Em 3 Passos

### 1️⃣ Zerar Banco + Criar Admin + Rodar Testes

```bash
npm run setup:test
```

**Isso faz:**
- ✅ Limpa completamente o banco de dados
- ✅ Executa todas as migrações
- ✅ Cria usuário admin
- ✅ Roda testes automáticos
- ✅ Gera relatórios

**Tempo:** ~2-3 minutos

---

### 2️⃣ Agendar Testes Automáticos (A cada hora)

#### Para Linux/Mac:
```bash
bash scripts/install-cron.sh
```

#### Para Windows:
Abrir Task Scheduler e criar tarefa:
- **Ação:** `npm run test:automated`
- **Frequência:** Hourly
- **Pasta:** Raiz do projeto

---

### 3️⃣ Pronto! Credenciais Admin

```
📧 Email: admin@evyra.pt
🔐 Senha: EvyraAdmin@2024!
```

Acesse em: `http://localhost:3000/auth/login`

---

## Verificar Testes

```bash
# Ver relatório mais recente
cat test-reports/latest-report.md

# Ver logs em tempo real (Linux/Mac)
tail -f logs/tests.log

# Listar todos os relatórios
ls -la test-reports/
```

---

## Estrutura de Testes

Os agentes testam automaticamente:

- 🗄️ **Database Schema** - Tabelas, colunas, integridade
- 🔐 **Authentication** - Admin, roles, permissões
- 💳 **Payment System** - Transações, statuses, tipos
- 📋 **Contracts** - Criação, lifecycle, statuses
- 💬 **Chat** - Salas, mensagens, participantes
- 🆔 **KYC** - Verificação, statuses
- 📱 **QR Codes** - Confirmação de presença
- 🎥 **Interviews** - Agendamento, videos
- ⚙️ **Admin** - Usuários, ações, notificações

---

## Relatórios Gerados

Cada teste gera:

```
📁 test-reports/
├── latest-report.md              # Resumo em markdown
├── report-[timestamp].json       # Dados completos em JSON
└── report-[timestamp].json       # Histórico
```

### Exemplo de Relatório:

```markdown
# Test Report
Generated: 2024-04-05T10:30:45.123Z
Duration: 5.42s

## Summary
- **Total Tests**: 45
- **Passed**: 43 ✅
- **Failed**: 2 ❌
- **Success Rate**: 95.56%

## Difficulties Found
- ⚠️ Issue #1
- ⚠️ Issue #2

## Recommendations
- 🔧 Fix issue #1
- 📊 Continue monitoring
```

---

## Comandos Úteis

```bash
# Executar testes manualmente
npm run test:automated

# Resetar BD (destruidor!)
npm run test:reset-db

# Recriar usuário admin
npm run test:create-admin

# Ver logs de testes
tail -f logs/tests.log

# Executar testes vitest (suite local)
npm run test

# Testes com coverage
npm run test:coverage
```

---

## Troubleshooting

### ❌ Testes falhando

```bash
npm run setup:test  # Recria tudo do zero
```

### ❌ Admin não consegue fazer login

```bash
npm run test:create-admin  # Recria credenciais
```

### ❌ Não está rodando cron

```bash
crontab -l  # Ver jobs agendados
crontab -e  # Editar/adicionar
```

---

## O Que Acontece A Cada Hora

1. Agent executa: `npm run test:automated`
2. Script conecta no banco de dados
3. Verifica todas as tabelas e colunas
4. Valida integridade de dados
5. Testa todos os sistemas (8 categorias)
6. Gera relatório detalhado
7. Salva em `test-reports/latest-report.md`
8. Registra qualquer dificuldade encontrada

---

## Próximo Passo

Executar agora:

```bash
npm run setup:test
```

Depois (em 1-2 minutos) você terá:
✅ Banco zerado
✅ Admin criado  
✅ Testes rodados
✅ Relatórios gerados

Então agendar com:
```bash
bash scripts/install-cron.sh  # Linux/Mac
```

---

**Pronto!** 🚀 Os agentes agora rodam testes automaticamente a cada hora.

Monitorar em: `/test-reports/latest-report.md`
