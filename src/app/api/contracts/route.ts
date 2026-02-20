import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const isFamily = session.user.role === 'FAMILY';

    const sql = isFamily 
      ? `SELECT c.*, u.name as caregiver_name, p.title as caregiver_title, p.city as caregiver_city
         FROM Contract c
         JOIN User u ON c.caregiverUserId = u.id
         LEFT JOIN ProfileCaregiver p ON c.caregiverUserId = p.userId
         WHERE c.familyUserId = ?
         ORDER BY c.createdAt DESC`
      : `SELECT c.*, u.name as family_name, p.city as family_city
         FROM Contract c
         JOIN User u ON c.familyUserId = u.id
         LEFT JOIN ProfileFamily p ON c.familyUserId = p.userId
         WHERE c.caregiverUserId = ?
         ORDER BY c.createdAt DESC`;

    const result = await db.execute({ sql, args: [userId] });

    const contracts = result.rows.map(row => ({
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
      serviceTypes: row.serviceTypes ? String(row.serviceTypes).split(',') : [],
      hoursPerWeek: Number(row.hoursPerWeek) || 0,
      otherParty: isFamily 
        ? { name: row.caregiver_name, title: row.caregiver_title, city: row.caregiver_city }
        : { name: row.family_name, city: row.family_city },
    }));

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { caregiverUserId, title, description, hourlyRateEur, totalHours, startDate, endDate, serviceTypes, hoursPerWeek } = body;

    const familyUserId = session.user.id;
    const contractId = `ctr-${Date.now()}`;
    const totalEurCents = (hourlyRateEur || 0) * (totalHours || 0);

    await db.execute({
      sql: `INSERT INTO Contract (id, familyUserId, caregiverUserId, status, title, description, hourlyRateEur, totalHours, totalEurCents, startDate, endDate, serviceTypes, hoursPerWeek, createdAt) VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [contractId, familyUserId, caregiverUserId, title, description, hourlyRateEur || 0, totalHours || 0, totalEurCents, startDate, endDate, serviceTypes, hoursPerWeek || 0]
    });

    return NextResponse.json({ 
      success: true, 
      contractId,
      message: 'Contrato criado com sucesso'
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
