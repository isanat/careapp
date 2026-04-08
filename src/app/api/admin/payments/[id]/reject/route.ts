import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { sendEmail } from '@/lib/services/email';

/**
 * POST /api/admin/payments/[id]/reject
 * Reject a pending payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const adminId = auth.adminUserId;
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get payment details
    const paymentResult = await db.execute({
      sql: `
        SELECT p.*, u.email as userEmail, u.name as userName
        FROM Payment p
        JOIN User u ON p.userId = u.id
        WHERE p.id = ?
      `,
      args: [id]
    });

    if (paymentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = paymentResult.rows[0];

    // Only reject PENDING payments
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending payments can be rejected' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update payment status
    await db.execute({
      sql: `
        UPDATE Payment
        SET status = ?, metadata = ?
        WHERE id = ?
      `,
      args: [
        'FAILED',
        JSON.stringify({
          rejectionReason: reason,
          rejectedAt: now,
          rejectedByAdminId: adminId,
        }),
        id
      ]
    });

    // If this is a visibility boost, mark purchase as failed
    if (payment.type === 'VISIBILITY_BOOST' && payment.demandId) {
      await db.execute({
        sql: `
          UPDATE VisibilityPurchase
          SET status = ?
          WHERE demandId = ? AND status = 'PENDING'
        `,
        args: ['FAILED', payment.demandId]
      });
    }

    // Send rejection email
    try {
      await sendEmail({
        to: payment.userEmail,
        subject: 'Pagamento Rejeitado - Evyra',
        html: `
          <p>Olá ${payment.userName},</p>
          <p>Seu pagamento de €${(payment.amountEurCents / 100).toFixed(2)} foi rejeitado.</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
        `,
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request due to email error
    }

    return NextResponse.json({
      success: true,
      message: 'Payment rejected',
      payment: {
        id: payment.id,
        status: 'FAILED',
        rejectionReason: reason,
      },
    });
  } catch (error: any) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
