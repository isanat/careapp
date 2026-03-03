import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    // Get pending caregivers count
    let pendingCaregivers = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus = 'PENDING'",
        args: [],
      });
      pendingCaregivers = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending caregivers:", e);
    }

    // Get pending contracts count
    let pendingContracts = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Contract WHERE status IN ('PENDING_ACCEPTANCE', 'PENDING_PAYMENT')",
        args: [],
      });
      pendingContracts = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending contracts:", e);
    }

    // Get disputed contracts count
    let disputedContracts = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Contract WHERE status = 'DISPUTED'",
        args: [],
      });
      disputedContracts = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting disputes:", e);
    }

    // Get pending KYC count
    let pendingKyc = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus = 'PENDING'",
        args: [],
      });
      pendingKyc = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending KYC:", e);
    }

    // Get open support tickets count
    let openSupportTickets = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM SupportTicket WHERE status = 'open'",
        args: [],
      });
      openSupportTickets = Number(result.rows[0]?.count || 0);
    } catch (e) {
      // Table might not exist
      console.error("Error counting support tickets:", e);
    }

    // Get pending moderation count
    let pendingModeration = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Review WHERE isModerated = 0",
        args: [],
      });
      pendingModeration = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending moderation:", e);
    }

    return NextResponse.json({
      pendingCaregivers,
      pendingContracts,
      disputedContracts,
      pendingKyc,
      openSupportTickets,
      pendingModeration,
      // Computed totals for convenience
      totalPendingActions: pendingCaregivers + disputedContracts + openSupportTickets + pendingModeration,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
