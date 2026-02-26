import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { generateRoomName, generateJitsiRoomUrl } from "@/lib/services/interview";

// POST: Create a new interview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { caregiverUserId, contractId, scheduledAt, durationMinutes = 30 } = body;

    if (!caregiverUserId || !scheduledAt) {
      return NextResponse.json(
        { error: "Caregiver ID and scheduled time are required" },
        { status: 400 }
      );
    }

    // Verify user is a family
    const userResult = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [session.user.id]
    });

    if (userResult.rows[0]?.role !== "FAMILY") {
      return NextResponse.json(
        { error: "Only families can schedule interviews" },
        { status: 403 }
      );
    }

    // Verify caregiver exists and is verified
    const caregiverResult = await db.execute({
      sql: `SELECT u.id, u.name, pc.verificationStatus 
            FROM User u 
            JOIN ProfileCaregiver pc ON u.id = pc.userId 
            WHERE u.id = ? AND u.role = 'CAREGIVER'`,
      args: [caregiverUserId]
    });

    if (caregiverResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 }
      );
    }

    // Generate room name and URL
    const roomName = generateRoomName(session.user.id, caregiverUserId);
    const videoRoomUrl = generateJitsiRoomUrl(roomName);

    // Create interview record
    const interviewId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO Interview (
        id, familyUserId, caregiverUserId, contractId, status,
        scheduledAt, durationMinutes, videoRoomUrl, videoProvider, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        interviewId,
        session.user.id,
        caregiverUserId,
        contractId || null,
        "SCHEDULED",
        scheduledAt,
        durationMinutes,
        videoRoomUrl,
        "jitsi",
        new Date().toISOString()
      ]
    });

    // Create notification for caregiver
    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        caregiverUserId,
        "interview",
        "New Interview Scheduled",
        `A family has scheduled an interview with you for ${new Date(scheduledAt).toLocaleString()}`,
        new Date().toISOString()
      ]
    });

    return NextResponse.json({
      success: true,
      interview: {
        id: interviewId,
        videoRoomUrl,
        scheduledAt,
        durationMinutes,
        status: "SCHEDULED"
      }
    });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}

// GET: List interviews for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let sql = `SELECT 
      i.id, i.status, i.scheduledAt, i.durationMinutes, i.videoRoomUrl,
      i.questionnaireJson, i.createdAt,
      CASE 
        WHEN i.familyUserId = ? THEN cg.name
        ELSE fm.name
      END as other_party_name,
      CASE 
        WHEN i.familyUserId = ? THEN 'caregiver'
        ELSE 'family'
      END as other_party_role
      FROM Interview i
      JOIN User fm ON i.familyUserId = fm.id
      JOIN User cg ON i.caregiverUserId = cg.id
      WHERE (i.familyUserId = ? OR i.caregiverUserId = ?)`;

    const args: (string | null)[] = [session.user.id, session.user.id, session.user.id, session.user.id];

    if (status) {
      sql += ` AND i.status = ?`;
      args.push(status);
    }

    sql += ` ORDER BY i.scheduledAt DESC`;

    const result = await db.execute({ sql, args });

    return NextResponse.json({
      interviews: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        scheduledAt: row.scheduledAt,
        durationMinutes: row.durationMinutes,
        videoRoomUrl: row.videoRoomUrl,
        otherPartyName: row.other_party_name,
        otherPartyRole: row.other_party_role,
        questionnaire: row.questionnaireJson ? JSON.parse(row.questionnaireJson as string) : null,
        createdAt: row.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
