import Stripe from 'stripe';
import { prisma } from '@idosolink/db/src/client';
import { ActivationService } from '@idosolink/core';

const stripeKey = process.env.STRIPE_SECRET_KEY ?? 'sk_test_stub';

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16'
});

export class StripeService {
  async createCheckoutSessionActivation(userId: string) {
    const payment = await prisma.payment.create({
      data: {
        userId,
        type: 'ACTIVATION',
        amountEur: 25,
        status: 'PENDING'
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/activation?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/activation?cancelled=true`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 2500,
            product_data: {
              name: 'Ativação IdosoLink'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment.id,
        userId
      }
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id }
    });

    return session.url ?? '';
  }

  async createCheckoutSessionTokenPurchase(userId: string, eurAmount: number) {
    const payment = await prisma.payment.create({
      data: {
        userId,
        type: 'TOKEN_PURCHASE',
        amountEur: eurAmount,
        status: 'PENDING'
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/app/wallet?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/app/wallet?cancelled=true`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: eurAmount * 100,
            product_data: {
              name: 'Compra de tokens IdosoLink'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment.id,
        userId
      }
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id }
    });

    return session.url ?? '';
  }

  async createCheckoutSessionContractPayment(contractId: string, eurAmount: number) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });
    if (!contract) {
      throw new Error('Contract not found');
    }

    const payment = await prisma.payment.create({
      data: {
        userId: contract.familyUserId,
        type: 'CONTRACT_PAYMENT',
        amountEur: eurAmount,
        status: 'PENDING'
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/app/contracts/${contractId}?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/app/contracts/${contractId}?cancelled=true`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: eurAmount * 100,
            product_data: {
              name: 'Pagamento de contrato IdosoLink'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment.id,
        userId: contract.familyUserId
      }
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id }
    });

    return session.url ?? '';
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      const userId = session.metadata?.userId;
      if (!paymentId || !userId) return;

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) return;

      if (payment.type === 'ACTIVATION') {
        const activation = new ActivationService();
        await activation.activateUser(userId, paymentId);
      } else {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'PAID' }
        });
      }
    }
  }
}
