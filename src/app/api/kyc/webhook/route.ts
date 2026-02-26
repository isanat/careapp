import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';
import crypto from 'crypto';

// Didit webhook payload structure (based on actual documentation)
interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Rejected' | 'Pending' | 'Expired';
  webhook_type: string;
  timestamp: number;
  created_at: number;
  workflow_id: string;
  metadata?: {
    user_id?: string;
    user_email?: string;
    user_role?: string;
    test_webhook?: boolean;
  };
  decision?: {
    session_id: string;
    status: 'Approved' | 'Rejected' | 'Pending';
    features?: string[];
    id_verifications?: Array<{
      status: string;
      full_name: string;
      first_name: string;
      last_name: string;
      date_of_birth: string;
      document_type: string;
      document_number: string;
      nationality: string;
      gender?: string;
      age?: number;
    }>;
    liveness_checks?: Array<{
      status: string;
      liveness_score: number;
    }>;
    face_matches?: Array<{
      status: string;
      face_match_score: number;
      similarity_percentage: number;
    }>;
    aml_screenings?: Array<{
      status: string;
      total_hits: number;
    }>;
    reviews?: Array<{
      user: string;
      new_status: string;
      comment?: string;
    }>;
  };
}

// Verify Didit webhook signature
function verifySignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    // Didit uses X-Signature-Simple for basic verification
    // or X-Signature-V2 for enhanced verification
    const message = `${timestamp}:${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const payload: DiditWebhookPayload = JSON.parse(rawBody);
    
    // Get signature headers
    const signature = request.headers.get('x-signature-simple') || 
                      request.headers.get('x-signature-v2');
    const timestamp = request.headers.get('x-timestamp') || '';
    const isTestWebhook = request.headers.get('x-didit-test-webhook') === 'true';
    
    // Log webhook received
    console.log('Didit webhook received:', {
      session_id: payload.session_id,
      status: payload.status,
      test: isTestWebhook,
      metadata: payload.metadata,
    });

    // Verify signature (skip for test webhooks in development)
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;
    if (webhookSecret && signature && !isTestWebhook) {
      const isValid = verifySignature(rawBody, signature, timestamp, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Handle test webhook
    if (isTestWebhook) {
      console.log('Test webhook received from Didit - configuration OK');
      return NextResponse.json({ 
        success: true, 
        message: 'Test webhook received successfully' 
      });
    }

    // Validate webhook payload
    if (!payload.session_id) {
      console.error('Invalid webhook payload - missing session_id');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Get user_id from metadata
    const userId = payload.metadata?.user_id;
    
    if (!userId) {
      console.error('No user_id in webhook metadata');
      return NextResponse.json(
        { error: 'No user_id in metadata' },
        { status: 400 }
      );
    }

    // Find user using Turso
    const userResult = await db.execute({
      sql: `SELECT id, role FROM User WHERE id = ?`,
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      console.error('User not found for KYC webhook:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Determine verification status based on Didit decision
    let verificationStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' = 'PENDING';
    
    const diditStatus = payload.status?.toUpperCase() || 
                        payload.decision?.status?.toUpperCase();
    
    if (diditStatus === 'APPROVED') {
      verificationStatus = 'VERIFIED';
    } else if (diditStatus === 'REJECTED') {
      verificationStatus = 'REJECTED';
    }

    // Extract confidence from face match or liveness
    let confidence = 0;
    if (payload.decision?.face_matches?.[0]?.similarity_percentage) {
      confidence = payload.decision.face_matches[0].similarity_percentage;
    } else if (payload.decision?.liveness_checks?.[0]?.liveness_score) {
      confidence = Math.round(payload.decision.liveness_checks[0].liveness_score * 100);
    }

    // Extract document info
    const idVerification = payload.decision?.id_verifications?.[0];
    const documentType = idVerification?.document_type;
    const documentNumber = idVerification?.document_number;

    // Update user with KYC details using Turso
    await db.execute({
      sql: `UPDATE User SET verificationStatus = ?, kycCompletedAt = ?, kycConfidence = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [verificationStatus, new Date().toISOString(), confidence, userId]
    });

    // Also update caregiver profile if exists
    if (user.role === 'CAREGIVER') {
      const caregiverResult = await db.execute({
        sql: `SELECT id FROM ProfileCaregiver WHERE userId = ?`,
        args: [userId]
      });
      
      if (caregiverResult.rows.length > 0) {
        await db.execute({
          sql: `UPDATE ProfileCaregiver SET verificationStatus = ?, documentType = ?, documentNumber = ?, documentVerified = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
          args: [verificationStatus, documentType || null, documentNumber || null, verificationStatus === 'VERIFIED' ? 1 : 0, userId]
        });
      }
    }

    // Create notification for user
    const titles = {
      VERIFIED: 'Verificação Concluída',
      REJECTED: 'Verificação Rejeitada',
      PENDING: 'Verificação em Análise',
    };
    
    const messages = {
      VERIFIED: 'Sua verificação de identidade foi aprovada! Você agora pode acessar todos os recursos da plataforma.',
      REJECTED: 'Sua verificação de identidade foi rejeitada. Entre em contato com o suporte para mais informações.',
      PENDING: 'Sua verificação de identidade está sendo analisada. Você será notificado quando for concluída.',
    };

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [notificationId, userId, 'kyc_complete', titles[verificationStatus], messages[verificationStatus], new Date().toISOString()]
    });

    console.log(`KYC ${verificationStatus} for user ${userId}`, {
      confidence,
      documentType,
    });

    return NextResponse.json({ 
      success: true, 
      status: verificationStatus,
      confidence,
    });
  } catch (error) {
    console.error('KYC webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify webhook is working
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'KYC webhook endpoint active',
    timestamp: new Date().toISOString(),
    service: 'Didit KYC Integration',
  });
}
