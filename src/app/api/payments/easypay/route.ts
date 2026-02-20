import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { easypayService } from '@/lib/services/easypay';

// Generate a CUID-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `ep-${timestamp}${randomPart}`.substring(0, 25);
}

// POST: Create an Easypay payment
export async function POST(request: NextRequest) {
  try {
    // Check if Easypay is configured
    if (!process.env.EASYPAY_API_KEY || !process.env.EASYPAY_ACCOUNT_ID) {
      return NextResponse.json({ 
        error: "Pagamento temporariamente indisponível",
        details: "O sistema de pagamento não está configurado. Entre em contato com o suporte." 
      }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, // 'activation' | 'tokens' | 'contract'
      method, // 'mbway' | 'multibanco' | 'cc'
      amount,
      phone, // For MB Way
      nif, // For Multibanco (optional)
    } = body;

    // Validate
    if (!type || !method || !amount) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 });
    }

    if (!['mbway', 'multibanco', 'cc'].includes(method)) {
      return NextResponse.json({ error: 'Método de pagamento inválido.' }, { status: 400 });
    }

    // Get user data
    const userResult = await db.execute({
      sql: `SELECT u.id, u.name, u.email, u.phone, pf.country 
            FROM User u 
            LEFT JOIN ProfileFamily pf ON u.id = pf.userId 
            LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
            WHERE u.id = ?`,
      args: [session.user.id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const transactionKey = generateId();
    const paymentId = generateId();
    const now = new Date().toISOString();

    // Determine payment type and amount
    let description = '';
    let tokensAmount = 0;
    let contractId = null;

    switch (type) {
      case 'activation':
        description = 'Ativação de conta IdosoLink';
        tokensAmount = Math.floor(amount); // 1 token per euro
        break;
      case 'tokens':
        description = `Compra de ${Math.floor(amount)} tokens SeniorToken`;
        tokensAmount = Math.floor(amount);
        break;
      case 'contract':
        description = 'Pagamento de contrato IdosoLink';
        // Contract-specific logic would go here
        break;
      default:
        return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    // Create payment record in database
    await db.execute({
      sql: `INSERT INTO Payment (id, userId, type, status, provider, amountEurCents, tokensAmount, description, createdAt)
            VALUES (?, ?, ?, 'PENDING', 'EASYPAY', ?, ?, ?, ?)`,
      args: [paymentId, session.user.id, type.toUpperCase(), Math.floor(amount * 100), tokensAmount, description, now]
    });

    // Create Easypay payment
    const customer = {
      id: session.user.id,
      name: user.name as string,
      email: user.email as string,
      phone: phone || (user.phone as string) || '',
      fiscalNumber: nif,
    };

    let easypayResponse;

    switch (method) {
      case 'mbway':
        if (!customer.phone) {
          return NextResponse.json({ error: 'Phone number required for MB Way' }, { status: 400 });
        }
        easypayResponse = await easypayService.createMBWayPayment({
          transactionKey,
          amount,
          customer,
          description,
        });
        break;

      case 'multibanco':
        easypayResponse = await easypayService.createMultibancoReference({
          transactionKey,
          amount,
          customer,
          description,
        });
        break;

      case 'cc':
        easypayResponse = await easypayService.createCardPayment({
          transactionKey,
          amount,
          customer,
          description,
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment`,
        });
        break;
    }

    // Update payment with Easypay UID
    await db.execute({
      sql: `UPDATE Payment SET stripeCheckoutSessionId = ?, metadata = ? WHERE id = ?`,
      args: [
        easypayResponse.uid,
        JSON.stringify({ 
          easypayId: easypayResponse.id,
          transactionKey,
          method,
        }),
        paymentId
      ]
    });

    // Return response based on method
    return NextResponse.json({
      success: true,
      paymentId,
      method,
      transactionKey,
      easypayUid: easypayResponse.uid,
      
      // Method-specific data
      mbway: easypayResponse.mbway ? {
        requestId: easypayResponse.mbway.request_id,
        alias: easypayResponse.mbway.alias,
      } : undefined,
      
      multibanco: easypayResponse.multibanco ? {
        entity: easypayResponse.multibanco.entity,
        reference: easypayResponse.multibanco.reference,
        amount: easypayResponse.multibanco.amount,
        expiresAt: easypayResponse.multibanco.expires_at,
      } : undefined,
      
      creditcard: easypayResponse.creditcard ? {
        url: easypayResponse.creditcard.url,
      } : undefined,
    });

  } catch (error) {
    console.error('Error creating Easypay payment:', error);
    
    const errorMessage = error instanceof Error ? error.message : '';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid API')) {
      return NextResponse.json({ 
        error: "Pagamento temporariamente indisponível",
        details: "As credenciais de pagamento não estão configuradas corretamente. Entre em contato com o suporte." 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.' 
    }, { status: 500 });
  }
}

// GET: Check payment status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const transactionKey = searchParams.get('transactionKey');

    if (!paymentId && !transactionKey) {
      return NextResponse.json({ error: 'Payment ID or transaction key required' }, { status: 400 });
    }

    // Get payment from database
    let payment;
    
    if (paymentId) {
      const result = await db.execute({
        sql: `SELECT * FROM Payment WHERE id = ? AND userId = ?`,
        args: [paymentId, session.user.id]
      });
      payment = result.rows[0];
    } else if (transactionKey) {
      const result = await db.execute({
        sql: `SELECT * FROM Payment WHERE metadata LIKE ? AND userId = ?`,
        args: [`%"transactionKey":"${transactionKey}"%`, session.user.id]
      });
      payment = result.rows[0];
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get status from Easypay
    const easypayUid = payment.stripeCheckoutSessionId as string;
    
    if (easypayUid) {
      try {
        const easypayStatus = await easypayService.getPayment(easypayUid);
        
        return NextResponse.json({
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amountEurCents,
          tokens: payment.tokensAmount,
          easypayStatus: easypayStatus.status_payment,
          method: easypayStatus.method,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          multibanco: easypayStatus.multibanco ? {
            entity: easypayStatus.multibanco.entity,
            reference: easypayStatus.multibanco.reference,
            expiresAt: easypayStatus.multibanco.expires_at,
          } : undefined,
        });
      } catch (easypayError) {
        console.error('Error fetching Easypay status:', easypayError);
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amountEurCents,
      tokens: payment.tokensAmount,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
  }
}
