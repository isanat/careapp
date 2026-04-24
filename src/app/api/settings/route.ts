import { NextResponse } from "next/server";
import { db } from "@/lib/db-turso";

// GET - Public platform settings
export async function GET() {
  try {
    const result = await db.execute({
      sql: `SELECT platformFeePercent FROM PlatformSettings LIMIT 1`,
      args: [],
    });

    const settings = result.rows[0] || { platformFeePercent: 15 };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return sensible defaults instead of failing
    return NextResponse.json({ platformFeePercent: 15 });
  }
}
