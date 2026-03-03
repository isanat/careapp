import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// GET - Get caregiver details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

    const { id } = await params;

    const result = await db.execute({
      sql: `
        SELECT 
          u.*,
          pc.title, pc.bio, pc.city, pc.address, pc.postalCode, pc.country,
          pc.latitude, pc.longitude, pc.radiusKm,
          pc.services, pc.hourlyRateEur, pc.minimumHours,
          pc.experienceYears, pc.education, pc.certifications, pc.languages,
          pc.availabilityJson, pc.availableNow, pc.featured,
          pc.documentType, pc.documentNumber, pc.documentVerified,
          pc.backgroundCheckStatus, pc.totalContracts, pc.totalHoursWorked,
          pc.averageRating, pc.totalReviews,
          pc.kycSessionId, pc.kycSessionCreatedAt, pc.kycCompletedAt, pc.kycConfidence,
          w.address as walletAddress, w.balanceTokens, w.balanceEurCents
        FROM User u
        JOIN ProfileCaregiver pc ON u.id = pc.userId
        LEFT JOIN Wallet w ON u.id = w.userId
        WHERE u.id = ? AND u.role = 'CAREGIVER'
      `,
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    // Get reviews
    const reviews = await db.execute({
      sql: `
        SELECT r.*, u.name as fromUserName
        FROM Review r
        JOIN User u ON r.fromUserId = u.id
        WHERE r.toUserId = ?
        ORDER BY r.createdAt DESC
        LIMIT 10
      `,
      args: [id]
    });

    // Get contracts
    const contracts = await db.execute({
      sql: `
        SELECT c.*, u.name as familyName
        FROM Contract c
        JOIN User u ON c.familyUserId = u.id
        WHERE c.caregiverUserId = ?
        ORDER BY c.createdAt DESC
        LIMIT 10
      `,
      args: [id]
    });

    return NextResponse.json({
      ...result.rows[0],
      reviews: reviews.rows,
      contracts: contracts.rows
    });
  } catch (error) {
    console.error('Error fetching caregiver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
