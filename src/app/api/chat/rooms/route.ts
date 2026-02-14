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
          cr.reference_type,
          cr.reference_id,
          cr.is_active,
          cr.created_at,
          cp.last_read_at,
          cp.unread_count,
          u.id as participant_id,
          u.name as participant_name,
          u.role as participant_role,
          pc.title as participant_title,
          cm.content as last_message_content,
          cm.created_at as last_message_at,
          cm.sender_id as last_message_sender_id
        FROM chat_rooms cr
        INNER JOIN chat_participants cp ON cr.id = cp.chat_room_id
        LEFT JOIN chat_participants cp2 ON cr.id = cp2.chat_room_id AND cp2.user_id != ?
        LEFT JOIN users u ON cp2.user_id = u.id
        LEFT JOIN profiles_caregiver pc ON u.id = pc.user_id AND u.role = 'CAREGIVER'
        LEFT JOIN chat_messages cm ON cr.id = cm.chat_room_id 
          AND cm.id = (
            SELECT id FROM chat_messages 
            WHERE chat_room_id = cr.id 
            ORDER BY created_at DESC 
            LIMIT 1
          )
        WHERE cp.user_id = ?
        ORDER BY COALESCE(cm.created_at, cr.created_at) DESC
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
          referenceType: row.reference_type,
          referenceId: row.reference_id,
          isActive: row.is_active === 1,
          createdAt: row.created_at,
          lastReadAt: row.last_read_at,
          unreadCount: row.unread_count || 0,
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
        SELECT cr.id FROM chat_rooms cr
        INNER JOIN chat_participants cp1 ON cr.id = cp1.chat_room_id
        INNER JOIN chat_participants cp2 ON cr.id = cp2.chat_room_id
        WHERE cp1.user_id = ? AND cp2.user_id = ? AND cr.type = 'direct'
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
      sql: `INSERT INTO chat_rooms (id, type, reference_type, reference_id, is_active, created_at) VALUES (?, 'direct', ?, ?, 1, ?)`,
      args: [chatRoomId, referenceType || null, referenceId || null, now]
    });

    // Add participants
    await db.execute({
      sql: `INSERT INTO chat_participants (id, chat_room_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
      args: [`cp-${chatRoomId}-${session.user.id}`, chatRoomId, session.user.id, now]
    });

    await db.execute({
      sql: `INSERT INTO chat_participants (id, chat_room_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
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
