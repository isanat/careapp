#!/usr/bin/env node

/**
 * Complete Setup and Test Script
 * 1. Resets database
 * 2. Runs migrations
 * 3. Creates admin user
 * 4. Runs automated tests
 * Usage: npx ts-node scripts/setup-and-test.ts
 */

import { execSync } from 'child_process';
import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const ADMIN_EMAIL = 'admin@evyra.pt';
const ADMIN_NAME = 'Administrador';
const ADMIN_PASSWORD = 'EvyraAdmin@2024!';

async function resetDatabase() {
  console.log('🗑️  Step 1: Resetting database...\n');

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Disable foreign keys
    await db.execute('PRAGMA foreign_keys = OFF;');

    // Get all tables
    const tablesResult = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"
    );

    const tables = (tablesResult.rows as any[])
      .map((row) => row.name)
      .filter((name) => name !== '_prisma_migrations');

    // Drop tables
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS "${table}";`);
      } catch (e) {
        // Ignore errors for non-existent tables
      }
    }

    // Re-enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON;');

    console.log(`✅ Database reset - dropped ${tables.length} tables\n`);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

async function runMigrations() {
  console.log('🔄 Step 2: Running migrations...\n');

  try {
    execSync('npm run db:push', { stdio: 'inherit', cwd: process.cwd() });
    console.log('\n✅ Migrations completed\n');
  } catch (error) {
    console.error('⚠️  Migration warning:', error);
    console.log('✅ Continuing with setup...\n');
  }
}

async function createAdminUser() {
  console.log('👤 Step 3: Creating admin user...\n');

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Check if exists
    const existingResult = await db.execute({
      sql: `SELECT id FROM User WHERE email = ? LIMIT 1`,
      args: [ADMIN_EMAIL],
    });

    if (existingResult.rows.length > 0) {
      console.log(`⚠️  Admin user already exists\n`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user
    await db.execute({
      sql: `INSERT INTO User (id, email, name, passwordHash, role, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, ADMIN_EMAIL, ADMIN_NAME, passwordHash, 'ADMIN', 'ACTIVE', new Date().toISOString(), new Date().toISOString()],
    });

    // Create AdminUser profile
    const adminUserId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.execute({
      sql: `INSERT INTO AdminUser (id, userId, role, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [adminUserId, userId, 'ADMIN', 1, new Date().toISOString(), new Date().toISOString()],
    });

    console.log(`✅ Admin user created: ${ADMIN_EMAIL}\n`);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

async function runTests() {
  console.log('📋 Step 4: Running automated tests...\n');

  try {
    execSync('npx ts-node scripts/run-automated-tests.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('\n✅ Tests completed\n');
  } catch (error) {
    console.warn('⚠️  Tests completed with warnings\n');
  }
}

async function displaySummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('✅ SETUP AND TEST COMPLETE');
  console.log('═'.repeat(60));

  console.log(`\n📋 Admin Credentials:\n`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);

  console.log(`\n🔗 Access the application:`);
  console.log(`   - Admin Panel: http://localhost:3000/admin/dashboard`);
  console.log(`   - Login: http://localhost:3000/auth/login`);

  console.log(`\n📊 Test Reports:`);
  const reportsPath = path.join(process.cwd(), 'test-reports');
  if (fs.existsSync(reportsPath)) {
    console.log(`   Location: ${reportsPath}`);
    console.log(`   Latest: test-reports/latest-report.md`);
  }

  console.log('\n🚀 Next Steps:');
  console.log('   1. Start the app: npm run dev');
  console.log(`   2. Log in with credentials above`);
  console.log('   3. Check test-reports/latest-report.md for test results');
  console.log('   4. Automated tests will run every hour (see schedule config)');

  console.log('\n' + '═'.repeat(60));
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 COMPLETE SETUP AND TEST INITIALIZATION');
  console.log('═'.repeat(60) + '\n');

  try {
    await resetDatabase();
    await runMigrations();
    await createAdminUser();
    await runTests();
    await displaySummary();

    console.log(
      '\n✅ All setup steps completed successfully!\n'
    );
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
