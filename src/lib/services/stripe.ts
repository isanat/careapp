import Stripe from "stripe";
import { db } from "@/lib/db";
import { ACTIVATION_COST_EUR_CENTS, CONTRACT_FEE_EUR_CENTS } from "@/lib/constants";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_stub", {
  apiVersion: "2023-10-16",
});

export class StripeService {
  /**
   * Create checkout session for account activation
   */
  async createActivationCheckout(userId: string) {
    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        type: "ACTIVATION",
        provider: "STRIPE",
        amountEurCents: ACTIVATION_COST_EUR_CENTS,
        tokensAmount: ACTIVATION_COST_EUR_CENTS, // 1:1 initial conversion
        status: "PENDING",
        description: "Ativação de conta IdosoLink",
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment?cancelled=true`,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: ACTIVATION_COST_EUR_CENTS,
            product_data: {
              name: "Ativação IdosoLink",
              description: `Ativação de conta com ${ACTIVATION_COST_EUR_CENTS / 100} tokens SENT`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        userId,
        type: "ACTIVATION",
      },
    });

    // Update payment with session ID
    await db.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create checkout session for token purchase
   */
  async createTokenPurchaseCheckout(userId: string, eurAmount: number) {
    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        type: "TOKEN_PURCHASE",
        provider: "STRIPE",
        amountEurCents: eurAmount,
        tokensAmount: eurAmount, // 1:1 conversion at initial price
        status: "PENDING",
        description: `Compra de ${eurAmount} tokens SENT`,
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/wallet?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/wallet?cancelled=true`,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: eurAmount,
            product_data: {
              name: "Tokens SeniorToken (SENT)",
              description: `${eurAmount / 100} tokens SENT`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        userId,
        type: "TOKEN_PURCHASE",
      },
    });

    // Update payment with session ID
    await db.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create checkout session for contract fee
   */
  async createContractFeeCheckout(userId: string, contractId: string) {
    // Get user and contract
    const user = await db.user.findUnique({ where: { id: userId } });
    const contract = await db.contract.findUnique({ where: { id: contractId } });

    if (!user || !contract) {
      throw new Error("User or contract not found");
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        contractId,
        type: "CONTRACT_FEE",
        provider: "STRIPE",
        amountEurCents: CONTRACT_FEE_EUR_CENTS,
        tokensAmount: CONTRACT_FEE_EUR_CENTS,
        status: "PENDING",
        description: "Taxa de criação de contrato",
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/contracts/${contractId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/contracts/${contractId}?cancelled=true`,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: CONTRACT_FEE_EUR_CENTS,
            product_data: {
              name: "Taxa de Contrato IdosoLink",
              description: "Taxa para criação de contrato de cuidado",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        userId,
        contractId,
        type: "CONTRACT_FEE",
      },
    });

    // Update payment with session ID
    await db.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(event: Stripe.Event) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      const userId = session.metadata?.userId;
      const type = session.metadata?.type;

      if (!paymentId || !userId) return;

      const payment = await db.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.status === "COMPLETED") return;

      // Update payment status
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date(),
        },
      });

      // Add tokens to user wallet
      if (type === "ACTIVATION" || type === "TOKEN_PURCHASE") {
        const wallet = await db.wallet.findUnique({ where: { userId } });
        if (wallet) {
          await db.wallet.update({
            where: { id: wallet.id },
            data: {
              balanceTokens: { increment: payment.tokensAmount },
              balanceEurCents: { increment: payment.amountEurCents },
            },
          });

          // Create ledger entry
          await db.tokenLedger.create({
            data: {
              userId,
              type: "CREDIT",
              reason: type === "ACTIVATION" ? "ACTIVATION_BONUS" : "TOKEN_PURCHASE",
              amountTokens: payment.tokensAmount,
              amountEurCents: payment.amountEurCents,
              referenceType: "Payment",
              referenceId: paymentId,
              description: type === "ACTIVATION" 
                ? "Tokens de ativação de conta" 
                : "Compra de tokens",
            },
          });

          // Update user status to active
          if (type === "ACTIVATION") {
            await db.user.update({
              where: { id: userId },
              data: { status: "ACTIVE" },
            });
          }
        }
      }

      // Update platform settings (reserve)
      const settings = await db.platformSettings.findFirst();
      if (settings) {
        await db.platformSettings.update({
          where: { id: settings.id },
          data: {
            totalReserveEurCents: { increment: payment.amountEurCents },
            totalTokensMinted: { increment: payment.tokensAmount },
          },
        });
      } else {
        await db.platformSettings.create({
          data: {
            totalReserveEurCents: payment.amountEurCents,
            totalTokensMinted: payment.tokensAmount,
          },
        });
      }
    }
  }
}

export const stripeService = new StripeService();
