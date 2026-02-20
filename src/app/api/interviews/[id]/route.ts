import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { validateQuestionnaire, formatQuestionnaireJson } from "@/lib/services/interview";

// GET: Get interview by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await db.execute({
      sql: `SELECT 
        i.*,
        fm.name as family_name,
        fm.email as family_email,
        cg.name as caregiver_name,
        cg.email as caregiver_email
        FROM Interview i
        JOIN User fm ON i.familyUserId = fm.id
        JOIN User cg ON i.caregiverUserId = cg.id
        WHERE i.id = ?`,
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const interview = result.rows[0];

    // Verify user is participant
    if (interview.familyUserId !== session.user.id && 
        interview.caregiverUserId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      interview: {
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
        videoRoomUrl: interview.videoRoomUrl,
        familyUserId: interview.familyUserId,
        caregiverUserId: interview.caregiverUserId,
        familyName: interview.family_name,
        caregiverName: interview.caregiver_name,
        questionnaire: interview.questionnaireJson ? JSON.parse(interview.questionnaireJson as string) : null,
        familyCompletedAt: interview.familyCompletedAt,
        caregiverCompletedAt: interview.caregiverCompletedAt
      }
    });
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 });
  }
}

// PATCH: Update interview status or submit questionnaire
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, questionnaire } = body;

    // Verify user is participant
    const interviewResult = await db.execute({
      sql: `SELECT * FROM Interview WHERE id = ?`,
      args: [id]
    });

    if (interviewResult.rows.length === 0) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const interview = interviewResult.rows[0];

    if (interview.familyUserId !== session.user.id && 
        interview.caregiverUserId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Handle status update
    if (status) {
      await db.execute({
        sql: `UPDATE Interview SET status = ?, updatedAt = ? WHERE id = ?`,
        args: [status, new Date().toISOString(), id]
      });

      // If starting interview, set startedAt
      if (status === "IN_PROGRESS") {
        await db.execute({
          sql: `UPDATE Interview SET startedAt = ? WHERE id = ?`,
          args: [new Date().toISOString(), id]
        });
      }

      // If completing interview, set endedAt
      if (status === "COMPLETED") {
        await db.execute({
          sql: `UPDATE Interview SET endedAt = ? WHERE id = ?`,
          args: [new Date().toISOString(), id]
        });
      }
    }

    // Handle questionnaire submission (family only)
    if (questionnaire && interview.familyUserId === session.user.id) {
      const validation = validateQuestionnaire(questionnaire);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(", ") },
          { status: 400 }
        );
      }

      const questionnaireJson = formatQuestionnaireJson(questionnaire);
      
      await db.execute({
        sql: `UPDATE Interview 
              SET questionnaireJson = ?, familyCompletedAt = ?, updatedAt = ?
              WHERE id = ?`,
        args: [questionnaireJson, new Date().toISOString(), new Date().toISOString(), id]
      });

      // If family wants to proceed and there's a contract, update acceptance
      if (questionnaire.proceedWithContract && interview.contractId) {
        const ip = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // Record contract acceptance with IP and timestamp
        await db.execute({
          sql: `INSERT OR REPLACE INTO ContractAcceptance 
                (id, contractId, acceptedByFamilyAt, familyIpAddress, familyUserAgent, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            interview.contractId,
            new Date().toISOString(),
            ip,
            userAgent,
            new Date().toISOString()
          ]
        });

        // Update contract status
        await db.execute({
          sql: `UPDATE Contract SET status = 'PENDING_ACCEPTANCE', updatedAt = ? WHERE id = ?`,
          args: [new Date().toISOString(), interview.contractId]
        });

        // Notify caregiver
        await db.execute({
          sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            interview.caregiverUserId,
            "contract",
            "Interview Completed",
            "The family has completed the interview and wants to proceed with the contract.",
            "interview",
            id,
            new Date().toISOString()
          ]
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
  }
}

// DELETE: Cancel interview
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is participant
    const interviewResult = await db.execute({
      sql: `SELECT * FROM Interview WHERE id = ?`,
      args: [id]
    });

    if (interviewResult.rows.length === 0) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const interview = interviewResult.rows[0];

    if (interview.familyUserId !== session.user.id && 
        interview.caregiverUserId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Mark as cancelled instead of deleting
    await db.execute({
      sql: `UPDATE Interview SET status = 'CANCELLED', updatedAt = ? WHERE id = ?`,
      args: [new Date().toISOString(), id]
    });

    // Notify other party
    const otherUserId = interview.familyUserId === session.user.id 
      ? interview.caregiverUserId 
      : interview.familyUserId;

    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        otherUserId,
        "interview",
        "Interview Cancelled",
        "An interview has been cancelled.",
        new Date().toISOString()
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling interview:", error);
    return NextResponse.json({ error: "Failed to cancel interview" }, { status: 500 });
  }
}
