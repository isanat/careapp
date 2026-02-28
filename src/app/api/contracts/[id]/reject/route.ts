import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

// Reject contract (caregiver only)
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
    const { rejectionReason } = body;

    // Verify user is the caregiver for this contract
    const contractResult = await db.execute({
      sql: `SELECT caregiverUserId, familyUserId, status FROM Contract WHERE id = ?`,
      args: [contractId]
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // Only caregiver can reject
    if (contract.caregiverUserId !== session.user.id) {
      return NextResponse.json({ error: 'Apenas o cuidador pode recusar esta proposta' }, { status: 403 });
    }

    // Can only reject if status is PENDING_ACCEPTANCE or DRAFT
    if (!['PENDING_ACCEPTANCE', 'DRAFT', 'PENDING'].includes(String(contract.status))) {
      return NextResponse.json({ error: 'Este contrato não pode mais ser recusado' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update contract status to CANCELLED
    await db.execute({
      sql: `UPDATE Contract 
            SET status = 'CANCELLED', 
                cancelledAt = ?,
                description = COALESCE(description || '\n\nMotivo da recusa: ' || ?, 'Motivo da recusa: ' || ?),
                updatedAt = ?
            WHERE id = ?`,
      args: [now, rejectionReason || 'Não informado', rejectionReason || 'Não informado', now, contractId]
    });

    // Create notification for family
    const notificationId = generateId("notif");
    await db.execute({
      sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
            VALUES (?, ?, 'contract_rejected', 'Proposta Recusada', ?, 'contract', ?, ?)`,
      args: [
        notificationId, 
        contract.familyUserId, 
        `O cuidador recusou sua proposta de contrato. ${rejectionReason ? `Motivo: ${rejectionReason}` : ''}`,
        contractId,
        now
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Proposta recusada com sucesso'
    });
  } catch (error) {
    console.error('Error rejecting contract:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
