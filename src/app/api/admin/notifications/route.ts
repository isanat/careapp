import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Admin notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    let sql = `SELECT * FROM AdminNotification`;
    if (unreadOnly) {
      sql += ` WHERE isRead = 0`;
    }
    sql += ` ORDER BY createdAt DESC LIMIT 50`;

    const result = await db.execute({ sql, args: [] });

    // Get unread count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM AdminNotification WHERE isRead = 0`,
      args: []
    });

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: countResult.rows[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await db.execute({
        sql: `UPDATE AdminNotification SET isRead = 1, readAt = ?, readBy = ? WHERE isRead = 0`,
        args: [new Date().toISOString(), session.user.id]
      });
    } else if (notificationId) {
      await db.execute({
        sql: `UPDATE AdminNotification SET isRead = 1, readAt = ?, readBy = ? WHERE id = ?`,
        args: [new Date().toISOString(), session.user.id, notificationId]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
