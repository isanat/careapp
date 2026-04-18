import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";
import { generateId } from "@/lib/utils/id";
import Stripe from "stripe";

// POST - Process refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const { id } = await params;
    const body = await request.json();
    const { amount, reason, notifyUser = true } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 },
      );
    }

    // Get payment
    const payment = await db.execute({
      sql: `SELECT p.*, u.name as userName
            FROM Payment p
            JOIN User u ON p.userId = u.id
            WHERE p.id = ? AND p.status = 'COMPLETED' AND p.refundedAt IS NULL`,
      args: [id],
    });

    if (payment.rows.length === 0) {
      return NextResponse.json(
        { error: "Payment not found or already refunded" },
        { status: 404 },
      );
    }

    const p = payment.rows[0] as any;
    const refundAmountCents = amount || p.amountEurCents;

    // Call Stripe API for refund if provider is STRIPE and payment intent exists
    if (p.provider === "STRIPE" && p.stripePaymentIntentId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2023-10-16" as any,
      });

      try {
        await stripe.refunds.create({
          payment_intent: p.stripePaymentIntentId as string,
          amount: refundAmountCents,
        });
      } catch (stripeError) {
        console.error("Stripe refund failed:", stripeError);
        return NextResponse.json(
          {
            error: "Stripe refund failed",
            details:
              stripeError instanceof Error
                ? stripeError.message
                : "Unknown Stripe error",
          },
          { status: 502 },
        );
      }
    }

    // Update payment status
    await db.execute({
      sql: `UPDATE Payment SET status = 'REFUNDED', refundedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id],
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, oldValue, newValue, reason, ipAddress, createdAt)
            VALUES (?, ?, 'REFUND', 'PAYMENT', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        generateId("action"),
        adminUserId,
        id,
        JSON.stringify({ status: "COMPLETED" }),
        JSON.stringify({ status: "REFUNDED" }),
        reason,
        request.headers.get("x-forwarded-for") || "unknown",
      ],
    });

    // Notify user
    if (notifyUser) {
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
              VALUES (?, ?, 'PAYMENT', 'Reembolso Processado', ?, 'PAYMENT', ?, CURRENT_TIMESTAMP)`,
        args: [
          generateId("notif"),
          p.userId,
          `Seu pagamento de €${(refundAmountCents / 100).toFixed(2)} foi reembolsado.`,
          id,
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Refund processed",
      refund: {
        paymentId: id,
        amountCents: refundAmountCents,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
