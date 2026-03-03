import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

/**
 * Public API endpoint for caregivers to find families looking for care.
 * Only returns ACTIVE families with completed profiles.
 * Privacy-safe: shows city, elder needs, service types, budget range — NOT phone/email.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const service = searchParams.get('service');
    const limit = parseInt(searchParams.get('limit') || '20');

    let sql = `
      SELECT
        u.id, u.name, u.profileImage,
        p.city, p.elderName, p.elderAge, p.elderNeeds,
        p.medicalConditions, p.mobilityLevel,
        p.preferredServices, p.preferredSchedule, p.budgetRange,
        p.latitude, p.longitude
      FROM User u
      INNER JOIN ProfileFamily p ON u.id = p.userId
      WHERE u.role = 'FAMILY'
        AND u.status = 'ACTIVE'
        AND p.city IS NOT NULL
        AND p.elderNeeds IS NOT NULL
    `;

    const args: string[] = [];

    if (city) {
      sql += ` AND p.city LIKE ?`;
      args.push(`%${city}%`);
    }

    if (service) {
      sql += ` AND p.preferredServices LIKE ?`;
      args.push(`%${service}%`);
    }

    sql += ` ORDER BY u.createdAt DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const families = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      profileImage: row.profileImage,
      city: row.city,
      elderName: row.elderName,
      elderAge: row.elderAge ? Number(row.elderAge) : null,
      elderNeeds: row.elderNeeds,
      medicalConditions: row.medicalConditions,
      mobilityLevel: row.mobilityLevel,
      preferredServices: row.preferredServices ? String(row.preferredServices).split(',') : [],
      preferredSchedule: row.preferredSchedule,
      budgetRange: row.budgetRange,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
    }));

    const response = NextResponse.json({ families });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error fetching families:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
