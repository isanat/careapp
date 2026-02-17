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
                   w.id as wallet_id, w.balance_tokens, w.balance_eur_cents
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
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
      sql: `INSERT INTO payments (id, user_id, type, provider, amount_eur_cents, tokens_amount, status, description, created_at)
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
      sql: `UPDATE payments SET stripe_checkout_session_id = ? WHERE id = ?`,
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
      sql: `SELECT id, email, name FROM users WHERE id = ?`,
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    await db.execute({
      sql: `INSERT INTO payments (id, user_id, type, provider, amount_eur_cents, tokens_amount, status, description, created_at)
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
      sql: `UPDATE payments SET stripe_checkout_session_id = ? WHERE id = ?`,
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
      sql: `SELECT id, email, name FROM users WHERE id = ?`,
      args: [userId],
    });

    // Get contract
    const contractResult = await db.execute({
      sql: `SELECT id, title, status FROM contracts WHERE id = ?`,
      args: [contractId],
    });

    if (userResult.rows.length === 0 || contractResult.rows.length === 0) {
      throw new Error("User or contract not found");
    }

    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    await db.execute({
      sql: `INSERT INTO payments (id, user_id, contract_id, type, provider, amount_eur_cents, tokens_amount, status, description, created_at)
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
      sql: `UPDATE payments SET stripe_checkout_session_id = ? WHERE id = ?`,
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
        sql: `SELECT id, user_id, type, status, amount_eur_cents, tokens_amount 
              FROM payments 
              WHERE id = ?`,
        args: [paymentId],
      });

      if (paymentResult.rows.length === 0) return;
      
      const payment = paymentResult.rows[0];
      
      // Check if already completed
      if (payment.status === "COMPLETED") return;

      // Update payment status
      await db.execute({
        sql: `UPDATE payments 
              SET status = 'COMPLETED', 
                  stripe_payment_intent_id = ?, 
                  paid_at = datetime('now')
              WHERE id = ?`,
        args: [session.payment_intent as string, paymentId],
      });

      // Add tokens to user wallet
      if (type === "ACTIVATION" || type === "TOKEN_PURCHASE") {
        // Get wallet
        const walletResult = await db.execute({
          sql: `SELECT id, balance_tokens, balance_eur_cents FROM wallets WHERE user_id = ?`,
          args: [userId],
        });

        if (walletResult.rows.length > 0) {
          const wallet = walletResult.rows[0];
          const newBalanceTokens = Number(wallet.balance_tokens) + Number(payment.tokens_amount);
          const newBalanceEurCents = Number(wallet.balance_eur_cents) + Number(payment.amount_eur_cents);

          // Update wallet balance
          await db.execute({
            sql: `UPDATE wallets 
                  SET balance_tokens = ?, 
                      balance_eur_cents = ?,
                      updated_at = datetime('now')
                  WHERE id = ?`,
            args: [newBalanceTokens, newBalanceEurCents, wallet.id],
          });

          // Create ledger entry
          const ledgerId = generateId("tl");
          await db.execute({
            sql: `INSERT INTO token_ledger 
                  (id, user_id, type, reason, amount_tokens, amount_eur_cents, reference_type, reference_id, description, created_at)
                  VALUES (?, ?, 'CREDIT', ?, ?, ?, 'Payment', ?, ?, datetime('now'))`,
            args: [
              ledgerId,
              userId,
              type === "ACTIVATION" ? "ACTIVATION_BONUS" : "TOKEN_PURCHASE",
              payment.tokens_amount,
              payment.amount_eur_cents,
              paymentId,
              type === "ACTIVATION" ? "Tokens de ativação de conta" : "Compra de tokens",
            ],
          });

          // Update user status to active for activation
          if (type === "ACTIVATION") {
            await db.execute({
              sql: `UPDATE users SET status = 'ACTIVE', updated_at = datetime('now') WHERE id = ?`,
              args: [userId],
            });
          }
        }
      }

      // Update platform settings (reserve)
      const settingsResult = await db.execute({
        sql: `SELECT id, total_reserve_eur_cents, total_tokens_minted FROM platform_settings LIMIT 1`,
        args: [],
      });

      if (settingsResult.rows.length > 0) {
        const settings = settingsResult.rows[0];
        const newReserve = Number(settings.total_reserve_eur_cents) + Number(payment.amount_eur_cents);
        const newMinted = Number(settings.total_tokens_minted) + Number(payment.tokens_amount);

        await db.execute({
          sql: `UPDATE platform_settings 
                SET total_reserve_eur_cents = ?, 
                    total_tokens_minted = ?,
                    updated_at = datetime('now')
                WHERE id = ?`,
          args: [newReserve, newMinted, settings.id],
        });
      } else {
        // Create platform settings if not exists
        const settingsId = generateId("ps");
        await db.execute({
          sql: `INSERT INTO platform_settings 
                (id, total_reserve_eur_cents, total_tokens_minted, updated_at)
                VALUES (?, ?, ?, datetime('now'))`,
          args: [settingsId, payment.amount_eur_cents, payment.tokens_amount],
        });
      }
    }
  }
}

export const stripeService = new StripeService();
