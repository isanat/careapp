import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

/**
 * GET /api/debug/demands-test
 * Test endpoint to debug demand creation errors
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test simple SELECT
    const result = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM Demand LIMIT 1',
      args: [],
    });

    // Test INSERT with minimal data
    const demandId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      await db.execute({
        sql: `
          INSERT INTO Demand (
            id, familyUserId, title, description, serviceTypes, city,
            requiredExperienceLevel, careType,
            visibilityPackage, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          demandId,
          session.user.id,
          'Test Title',
          'A'.repeat(100),
          JSON.stringify(['PERSONAL_CARE']),
          'Lisboa',
          'INTERMEDIATE',
          'RECURRING',
          'NONE',
          'ACTIVE',
          now,
          now,
        ],
      });

      return NextResponse.json({
        success: true,
        message: 'Test INSERT successful',
        demandId,
        totalDemands: result.rows[0],
      });
    } catch (insertError) {
      return NextResponse.json({
        success: false,
        error: 'INSERT failed',
        details: insertError instanceof Error ? insertError.message : String(insertError),
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
