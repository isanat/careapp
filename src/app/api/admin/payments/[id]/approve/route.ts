import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { sendEmail } from '@/lib/services/email';

/**
 * POST /api/admin/payments/[id]/approve
 * Approve a pending payment (mock/internal payments only)
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

    // Only approve INTERNAL provider payments that are PENDING
    if (payment.provider !== 'INTERNAL' || payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending internal payments can be approved' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update payment status
    await db.execute({
      sql: `
        UPDATE Payment
        SET status = ?, approvedAt = ?, approvedByAdminId = ?
        WHERE id = ?
      `,
      args: ['COMPLETED', now, adminId, id]
    });

    // If this is a visibility boost, activate it
    if (payment.type === 'VISIBILITY_BOOST' && payment.demandId) {
      // Update VisibilityPurchase status
      await db.execute({
        sql: `
          UPDATE VisibilityPurchase
          SET status = ?, completedAt = ?
          WHERE demandId = ? AND status = 'PENDING'
        `,
        args: ['COMPLETED', now, payment.demandId]
      });

      // Mark demand as boosted
      const metadata = payment.metadata ? JSON.parse(String(payment.metadata)) : {};
      const expiresAt = metadata.expiresAt || now;

      await db.execute({
        sql: `
          UPDATE Demand
          SET isBoosted = ?, boostExpiresAt = ?
          WHERE id = ?
        `,
        args: [1, expiresAt, payment.demandId]
      });
    }

    // Send confirmation email
    try {
      if (payment.userEmail) {
        await sendEmail({
          to: payment.userEmail,
          subject: 'Pagamento Aprovado - Evyra',
          html: `
            <p>Olá ${payment.userName},</p>
            <p>Seu pagamento de €${(payment.amountEurCents / 100).toFixed(2)} foi aprovado com sucesso!</p>
            ${payment.type === 'VISIBILITY_BOOST' ? '<p>Sua demanda agora tem maior visibilidade.</p>' : ''}
            <p>Obrigado por usar Evyra.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the request due to email error
    }

    return NextResponse.json({
      success: true,
      message: 'Payment approved',
      payment: {
        id: payment.id,
        status: 'COMPLETED',
        approvedAt: now,
      },
    });
  } catch (error: any) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
