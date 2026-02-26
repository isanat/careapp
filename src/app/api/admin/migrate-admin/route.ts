import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// This endpoint creates AdminUser and AdminAction tables in Turso
// It should be called once after deploying the admin panel feature

export async function POST(request: NextRequest) {
  try {
    // Check for admin secret to prevent unauthorized access
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'idosolink-migrate-2024') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting Admin tables migration...');

    const results: { step: string; success: boolean; error?: string }[] = [];

    // Step 1: Create AdminUser table
    try {
      await db.execute({
        sql: `
          CREATE TABLE IF NOT EXISTS AdminUser (
            id TEXT PRIMARY KEY,
            userId TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'ADMIN',
            customPermissions TEXT,
            isActive INTEGER DEFAULT 1,
            lastAdminActionAt TEXT,
            twoFactorEnabled INTEGER DEFAULT 0,
            twoFactorSecret TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
          )
        `,
        args: []
      });
      results.push({ step: 'create_admin_user_table', success: true });
      console.log('Created AdminUser table');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        results.push({ step: 'create_admin_user_table', success: true, error: 'Table already exists' });
      } else {
        results.push({ step: 'create_admin_user_table', success: false, error: String(e) });
        return NextResponse.json({ results, error: 'Failed to create AdminUser table' }, { status: 500 });
      }
    }

    // Step 2: Create AdminAction table
    try {
      await db.execute({
        sql: `
          CREATE TABLE IF NOT EXISTS AdminAction (
            id TEXT PRIMARY KEY,
            adminUserId TEXT NOT NULL,
            action TEXT NOT NULL,
            entityType TEXT NOT NULL,
            entityId TEXT,
            oldValue TEXT,
            newValue TEXT,
            ipAddress TEXT,
            userAgent TEXT,
            reason TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (adminUserId) REFERENCES AdminUser(id) ON DELETE CASCADE
          )
        `,
        args: []
      });
      results.push({ step: 'create_admin_action_table', success: true });
      console.log('Created AdminAction table');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        results.push({ step: 'create_admin_action_table', success: true, error: 'Table already exists' });
      } else {
        results.push({ step: 'create_admin_action_table', success: false, error: String(e) });
        return NextResponse.json({ results, error: 'Failed to create AdminAction table' }, { status: 500 });
      }
    }

    // Step 3: Create indexes for AdminUser
    const adminUserIndexes = [
      { name: 'idx_admin_user_role', sql: 'CREATE INDEX IF NOT EXISTS idx_admin_user_role ON AdminUser(role)' },
      { name: 'idx_admin_user_is_active', sql: 'CREATE INDEX IF NOT EXISTS idx_admin_user_is_active ON AdminUser(isActive)' },
    ];

    for (const idx of adminUserIndexes) {
      try {
        await db.execute({ sql: idx.sql, args: [] });
        results.push({ step: `create_index_${idx.name}`, success: true });
      } catch (e: any) {
        results.push({ step: `create_index_${idx.name}`, success: true, error: 'Index may already exist' });
      }
    }

    // Step 4: Create indexes for AdminAction
    const adminActionIndexes = [
      { name: 'idx_admin_action_user_date', sql: 'CREATE INDEX IF NOT EXISTS idx_admin_action_user_date ON AdminAction(adminUserId, createdAt)' },
      { name: 'idx_admin_action_entity', sql: 'CREATE INDEX IF NOT EXISTS idx_admin_action_entity ON AdminAction(entityType, entityId)' },
      { name: 'idx_admin_action_created', sql: 'CREATE INDEX IF NOT EXISTS idx_admin_action_created ON AdminAction(createdAt)' },
    ];

    for (const idx of adminActionIndexes) {
      try {
        await db.execute({ sql: idx.sql, args: [] });
        results.push({ step: `create_index_${idx.name}`, success: true });
      } catch (e: any) {
        results.push({ step: `create_index_${idx.name}`, success: true, error: 'Index may already exist' });
      }
    }

    // Step 5: Verify tables were created
    try {
      const tablesCheck = await db.execute({
        sql: `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('AdminUser', 'AdminAction')`,
        args: []
      });
      
      const createdTables = tablesCheck.rows.map((row: any) => row.name);
      
      if (!createdTables.includes('AdminUser') || !createdTables.includes('AdminAction')) {
        return NextResponse.json({
          success: false,
          message: 'Some tables were not created',
          results,
          createdTables,
        }, { status: 500 });
      }
      
      results.push({ step: 'verify_tables', success: true });
      
      return NextResponse.json({
        success: true,
        message: 'Admin tables migration completed successfully',
        results,
        createdTables,
      });
    } catch (e) {
      results.push({ step: 'verify_tables', success: false, error: String(e) });
      return NextResponse.json({ results }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET to check current migration status
export async function GET(request: NextRequest) {
  try {
    // Check if tables exist
    const tablesCheck = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('AdminUser', 'AdminAction')`,
      args: []
    });
    
    const existingTables = tablesCheck.rows.map((row: any) => row.name);

    // Get AdminUser columns if table exists
    let adminUserColumns: any[] = [];
    if (existingTables.includes('AdminUser')) {
      const colsResult = await db.execute({
        sql: `PRAGMA table_info(AdminUser)`,
        args: []
      });
      adminUserColumns = colsResult.rows.map((row: any) => ({
        name: row.name,
        type: row.type,
        notnull: row.notnull,
        defaultValue: row.dflt_value,
      }));
    }

    // Get AdminAction columns if table exists
    let adminActionColumns: any[] = [];
    if (existingTables.includes('AdminAction')) {
      const colsResult = await db.execute({
        sql: `PRAGMA table_info(AdminAction)`,
        args: []
      });
      adminActionColumns = colsResult.rows.map((row: any) => ({
        name: row.name,
        type: row.type,
        notnull: row.notnull,
        defaultValue: row.dflt_value,
      }));
    }

    // Check for admin users
    let adminUserCount = 0;
    if (existingTables.includes('AdminUser')) {
      const countResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM AdminUser`,
        args: []
      });
      adminUserCount = (countResult.rows[0] as any)?.count || 0;
    }

    return NextResponse.json({
      migrationRequired: !existingTables.includes('AdminUser') || !existingTables.includes('AdminAction'),
      existingTables,
      adminUserColumns,
      adminActionColumns,
      adminUserCount,
      status: existingTables.includes('AdminUser') && existingTables.includes('AdminAction') 
        ? 'migrated' 
        : 'pending',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check migration status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
