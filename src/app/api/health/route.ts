import { NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Simple health check for database connection
export async function GET() {
  try {
    // Try a simple query
    const result = await db.execute({
      sql: 'SELECT 1 as test',
      args: []
    });

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
    }, { status: 500 });
  }
}
