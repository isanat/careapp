import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Endpoint to reset/delete a user for testing
export async function POST(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== 'idosolink-migrate-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    console.log(`Resetting user: ${email}`);

    // Find user
    const userResult = await db.execute({
      sql: `SELECT id, email FROM User WHERE email = ?`,
      args: [email]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found', email });
    }

    const userId = userResult.rows[0].id;

    // Delete related records first (due to foreign keys)
    const tables = [
      'Notification',
      'ChatMessage',
      'ChatParticipant',
      'Session',
      'Account',
      'TokenLedger',
      'Payment',
      'Review',
      'Tip',
      'ProfileFamily',
      'ProfileCaregiver',
      'Wallet',
    ];

    for (const table of tables) {
      try {
        await db.execute({
          sql: `DELETE FROM ${table} WHERE userId = ?`,
          args: [userId]
        });
      } catch (e) {
        // Table might not exist or no rows
      }
    }

    // Delete from Contract tables
    try {
      await db.execute({
        sql: `DELETE FROM Contract WHERE familyUserId = ? OR caregiverUserId = ?`,
        args: [userId, userId]
      });
    } catch (e) {}

    // Delete from ChatRoom
    try {
      await db.execute({
        sql: `DELETE FROM ChatRoom WHERE id IN (SELECT chatRoomId FROM ChatParticipant WHERE userId = ?)`,
        args: [userId]
      });
    } catch (e) {}

    // Finally delete the user
    await db.execute({
      sql: `DELETE FROM User WHERE id = ?`,
      args: [userId]
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: { id: userId, email }
    });

  } catch (error) {
    console.error('Reset user error:', error);
    return NextResponse.json({
      error: 'Failed to reset user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Just reset KYC status without deleting user
export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== 'idosolink-migrate-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    console.log(`Resetting KYC for: ${email}`);

    // Reset KYC status only
    const result = await db.execute({
      sql: `UPDATE User SET 
        verificationStatus = 'UNVERIFIED',
        kycSessionId = NULL,
        kycSessionToken = NULL,
        kycSessionCreatedAt = NULL,
        kycCompletedAt = NULL,
        kycConfidence = 0,
        updatedAt = CURRENT_TIMESTAMP
      WHERE email = ?`,
      args: [email]
    });

    return NextResponse.json({
      success: true,
      message: 'KYC status reset',
      email,
      rowsAffected: result.rowsAffected
    });

  } catch (error) {
    console.error('Reset KYC error:', error);
    return NextResponse.json({
      error: 'Failed to reset KYC',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
