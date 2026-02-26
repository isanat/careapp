import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Helper function to verify admin access
async function verifyAdminAccess(sessionUserId: string): Promise<{ authorized: boolean; adminUserId?: string; role?: string; error?: string }> {
  const userResult = await db.execute({
    sql: `SELECT role FROM User WHERE id = ?`,
    args: [sessionUserId]
  });

  const userRole = userResult.rows[0]?.role as string;
  if (!['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(userRole)) {
    return { authorized: false, error: 'Forbidden - Admin access required' };
  }

  const adminResult = await db.execute({
    sql: `SELECT id, role FROM AdminUser WHERE userId = ? AND isActive = 1`,
    args: [sessionUserId]
  });

  if (adminResult.rows.length === 0) {
    return { authorized: true, adminUserId: sessionUserId, role: userRole };
  }

  return { 
    authorized: true, 
    adminUserId: adminResult.rows[0].id as string,
    role: adminResult.rows[0].role as string 
  };
}

// POST - Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await verifyAdminAccess(session.user.id);
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const { id } = await params;

    // Check if notification exists
    const notificationResult = await db.execute({
      sql: `SELECT * FROM AdminNotification WHERE id = ?`,
      args: [id]
    });

    if (notificationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notification = notificationResult.rows[0];

    // Mark as read
    await db.execute({
      sql: `UPDATE AdminNotification 
            SET isRead = 1, 
                readAt = CURRENT_TIMESTAMP, 
                readBy = ? 
            WHERE id = ?`,
      args: [session.user.id, id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, oldValue, newValue, createdAt)
            VALUES (?, ?, 'MARK_READ', 'ADMIN_NOTIFICATION', ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        `action-${Date.now()}`, 
        adminCheck.adminUserId, 
        id, 
        JSON.stringify({ isRead: false }), 
        JSON.stringify({ isRead: true, readBy: session.user.id })
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id,
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: session.user.id,
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Dismiss/delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await verifyAdminAccess(session.user.id);
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const { id } = await params;

    // Check if notification exists
    const notificationResult = await db.execute({
      sql: `SELECT * FROM AdminNotification WHERE id = ?`,
      args: [id]
    });

    if (notificationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Delete notification
    await db.execute({
      sql: `DELETE FROM AdminNotification WHERE id = ?`,
      args: [id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, createdAt)
            VALUES (?, ?, 'DELETE_NOTIFICATION', 'ADMIN_NOTIFICATION', ?, CURRENT_TIMESTAMP)`,
      args: [`action-${Date.now()}`, adminCheck.adminUserId, id]
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
