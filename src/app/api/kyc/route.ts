import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

const DIDIT_API_URL = 'https://verification.didit.me/v3/session/';

// GET - Fetch KYC status
export async function GET(request: NextRequest) {
  try {
    console.log('KYC GET - Starting...');
    
    const session = await getServerSession(authOptions);
    console.log('KYC GET - Session:', session ? { id: session.user?.id } : 'No session');
    
    if (!session?.user?.id) {
      console.log('KYC GET - Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized', debug: 'No session found' },
        { status: 401 }
      );
    }

    console.log('KYC GET - Querying user:', session.user.id);

    // Query user from Turso
    const result = await db.execute({
      sql: `SELECT id, verificationStatus, kycSessionId, kycSessionToken, kycSessionCreatedAt, kycCompletedAt, kycConfidence
            FROM User WHERE id = ?`,
      args: [session.user.id]
    });

    console.log('KYC GET - Query result:', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found', debug: session.user.id },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Build widget URL if session exists (use session_token, not session_id)
    let widget_url = null;
    if (user.kycSessionToken && user.verificationStatus === 'PENDING') {
      // The URL format is: https://verify.didit.me/session/{session_token}
      widget_url = `https://verify.didit.me/session/${user.kycSessionToken}`;
    }

    // Return KYC status from user fields
    return NextResponse.json({
      verification_status: user.verificationStatus || 'UNVERIFIED',
      session_id: user.kycSessionId || null,
      session_token: user.kycSessionToken || null,
      session_created_at: user.kycSessionCreatedAt || null,
      completed_at: user.kycCompletedAt || null,
      document_verified: user.verificationStatus === 'VERIFIED',
      confidence: user.kycConfidence || 0,
      widget_url, // Include existing widget URL for PENDING sessions
    });
  } catch (error) {
    console.error('KYC status fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create KYC session
export async function POST(request: NextRequest) {
  try {
    console.log('KYC POST - Starting...');
    
    const session = await getServerSession(authOptions);
    console.log('KYC POST - Session:', session ? { id: session.user?.id } : 'No session');
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', debug: 'No session found' },
        { status: 401 }
      );
    }

    // Query user from Turso
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

    console.log('KYC POST - Didit credentials:', { 
      hasAppId: !!appId, 
      hasApiKey: !!apiKey,
      hasWorkflowId: !!workflowId
    });

    if (!appId || !apiKey) {
      console.error('Didit credentials not configured');
      return NextResponse.json(
        { error: 'KYC service not configured. Please contact support.', debug: 'Missing DIDIT_APP_ID or DIDIT_API_KEY' },
        { status: 500 }
      );
    }

    if (!workflowId) {
      console.error('Didit workflow_id not configured');
      return NextResponse.json(
        { error: 'KYC workflow not configured. Please contact support.', debug: 'Missing DIDIT_WORKFLOW_ID - get it from Didit dashboard' },
        { status: 500 }
      );
    }

    // Prepare callback URL for webhook - use production URL
    const webhookUrl = `https://careapp-pied.vercel.app/api/kyc/webhook`;

    console.log('KYC POST - Creating Didit session...');

    // Create session with Didit API
    const diditResponse = await fetch(DIDIT_API_URL, {
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

    console.log('KYC POST - Didit response status:', diditResponse.status);

    if (!diditResponse.ok) {
      const errorData = await diditResponse.text();
      console.error('Didit API error:', diditResponse.status, errorData);
      return NextResponse.json(
        { error: 'Failed to create verification session. Please try again.', debug: errorData },
        { status: 500 }
      );
    }

    const data = await diditResponse.json();
    console.log('KYC POST - Didit session created:', data.session_id, 'token:', data.session_token);
    
    // Store session ID and token in user record
    await db.execute({
      sql: `UPDATE User SET kycSessionId = ?, kycSessionToken = ?, kycSessionCreatedAt = ?, verificationStatus = 'PENDING', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [data.session_id, data.session_token, new Date().toISOString(), user.id]
    });

    return NextResponse.json({
      success: true,
      session_id: data.session_id,
      session_token: data.session_token, // Token for embedded widget
      url: data.url, // URL to redirect user for verification
    });
  } catch (error) {
    console.error('KYC session creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
