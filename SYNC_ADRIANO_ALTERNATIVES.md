# Sincronizar ADRIANO - Guias Alternativos

Se o endpoint `/api/admin/sync-didit-user` estiver retornando erro, use uma dessas alternativas:

## Opção 1: Via Turso CLI (Recomendado)

```bash
# Instalar Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Fazer login
turso auth login

# Conectar ao banco
turso db shell idosolink-isanat

# Executar o SQL abaixo
```

### SQL para criar/atualizar ADRIANO:

```sql
INSERT OR REPLACE INTO User (
  id,
  email,
  name,
  firstName,
  lastName,
  role,
  status,
  verificationStatus,
  kycSessionId,
  kycBirthDate,
  kycNationality,
  kycDocumentIssueDate,
  kycDocumentExpiryDate,
  kycDocumentIssuer,
  kycCompletedAt,
  kycData,
  createdAt,
  updatedAt
) VALUES (
  'user_adriano_' || cast(strftime('%s') as text),
  'netlinkassist@gmail.com',
  'Adriano Moreira da Silva',
  'Adriano',
  'Moreira da Silva',
  'CAREGIVER',
  'ACTIVE',
  'VERIFIED',
  '145187c2-56e1-4636-8efd-bf54713c11e2',
  '1976-05-01T00:00:00Z',
  'BRA',
  '2000-05-26T00:00:00Z',
  '2025-12-05T00:00:00Z',
  'Detran-SP',
  datetime('now'),
  json('{"email":"netlinkassist@gmail.com","firstName":"Adriano","lastName":"Moreira da Silva","birthDate":"1976-05-01","nationality":"BRA","documentNumber":"01536294680","documentType":"driver_license","documentIssuer":"Detran-SP","documentIssueDate":"2000-05-26","documentExpiryDate":"2025-12-05","syncedAt":"' || datetime('now') || '"}'),
  datetime('now'),
  datetime('now')
);
```

## Opção 2: Via Script TypeScript + Prisma

```bash
# Criar arquivo sync-user.ts
npx ts-node scripts/sync-user.ts

# Ou usando tsx
npx tsx scripts/sync-user.ts
```

Script:
```typescript
import { db } from './src/lib/db-turso';

async function syncAdrianoViaORM() {
  const now = new Date();
  
  try {
    const result = await db.execute({
      sql: `INSERT OR REPLACE INTO User (
        id, email, name, firstName, lastName, role, status,
        verificationStatus, kycSessionId, kycBirthDate,
        kycNationality, kycDocumentIssueDate, kycDocumentExpiryDate,
        kycDocumentIssuer, kycCompletedAt, kycData, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `user_adriano_${Date.now()}`,
        'netlinkassist@gmail.com',
        'Adriano Moreira da Silva',
        'Adriano',
        'Moreira da Silva',
        'CAREGIVER',
        'ACTIVE',
        'VERIFIED',
        '145187c2-56e1-4636-8efd-bf54713c11e2',
        '1976-05-01',
        'BRA',
        '2000-05-26',
        '2025-12-05',
        'Detran-SP',
        now.toISOString(),
        JSON.stringify({
          email: 'netlinkassist@gmail.com',
          firstName: 'Adriano',
          lastName: 'Moreira da Silva',
          birthDate: '1976-05-01',
          nationality: 'BRA',
          documentNumber: '01536294680',
          documentType: 'driver_license',
          documentIssuer: 'Detran-SP',
          documentIssueDate: '2000-05-26',
          documentExpiryDate: '2025-12-05',
          syncedAt: now.toISOString()
        }),
        now.toISOString(),
        now.toISOString()
      ]
    });
    
    console.log('✅ ADRIANO sincronizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

syncAdrianoViaORM();
```

## Opção 3: Via Vercel KV (se disponível)

Se tiver KV habilitado no Vercel, pode usar como alternativa temporária.

## Checklist de Configuração

- [ ] `ADMIN_API_KEY` configurado em Vercel (production, preview, development)
- [ ] `DIDIT_WEBHOOK_SECRET` configurado em Vercel
- [ ] TURSO_DATABASE_URL está correta
- [ ] TURSO_AUTH_TOKEN está válido
- [ ] Arquivo `.env.local` tem variáveis de teste

## Testando Conectividade

```bash
# Verificar se consegue acessar Turso
curl -s -H "Authorization: Bearer seu-token-turso" \
  https://idosolink-isanat.aws-us-east-1.turso.io/health

# Deve retornar 200 OK
```

Se nenhuma das opções acima funcionar, verifique:
1. Token do Turso está válido?
2. Banco de dados ainda existe?
3. Há problema de firewall/rede?
