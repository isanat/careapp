import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db-turso";
import { stripeService } from "@/lib/services/stripe";
import { generateId } from "@/lib/utils/id";

/**
 * GET /api/contracts/{id}/weekly-approvals
 * Fetch all weekly payment approvals for a contract
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractId = params.id;

    // Get contract and verify ownership
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, caregiverUserId, status, totalEurCents, weeklyPaymentEnabled
            FROM Contract WHERE id = ?`,
      args: [contractId],
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // Verify user is family or caregiver in this contract
    if (session.user.id !== contract.familyUserId && session.user.id !== contract.caregiverUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all weekly payment approvals
    const approvalsResult = await db.execute({
      sql: `SELECT
              id, weekNumber, weeklyAmountCents, platformFeeCents, caregiverAmountCents,
              approvalDueAt, familyDecision, status, approvedAt, capturedAt, familyNotes
            FROM WeeklyPaymentApproval
            WHERE contractId = ?
            ORDER BY weekNumber ASC`,
      args: [contractId],
    });

    const weeklyApprovals = approvalsResult.rows.map((row) => ({
      id: row.id,
      weekNumber: row.weekNumber,
      amount: row.weeklyAmountCents,
      platformFee: row.platformFeeCents,
      caregiverReceives: row.caregiverAmountCents,
      approvalDueAt: row.approvalDueAt,
      familyDecision: row.familyDecision,
      status: row.status,
      approvedAt: row.approvedAt,
      capturedAt: row.capturedAt,
      familyNotes: row.familyNotes,
      canApprove: session.user.id === contract.familyUserId && row.status === "PENDING",
      canDispute: session.user.id === contract.familyUserId && row.status === "PENDING",
    }));

    return NextResponse.json({
      contractId,
      weeklyPaymentEnabled: contract.weeklyPaymentEnabled,
      status: contract.status,
      totalAmount: contract.totalEurCents,
      weeklyApprovals,
    });
  } catch (error) {
    console.error("Error fetching weekly approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly approvals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts/{id}/weekly-approvals/create
 * Create weekly payment approvals for a contract
 * Called after contract fee is paid
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractId = params.id;

    // Get contract
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, totalEurCents, startDate, status, weeklyPaymentEnabled
            FROM Contract WHERE id = ?`,
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

    // Check if contract is in right status
    if (contract.status !== "ACTIVE" && contract.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: `Cannot create weekly approvals for contract in ${contract.status} status` },
        { status: 400 }
      );
    }

    // Check if already enabled
    if (contract.weeklyPaymentEnabled) {
      return NextResponse.json(
        { error: "Weekly payment approvals already created for this contract" },
        { status: 400 }
      );
    }

    const dailyRate = Math.floor(contract.totalEurCents / 30); // €5/day for €150/30d
    const startDate = new Date(contract.startDate);

    // Create 4 weekly payment approvals
    const weeklyApprovals = [];
    const platformFeePct = 15; // 15% platform fee

    for (let week = 1; week <= 4; week++) {
      // Calculate week dates
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);

      // Approval due at Friday 5 PM
      const approvalDueAt = new Date(weekStartDate);
      approvalDueAt.setDate(approvalDueAt.getDate() + ((5 - approvalDueAt.getDay() + 7) % 7)); // Next Friday
      approvalDueAt.setHours(17, 0, 0, 0); // 5 PM

      // Calculate actual days in week (week 1 might be partial, others are 7 days)
      let daysInWeek = 7;
      if (week === 1) {
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        daysInWeek = Math.min(7, Math.ceil((approvalDueAt.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)));
        if (daysInWeek === 0) daysInWeek = 1; // At least 1 day
      }

      const weeklyAmount = dailyRate * daysInWeek;
      const platformFee = Math.floor((weeklyAmount * platformFeePct) / 100);
      const caregiverAmount = weeklyAmount - platformFee;

      const approvalId = generateId("wpa");

      // Insert weekly payment approval
      await db.execute({
        sql: `INSERT INTO WeeklyPaymentApproval (
              id, contractId, weekNumber, weeklyAmountCents, platformFeeCents, caregiverAmountCents,
              approvalDueAt, status, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'))`,
        args: [
          approvalId,
          contractId,
          week,
          weeklyAmount,
          platformFee,
          caregiverAmount,
          approvalDueAt.toISOString(),
        ],
      });

      weeklyApprovals.push({
        id: approvalId,
        weekNumber: week,
        amount: weeklyAmount,
        dueAt: approvalDueAt.toISOString(),
      });
    }

    // Enable weekly payment and set cycle start date
    await db.execute({
      sql: `UPDATE Contract SET weeklyPaymentEnabled = 1, paymentCycleStartDate = datetime('now')
            WHERE id = ?`,
      args: [contractId],
    });

    // Create initial Stripe payment hold for week 1
    if (weeklyApprovals.length > 0) {
      const week1 = weeklyApprovals[0];
      try {
        const hold = await stripeService.createPaymentHold(
          contractId,
          contract.familyUserId,
          week1.amount,
          1
        );

        // Store Stripe payment hold ID in first week
        await db.execute({
          sql: `UPDATE WeeklyPaymentApproval SET stripePaymentHoldId = ? WHERE id = ?`,
          args: [hold.paymentIntentId, week1.id],
        });
      } catch (error) {
        console.error("Error creating Stripe hold for week 1:", error);
        // Continue anyway, family can retry
      }
    }

    return NextResponse.json({
      success: true,
      contractId,
      weeklyApprovals,
      message: "Weekly payment approvals created successfully",
    });
  } catch (error) {
    console.error("Error creating weekly approvals:", error);
    return NextResponse.json(
      { error: "Failed to create weekly approvals" },
      { status: 500 }
    );
  }
}
