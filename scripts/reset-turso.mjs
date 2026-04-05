import { createClient } from '@libsql/client';

const TURSO_URL = 'libsql://idosolink-isanat.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ2Mi1oNWhlNEVmR0JkMkxuaDZhN1lnIn0.voAYnUKiV4uobw6DJEqY0bipVPuHjEsBH0hYdzd8zNaT8pRf3GedJL20pCinMmSKQ9XwTMSv4oJ7XE7Y55PuAw';

async function resetTurso() {
  try {
    console.log('Connecting to Turso database...');
    const db = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });

    console.log('Fetching existing tables...');
    const tablesResult = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    const tables = (tablesResult.rows || []).map((row) => row.name);
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t}`));

    if (tables.length === 0) {
      console.log('Database is already empty!');
      return;
    }

    // Disable foreign keys
    await db.execute('PRAGMA foreign_keys = OFF');

    // Drop all tables
    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      try {
        await db.execute(`DROP TABLE IF EXISTS \`${table}\``);
      } catch (e) {
        console.error(`Failed to drop ${table}:`, e);
      }
    }

    // Re-enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON');

    // Verify
    const verifyResult = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const remainingTables = (verifyResult.rows || []).length;
    console.log(`\nVerification: ${remainingTables} tables remaining`);
    console.log('Turso database reset complete!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

resetTurso();
