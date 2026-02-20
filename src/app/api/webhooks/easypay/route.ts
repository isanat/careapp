import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';
import { EasypayWebhookData, easypayService } from '@/lib/services/easypay';

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

    // Get signature from headers
    const signature = request.headers.get('x-easypay-signature') || '';

    // Verify signature (in production, implement proper verification)
    // if (!easypayService.verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

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
      const metadata = payment.metadata ? JSON.parse(payment.metadata as string) : {};
      const userId = payment.userId as string;
      const tokensAmount = payment.tokensAmount as number;
      const paymentType = payment.type as string;

      // Credit tokens to user wallet
      if (tokensAmount > 0) {
        // Update wallet balance
        await db.execute({
          sql: `UPDATE Wallet SET balanceTokens = balanceTokens + ?, balanceEurCents = balanceEurCents + ?, updatedAt = ? WHERE userId = ?`,
          args: [tokensAmount, tokensAmount, now, userId]
        });

        // Create ledger entry
        const ledgerId = `ledger-${Date.now()}`;
        await db.execute({
          sql: `INSERT INTO TokenLedger (id, userId, type, reason, amountTokens, amountEurCents, description, referenceType, referenceId, createdAt)
                VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            ledgerId,
            userId,
            paymentType === 'ACTIVATION' ? 'ACTIVATION_BONUS' : 'TOKEN_PURCHASE',
            tokensAmount,
            tokensAmount,
            paymentType === 'ACTIVATION' ? 'Bônus de ativação de conta' : 'Compra de tokens',
            'payment',
            payment.id,
            now
          ]
        });
      }

      // Update user status if activation payment
      if (paymentType === 'ACTIVATION') {
        await db.execute({
          sql: `UPDATE User SET status = 'ACTIVE', updatedAt = ? WHERE id = ?`,
          args: [now, userId]
        });
      }

      // Create notification
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, createdAt)
              VALUES (?, ?, 'payment', 'Pagamento Confirmado', 'Seu pagamento foi processado com sucesso!', ?)`,
        args: [`notif-${Date.now()}`, userId, now]
      });

      console.log(`Payment ${payment.id} completed successfully. Credited ${tokensAmount} tokens to user ${userId}`);

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

      // TODO: Deduct tokens from user wallet if already credited
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
