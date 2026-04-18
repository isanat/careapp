import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    // Get total payments
    let totalPayments = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Payment",
        args: [],
      });
      totalPayments = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting payments:", e);
    }

    // Get completed payments
    let completedPayments = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Payment WHERE status = 'COMPLETED'",
        args: [],
      });
      completedPayments = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting completed payments:", e);
    }

    // Get total revenue
    let totalRevenue = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COALESCE(SUM(amountEurCents), 0) as total FROM Payment WHERE status = 'COMPLETED'",
        args: [],
      });
      totalRevenue = Number(result.rows[0]?.total || 0);
    } catch (e) {
      console.error("Error summing revenue:", e);
    }

    // Get pending payments
    let pendingPayments = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Payment WHERE status = 'PENDING'",
        args: [],
      });
      pendingPayments = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending payments:", e);
    }

    // Get failed payments
    let failedPayments = 0;
    try {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Payment WHERE status = 'FAILED'",
        args: [],
      });
      failedPayments = Number(result.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting failed payments:", e);
    }

    return NextResponse.json({
      stats: {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue,
        totalRevenueEur: totalRevenue / 100,
      },
    });
  } catch (error) {
    console.error("Admin payments stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment stats" },
      { status: 500 },
    );
  }
}
