import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

const DIDIT_API_URL = 'https://verification.didit.me/v3/session/';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from Turso
    const userResult = await db.execute({
      sql: `SELECT id, email, role, verificationStatus FROM User WHERE id = ?`,
      args: [session.user.id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.verificationStatus === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Already verified', verified: true },
        { status: 400 }
      );
    }

    const appId = process.env.DIDIT_APP_ID;
    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId = process.env.DIDIT_WORKFLOW_ID;

    if (!appId || !apiKey) {
      console.error('Didit credentials not configured');
      return NextResponse.json(
        { error: 'KYC service not configured' },
        { status: 500 }
      );
    }

    if (!workflowId) {
      console.error('Didit workflow_id not configured');
      return NextResponse.json(
        { error: 'KYC workflow not configured', debug: 'Missing DIDIT_WORKFLOW_ID' },
        { status: 500 }
      );
    }

    // Prepare callback URL for webhook - use production URL
    const webhookUrl = `https://careapp-pied.vercel.app/api/kyc/webhook`;

    // Create session with Didit API
    const response = await fetch(DIDIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        callback_url: webhookUrl,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          user_role: user.role,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Didit API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to create KYC session' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Store session ID in database
    await db.execute({
      sql: `UPDATE User SET kycSessionId = ?, kycSessionCreatedAt = ?, verificationStatus = 'PENDING', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [data.session_id, new Date().toISOString(), user.id]
    });

    return NextResponse.json({
      success: true,
      session_id: data.session_id,
      url: data.url, // URL to redirect user for verification
    });
  } catch (error) {
    console.error('KYC session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from Turso
    const userResult = await db.execute({
      sql: `SELECT id, verificationStatus, kycSessionId, kycSessionCreatedAt, kycCompletedAt, kycConfidence FROM User WHERE id = ?`,
      args: [session.user.id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      verificationStatus: user.verificationStatus || 'UNVERIFIED',
      kycSession: {
        sessionId: user.kycSessionId,
        createdAt: user.kycSessionCreatedAt,
        completedAt: user.kycCompletedAt,
        confidence: user.kycConfidence,
      },
    });
  } catch (error) {
    console.error('KYC status fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
