import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db-turso";
import { stripeService } from "@/lib/services/stripe";
import { generateId } from "@/lib/utils/id";

/**
 * POST /api/contracts/{id}/weekly-approvals/{weekNumber}/dispute
 * Family disputes a weekly payment
 * Voids Stripe hold and creates support ticket for mediation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; weekNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractId = params.id;
    const weekNumber = parseInt(params.weekNumber);
    const body = await req.json();
    const { reason } = body;

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 4) {
      return NextResponse.json({ error: "Invalid week number" }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Dispute reason is required" }, { status: 400 });
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
      sql: `SELECT id, status, familyDecision, stripePaymentHoldId, weeklyAmountCents
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
        { error: `Cannot dispute week ${weekNumber}: status is ${approval.status}` },
        { status: 400 }
      );
    }

    if (approval.familyDecision !== null) {
      return NextResponse.json(
        { error: `Family has already made a decision for week ${weekNumber}` },
        { status: 400 }
      );
    }

    // Void Stripe payment hold
    if (approval.stripePaymentHoldId) {
      try {
        await stripeService.voidPaymentHold(approval.stripePaymentHoldId);
      } catch (error) {
        console.error("Error voiding payment hold:", error);
        // Continue anyway - hold will expire naturally
      }
    }

    // Update weekly approval with dispute
    const approvalId = approval.id;
    await db.execute({
      sql: `UPDATE WeeklyPaymentApproval
            SET familyDecision = 'DISPUTED', familyDecidedAt = datetime('now'),
                familyNotes = ?, status = 'DISPUTED'
            WHERE id = ?`,
      args: [reason, approvalId],
    });

    // Create support ticket for admin mediation
    const ticketId = generateId("ticket");
    const ticketTitle = `Disputa de Pagamento - Semana ${weekNumber} do Contrato`;
    const ticketMessage = `
Família disputou o pagamento da semana ${weekNumber}.

Motivo: ${reason}

Valor em disputa: €${(approval.weeklyAmountCents / 100).toFixed(2)}
Cuidador: ${contract.caregiverUserId}

Por favor, mediar entre as partes.
    `.trim();

    await db.execute({
      sql: `INSERT INTO SupportTicket (id, userId, subject, description, status, priority, type, contractId, createdAt)
            VALUES (?, ?, ?, ?, 'OPEN', 'HIGH', 'DISPUTE', ?, datetime('now'))`,
      args: [ticketId, contract.familyUserId, ticketTitle, ticketMessage, contractId],
    });

    // Notify caregiver about dispute
    try {
      const notifId = generateId("notif");
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
              VALUES (?, ?, 'contract', 'Pagamento Disputado', ?, 'Contract', ?, datetime('now'))`,
        args: [
          notifId,
          contract.caregiverUserId,
          `A família disputou o pagamento da semana ${weekNumber}. Um administrador fará a mediação.`,
          contractId,
        ],
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      // Continue anyway
    }

    // Notify admin
    try {
      const notifId = generateId("notif");
      const adminResult = await db.execute({
        sql: `SELECT id FROM User WHERE role = 'ADMIN' LIMIT 1`,
      });

      if (adminResult.rows.length > 0) {
        await db.execute({
          sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
                VALUES (?, ?, 'admin', 'Disputa de Pagamento Requerendo Mediação', ?, 'SupportTicket', ?, datetime('now'))`,
          args: [notifId, adminResult.rows[0].id, `Ticket ${ticketId}`, ticketId],
        });
      }
    } catch (error) {
      console.error("Error creating admin notification:", error);
    }

    return NextResponse.json({
      success: true,
      weekNumber,
      status: "DISPUTED",
      reason,
      supportTicketId: ticketId,
      message: "Disputa criada. Um administrador fará a mediação.",
    });
  } catch (error) {
    console.error("Error disputing weekly payment:", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    );
  }
}
