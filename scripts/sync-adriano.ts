import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://idosolink-isanat.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function syncAdrianoUser() {
  try {
    console.log('🔄 Sincronizando usuário ADRIANO...\n');

    const now = new Date().toISOString();
    const kycData = {
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
      syncedAt: now
    };

    const result = await client.execute({
      sql: `INSERT INTO User (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'user_adriano_' + Date.now(),
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
        now,
        JSON.stringify(kycData),
        now,
        now
      ]
    });

    console.log('✅ Usuário sincronizado com sucesso!');
    console.log(`\nDetalhes:`);
    console.log(`  Email: netlinkassist@gmail.com`);
    console.log(`  Nome: Adriano Moreira da Silva`);
    console.log(`  Role: CAREGIVER`);
    console.log(`  Status: ACTIVE`);
    console.log(`  KYC Status: VERIFIED`);
    console.log(`  Data de Nascimento: 1976-05-01`);
    console.log(`  Nacionalidade: BRA`);
    console.log(`  Documento Válido até: 2025-12-05`);
    console.log(`\n🎉 Pronto para fazer login!`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

syncAdrianoUser();
