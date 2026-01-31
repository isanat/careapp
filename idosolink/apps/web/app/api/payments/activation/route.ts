import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@idosolink/payments';
import { rateLimit } from '../../utils/rateLimit';
import { logInfo } from '../../utils/logger';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  if (rateLimit(`activation:${ip}`, 5)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  logInfo('activation.checkout.requested', { ip });
  const stripeService = new StripeService();
  const url = await stripeService.createCheckoutSessionActivation('demo-user');
  return NextResponse.json({ url });
}
