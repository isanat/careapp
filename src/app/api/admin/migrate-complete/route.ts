import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Complete migration for all admin tables
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== 'idosolink-migrate-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { step: string; success: boolean; error?: string }[] = [];

  // ===== PHASE 1: Admin Tables =====
  
  // 1. AdminUser table
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS AdminUser (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'ADMIN',
        customPermissions TEXT,
        isActive INTEGER DEFAULT 1,
        lastAdminActionAt TEXT,
        twoFactorEnabled INTEGER DEFAULT 0,
        twoFactorSecret TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_admin_user_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_admin_user_table', success: false, error: e.message });
  }

  // 2. AdminAction table (audit log)
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS AdminAction (
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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_admin_action_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_admin_action_table', success: false, error: e.message });
  }

  // Create indexes for AdminAction
  try {
    await db.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_admin_action_user ON AdminAction(adminUserId, createdAt)`,
      args: []
    });
    await db.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_admin_action_entity ON AdminAction(entityType, entityId)`,
      args: []
    });
    results.push({ step: 'create_admin_action_indexes', success: true });
  } catch (e: any) {
    results.push({ step: 'create_admin_action_indexes', success: false, error: String(e) });
  }

  // ===== PHASE 2: User KYC columns =====
  
  const userColumns = [
    { name: 'kycSessionId', sql: 'ALTER TABLE User ADD COLUMN kycSessionId TEXT' },
    { name: 'kycSessionToken', sql: 'ALTER TABLE User ADD COLUMN kycSessionToken TEXT' },
    { name: 'kycSessionCreatedAt', sql: 'ALTER TABLE User ADD COLUMN kycSessionCreatedAt TEXT' },
    { name: 'kycCompletedAt', sql: 'ALTER TABLE User ADD COLUMN kycCompletedAt TEXT' },
    { name: 'kycConfidence', sql: 'ALTER TABLE User ADD COLUMN kycConfidence INTEGER DEFAULT 0' },
  ];

  let existingUserCols: string[] = [];
  try {
    const colsResult = await db.execute({ sql: `PRAGMA table_info(User)`, args: [] });
    existingUserCols = colsResult.rows.map((row: any) => row.name as string);
  } catch (e) {
    results.push({ step: 'get_user_columns', success: false, error: String(e) });
  }

  for (const col of userColumns) {
    if (!existingUserCols.includes(col.name)) {
      try {
        await db.execute({ sql: col.sql, args: [] });
        results.push({ step: `add_user_column_${col.name}`, success: true });
      } catch (e: any) {
        if (e.message?.includes('duplicate column')) {
          results.push({ step: `add_user_column_${col.name}`, success: true, error: 'Already exists' });
        } else {
          results.push({ step: `add_user_column_${col.name}`, success: false, error: e.message });
        }
      }
    } else {
      results.push({ step: `add_user_column_${col.name}`, success: true, error: 'Already exists' });
    }
  }

  // ===== PHASE 3: Support Tickets =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS SupportTicket (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN',
        priority TEXT DEFAULT 'NORMAL',
        assignedTo TEXT,
        resolvedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_support_ticket_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_support_ticket_table', success: false, error: e.message });
  }

  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS SupportTicketMessage (
        id TEXT PRIMARY KEY,
        ticketId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        senderRole TEXT NOT NULL,
        message TEXT NOT NULL,
        attachments TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_ticket_message_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_ticket_message_table', success: false, error: e.message });
  }

  // ===== PHASE 4: Feature Flags =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS FeatureFlag (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 0,
        rolloutPercent INTEGER DEFAULT 100,
        conditions TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_feature_flag_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_feature_flag_table', success: false, error: e.message });
  }

  // ===== PHASE 5: Admin Notifications =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS AdminNotification (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        entityType TEXT,
        entityId TEXT,
        severity TEXT DEFAULT 'INFO',
        isRead INTEGER DEFAULT 0,
        readAt TEXT,
        readBy TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_admin_notification_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_admin_notification_table', success: false, error: e.message });
  }

  // ===== PHASE 6: Impersonation Log =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS ImpersonationLog (
        id TEXT PRIMARY KEY,
        adminUserId TEXT NOT NULL,
        targetUserId TEXT NOT NULL,
        reason TEXT,
        startedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        endedAt TEXT,
        durationSeconds INTEGER,
        ipAddress TEXT,
        userAgent TEXT
      )`,
      args: []
    });
    results.push({ step: 'create_impersonation_log_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_impersonation_log_table', success: false, error: e.message });
  }

  // ===== PHASE 7: Platform Metrics =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS PlatformMetric (
        id TEXT PRIMARY KEY,
        metricKey TEXT UNIQUE NOT NULL,
        metricValue TEXT NOT NULL,
        computedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        period TEXT
      )`,
      args: []
    });
    results.push({ step: 'create_platform_metric_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_platform_metric_table', success: false, error: e.message });
  }

  // ===== PHASE 8: Scheduled Reports =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS ScheduledReport (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        reportType TEXT NOT NULL,
        frequency TEXT NOT NULL,
        recipients TEXT NOT NULL,
        filters TEXT,
        lastRunAt TEXT,
        nextRunAt TEXT,
        isActive INTEGER DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_scheduled_report_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_scheduled_report_table', success: false, error: e.message });
  }

  // ===== PHASE 9: Moderation Queue =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS ModerationQueue (
        id TEXT PRIMARY KEY,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        reportedBy TEXT,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        reviewedBy TEXT,
        reviewedAt TEXT,
        action TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_moderation_queue_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_moderation_queue_table', success: false, error: e.message });
  }

  // ===== PHASE 10: Email Templates =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS EmailTemplate (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        subject TEXT NOT NULL,
        bodyHtml TEXT NOT NULL,
        bodyText TEXT,
        variables TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_email_template_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_email_template_table', success: false, error: e.message });
  }

  // ===== PHASE 11: API Keys =====
  
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS ApiKey (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        keyHash TEXT UNIQUE NOT NULL,
        keyPrefix TEXT NOT NULL,
        permissions TEXT,
        lastUsedAt TEXT,
        expiresAt TEXT,
        isActive INTEGER DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    results.push({ step: 'create_api_key_table', success: true });
  } catch (e: any) {
    results.push({ step: 'create_api_key_table', success: false, error: e.message });
  }

  // ===== FINAL: Insert default admin user =====
  
  try {
    const adminCheck = await db.execute({
      sql: `SELECT COUNT(*) as count FROM AdminUser`,
      args: []
    });
    
    if (Number(adminCheck.rows[0].count) === 0) {
      // Find user with specific email and make them super admin
      const potentialAdmin = await db.execute({
        sql: `SELECT id FROM User WHERE email = 'netlinkassist@gmail.com' LIMIT 1`,
        args: []
      });
      
      if (potentialAdmin.rows.length > 0) {
        const adminId = `admin-${Date.now()}`;
        await db.execute({
          sql: `INSERT INTO AdminUser (id, userId, role, isActive) VALUES (?, ?, 'SUPER_ADMIN', 1)`,
          args: [adminId, potentialAdmin.rows[0].id]
        });
        results.push({ step: 'create_default_admin', success: true, error: `Super admin created for ${potentialAdmin.rows[0].id}` });
      } else {
        // Try to find any user to make admin
        const anyUser = await db.execute({
          sql: `SELECT id FROM User LIMIT 1`,
          args: []
        });
        if (anyUser.rows.length > 0) {
          const adminId = `admin-${Date.now()}`;
          await db.execute({
            sql: `INSERT INTO AdminUser (id, userId, role, isActive) VALUES (?, ?, 'SUPER_ADMIN', 1)`,
            args: [adminId, anyUser.rows[0].id]
          });
          results.push({ step: 'create_default_admin', success: true, error: `Admin created for ${anyUser.rows[0].id}` });
        } else {
          results.push({ step: 'create_default_admin', success: true, error: 'No users found' });
        }
      }
    } else {
      results.push({ step: 'create_default_admin', success: true, error: 'Admin already exists' });
    }
  } catch (e: any) {
    results.push({ step: 'create_default_admin', success: false, error: e.message });
  }

  // Count total tables
  try {
    const tablesResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'`,
      args: []
    });
    const totalTables = tablesResult.rows[0].count;
    
    return NextResponse.json({
      success: true,
      message: 'Complete migration finished',
      totalTables,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ success: true, results, error: 'Could not count tables' });
  }
}

// GET - Show migration status
export async function GET(request: NextRequest) {
  try {
    const tablesResult = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      args: []
    });
    
    const tables = tablesResult.rows.map((row: any) => row.name);
    
    const adminTables = ['AdminUser', 'AdminAction', 'SupportTicket', 'SupportTicketMessage', 
                         'FeatureFlag', 'AdminNotification', 'ImpersonationLog', 'PlatformMetric',
                         'ScheduledReport', 'ModerationQueue', 'EmailTemplate', 'ApiKey'];
    
    const existingAdminTables = adminTables.filter(t => tables.includes(t));
    
    const userCols = await db.execute({ sql: `PRAGMA table_info(User)`, args: [] });
    const kycCols = ['kycSessionId', 'kycSessionToken', 'kycSessionCreatedAt', 'kycCompletedAt', 'kycConfidence'];
    const existingKycCols = userCols.rows
      .map((row: any) => row.name)
      .filter((name: string) => kycCols.includes(name));
    
    const adminCount = await db.execute({
      sql: `SELECT COUNT(*) as count FROM AdminUser`,
      args: []
    });
    
    return NextResponse.json({
      totalTables: tables.length,
      allTables: tables,
      adminTablesStatus: {
        required: adminTables.length,
        existing: existingAdminTables.length,
        missing: adminTables.filter(t => !tables.includes(t)),
      },
      kycColumnsStatus: {
        required: kycCols.length,
        existing: existingKycCols.length,
        missing: kycCols.filter(c => !existingKycCols.includes(c)),
      },
      adminUsersCount: Number(adminCount.rows[0].count),
      needsMigration: existingAdminTables.length < adminTables.length || existingKycCols.length < kycCols.length,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check migration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
