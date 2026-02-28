import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST: Mark messages as read for current user in a chat room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatRoomId } = body;

    if (!chatRoomId) {
      return NextResponse.json({ error: 'chatRoomId is required' }, { status: 400 });
    }

    // Verify user is a participant
    const participant = await db.execute({
      sql: `SELECT id FROM ChatParticipant WHERE chatRoomId = ? AND userId = ?`,
      args: [chatRoomId, session.user.id]
    });

    if (participant.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Reset unread count and update lastReadAt
    await db.execute({
      sql: `UPDATE ChatParticipant SET unreadCount = 0, lastReadAt = datetime('now') WHERE chatRoomId = ? AND userId = ?`,
      args: [chatRoomId, session.user.id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
