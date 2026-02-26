import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

// GET: Check if user has accepted the guide
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT * FROM GuideAcceptance WHERE userId = ? AND guideType = 'best_practices'`,
      args: [session.user.id]
    });

    return NextResponse.json({
      accepted: result.rows.length > 0,
      acceptedAt: result.rows[0]?.acknowledgedAt || null
    });
  } catch (error) {
    console.error("Error checking guide acceptance:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
