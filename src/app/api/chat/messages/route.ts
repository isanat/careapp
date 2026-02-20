import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET: Get messages for a chat room
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // for pagination

    if (!chatRoomId) {
      return NextResponse.json({ error: 'chatRoomId required' }, { status: 400 });
    }

    // Verify user is participant
    const participant = await db.execute({
      sql: `SELECT id FROM ChatParticipant WHERE chatRoomId = ? AND userId = ?`,
      args: [chatRoomId, session.user.id]
    });

    if (participant.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages
    let sql = `
      SELECT 
        cm.id,
        cm.chatRoomId,
        cm.senderId,
        u.name as sender_name,
        u.role as sender_role,
        cm.content,
        cm.messageType,
        cm.metadata,
        cm.isEdited,
        cm.isDeleted,
        cm.createdAt
      FROM ChatMessage cm
      INNER JOIN User u ON cm.senderId = u.id
      WHERE cm.chatRoomId = ? AND cm.isDeleted = 0
    `;
    const args: any[] = [chatRoomId];

    if (before) {
      sql += ` AND cm.createdAt < ?`;
      args.push(before);
    }

    sql += ` ORDER BY cm.createdAt DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const messages = result.rows.map(row => ({
      id: row.id,
      chatRoomId: row.chatRoomId,
      senderId: row.senderId,
      senderName: row.sender_name,
      senderRole: row.sender_role,
      content: row.content,
      messageType: row.messageType,
      metadata: row.metadata,
      isEdited: row.isEdited === 1,
      createdAt: row.createdAt,
    })).reverse(); // Reverse to show oldest first

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatRoomId, content, messageType, metadata } = body;

    if (!chatRoomId || !content) {
      return NextResponse.json({ error: 'chatRoomId and content required' }, { status: 400 });
    }

    // Verify user is participant
    const participant = await db.execute({
      sql: `SELECT id FROM ChatParticipant WHERE chatRoomId = ? AND userId = ?`,
      args: [chatRoomId, session.user.id]
    });

    if (participant.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO ChatMessage (id, chatRoomId, senderId, content, messageType, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [messageId, chatRoomId, session.user.id, content, messageType || 'text', metadata ? JSON.stringify(metadata) : null, now]
    });

    // Update chat room updatedAt
    await db.execute({
      sql: `UPDATE ChatRoom SET updatedAt = ? WHERE id = ?`,
      args: [now, chatRoomId]
    });

    return NextResponse.json({ 
      message: {
        id: messageId,
        chatRoomId,
        senderId: session.user.id,
        senderName: session.user.name,
        content,
        messageType: messageType || 'text',
        createdAt: now,
      }
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
