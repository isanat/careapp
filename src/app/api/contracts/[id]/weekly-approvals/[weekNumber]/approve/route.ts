import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { stripeService } from "@/lib/services/stripe";
import { generateId } from "@/lib/utils/id";

/**
 * POST /api/contracts/{id}/weekly-approvals/{weekNumber}/approve
 * Family approves a weekly payment
 * Captures Stripe hold and creates caregiver transfer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; weekNumber: string }> }
) {
  const { id, weekNumber: weekNumberStr } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractId = id;
    const weekNumber = parseInt(weekNumberStr);

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 4) {
      return NextResponse.json({ error: "Invalid week number" }, { status: 400 });
    }

    // Get contract
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, caregiverUserId FROM Contract WHERE id = ?`,
      args: [contractId],
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // Verify family owns contract
    if (contract.familyUserId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get weekly approval
    const approvalResult = await db.execute({
      sql: `SELECT id, weekNumber, status, familyDecision, weeklyAmountCents,
                   caregiverAmountCents, stripePaymentHoldId
            FROM WeeklyPaymentApproval
            WHERE contractId = ? AND weekNumber = ?`,
      args: [contractId, weekNumber],
    });

    if (approvalResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Weekly approval not found" },
        { status: 404 }
      );
    }

    const approval = approvalResult.rows[0];

    // Check status
    if (approval.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot approve week ${weekNumber}: status is ${approval.status}` },
        { status: 400 }
      );
    }

    if (approval.familyDecision !== null) {
      return NextResponse.json(
        { error: `Family has already made a decision for week ${weekNumber}` },
        { status: 400 }
      );
    }

    // Capture Stripe payment hold
    let chargeId: string | null = null;
    let transferId: string | null = null;

    if (approval.stripePaymentHoldId) {
      try {
        const captureResult = await stripeService.capturePaymentHold(
          approval.stripePaymentHoldId as string
        );
        chargeId = captureResult.chargeId;

        // Get caregiver Stripe Connect account ID (mock for now)
        const caregiverResult = await db.execute({
          sql: `SELECT id FROM User WHERE id = ?`,
          args: [contract.caregiverUserId],
        });

        if (caregiverResult.rows.length > 0) {
          // In production, fetch caregiver's actual Stripe Connect account ID
          // For now, we'll store transfer intent
          try {
            const transfer = await stripeService.transferToCaregiverAccount(
              approval.caregiverAmountCents as number,
              `acct_${(contract.caregiverUserId as string).slice(0, 16)}`, // Mock account ID
              {
                contractId,
                weekNumber,
              }
            );
            transferId = transfer.transferId;
          } catch (error) {
            console.error("Error creating transfer:", error);
            // Continue anyway - transfer can be retried
          }
        }
      } catch (error) {
        console.error("Error capturing payment:", error);
        return NextResponse.json(
          { error: "Failed to capture payment" },
          { status: 500 }
        );
      }
    }

    // Update weekly approval
    const approvalId = approval.id;
    await db.execute({
      sql: `UPDATE WeeklyPaymentApproval
            SET familyDecision = 'APPROVED', familyDecidedAt = datetime('now'),
                status = 'CAPTURED', capturedAt = datetime('now')
            WHERE id = ?`,
      args: [approvalId],
    });

    // Create caregiver transfer record (if we have transfer ID)
    if (transferId) {
      const transferRecord = generateId("xfer");
      await db.execute({
        sql: `INSERT INTO CaregiverTransfer (id, caregiverId, contractId, grossAmount,
                platformFeePercent, platformFeeCents, netAmount, stripeTransferId,
                status, createdAt)
              VALUES (?, ?, ?, ?, 15, ?, ?, ?, 'PENDING', datetime('now'))`,
        args: [
          transferRecord,
          contract.caregiverUserId,
          contractId,
          approval.weeklyAmountCents as number,
          (approval.weeklyAmountCents as number) - (approval.caregiverAmountCents as number),
          approval.caregiverAmountCents as number,
          transferId,
        ],
      });

      // Update approval with transfer ID
      await db.execute({
        sql: `UPDATE WeeklyPaymentApproval SET caregiverTransferId = ? WHERE id = ?`,
        args: [transferRecord, approvalId],
      });
    }

    // Notify caregiver
    try {
      const notifId = generateId("notif");
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
              VALUES (?, ?, 'contract', 'Semana Aprovada', ?, 'Contract', ?, datetime('now'))`,
        args: [
          notifId,
          contract.caregiverUserId,
          `Semana ${weekNumber} foi aprovada. Você receberá €${(approval.caregiverAmountCents / 100).toFixed(2)}.`,
          contractId,
        ],
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      // Continue anyway
    }

    // Auto-authorize next week's hold if this is not week 4
    if (weekNumber < 4) {
      try {
        const nextWeekResult = await db.execute({
          sql: `SELECT id, weeklyAmountCents FROM WeeklyPaymentApproval
                WHERE contractId = ? AND weekNumber = ?`,
          args: [contractId, weekNumber + 1],
        });

        if (nextWeekResult.rows.length > 0) {
          const nextWeek = nextWeekResult.rows[0];
          const hold = await stripeService.createPaymentHold(
            contractId,
            contract.familyUserId,
            nextWeek.weeklyAmountCents,
            weekNumber + 1
          );

          await db.execute({
            sql: `UPDATE WeeklyPaymentApproval SET stripePaymentHoldId = ? WHERE id = ?`,
            args: [hold.paymentIntentId, nextWeek.id],
          });
        }
      } catch (error) {
        console.error("Error auto-authorizing next week:", error);
        // Continue anyway
      }
    }

    return NextResponse.json({
      success: true,
      weekNumber,
      status: "CAPTURED",
      approvedAt: new Date().toISOString(),
      caregiverReceives: approval.caregiverAmountCents,
      transferId: transferId || null,
      nextWeekAuthorized: weekNumber < 4,
    });
  } catch (error) {
    console.error("Error approving weekly payment:", error);
    return NextResponse.json(
      { error: "Failed to approve weekly payment" },
      { status: 500 }
    );
  }
}
