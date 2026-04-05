/**
 * Create Admin User Script
 * Creates the admin user with strong password
 * Usage: npx ts-node scripts/create-admin-user.ts
 */

import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@evyra.pt';
const ADMIN_NAME = 'Administrador';
const ADMIN_PASSWORD = 'EvyraAdmin@2024!';

async function createAdminUser() {
  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('👤 Creating admin user...\n');

    // Check if admin already exists
    const existingResult = await db.execute({
      sql: `SELECT id, email FROM User WHERE email = ? LIMIT 1`,
      args: [ADMIN_EMAIL],
    });

    if (existingResult.rows.length > 0) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log(`\n📋 Admin Credentials:`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`\n✅ Use these credentials to log in to the admin panel`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.execute({
      sql: `INSERT INTO User (id, email, name, passwordHash, role, status, createdAt, updatedAt, lastLoginAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      args: [userId, ADMIN_EMAIL, ADMIN_NAME, passwordHash, 'ADMIN', 'ACTIVE', new Date().toISOString(), new Date().toISOString()],
    });

    console.log(`✅ User created: ${ADMIN_EMAIL}`);

    // Create AdminUser profile
    const adminUserId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.execute({
      sql: `INSERT INTO AdminUser (id, userId, role, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [adminUserId, userId, 'ADMIN', 1, new Date().toISOString(), new Date().toISOString()],
    });

    console.log(`✅ AdminUser profile created\n`);

    // Display credentials
    console.log('═'.repeat(50));
    console.log('📋 ADMIN USER CREATED SUCCESSFULLY');
    console.log('═'.repeat(50));
    console.log(`\n🔐 Admin Credentials:\n`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n✅ Use these credentials to log in at /auth/login`);
    console.log('═'.repeat(50));

    return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

createAdminUser().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
