import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';
import { EasypayWebhookData, easypayService } from '@/lib/services/easypay';
import { generateId } from '@/lib/utils/id';

// POST: Handle Easypay webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EasypayWebhookData;
    
    console.log('Easypay webhook received:', JSON.stringify(body, null, 2));

    // Extract data from webhook
    const {
      uid,
      transaction_key,
      status,
      status_payment,
      method,
      amount,
      customer,
      paid_at,
    } = body;

    // Get signature from headers and verify
    const signature = request.headers.get('x-easypay-signature') || '';

    if (!easypayService.verifyWebhookSignature(body, signature)) {
      console.error('Easypay webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Find payment by transaction key or Easypay UID
    const paymentResult = await db.execute({
      sql: `SELECT * FROM Payment WHERE stripeCheckoutSessionId = ? OR metadata LIKE ?`,
      args: [uid, `%"transactionKey":"${transaction_key}"%`]
    });

    if (paymentResult.rows.length === 0) {
      console.error('Payment not found for webhook:', { uid, transaction_key });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];
    const now = new Date().toISOString();

    // Update payment status based on webhook
    if (status === 'ok' && status_payment === 'paid') {
      // Payment successful
      await db.execute({
        sql: `UPDATE Payment SET status = 'COMPLETED', paidAt = ?, updatedAt = ? WHERE id = ?`,
        args: [paid_at || now, now, payment.id]
      });

      // Get payment metadata
      const metadata = payment.metadata ? JSON.parse(String(payment.metadata)) : {};
      const userId = payment.userId as string;
      const paymentType = payment.type as string;

      // Update user status if activation payment
      if (paymentType === 'ACTIVATION') {
        await db.execute({
          sql: `UPDATE User SET status = 'ACTIVE', updatedAt = ? WHERE id = ?`,
          args: [now, userId]
        });
      }

      // Activate contract if contract fee payment
      if (paymentType === 'CONTRACT_FEE' && metadata.contractId) {
        const contractId = metadata.contractId;

        // Mark family fee as paid
        await db.execute({
          sql: `UPDATE Contract SET familyFeePaid = 1, updatedAt = ? WHERE id = ?`,
          args: [now, contractId]
        });

        // Check if both parties have paid — if so, activate the contract
        const contractResult = await db.execute({
          sql: `SELECT familyFeePaid, caregiverFeePaid FROM Contract WHERE id = ?`,
          args: [contractId]
        });

        if (contractResult.rows.length > 0) {
          const contract = contractResult.rows[0];
          const familyPaid = Number(contract.familyFeePaid) === 1;
          const caregiverPaid = Number(contract.caregiverFeePaid) === 1;

          if (familyPaid && caregiverPaid) {
            await db.execute({
              sql: `UPDATE Contract SET status = 'ACTIVE', updatedAt = ? WHERE id = ?`,
              args: [now, contractId]
            });
            console.log(`Contract ${contractId} activated — both fees paid`);
          } else {
            console.log(`Contract ${contractId} fee paid by family. Waiting for caregiver fee.`);
          }
        }
      }

      // Create notification
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, createdAt)
              VALUES (?, ?, 'payment', 'Pagamento Confirmado', 'Seu pagamento foi processado com sucesso!', ?)`,
        args: [generateId("notif"), userId, now]
      });

      console.log(`Payment ${payment.id} completed successfully for user ${userId}`);

    } else if (status_payment === 'failed' || status_payment === 'cancelled') {
      // Payment failed or cancelled
      await db.execute({
        sql: `UPDATE Payment SET status = 'FAILED', updatedAt = ? WHERE id = ?`,
        args: [now, payment.id]
      });

      console.log(`Payment ${payment.id} failed with status: ${status_payment}`);

    } else if (status_payment === 'refunded') {
      // Payment refunded
      await db.execute({
        sql: `UPDATE Payment SET status = 'REFUNDED', refundedAt = ?, updatedAt = ? WHERE id = ?`,
        args: [now, now, payment.id]
      });

      console.log(`Payment ${payment.id} refunded`);

    } else if (status_payment === 'pending') {
      // Payment still pending
      console.log(`Payment ${payment.id} still pending`);
    }

    return NextResponse.json({ 
      success: true, 
      received: true,
      paymentId: payment.id,
      status: status_payment 
    });

  } catch (error) {
    console.error('Error processing Easypay webhook:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET: Verify webhook endpoint is working
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Easypay webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
