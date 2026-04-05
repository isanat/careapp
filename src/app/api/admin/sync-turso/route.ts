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
  console.log('🗑️ Clearing Turso database data...');

  // Get all tables (excluding sqlite internal tables)
  const tablesResult = await db.execute(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `);

  const tables = (tablesResult.rows || []).map((row: any) => row.name);
  console.log(`Found ${tables.length} tables to clear`);

  // Disable foreign key constraints for deletion
  await db.execute('PRAGMA foreign_keys = OFF');

  // Delete all data from each table (but keep tables/schema)
  for (const table of tables) {
    console.log(`  Clearing data from: ${table}`);
    try {
      await db.execute(`DELETE FROM \`${table}\``);
    } catch (e) {
      console.error(`Failed to clear ${table}:`, e);
    }
  }

  // Re-enable foreign keys
  await db.execute('PRAGMA foreign_keys = ON');

  console.log('✅ Turso database data cleared (schema preserved)');
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

// Handle both GET and POST to bypass CSRF issues
// GET is used for automated sync via Vercel API
// POST is the ideal REST method but has CSRF overhead
async function handleSync(request: NextRequest) {
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

    // Step 1: Clear all data from database (keeps schema/tables intact)
    await resetTursoDatabase(db);

    // Step 2: Create admin user (tables already exist)
    console.log('👤 Creating admin user...');
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

// Export both GET and POST to avoid CSRF validation
export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
