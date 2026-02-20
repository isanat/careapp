import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function check() {
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('📊 Tables:', tables.rows.map(r => r.name).join(', '));
  
  const users = await db.execute("SELECT id, email, role FROM users");
  console.log('\n👥 Users:');
  for (const u of users.rows) {
    console.log(`  - ${u.id}: ${u.email} (${u.role})`);
  }
  
  const wallets = await db.execute("SELECT id, user_id, balance_tokens FROM wallets");
  console.log('\n💼 Wallets:', wallets.rows.length);
  
  const contracts = await db.execute("SELECT id, status, title FROM contracts");
  console.log('\n📄 Contracts:', contracts.rows.length);
}

check().catch(console.error);
