import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sql = unreadOnly
      ? `SELECT * FROM Notification WHERE userId = ? AND isRead = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?`
      : `SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`;

    const result = await db.execute({
      sql,
      args: [userId, limit, offset]
    });

    // Get unread count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM Notification WHERE userId = ? AND isRead = 0`,
      args: [userId]
    });

    const unreadCount = countResult.rows.length > 0 
      ? Number(countResult.rows[0].count) || 0 
      : 0;

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      isRead: Boolean(row.isRead),
      readAt: row.readAt,
      createdAt: row.createdAt,
    }));

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: result.rows.length === limit
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all as read
      const now = new Date().toISOString();
      await db.execute({
        sql: `UPDATE Notification SET isRead = 1, readAt = ? WHERE userId = ? AND isRead = 0`,
        args: [now, session.user.id]
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Todas as notificações marcadas como lidas' 
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds é obrigatório' }, { status: 400 });
    }

    // Mark specific notifications as read
    const now = new Date().toISOString();
    const placeholders = notificationIds.map(() => '?').join(',');
    
    await db.execute({
      sql: `UPDATE Notification SET isRead = 1, readAt = ? WHERE userId = ? AND id IN (${placeholders})`,
      args: [now, session.user.id, ...notificationIds]
    });

    return NextResponse.json({ 
      success: true, 
      message: `${notificationIds.length} notificação(ões) marcada(s) como lida(s)` 
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow internal calls or admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, referenceType, referenceId } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [notificationId, userId, type, title, message, referenceType || null, referenceId || null, now]
    });

    return NextResponse.json({
      success: true,
      notificationId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
