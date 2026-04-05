/**
 * Create Admin User Script
 * Creates the admin user with strong password
 * Usage: npx ts-node scripts/create-admin-user.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@evyra.pt';
const ADMIN_NAME = 'Administrador';
const ADMIN_PASSWORD = 'EvyraAdmin@2024!';

async function createAdminUser() {
  try {
    const prisma = new PrismaClient();

    console.log('👤 Creating admin user...\n');

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingUser) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log(`\n📋 Admin Credentials:`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`\n✅ Use these credentials to log in to the admin panel`);
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    console.log(`✅ User created: ${ADMIN_EMAIL}`);

    // Create AdminUser profile
    await prisma.adminUser.create({
      data: {
        userId: user.id,
        role: 'ADMIN',
        isActive: true,
      },
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

    await prisma.$disconnect();
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
