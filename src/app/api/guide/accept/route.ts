import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

// POST: Accept the guide
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already accepted
    const existing = await db.execute({
      sql: `SELECT id FROM GuideAcceptance WHERE userId = ? AND guideType = 'best_practices'`,
      args: [session.user.id]
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Already accepted",
        alreadyAccepted: true 
      });
    }

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create acceptance record
    await db.execute({
      sql: `INSERT INTO GuideAcceptance (id, userId, guideType, guideVersion, acknowledgedAt, ipAddress, userAgent)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        session.user.id,
        "best_practices",
        "1.0",
        new Date().toISOString(),
        ip,
        userAgent
      ]
    });

    // Create notification
    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        session.user.id,
        "guide",
        "Guia Confirmado",
        "Você confirmou a leitura do Guia de Boas Práticas.",
        new Date().toISOString()
      ]
    });

    return NextResponse.json({ 
      success: true,
      message: "Guide acceptance recorded"
    });
  } catch (error) {
    console.error("Error accepting guide:", error);
    return NextResponse.json({ error: "Failed to record acceptance" }, { status: 500 });
  }
}
