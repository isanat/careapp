import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-turso";
import { generateId } from "@/lib/utils/id";

/**
 * POST /api/contracts/auto-renew
 * Automatically renew contracts that are expiring within 3 days
 * Called by background job/cron
 *
 * IMPORTANT: This endpoint should be protected by API key or cron secret
 */
export async function POST(req: NextRequest) {
  try {
    // Verify this is called from authorized source
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ADMIN_API_KEY;

    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid API key" },
        { status: 401 }
      );
    }

    // Find contracts expiring in next 3 days
    const expiringResult = await db.execute({
      sql: `SELECT id, familyUserId, caregiverUserId, title, description, hourlyRateEur,
                   totalHours, totalEurCents, platformFeePct, hoursPerWeek, scheduleJson,
                   serviceTypes, startDate, endDate, weeklyPaymentEnabled
            FROM Contract
            WHERE status = 'ACTIVE'
              AND weeklyPaymentEnabled = 1
              AND endDate <= datetime('now', '+3 days')
              AND endDate > datetime('now')
            ORDER BY endDate ASC`,
    });

    const contractsToRenew = expiringResult.rows;
    const renewedContracts = [];

    for (const contract of contractsToRenew) {
      try {
        // Create new contract with same terms
        const newContractId = generateId("cont");
        const oldEndDate = new Date(contract.endDate);
        const newStartDate = new Date(oldEndDate.getTime() + 1000); // Start next second
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + 30); // 30 days later

        await db.execute({
          sql: `INSERT INTO Contract (
                  id, familyUserId, caregiverUserId, title, description, hourlyRateEur,
                  totalHours, totalEurCents, platformFeePct, hoursPerWeek, scheduleJson,
                  serviceTypes, startDate, endDate, status, familyFeePaid, caregiverFeePaid,
                  weeklyPaymentEnabled, paymentCycleStartDate, createdAt
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_ACCEPTANCE', 0, 0, 1, datetime('now'), datetime('now'))`,
          args: [
            newContractId,
            contract.familyUserId,
            contract.caregiverUserId,
            contract.title,
            contract.description,
            contract.hourlyRateEur,
            contract.totalHours,
            contract.totalEurCents,
            contract.platformFeePct,
            contract.hoursPerWeek,
            contract.scheduleJson,
            contract.serviceTypes,
            newStartDate.toISOString(),
            newEndDate.toISOString(),
          ],
        });

        // Link renewal
        await db.execute({
          sql: `UPDATE Contract SET renewalContractId = ? WHERE id = ?`,
          args: [newContractId, contract.id],
        });

        // Notify family
        try {
          const notifId = generateId("notif");
          await db.execute({
            sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
                  VALUES (?, ?, 'contract', 'Contrato em Renovação', ?, 'Contract', ?, datetime('now'))`,
            args: [
              notifId,
              contract.familyUserId,
              `Seu contrato "${contract.title}" vence em 3 dias. Um novo contrato foi criado para renovação. Por favor, revise e aceite para continuar.`,
              newContractId,
            ],
          });
        } catch (error) {
          console.error(`Error notifying family for renewal:`, error);
        }

        // Notify caregiver
        try {
          const notifId = generateId("notif");
          await db.execute({
            sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
                  VALUES (?, ?, 'contract', 'Contrato em Renovação', ?, 'Contract', ?, datetime('now'))`,
            args: [
              notifId,
              contract.caregiverUserId,
              `Seu contrato "${contract.title}" vence em 3 dias. Um novo contrato foi criado para renovação. Por favor, revise e aceite para continuar.`,
              newContractId,
            ],
          });
        } catch (error) {
          console.error(`Error notifying caregiver for renewal:`, error);
        }

        renewedContracts.push({
          oldContractId: contract.id,
          newContractId,
          expiresAt: contract.endDate,
        });
      } catch (error) {
        console.error(`Error renewing contract ${contract.id}:`, error);
        // Continue with next contract
      }
    }

    return NextResponse.json({
      success: true,
      contractsRenewed: renewedContracts.length,
      contracts: renewedContracts,
    });
  } catch (error) {
    console.error("Error in auto-renew:", error);
    return NextResponse.json(
      { error: "Failed to renew contracts" },
      { status: 500 }
    );
  }
}
