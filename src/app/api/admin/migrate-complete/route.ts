import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { db } from '@/lib/db-turso';

/**
 * Migration Status API
 * 
 * Este endpoint verifica o status das tabelas do banco de dados.
 * As tabelas agora são gerenciadas pelo Prisma, então este arquivo
 * apenas verifica se tudo está sincronizado.
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

    const tables = tablesResult.rows.map((row: { name: unknown }) => row.name as string);

    // Prisma-managed models (synced with schema.prisma)
    const prismaModels = [
      'User',
      'ProfileFamily',
      'ProfileCaregiver',
      'Wallet',
      'TokenLedger',
      'Payment',
      'Contract',
      'ContractAcceptance',
      'Tip',
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
      'GuideAcceptance',
      'EscrowPayment',
      'AdminUser',
      'AdminAction',
      'SupportTicket',
      'SupportTicketMessage',
      'Receipt',
      'RecurringPayment',
      'FeatureFlag',
      // New models added to Prisma
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

    // Check KYC columns in User table
    const userCols = await db.execute({ sql: `PRAGMA table_info(User)`, args: [] });
    const kycCols = [
      'kycSessionId',
      'kycSessionToken',
      'kycSessionCreatedAt',
      'kycCompletedAt',
      'kycConfidence',
    ];
    const existingKycCols = userCols.rows
      .map((row: { name: unknown }) => row.name as string)
      .filter((name: string) => kycCols.includes(name));

    // Count admin users
    const adminCount = await prisma.adminUser.count();

    // Count records in orphan tables (now managed by Prisma)
    const orphanTableStats = {
      adminNotification: await prisma.adminNotification.count(),
      apiKey: await prisma.apiKey.count(),
      emailTemplate: await prisma.emailTemplate.count(),
      impersonationLog: await prisma.impersonationLog.count(),
      moderationQueue: await prisma.moderationQueue.count(),
      platformMetric: await prisma.platformMetric.count(),
      scheduledReport: await prisma.scheduledReport.count(),
    };

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
      kycColumns: {
        required: kycCols.length,
        existing: existingKycCols.length,
        missing: kycCols.filter((c) => !existingKycCols.includes(c)),
      },
      adminUsers: adminCount,
      orphanTableStats,
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

// POST - Sync database with Prisma schema (deprecated - use prisma db push instead)
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Manual migration is deprecated',
    instruction: 'Use `bun run db:push` to sync Prisma schema with database',
    alternative: 'Or use Prisma Studio: `bun run db:studio`',
    note: 'All tables are now managed by Prisma schema. Run `bun run db:generate` to update Prisma Client.',
  });
}
