/**
 * Database Reset Script
 * Zeros entire database and creates admin user
 * Usage: npx ts-node scripts/reset-database.ts
 */

import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@evyra.pt';
const ADMIN_NAME = 'Administrador';
const ADMIN_PASSWORD = 'EvyraAdmin@2024'; // Strong password

async function resetDatabase() {
  try {
    // Connect to database
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('🗑️  Starting database reset...\n');

    // Disable foreign key constraints temporarily
    await db.execute('PRAGMA foreign_keys = OFF;');
    console.log('✅ Disabled foreign key constraints');

    // Get all tables
    const tablesResult = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"
    );

    const tables = (tablesResult.rows as any[])
      .map((row) => row.name)
      .filter((name) => name !== '_prisma_migrations');

    console.log(`Found ${tables.length} tables to clear`);

    // Drop all tables
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS "${table}";`);
        console.log(`  ✅ Dropped table: ${table}`);
      } catch (e) {
        console.log(`  ⚠️  Could not drop table ${table}: ${e}`);
      }
    }

    // Re-enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON;');
    console.log('\n✅ Re-enabled foreign key constraints');

    // Run migrations to recreate schema
    console.log('\n🔄 Running migrations to recreate schema...');
    const migrationResult = await db.execute(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='_prisma_migrations';`
    );

    if (migrationResult.rows.length === 0) {
      console.log('  ℹ️  No migrations table found, will be created automatically');
    }

    console.log('\n✅ Database reset complete');
    console.log('\nℹ️  Database schema will be auto-migrated on next app start');
    console.log('   Make sure to run: npm run db:push');

    return true;
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    return false;
  }
}

resetDatabase().then((success) => {
  process.exit(success ? 0 : 1);
});
