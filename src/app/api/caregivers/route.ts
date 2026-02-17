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
        u.id, u.name, u.email, u.profile_image,
        p.title, p.bio, p.city, p.services, p.hourly_rate_eur, 
        p.average_rating, p.total_reviews, p.total_contracts, p.experience_years
      FROM users u
      INNER JOIN profiles_caregiver p ON u.id = p.user_id
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
      sql += ` AND p.average_rating >= ?`;
      args.push(minRating);
    }

    sql += ` ORDER BY p.average_rating DESC, p.total_reviews DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const caregivers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      profileImage: row.profile_image,
      title: row.title,
      bio: row.bio,
      city: row.city,
      services: row.services ? String(row.services).split(',') : [],
      hourlyRateEur: Number(row.hourly_rate_eur) || 0,
      averageRating: Number(row.average_rating) || 0,
      totalReviews: Number(row.total_reviews) || 0,
      totalContracts: Number(row.total_contracts) || 0,
      experienceYears: Number(row.experience_years) || 0,
    }));

    return NextResponse.json({ caregivers });
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
