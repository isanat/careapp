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
         FROM contracts c
         JOIN users u ON c.caregiver_user_id = u.id
         LEFT JOIN profiles_caregiver p ON c.caregiver_user_id = p.user_id
         WHERE c.family_user_id = ?
         ORDER BY c.created_at DESC`
      : `SELECT c.*, u.name as family_name, p.city as family_city
         FROM contracts c
         JOIN users u ON c.family_user_id = u.id
         LEFT JOIN profiles_family p ON c.family_user_id = p.user_id
         WHERE c.caregiver_user_id = ?
         ORDER BY c.created_at DESC`;

    const result = await db.execute({ sql, args: [userId] });

    const contracts = result.rows.map(row => ({
      id: row.id,
      status: row.status,
      title: row.title,
      description: row.description,
      hourlyRateEur: Number(row.hourly_rate_eur) || 0,
      totalHours: Number(row.total_hours) || 0,
      totalEurCents: Number(row.total_eur_cents) || 0,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      serviceTypes: row.service_types ? String(row.service_types).split(',') : [],
      hoursPerWeek: Number(row.hours_per_week) || 0,
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
      sql: `INSERT INTO contracts (id, family_user_id, caregiver_user_id, status, title, description, hourly_rate_eur, total_hours, total_eur_cents, start_date, end_date, service_types, hours_per_week, created_at) VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
