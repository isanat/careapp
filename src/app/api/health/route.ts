import { NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Simple health check for database connection
export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query
    const result = await db.execute({
      sql: 'SELECT 1 as test',
      args: []
    });
    
    console.log('Database query result:', result);
    
    // Check env variables (without exposing secrets)
    const envStatus = {
      TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIDIT_APP_ID: !!process.env.DIDIT_APP_ID,
      DIDIT_API_KEY: !!process.env.DIDIT_API_KEY,
      DIDIT_WORKFLOW_ID: !!process.env.DIDIT_WORKFLOW_ID,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      queryResult: result.rows,
      env: envStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
