# 🔄 Sincronização Turso - Procedimento Completo

## Estado Atual
- **Local (SQLite)**: ✅ Zerado e operacional com admin user criado
- **Turso (Remoto)**: ⏳ Aguardando sincronização (ainda com dados antigos)

## Admin Credentials (Usar em ambos os bancos)
```
Email: admin@evyra.pt
Password: EvyraAdmin@2024!
```

## Procedimento de Sincronização (Quando rede voltar)

### 1️⃣ Reset Turso Remoto
```bash
node scripts/reset-turso.mjs
```
Isso vai:
- Conectar ao Turso remoto
- Listar todas as tabelas existentes
- Dropá-las completamente
- Deixar o Turso vazio

### 2️⃣ Push do Schema Local para Turso
```bash
export TURSO_DATABASE_URL="libsql://idosolink-isanat.aws-us-east-1.turso.io"
export TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ2Mi1oNWhlNEVmR0JkMkxuaDZhN1lnIn0.voAYnUKiV4uobw6DJEqY0bipVPuHjEsBH0hYdzd8zNaT8pRf3GedJL20pCinMmSKQ9XwTMSv4oJ7XE7Y55PuAw"
npm run db:push
```
Isso vai:
- Ler o schema atual do `prisma/schema.prisma`
- Conectar ao Turso com as credenciais acima
- Criar todas as tabelas no Turso com estrutura idêntica ao local
- **100% sincronizado em estrutura**

### 3️⃣ Criar Admin User no Turso
```bash
export TURSO_DATABASE_URL="libsql://idosolink-isanat.aws-us-east-1.turso.io"
export TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ2Mi1oNWhlNEVmR0JkMkxuaDZhN1lnIn0.voAYnUKiV4uobw6DJEqY0bipVPuHjEsBH0hYdzd8zNaT8pRf3GedJL20pCinMmSKQ9XwTMSv4oJ7XE7Y55PuAw"
npx ts-node scripts/create-admin-user.ts
```
Isso vai:
- Conectar ao Turso remoto
- Criar user com email admin@evyra.pt e senha EvyraAdmin@2024!
- Criar perfil AdminUser associado

## ✅ Resultado Final
Após estes 3 passos:
- ✅ Turso zerado completamente
- ✅ Schema idêntico ao local
- ✅ Admin user criado e funcional
- ✅ 100% sincronizado local ↔ Turso

## 🚀 Quick Command (Execute tudo de uma vez)
```bash
node scripts/reset-turso.mjs && \
export TURSO_DATABASE_URL="libsql://idosolink-isanat.aws-us-east-1.turso.io" && \
export TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ2Mi1oNWhlNEVmR0JkMkxuaDZhN1lnIn0.voAYnUKiV4uobw6DJEqY0bipVPuHjEsBH0hYdzd8zNaT8pRf3GedJL20pCinMmSKQ9XwTMSv4oJ7XE7Y55PuAw" && \
npm run db:push && \
npx ts-node scripts/create-admin-user.ts
```

## 📋 Verificação
Depois da sincronização, verifique:
1. Login no admin painel com `admin@evyra.pt / EvyraAdmin@2024!`
2. Confirme que está vazio (0 users, 0 payments, 0 contracts, etc.)
3. Comece com dados limpos

## 🔗 Variáveis de Ambiente (Salvar para uso futuro)
```
TURSO_DATABASE_URL=libsql://idosolink-isanat.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ2Mi1oNWhlNEVmR0JkMkxuaDZhN1lnIn0.voAYnUKiV4uobw6DJEqY0bipVPuHjEsBH0hYdzd8zNaT8pRf3GedJL20pCinMmSKQ9XwTMSv4oJ7XE7Y55PuAw
DATABASE_URL=file:./prisma/dev.db (Local)
```

---
**Última atualização**: 2026-04-05 15:27 UTC
**Status**: Aguardando conexão de rede para completar sincronização
