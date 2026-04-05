import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

/**
 * Migration Status API
 * 
 * Este endpoint verifica o status das tabelas do banco de dados.
 * Todas as tabelas são gerenciadas pelo schema Prisma mas acessadas via libsql.
 */

// GET - Show migration status
export async function GET(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all tables from database
    const tablesResult = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      args: [],
    });

    const tables = tablesResult.rows.map((row) => row.name as string);

    // All models managed by Prisma schema
    const prismaModels = [
      'User',
      'ProfileFamily',
      'ProfileCaregiver',
      'Payment',
      'Contract',
      'ContractAcceptance',
      'Review',
      'ChatRoom',
      'ChatParticipant',
      'ChatMessage',
      'Notification',
      'PlatformSettings',
      'Account',
      'Session',
      'VerificationToken',
      'Interview',
      'TermsAcceptance',
      'EscrowPayment',
      'AdminUser',
      'AdminAction',
      'SupportTicket',
      'SupportTicketMessage',
      'Receipt',
      'RecurringPayment',
      // Orphan tables now in Prisma
      'AdminNotification',
      'ApiKey',
      'EmailTemplate',
      'ImpersonationLog',
      'ModerationQueue',
      'PlatformMetric',
      'ScheduledReport',
    ];

    const existingPrismaModels = prismaModels.filter((t) => tables.includes(t));
    const missingPrismaModels = prismaModels.filter((t) => !tables.includes(t));

    // Count records in key tables
    const tableStats: Record<string, number> = {};
    const countTables = ['User', 'AdminUser', 'Contract', 'Payment', 'Review'];
    
    for (const table of countTables) {
      if (tables.includes(table)) {
        try {
          const result = await db.execute({
            sql: `SELECT COUNT(*) as count FROM "${table}"`,
            args: [],
          });
          tableStats[table] = Number(result.rows[0]?.count || 0);
        } catch {
          tableStats[table] = 0;
        }
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        totalTables: tables.length,
        allTables: tables,
      },
      prismaModels: {
        required: prismaModels.length,
        existing: existingPrismaModels.length,
        missing: missingPrismaModels,
        synced: missingPrismaModels.length === 0,
      },
      tableStats,
      recommendation:
        missingPrismaModels.length > 0
          ? 'Run `bun run db:push` to sync Prisma schema with database'
          : 'All tables are synced with Prisma schema',
    });
  } catch (error) {
    console.error('Migration status check failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Deprecated manual migration
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Manual migration is deprecated',
    instruction: 'Use `bun run db:push` to sync Prisma schema with database',
    note: 'All tables are now managed by Prisma schema.',
  });
}
