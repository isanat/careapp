import Stripe from "stripe";
import { db } from "@/lib/db-turso";
import { ACTIVATION_COST_EUR_CENTS, CONTRACT_FEE_EUR_CENTS } from "@/lib/constants";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_stub", {
  apiVersion: "2023-10-16",
});

/**
 * Generate a unique ID for database records
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class StripeService {
  /**
   * Create checkout session for account activation
   */
  async createActivationCheckout(userId: string) {
    // Get user with wallet
    const userResult = await db.execute({
      sql: `SELECT u.id, u.email, u.name, u.status,
                   w.id as walletId, w.balanceTokens, w.balanceEurCents
            FROM User u
            LEFT JOIN Wallet w ON u.id = w.userId
            WHERE u.id = ?`,
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    await db.execute({
      sql: `INSERT INTO Payment (id, userId, type, provider, amountEurCents, tokensAmount, status, description, createdAt)
            VALUES (?, ?, 'ACTIVATION', 'STRIPE', ?, ?, 'PENDING', 'Ativação de conta IdosoLink', datetime('now'))`,
      args: [paymentId, userId, ACTIVATION_COST_EUR_CENTS, ACTIVATION_COST_EUR_CENTS],
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment?cancelled=true`,
      customer_email: String(user.email),
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
        paymentId,
        userId,
        type: "ACTIVATION",
      },
    });

    // Update payment with session ID
    await db.execute({
      sql: `UPDATE Payment SET stripeCheckoutSessionId = ? WHERE id = ?`,
      args: [session.id, paymentId],
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
    const userResult = await db.execute({
      sql: `SELECT id, email, name FROM User WHERE id = ?`,
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    await db.execute({
      sql: `INSERT INTO Payment (id, userId, type, provider, amountEurCents, tokensAmount, status, description, createdAt)
            VALUES (?, ?, 'TOKEN_PURCHASE', 'STRIPE', ?, ?, 'PENDING', ?, datetime('now'))`,
      args: [paymentId, userId, eurAmount, eurAmount, `Compra de ${eurAmount} tokens SENT`],
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/wallet?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/wallet?cancelled=true`,
      customer_email: String(user.email),
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
        paymentId,
        userId,
        type: "TOKEN_PURCHASE",
      },
    });

    // Update payment with session ID
    await db.execute({
      sql: `UPDATE Payment SET stripeCheckoutSessionId = ? WHERE id = ?`,
      args: [session.id, paymentId],
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
    // Get user
    const userResult = await db.execute({
      sql: `SELECT id, email, name FROM User WHERE id = ?`,
      args: [userId],
    });

    // Get contract
    const contractResult = await db.execute({
      sql: `SELECT id, title, status FROM Contract WHERE id = ?`,
      args: [contractId],
    });

    if (userResult.rows.length === 0 || contractResult.rows.length === 0) {
      throw new Error("User or contract not found");
    }

    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    await db.execute({
      sql: `INSERT INTO Payment (id, userId, contractId, type, provider, amountEurCents, tokensAmount, status, description, createdAt)
            VALUES (?, ?, ?, 'CONTRACT_FEE', 'STRIPE', ?, ?, 'PENDING', 'Taxa de criação de contrato', datetime('now'))`,
      args: [paymentId, userId, contractId, CONTRACT_FEE_EUR_CENTS, CONTRACT_FEE_EUR_CENTS],
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/contracts/${contractId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/contracts/${contractId}?cancelled=true`,
      customer_email: String(user.email),
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
        paymentId,
        userId,
        contractId,
        type: "CONTRACT_FEE",
      },
    });

    // Update payment with session ID
    await db.execute({
      sql: `UPDATE Payment SET stripeCheckoutSessionId = ? WHERE id = ?`,
      args: [session.id, paymentId],
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

      // Get payment
      const paymentResult = await db.execute({
        sql: `SELECT id, userId, type, status, amountEurCents, tokensAmount 
              FROM Payment 
              WHERE id = ?`,
        args: [paymentId],
      });

      if (paymentResult.rows.length === 0) return;
      
      const payment = paymentResult.rows[0];
      
      // Check if already completed
      if (payment.status === "COMPLETED") return;

      // Update payment status
      await db.execute({
        sql: `UPDATE Payment 
              SET status = 'COMPLETED', 
                  stripePaymentIntentId = ?, 
                  paidAt = datetime('now')
              WHERE id = ?`,
        args: [session.payment_intent as string, paymentId],
      });

      // Add tokens to user wallet
      if (type === "ACTIVATION" || type === "TOKEN_PURCHASE") {
        // Get wallet
        const walletResult = await db.execute({
          sql: `SELECT id, balanceTokens, balanceEurCents FROM Wallet WHERE userId = ?`,
          args: [userId],
        });

        if (walletResult.rows.length > 0) {
          const wallet = walletResult.rows[0];
          const newBalanceTokens = Number(wallet.balanceTokens) + Number(payment.tokensAmount);
          const newBalanceEurCents = Number(wallet.balanceEurCents) + Number(payment.amountEurCents);

          // Update wallet balance
          await db.execute({
            sql: `UPDATE Wallet 
                  SET balanceTokens = ?, 
                      balanceEurCents = ?,
                      updatedAt = datetime('now')
                  WHERE id = ?`,
            args: [newBalanceTokens, newBalanceEurCents, wallet.id],
          });

          // Create ledger entry
          const ledgerId = generateId("tl");
          await db.execute({
            sql: `INSERT INTO TokenLedger 
                  (id, userId, type, reason, amountTokens, amountEurCents, referenceType, referenceId, description, createdAt)
                  VALUES (?, ?, 'CREDIT', ?, ?, ?, 'Payment', ?, ?, datetime('now'))`,
            args: [
              ledgerId,
              userId,
              type === "ACTIVATION" ? "ACTIVATION_BONUS" : "TOKEN_PURCHASE",
              payment.tokensAmount,
              payment.amountEurCents,
              paymentId,
              type === "ACTIVATION" ? "Tokens de ativação de conta" : "Compra de tokens",
            ],
          });

          // Update user status to active for activation
          if (type === "ACTIVATION") {
            await db.execute({
              sql: `UPDATE User SET status = 'ACTIVE', updatedAt = datetime('now') WHERE id = ?`,
              args: [userId],
            });
          }
        }
      }

      // Update platform settings (reserve)
      const settingsResult = await db.execute({
        sql: `SELECT id, totalReserveEurCents, totalTokensMinted FROM PlatformSettings LIMIT 1`,
        args: [],
      });

      if (settingsResult.rows.length > 0) {
        const settings = settingsResult.rows[0];
        const newReserve = Number(settings.totalReserveEurCents) + Number(payment.amountEurCents);
        const newMinted = Number(settings.totalTokensMinted) + Number(payment.tokensAmount);

        await db.execute({
          sql: `UPDATE PlatformSettings 
                SET totalReserveEurCents = ?, 
                    totalTokensMinted = ?,
                    updatedAt = datetime('now')
                WHERE id = ?`,
          args: [newReserve, newMinted, settings.id],
        });
      } else {
        // Create platform settings if not exists
        const settingsId = generateId("ps");
        await db.execute({
          sql: `INSERT INTO PlatformSettings 
                (id, totalReserveEurCents, totalTokensMinted, updatedAt)
                VALUES (?, ?, ?, datetime('now'))`,
          args: [settingsId, payment.amountEurCents, payment.tokensAmount],
        });
      }
    }
  }
}

export const stripeService = new StripeService();
