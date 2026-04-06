import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

interface BoostRequest {
  package: 'BASIC' | 'PREMIUM' | 'URGENT';
}

const BOOST_PACKAGES: Record<string, { price: number; durationDays: number; label: string }> = {
  BASIC: { price: 300, durationDays: 7, label: 'Visibilidade Básica (7 dias)' },
  PREMIUM: { price: 800, durationDays: 30, label: 'Visibilidade Premium (30 dias)' },
  URGENT: { price: 1500, durationDays: 3, label: 'Visibilidade Urgente (3 dias)' },
};

/**
 * POST /api/demands/[id]/boost
 * Criar checkout Stripe para boost de visibilidade
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const demandId = params.id;
    const body: BoostRequest = await request.json();
    const { package: boostPackage } = body;

    if (!boostPackage || !(boostPackage in BOOST_PACKAGES)) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const packageInfo = BOOST_PACKAGES[boostPackage];

    // Verify demand exists and user is owner
    const demandResult = await db.execute({
      sql: `SELECT id, familyUserId, title FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const demand = demandResult.rows[0];
    if (demand.familyUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: packageInfo.label,
              description: `Aumentar visibilidade da demanda: "${demand.title}"`,
            },
            unit_amount: packageInfo.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/family/demands/${demandId}?boost_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/family/demands/${demandId}?boost_cancelled=true`,
      metadata: {
        demandId,
        familyUserId: session.user.id,
        boostPackage,
      },
    });

    // Store VisibilityPurchase with PENDING status
    const purchaseId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + packageInfo.durationDays * 24 * 60 * 60 * 1000).toISOString();

    await db.execute({
      sql: `
        INSERT INTO VisibilityPurchase (
          id, demandId, familyUserId, package, amountEurCents,
          stripeCheckoutSessionId, status, purchasedAt, expiresAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `,
      args: [
        purchaseId,
        demandId,
        session.user.id,
        boostPackage,
        packageInfo.price,
        checkoutSession.id,
        'PENDING',
        expiresAt,
      ],
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('[Boost API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/demands/[id]/boost
 * Verificar status do boost (para polling after redirect)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const demandId = params.id;

    // Get current visibility status
    const demandResult = await db.execute({
      sql: `
        SELECT
          visibilityPackage,
          visibilityExpiresAt
        FROM Demand
        WHERE id = ?
      `,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const demand = demandResult.rows[0];

    // Check if there's an active boost
    const boostResult = await db.execute({
      sql: `
        SELECT
          id,
          package,
          status,
          completedAt,
          expiresAt
        FROM VisibilityPurchase
        WHERE demandId = ? AND status = 'COMPLETED'
        ORDER BY completedAt DESC
        LIMIT 1
      `,
      args: [demandId],
    });

    const activeBoost = boostResult.rows[0] || null;

    return NextResponse.json({
      demandId,
      currentPackage: demand.visibilityPackage,
      expiresAt: demand.visibilityExpiresAt,
      activeBoost,
    });
  } catch (error) {
    console.error('[Boost API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boost status' },
      { status: 500 }
    );
  }
}
