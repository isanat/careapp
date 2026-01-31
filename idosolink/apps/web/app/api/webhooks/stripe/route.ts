import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { StripeService } from '@idosolink/payments';
import { logError, logInfo } from '../../utils/logger';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_stub', {
    apiVersion: '2023-10-16'
  });
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_stub'
    );
    logInfo('stripe.webhook.received', { type: event.type });
    const service = new StripeService();
    await service.handleWebhook(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logError('stripe.webhook.failed', { error: String(error) });
    return NextResponse.json({ error: 'Webhook validation failed' }, { status: 400 });
  }
}
