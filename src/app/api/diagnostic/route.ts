import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST - Execute admin SQL (requires admin secret)
export async function POST(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sql: sqlQuery, args = [] } = body;

    if (!sqlQuery) {
      return NextResponse.json({ error: 'SQL query required' }, { status: 400 });
    }

    const result = await db.execute({ sql: sqlQuery, args });

    return NextResponse.json({
      success: true,
      rowsAffected: result.rowsAffected,
      rows: result.rows,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Diagnostic endpoint - check session, database, and tables
export async function GET(request: NextRequest) {
  console.log('🔍 Diagnostic API called');
  
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    },
    session: null,
    database: null,
    tables: null,
    user: null,
    profile: null,
  };

  // Check session
  try {
    const session = await getServerSession(authOptions);
    diagnostics.session = session ? {
      id: session.user?.id,
      email: session.user?.email,
      name: session.user?.name,
      role: session.user?.role,
      status: session.user?.status,
    } : 'No session';
    console.log('📋 Session:', diagnostics.session);
  } catch (error) {
    diagnostics.session = 'Error: ' + (error instanceof Error ? error.message : 'Unknown');
    console.error('❌ Session error:', error);
  }

  // Check database connection
  try {
    const result = await db.execute({
      sql: "SELECT 1 as test",
      args: []
    });
    diagnostics.database = result.rows.length > 0 ? 'Connected' : 'No result';
    console.log('📦 Database:', diagnostics.database);
  } catch (error) {
    diagnostics.database = 'Error: ' + (error instanceof Error ? error.message : 'Unknown');
    console.error('❌ Database error:', error);
  }

  // Check tables
  try {
    const tables = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      args: []
    });
    diagnostics.tables = tables.rows.map(r => r.name);
    console.log('📋 Tables:', diagnostics.tables);
  } catch (error) {
    diagnostics.tables = 'Error: ' + (error instanceof Error ? error.message : 'Unknown');
    console.error('❌ Tables error:', error);
  }

  // Check user if session exists
  if (diagnostics.session && typeof diagnostics.session === 'object' && diagnostics.session.id) {
    try {
      const userResult = await db.execute({
        sql: `SELECT id, email, name, phone, role, status, profileImage, nif, documentType, documentNumber FROM User WHERE id = ?`,
        args: [diagnostics.session.id]
      });
      diagnostics.user = userResult.rows.length > 0 ? userResult.rows[0] : 'User not found';
      console.log('👤 User:', diagnostics.user);

      // Check profile
      if (diagnostics.session.role === 'CAREGIVER') {
        const profileResult = await db.execute({
          sql: `SELECT * FROM ProfileCaregiver WHERE userId = ?`,
          args: [diagnostics.session.id]
        });
        diagnostics.profile = profileResult.rows.length > 0 ? profileResult.rows[0] : 'Profile not found';
      } else if (diagnostics.session.role === 'FAMILY') {
        const profileResult = await db.execute({
          sql: `SELECT * FROM ProfileFamily WHERE userId = ?`,
          args: [diagnostics.session.id]
        });
        diagnostics.profile = profileResult.rows.length > 0 ? profileResult.rows[0] : 'Profile not found';
      }
      console.log('📋 Profile:', diagnostics.profile);
    } catch (error) {
      diagnostics.user = 'Error: ' + (error instanceof Error ? error.message : 'Unknown');
      console.error('❌ User query error:', error);
    }
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
