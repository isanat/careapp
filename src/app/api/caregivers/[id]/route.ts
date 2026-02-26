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
          u.id, u.name, u.email, u.profileImage, u.verificationStatus,
          p.title, p.bio, p.city, p.services, p.hourlyRateEur, 
          p.averageRating, p.totalReviews, p.totalContracts, 
          p.experienceYears, p.education, p.certifications, p.languages,
          p.availabilityJson, p.availableNow
        FROM User u
        INNER JOIN ProfileCaregiver p ON u.id = p.userId
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
        SELECT r.id, r.rating, r.comment, r.createdAt, u.name as reviewer_name
        FROM Review r
        JOIN User u ON r.fromUserId = u.id
        WHERE r.toUserId = ?
        ORDER BY r.createdAt DESC
        LIMIT 10
      `,
      args: [id]
    });

    const caregiver = {
      id: row.id,
      name: row.name,
      email: row.email,
      profileImage: row.profileImage,
      verificationStatus: row.verificationStatus,
      title: row.title,
      bio: row.bio,
      city: row.city,
      services: row.services ? String(row.services).split(',') : [],
      hourlyRateEur: Number(row.hourlyRateEur) || 0,
      averageRating: Number(row.averageRating) || 0,
      totalReviews: Number(row.totalReviews) || 0,
      totalContracts: Number(row.totalContracts) || 0,
      experienceYears: Number(row.experienceYears) || 0,
      education: row.education,
      certifications: row.certifications ? String(row.certifications).split(',') : [],
      languages: row.languages ? String(row.languages).split(',') : [],
      availability: row.availabilityJson ? JSON.parse(String(row.availabilityJson)) : null,
      availableNow: row.availableNow === 1,
      reviews: reviewsResult.rows.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt,
        reviewerName: r.reviewer_name,
      })),
    };

    return NextResponse.json({ caregiver });
  } catch (error) {
    console.error('Error fetching caregiver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
