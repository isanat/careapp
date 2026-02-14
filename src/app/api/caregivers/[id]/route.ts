import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db.execute({
      sql: `
        SELECT 
          u.id, u.name, u.email, u.profile_image, u.verification_status,
          p.title, p.bio, p.city, p.services, p.hourly_rate_eur, 
          p.average_rating, p.total_reviews, p.total_contracts, 
          p.experience_years, p.education, p.certifications, p.languages,
          p.availability_json, p.available_now
        FROM users u
        INNER JOIN profiles_caregiver p ON u.id = p.user_id
        WHERE u.id = ? AND u.role = 'CAREGIVER'
      `,
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    const row = result.rows[0];

    const reviewsResult = await db.execute({
      sql: `
        SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name
        FROM reviews r
        JOIN users u ON r.from_user_id = u.id
        WHERE r.to_user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `,
      args: [id]
    });

    const caregiver = {
      id: row.id,
      name: row.name,
      email: row.email,
      profileImage: row.profile_image,
      verificationStatus: row.verification_status,
      title: row.title,
      bio: row.bio,
      city: row.city,
      services: row.services ? String(row.services).split(',') : [],
      hourlyRateEur: Number(row.hourly_rate_eur) || 0,
      averageRating: Number(row.average_rating) || 0,
      totalReviews: Number(row.total_reviews) || 0,
      totalContracts: Number(row.total_contracts) || 0,
      experienceYears: Number(row.experience_years) || 0,
      education: row.education,
      certifications: row.certifications ? String(row.certifications).split(',') : [],
      languages: row.languages ? String(row.languages).split(',') : [],
      availability: row.availability_json ? JSON.parse(String(row.availability_json)) : null,
      availableNow: row.available_now === 1,
      reviews: reviewsResult.rows.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        date: r.created_at,
        reviewerName: r.reviewer_name,
      })),
    };

    return NextResponse.json({ caregiver });
  } catch (error) {
    console.error('Error fetching caregiver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
