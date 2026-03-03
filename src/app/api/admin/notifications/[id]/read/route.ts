import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

// POST - Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const { id } = await params;

    // Get admin profile for logging
    const adminProfileResult = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ? AND isActive = 1`,
      args: [adminUserId]
    });
    const adminProfileId = adminProfileResult.rows[0]?.id as string | null;

    // Check if notification exists
    const notificationResult = await db.execute({
      sql: `SELECT * FROM AdminNotification WHERE id = ?`,
      args: [id]
    });

    if (notificationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Mark as read
    await db.execute({
      sql: `UPDATE AdminNotification
            SET isRead = 1,
                readAt = CURRENT_TIMESTAMP,
                readBy = ?
            WHERE id = ?`,
      args: [adminUserId, id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, oldValue, newValue, createdAt)
            VALUES (?, ?, 'MARK_READ', 'ADMIN_NOTIFICATION', ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        generateId("action"),
        adminProfileId ?? '',
        id,
        JSON.stringify({ isRead: false }),
        JSON.stringify({ isRead: true, readBy: adminUserId })
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id,
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: adminUserId,
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
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    // Get admin profile for logging
    const adminProfileResult = await db.execute({
      sql: `SELECT id FROM AdminUser WHERE userId = ? AND isActive = 1`,
      args: [adminUserId]
    });
    const adminProfileId = adminProfileResult.rows[0]?.id as string | null;

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
      args: [generateId("action"), adminProfileId ?? '', id]
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
