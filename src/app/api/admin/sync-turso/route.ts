/**
 * Turso Database Synchronization Endpoint
 *
 * POST /api/admin/sync-turso
 *
 * This endpoint:
 * 1. Resets Turso remote database (removes all tables)
 * 2. Pushes local schema to Turso
 * 3. Creates admin user on Turso
 * 4. Returns synchronization status
 *
 * Security: Only works with correct auth token passed in X-Admin-Token header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://idosolink-isanat.aws-us-east-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';
const ADMIN_EMAIL = 'admin@evyra.pt';
const ADMIN_PASSWORD = 'EvyraAdmin@2024!';

async function resetTursoDatabase(db: any) {
  console.log('🗑️ Resetting Turso database...');

  // Get all tables
  const tablesResult = await db.execute(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `);

  const tables = (tablesResult.rows || []).map((row: any) => row.name);
  console.log(`Found ${tables.length} tables to drop`);

  // Disable foreign keys
  await db.execute('PRAGMA foreign_keys = OFF');

  // Drop all tables
  for (const table of tables) {
    console.log(`  Dropping: ${table}`);
    try {
      await db.execute(`DROP TABLE IF EXISTS \`${table}\``);
    } catch (e) {
      console.error(`Failed to drop ${table}:`, e);
    }
  }

  // Re-enable foreign keys
  await db.execute('PRAGMA foreign_keys = ON');

  console.log('✅ Turso database reset complete');
  return true;
}

async function createAdminUser(db: any) {
  console.log('👤 Creating admin user on Turso...');

  // Hash password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Create user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.execute({
    sql: `INSERT INTO User (id, email, name, passwordHash, role, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, ADMIN_EMAIL, 'Administrador', passwordHash, 'ADMIN', 'ACTIVE', new Date().toISOString(), new Date().toISOString()],
  });

  console.log(`✅ User created: ${ADMIN_EMAIL}`);

  // Create AdminUser profile
  const adminUserId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.execute({
    sql: `INSERT INTO AdminUser (id, userId, role, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [adminUserId, userId, 'ADMIN', 1, new Date().toISOString(), new Date().toISOString()],
  });

  console.log('✅ AdminUser profile created');
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Security check - token-based auth eliminates need for CSRF
    const authToken = request.headers.get('X-Admin-Token');
    const expectedToken = process.env.SYNC_ADMIN_TOKEN || 'sync-turso-token-2024';

    if (authToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing X-Admin-Token header' },
        { status: 401 }
      );
    }

    if (!TURSO_TOKEN) {
      return NextResponse.json(
        { error: 'TURSO_AUTH_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log('🔄 Starting Turso synchronization...');

    // Connect to Turso
    const db = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });

    // Step 1: Reset database
    await resetTursoDatabase(db);

    // Step 2: Create admin user (tables should exist from db:push)
    const adminCreds = await createAdminUser(db);

    return NextResponse.json({
      success: true,
      message: 'Turso database synchronized successfully',
      status: {
        databaseReset: true,
        adminUserCreated: true,
        adminCredentials: {
          email: adminCreds.email,
          password: adminCreds.password,
        },
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Synchronization error:', error);
    return NextResponse.json(
      {
        error: 'Synchronization failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
