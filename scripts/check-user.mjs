import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://idosolink-isanat.aws-us-east-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ2Mi1oNWhlNEVmR0JkMkxuaDZhN1lnIn0.voAYnUKiV4uobw6DJEqY0bipVPuHjEsBH0hYdzd8zNaT8pRf3GedJL20pCinMmSKQ9XwTMSv4oJ7XE7Y55PuAw"
});

async function check() {
  try {
    console.log('🔍 Procurando usuário com email: netlinkassist@gmail.com\n');

    const result = await client.execute({
      sql: `SELECT
        id,
        email,
        name,
        role,
        status,
        verificationStatus,
        createdAt,
        updatedAt
      FROM User
      WHERE email = ?`,
      args: ['netlinkassist@gmail.com']
    });

    if (result.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado com este email');
      console.log('\n📊 Totalizando usuários no banco:');

      const count = await client.execute({
        sql: 'SELECT COUNT(*) as total FROM User'
      });

      console.log(`Total de usuários: ${count.rows[0].total}`);

      const byRole = await client.execute({
        sql: `SELECT role, COUNT(*) as count FROM User GROUP BY role`
      });

      console.log('\nPor role:');
      for (const row of byRole.rows) {
        console.log(`  - ${row.role}: ${row.count}`);
      }

      const recent = await client.execute({
        sql: `SELECT id, email, name, role, status FROM User ORDER BY createdAt DESC LIMIT 5`
      });

      console.log('\n5 usuários mais recentes:');
      for (const user of recent.rows) {
        console.log(`  - ${user.email} (${user.role})`);
      }
    } else {
      console.log('✅ Usuário encontrado:');
      for (const user of result.rows) {
        console.log(`\nID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
        console.log(`Verification Status: ${user.verificationStatus}`);
        console.log(`Criado em: ${user.createdAt}`);
        console.log(`Atualizado em: ${user.updatedAt}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao consultar banco de dados:');
    console.error(error.message);
    process.exit(1);
  }
}

check();
