import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@idosolink/payments';
import { rateLimit } from '../../utils/rateLimit';
import { logInfo } from '../../utils/logger';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  if (rateLimit(`contract:${ip}`, 10)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json();
  const contractId = String(body?.contractId ?? 'c1');
  const amount = Number(body?.amount ?? 100);
  logInfo('contract.checkout.requested', { ip, contractId, amount });
  const stripeService = new StripeService();
  const url = await stripeService.createCheckoutSessionContractPayment(contractId, amount);
  return NextResponse.json({ url });
}
