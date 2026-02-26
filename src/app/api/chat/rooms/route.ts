import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET: List chat rooms for logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get chat rooms with participants and last message
    const result = await db.execute({
      sql: `
        SELECT 
          cr.id,
          cr.type,
          cr.referenceType,
          cr.referenceId,
          cr.isActive,
          cr.createdAt,
          cp.lastReadAt,
          cp.unreadCount,
          u.id as participant_id,
          u.name as participant_name,
          u.role as participant_role,
          pc.title as participant_title,
          cm.content as last_message_content,
          cm.createdAt as last_message_at,
          cm.senderId as last_message_sender_id
        FROM ChatRoom cr
        INNER JOIN ChatParticipant cp ON cr.id = cp.chatRoomId
        LEFT JOIN ChatParticipant cp2 ON cr.id = cp2.chatRoomId AND cp2.userId != ?
        LEFT JOIN User u ON cp2.userId = u.id
        LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId AND u.role = 'CAREGIVER'
        LEFT JOIN ChatMessage cm ON cr.id = cm.chatRoomId 
          AND cm.id = (
            SELECT id FROM ChatMessage 
            WHERE chatRoomId = cr.id 
            ORDER BY createdAt DESC 
            LIMIT 1
          )
        WHERE cp.userId = ?
        ORDER BY COALESCE(cm.createdAt, cr.createdAt) DESC
      `,
      args: [userId, userId]
    });

    // Group by chat room
    const chatRoomsMap = new Map<string, any>();
    
    for (const row of result.rows) {
      const roomId = row.id as string;
      
      if (!chatRoomsMap.has(roomId)) {
        chatRoomsMap.set(roomId, {
          id: roomId,
          type: row.type,
          referenceType: row.referenceType,
          referenceId: row.referenceId,
          isActive: row.isActive === 1,
          createdAt: row.createdAt,
          lastReadAt: row.lastReadAt,
          unreadCount: row.unreadCount || 0,
          participant: row.participant_id ? {
            id: row.participant_id,
            name: row.participant_name,
            role: row.participant_role,
            title: row.participant_title,
          } : null,
          lastMessage: row.last_message_content ? {
            content: row.last_message_content,
            createdAt: row.last_message_at,
            senderId: row.last_message_sender_id,
          } : null,
        });
      }
    }

    const chatRooms = Array.from(chatRoomsMap.values());

    return NextResponse.json({ chatRooms });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new chat room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { participantId, referenceType, referenceId } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    // Check if chat room already exists between these users
    const existingRoom = await db.execute({
      sql: `
        SELECT cr.id FROM ChatRoom cr
        INNER JOIN ChatParticipant cp1 ON cr.id = cp1.chatRoomId
        INNER JOIN ChatParticipant cp2 ON cr.id = cp2.chatRoomId
        WHERE cp1.userId = ? AND cp2.userId = ? AND cr.type = 'direct'
        LIMIT 1
      `,
      args: [session.user.id, participantId]
    });

    if (existingRoom.rows.length > 0) {
      return NextResponse.json({ 
        chatRoomId: existingRoom.rows[0].id,
        message: 'Chat room already exists' 
      });
    }

    const chatRoomId = `room-${Date.now()}`;
    const now = new Date().toISOString();

    // Create chat room
    await db.execute({
      sql: `INSERT INTO ChatRoom (id, type, referenceType, referenceId, isActive, createdAt) VALUES (?, 'direct', ?, ?, 1, ?)`,
      args: [chatRoomId, referenceType || null, referenceId || null, now]
    });

    // Add participants
    await db.execute({
      sql: `INSERT INTO ChatParticipant (id, chatRoomId, userId, createdAt) VALUES (?, ?, ?, ?)`,
      args: [`cp-${chatRoomId}-${session.user.id}`, chatRoomId, session.user.id, now]
    });

    await db.execute({
      sql: `INSERT INTO ChatParticipant (id, chatRoomId, userId, createdAt) VALUES (?, ?, ?, ?)`,
      args: [`cp-${chatRoomId}-${participantId}`, chatRoomId, participantId, now]
    });

    return NextResponse.json({ 
      chatRoomId,
      message: 'Chat room created successfully' 
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
