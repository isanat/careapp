import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@idosolink/payments';
import { rateLimit } from '../../utils/rateLimit';
import { logInfo } from '../../utils/logger';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  if (rateLimit(`token:${ip}`, 10)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json();
  const amount = Number(body?.amount ?? 25);
  logInfo('token.checkout.requested', { ip, amount });
  const stripeService = new StripeService();
  const url = await stripeService.createCheckoutSessionTokenPurchase('demo-user', amount);
  return NextResponse.json({ url });
}
