import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

/**
 * Counter-proposal endpoint.
 * Allows a caregiver to counter-propose new terms instead of simply accepting or rejecting.
 * Updates contract status to COUNTER_PROPOSED and stores the counter values in metadata.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contractId } = await params;
    const body = await request.json().catch(() => ({}));
    const { hourlyRateEur, totalHours, hoursPerWeek, message } = body;

    // At least one counter value must be provided
    if (hourlyRateEur == null && totalHours == null && hoursPerWeek == null) {
      return NextResponse.json(
        { error: 'Deve propor pelo menos um valor diferente (taxa horaria, total de horas ou horas por semana)' },
        { status: 400 }
      );
    }

    // Verify user is the caregiver for this contract
    const contractResult = await db.execute({
      sql: `SELECT id, caregiverUserId, familyUserId, status, hourlyRateEur, totalHours, hoursPerWeek, totalEurCents, description
            FROM Contract WHERE id = ?`,
      args: [contractId]
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // Only caregiver can counter-propose
    if (contract.caregiverUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o cuidador pode fazer uma contraproposta' },
        { status: 403 }
      );
    }

    // Can only counter-propose if status is PENDING_ACCEPTANCE or DRAFT
    if (!['PENDING_ACCEPTANCE', 'DRAFT'].includes(String(contract.status))) {
      return NextResponse.json(
        { error: 'Este contrato nao pode receber uma contraproposta neste momento' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Build counter-proposal metadata
    const counterProposal = {
      originalHourlyRateEur: Number(contract.hourlyRateEur),
      originalTotalHours: Number(contract.totalHours),
      originalHoursPerWeek: Number(contract.hoursPerWeek),
      originalTotalEurCents: Number(contract.totalEurCents),
      proposedHourlyRateEur: hourlyRateEur != null ? Number(hourlyRateEur) : Number(contract.hourlyRateEur),
      proposedTotalHours: totalHours != null ? Number(totalHours) : Number(contract.totalHours),
      proposedHoursPerWeek: hoursPerWeek != null ? Number(hoursPerWeek) : Number(contract.hoursPerWeek),
      message: message || null,
      counterProposedAt: now,
      counterProposedBy: session.user.id,
    };

    // Calculate new total based on counter-proposed values
    const newHourlyRate = counterProposal.proposedHourlyRateEur;
    const newTotalHours = counterProposal.proposedTotalHours;
    const newTotalEurCents = newHourlyRate * newTotalHours;
    counterProposal.proposedHourlyRateEur = newHourlyRate;

    // Build the description update with counter-proposal info
    const counterDescription = message
      ? `\n\nContraproposta do cuidador: ${message}`
      : '\n\nContraproposta enviada pelo cuidador.';

    // Update contract with counter-proposed values and status
    // We store original values in metadata JSON and update the contract fields to the proposed values
    await db.execute({
      sql: `UPDATE Contract
            SET status = 'COUNTER_PROPOSED',
                hourlyRateEur = ?,
                totalHours = ?,
                hoursPerWeek = ?,
                totalEurCents = ?,
                description = COALESCE(description, '') || ?,
                updatedAt = ?
            WHERE id = ?`,
      args: [
        newHourlyRate,
        newTotalHours,
        counterProposal.proposedHoursPerWeek,
        newTotalEurCents,
        counterDescription,
        now,
        contractId
      ]
    });

    // Create notification for the family
    const notificationId = generateId("notif");
    const notifMessage = `O cuidador enviou uma contraproposta para o seu contrato.${
      hourlyRateEur != null ? ` Nova taxa: €${(Number(hourlyRateEur) / 100).toFixed(2)}/h.` : ''
    }${
      totalHours != null ? ` Total horas: ${totalHours}h.` : ''
    }${
      hoursPerWeek != null ? ` Horas/semana: ${hoursPerWeek}h.` : ''
    }${
      message ? ` Mensagem: "${message}"` : ''
    }`;

    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
            VALUES (?, ?, 'contract_counter_proposal', 'Contraproposta Recebida', ?, 'contract', ?, ?)`,
      args: [notificationId, contract.familyUserId, notifMessage, contractId, now]
    });

    return NextResponse.json({
      success: true,
      message: 'Contraproposta enviada com sucesso',
      counterProposal: {
        hourlyRateEur: newHourlyRate,
        totalHours: newTotalHours,
        hoursPerWeek: counterProposal.proposedHoursPerWeek,
        totalEurCents: newTotalEurCents,
      }
    });
  } catch (error) {
    console.error('Error creating counter-proposal:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
