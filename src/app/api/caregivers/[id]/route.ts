import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;

    const result = await db.execute({
      sql: `
        SELECT
          u.id, u.name, u.email, u.phone, u.profileImage, u.verificationStatus,
          u.backgroundCheckStatus,
          p.title, p.bio, p.city, p.services, p.hourlyRateEur,
          p.averageRating, p.totalReviews, p.totalContracts,
          p.experienceYears, p.education, p.certifications, p.languages,
          p.availabilityJson, p.availableNow, p.verificationStatus as caregiverVerification,
          p.totalHoursWorked
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

    // Check if viewer has an active contract with this caregiver
    let hasActiveContract = false;
    if (viewerId) {
      const contractCheck = await db.execute({
        sql: `SELECT id FROM Contract
              WHERE familyUserId = ? AND caregiverUserId = ?
              AND status IN ('ACTIVE', 'COMPLETED')
              LIMIT 1`,
        args: [viewerId, id]
      });
      hasActiveContract = contractCheck.rows.length > 0;
    }

    const reviewsResult = await db.execute({
      sql: `
        SELECT r.id, r.rating, r.comment, r.punctualityRating, r.professionalismRating,
               r.communicationRating, r.qualityRating, r.createdAt, u.name as reviewer_name
        FROM Review r
        JOIN User u ON r.fromUserId = u.id
        WHERE r.toUserId = ? AND r.isPublic = 1
        ORDER BY r.createdAt DESC
        LIMIT 10
      `,
      args: [id]
    });

    // Build trust badges
    const badges: string[] = [];
    if (row.verificationStatus === 'VERIFIED') badges.push('IDENTITY_VERIFIED');
    if (row.backgroundCheckStatus === 'VERIFIED') badges.push('BACKGROUND_CHECKED');
    if (row.caregiverVerification === 'VERIFIED') badges.push('PROFILE_VERIFIED');
    if (Number(row.totalContracts) >= 5) badges.push('EXPERIENCED');
    if (Number(row.averageRating) >= 4.5 && Number(row.totalReviews) >= 3) badges.push('TOP_RATED');
    if (Number(row.totalHoursWorked) >= 100) badges.push('DEDICATED');

    const caregiver = {
      id: row.id,
      name: row.name,
      // Only show contact info if there's an active contract
      email: hasActiveContract ? row.email : undefined,
      phone: hasActiveContract ? row.phone : undefined,
      profileImage: row.profileImage,
      verificationStatus: row.verificationStatus,
      title: row.title,
      bio: row.bio,
      city: row.city,
      services: row.services ? (() => { try { return JSON.parse(String(row.services)); } catch { return String(row.services).split(',').filter(Boolean); } })() : [],
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
      hasActiveContract,
      badges,
      reviews: reviewsResult.rows.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        punctualityRating: r.punctualityRating,
        professionalismRating: r.professionalismRating,
        communicationRating: r.communicationRating,
        qualityRating: r.qualityRating,
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
