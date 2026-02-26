import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const service = searchParams.get('service');
    const minRating = searchParams.get('minRating');
    const limit = parseInt(searchParams.get('limit') || '20');

    let sql = `
      SELECT 
        u.id, u.name, u.email, u.profileImage,
        p.title, p.bio, p.city, p.services, p.hourlyRateEur, 
        p.averageRating, p.totalReviews, p.totalContracts, p.experienceYears
      FROM User u
      INNER JOIN ProfileCaregiver p ON u.id = p.userId
      WHERE u.role = 'CAREGIVER' AND u.status = 'ACTIVE'
    `;
    
    const args: string[] = [];

    if (city) {
      sql += ` AND p.city LIKE ?`;
      args.push(`%${city}%`);
    }

    if (service) {
      sql += ` AND p.services LIKE ?`;
      args.push(`%${service}%`);
    }

    if (minRating) {
      sql += ` AND p.averageRating >= ?`;
      args.push(minRating);
    }

    sql += ` ORDER BY p.averageRating DESC, p.totalReviews DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const caregivers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      profileImage: row.profileImage,
      title: row.title,
      bio: row.bio,
      city: row.city,
      services: row.services ? String(row.services).split(',') : [],
      hourlyRateEur: Number(row.hourlyRateEur) || 0,
      averageRating: Number(row.averageRating) || 0,
      totalReviews: Number(row.totalReviews) || 0,
      totalContracts: Number(row.totalContracts) || 0,
      experienceYears: Number(row.experienceYears) || 0,
    }));

    return NextResponse.json({ caregivers });
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
