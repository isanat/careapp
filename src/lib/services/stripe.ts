import Stripe from "stripe";
import { db } from "@/lib/db-turso";
import { ACTIVATION_COST_EUR_CENTS, CONTRACT_FEE_EUR_CENTS, APP_NAME } from "@/lib/constants";
import { generateId } from "@/lib/utils/id";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_stub", {
  apiVersion: "2023-10-16" as any,
});

export class StripeService {
  /**
   * Create checkout session for account activation
   */
  async createActivationCheckout(userId: string) {
    // Get user
    const userResult = await db.execute({
      sql: `SELECT u.id, u.email, u.name, u.status FROM User u WHERE u.id = ?`,
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    await db.execute({
      sql: `INSERT INTO Payment (id, userId, type, provider, amountEurCents, status, description, createdAt)
            VALUES (?, ?, 'ACTIVATION', 'STRIPE', ?, 'PENDING', 'Ativação de conta ${APP_NAME}', datetime('now'))`,
      args: [paymentId, userId, ACTIVATION_COST_EUR_CENTS],
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
              name: `Ativação ${APP_NAME}`,
              description: `Ativação de conta ${APP_NAME}`,
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
   * Create checkout session for visibility boost
   */
  async createVisibilityBoostCheckout(
    userId: string,
    demandId: string,
    boostPackage: 'BASIC' | 'PREMIUM' | 'URGENT'
  ) {
    const packages: Record<string, { price: number; duration: number; label: string }> = {
      BASIC: { price: 300, duration: 7, label: 'Visibilidade Básica (7 dias)' },
      PREMIUM: { price: 800, duration: 30, label: 'Visibilidade Premium (30 dias)' },
      URGENT: { price: 1500, duration: 3, label: 'Visibilidade Urgente (3 dias)' },
    };

    const packageInfo = packages[boostPackage];
    if (!packageInfo) throw new Error('Invalid boost package');

    // Get user and demand
    const userResult = await db.execute({
      sql: `SELECT id, email, name FROM User WHERE id = ?`,
      args: [userId],
    });

    const demandResult = await db.execute({
      sql: `SELECT id, title, familyUserId FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (userResult.rows.length === 0 || demandResult.rows.length === 0) {
      throw new Error('User or demand not found');
    }

    const user = userResult.rows[0];
    const demand = demandResult.rows[0];

    if (demand.familyUserId !== userId) {
      throw new Error('Unauthorized');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/family/demands/${demandId}?boost=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/family/demands/${demandId}?boost=cancelled`,
      customer_email: String(user.email),
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: packageInfo.price,
            product_data: {
              name: packageInfo.label,
              description: `Aumentar visibilidade da demanda: "${demand.title}"`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        demandId,
        familyUserId: userId,
        boostPackage,
        type: 'VISIBILITY_BOOST',
      },
    });

    // Create VisibilityPurchase record
    const purchaseId = generateId('vpurch');
    const expiresAt = new Date(Date.now() + packageInfo.duration * 24 * 60 * 60 * 1000);

    await db.execute({
      sql: `
        INSERT INTO VisibilityPurchase (
          id, demandId, familyUserId, package, amountEurCents,
          stripeCheckoutSessionId, status, purchasedAt, expiresAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), ?, datetime('now'))
      `,
      args: [
        purchaseId,
        demandId,
        userId,
        boostPackage,
        packageInfo.price,
        session.id,
        expiresAt.toISOString(),
      ],
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
      sql: `INSERT INTO Payment (id, userId, contractId, type, provider, amountEurCents, status, description, createdAt)
            VALUES (?, ?, ?, 'CONTRACT_FEE', 'STRIPE', ?, 'PENDING', 'Taxa de criação de contrato', datetime('now'))`,
      args: [paymentId, userId, contractId, CONTRACT_FEE_EUR_CENTS],
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
              name: `Taxa de Contrato ${APP_NAME}`,
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
      const type = session.metadata?.type;
      const paymentId = session.metadata?.paymentId;
      const userId = session.metadata?.userId;

      // Handle visibility boost
      if (type === "VISIBILITY_BOOST") {
        const demandId = session.metadata?.demandId;
        const boostPackage = session.metadata?.boostPackage;

        if (!demandId || !boostPackage) return;

        // Check if already completed (idempotency)
        const checkResult = await db.execute({
          sql: `SELECT status FROM VisibilityPurchase WHERE stripeCheckoutSessionId = ?`,
          args: [session.id],
        });

        if (checkResult.rows.length > 0 && checkResult.rows[0].status === "COMPLETED") {
          return;
        }

        const packages: Record<string, { duration: number }> = {
          BASIC: { duration: 7 },
          PREMIUM: { duration: 30 },
          URGENT: { duration: 3 },
        };

        const packageInfo = packages[boostPackage];
        if (!packageInfo) return;

        // Wrap in transaction
        const tx = await db.transaction("write");
        try {
          // Update VisibilityPurchase
          const expiresAt = new Date(Date.now() + packageInfo.duration * 24 * 60 * 60 * 1000);
          await tx.execute({
            sql: `
              UPDATE VisibilityPurchase
              SET
                status = 'COMPLETED',
                stripePaymentIntentId = ?,
                completedAt = datetime('now'),
                expiresAt = ?
              WHERE stripeCheckoutSessionId = ? AND status = 'PENDING'
            `,
            args: [session.payment_intent as string, expiresAt.toISOString(), session.id],
          });

          // Update Demand visibility
          await tx.execute({
            sql: `
              UPDATE Demand
              SET
                visibilityPackage = ?,
                visibilityExpiresAt = ?,
                updatedAt = datetime('now')
              WHERE id = ?
            `,
            args: [boostPackage, expiresAt.toISOString(), demandId],
          });

          await tx.commit();
          console.log('[Webhook] ✓ Boost completed:', { demandId, boostPackage });
        } catch (error) {
          await tx.rollback();
          throw error;
        }

        return;
      }

      if (!paymentId || !userId) return;

      // Get payment
      const paymentResult = await db.execute({
        sql: `SELECT id, userId, type, status, amountEurCents
              FROM Payment
              WHERE id = ?`,
        args: [paymentId],
      });

      if (paymentResult.rows.length === 0) return;

      const payment = paymentResult.rows[0];

      // Check if already completed (idempotency)
      if (payment.status === "COMPLETED") return;

      // Wrap all mutations in a transaction to prevent partial updates
      const tx = await db.transaction("write");
      try {
        // Update payment status
        await tx.execute({
          sql: `UPDATE Payment
                SET status = 'COMPLETED',
                    stripePaymentIntentId = ?,
                    paidAt = datetime('now')
                WHERE id = ?`,
          args: [session.payment_intent as string, paymentId],
        });

        // Activate user account on activation payment
        if (type === "ACTIVATION") {
          await tx.execute({
            sql: `UPDATE User SET status = 'ACTIVE', updatedAt = datetime('now') WHERE id = ?`,
            args: [userId],
          });
        }

        // Handle contract fee payment
        if (type === "CONTRACT_FEE") {
          const contractId = session.metadata?.contractId;
          if (contractId) {
            await tx.execute({
              sql: `UPDATE Contract SET familyFeePaid = 1, status = 'ACTIVE', updatedAt = datetime('now') WHERE id = ? AND status = 'PENDING_PAYMENT'`,
              args: [contractId],
            });

            // Get caregiver to notify them
            const contractResult = await tx.execute({
              sql: `SELECT caregiverUserId FROM Contract WHERE id = ?`,
              args: [contractId],
            });

            if (contractResult.rows.length > 0) {
              const caregiverUserId = contractResult.rows[0].caregiverUserId;
              const notifId = generateId("notif");
              await tx.execute({
                sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt) VALUES (?, ?, 'contract', 'Contrato Ativado', 'A taxa de contrato foi paga. O contrato está agora ativo.', 'Contract', ?, datetime('now'))`,
                args: [notifId, caregiverUserId, contractId],
              });
            }
          }
        }

        // Update platform revenue stats
        const SETTINGS_ID = "platform-settings-v1";
        const settingsResult = await tx.execute({
          sql: `SELECT id, totalReserveEurCents FROM PlatformSettings WHERE id = ?`,
          args: [SETTINGS_ID],
        });

        if (settingsResult.rows.length > 0) {
          const settings = settingsResult.rows[0];
          const newReserve = Number(settings.totalReserveEurCents) + Number(payment.amountEurCents);
          await tx.execute({
            sql: `UPDATE PlatformSettings SET totalReserveEurCents = ?, updatedAt = datetime('now') WHERE id = ?`,
            args: [newReserve, SETTINGS_ID],
          });
        }

        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    }
  }
}

export const stripeService = new StripeService();
