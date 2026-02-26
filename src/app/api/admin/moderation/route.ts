import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Moderation queue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const type = searchParams.get('type'); // REVIEW, PROFILE, etc

    // Get pending reviews
    let reviews = [];
    if (!type || type === 'REVIEW') {
      const reviewsResult = await db.execute({
        sql: `SELECT 
          r.id, r.rating, r.comment, r.createdAt,
          c.title as contractTitle,
          uFrom.name as fromName,
          uTo.name as toName, uTo.role as toRole
        FROM Review r
        LEFT JOIN Contract c ON r.contractId = c.id
        LEFT JOIN User uFrom ON r.fromUserId = uFrom.id
        LEFT JOIN User uTo ON r.toUserId = uTo.id
        WHERE r.isModerated = ?
        ORDER BY r.createdAt DESC
        LIMIT 20`,
        args: [status === 'PENDING' ? 0 : 1]
      });
      reviews = reviewsResult.rows;
    }

    // Get low ratings (potential issues)
    const lowRatingsResult = await db.execute({
      sql: `SELECT 
        u.id, u.name, u.email,
        pc.totalReviews, pc.averageRating,
        (SELECT COUNT(*) FROM Review WHERE toUserId = u.id AND rating <= 2) as lowRatings
      FROM User u
      JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE pc.averageRating < 3.0 AND pc.totalReviews >= 3
      ORDER BY pc.averageRating ASC
      LIMIT 10`,
      args: []
    });

    return NextResponse.json({
      reviews,
      lowRatedCaregivers: lowRatingsResult.rows,
      stats: {
        pendingReviews: reviews.length,
        lowRatedCount: lowRatingsResult.rows.length,
      }
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Moderate content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, entityId, action, reason } = body;
    // type: 'REVIEW', 'PROFILE'
    // action: 'APPROVE', 'REJECT', 'HIDE'

    const now = new Date().toISOString();

    if (type === 'REVIEW') {
      const isPublic = action === 'APPROVE' ? 1 : 0;
      await db.execute({
        sql: `UPDATE Review SET isModerated = 1, isPublic = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [isPublic, entityId]
      });
    }

    // Log to moderation queue
    await db.execute({
      sql: `INSERT INTO ModerationQueue (id, entityType, entityId, status, reviewedBy, action, notes, createdAt)
        VALUES (?, ?, ?, 'REVIEWED', ?, ?, ?, ?)`,
      args: [`mod-${Date.now()}`, type, entityId, session.user.id, action, reason, now]
    });

    // Log admin action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [`action-${Date.now()}`, session.user.id, `MODERATE_${action}`, type, entityId, reason, now]
    });

    return NextResponse.json({ success: true, type, entityId, action });
  } catch (error) {
    console.error('Error moderating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
