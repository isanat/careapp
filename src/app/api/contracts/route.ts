import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { generateId } from "@/lib/utils/id";
import { createContractSchema } from "@/lib/validations/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isFamily = session.user.role === "FAMILY";

    const sql = isFamily
      ? `SELECT c.*, u.name as caregiver_name, p.title as caregiver_title, p.city as caregiver_city
         FROM Contract c
         JOIN User u ON c.caregiverUserId = u.id
         LEFT JOIN ProfileCaregiver p ON c.caregiverUserId = p.userId
         WHERE c.familyUserId = ?
         ORDER BY c.createdAt DESC`
      : `SELECT c.*, u.name as family_name, u.email as family_email, u.phone as family_phone,
                p.city as family_city, p.elderName as elder_name, p.elderNeeds as elder_needs
         FROM Contract c
         JOIN User u ON c.familyUserId = u.id
         LEFT JOIN ProfileFamily p ON c.familyUserId = p.userId
         WHERE c.caregiverUserId = ?
         ORDER BY c.createdAt DESC`;

    const result = await db.execute({ sql, args: [userId] });

    const contracts = result.rows.map((row) => ({
      id: row.id,
      status: row.status,
      title: row.title,
      description: row.description,
      hourlyRateEur: Number(row.hourlyRateEur) || 0,
      totalHours: Number(row.totalHours) || 0,
      totalEurCents: Number(row.totalEurCents) || 0,
      startDate: row.startDate,
      endDate: row.endDate,
      createdAt: row.createdAt,
      serviceTypes: row.serviceTypes ? String(row.serviceTypes).split(",") : [],
      hoursPerWeek: Number(row.hoursPerWeek) || 0,
      caregiverId: row.caregiverUserId,
      familyId: row.familyUserId,
      otherParty: isFamily
        ? {
            id: row.caregiverUserId,
            name: row.caregiver_name,
            title: row.caregiver_title,
            city: row.caregiver_city,
          }
        : {
            id: row.familyUserId,
            name: row.family_name,
            city: row.family_city,
          },
      // Additional family info for caregivers - contact details only for active/completed contracts
      family: !isFamily
        ? {
            name: row.family_name,
            email:
              row.status === "ACTIVE" || row.status === "COMPLETED"
                ? row.family_email
                : undefined,
            phone:
              row.status === "ACTIVE" || row.status === "COMPLETED"
                ? row.family_phone
                : undefined,
            city: row.family_city,
            elderName: row.elder_name,
            elderNeeds: row.elder_needs,
          }
        : undefined,
    }));

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createContractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const {
      caregiverUserId,
      title,
      description,
      hourlyRateEur,
      totalHours,
      startDate,
      endDate,
      serviceTypes,
      hoursPerWeek,
    } = parsed.data;

    const familyUserId = session.user.id;

    // Verify both parties have completed KYC
    const kycCheck = await db.execute({
      sql: `SELECT id, verificationStatus, role FROM User WHERE id IN (?, ?)`,
      args: [familyUserId, caregiverUserId],
    });

    const familyUser = kycCheck.rows.find((r) => r.id === familyUserId);
    const caregiverUser = kycCheck.rows.find((r) => r.id === caregiverUserId);

    if (!caregiverUser) {
      return NextResponse.json(
        { error: "Cuidador não encontrado" },
        { status: 404 },
      );
    }

    if (familyUser?.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error: "Verificação KYC necessária antes de criar contrato",
          code: "KYC_REQUIRED",
        },
        { status: 403 },
      );
    }

    if (caregiverUser.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error: "O cuidador ainda não completou a verificação KYC",
          code: "CAREGIVER_KYC_PENDING",
        },
        { status: 403 },
      );
    }

    const contractId = generateId("ctr");
    const totalEurCents = (hourlyRateEur || 0) * (totalHours || 0);

    await db.execute({
      sql: `INSERT INTO Contract (id, familyUserId, caregiverUserId, status, title, description, hourlyRateEur, totalHours, totalEurCents, startDate, endDate, serviceTypes, hoursPerWeek, createdAt, updatedAt) VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        contractId,
        familyUserId,
        caregiverUserId,
        title,
        description ?? "",
        hourlyRateEur || 0,
        totalHours || 0,
        totalEurCents,
        startDate ?? null,
        endDate ?? null,
        serviceTypes ?? "",
        hoursPerWeek || 0,
      ],
    });

    return NextResponse.json({
      success: true,
      contractId,
      message: "Contrato criado com sucesso",
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
