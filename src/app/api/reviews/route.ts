import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET: List reviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const toUserId = searchParams.get('toUserId');
    const fromUserId = searchParams.get('fromUserId');
    const contractId = searchParams.get('contractId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let sql = `
      SELECT 
        r.id,
        r.contractId,
        r.fromUserId,
        r.toUserId,
        r.rating,
        r.comment,
        r.punctualityRating,
        r.professionalismRating,
        r.communicationRating,
        r.qualityRating,
        r.isPublic,
        r.createdAt,
        u.name as reviewer_name,
        u.role as reviewer_role,
        c.title as contract_title
      FROM Review r
      INNER JOIN User u ON r.fromUserId = u.id
      LEFT JOIN Contract c ON r.contractId = c.id
      WHERE r.isPublic = 1
    `;
    const args: string[] = [];

    if (toUserId) {
      sql += ` AND r.toUserId = ?`;
      args.push(toUserId);
    }

    if (fromUserId) {
      sql += ` AND r.fromUserId = ?`;
      args.push(fromUserId);
    }

    if (contractId) {
      sql += ` AND r.contractId = ?`;
      args.push(contractId);
    }

    sql += ` ORDER BY r.createdAt DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const reviews = result.rows.map(row => ({
      id: row.id,
      contractId: row.contractId,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      rating: row.rating,
      comment: row.comment,
      punctualityRating: row.punctualityRating,
      professionalismRating: row.professionalismRating,
      communicationRating: row.communicationRating,
      qualityRating: row.qualityRating,
      isPublic: row.isPublic === 1,
      createdAt: row.createdAt,
      reviewer: {
        name: row.reviewer_name,
        role: row.reviewer_role,
      },
      contract: {
        title: row.contract_title,
      },
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      contractId, 
      toUserId, 
      rating, 
      comment, 
      punctualityRating, 
      professionalismRating, 
      communicationRating, 
      qualityRating 
    } = body;

    if (!contractId || !toUserId || !rating) {
      return NextResponse.json({ error: 'contractId, toUserId, and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify contract exists and user is part of it
    const contract = await db.execute({
      sql: `SELECT familyUserId, caregiverUserId, status FROM Contract WHERE id = ?`,
      args: [contractId]
    });

    if (contract.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contractData = contract.rows[0];
    
    // Verify user is part of the contract
    if (contractData.familyUserId !== session.user.id && contractData.caregiverUserId !== session.user.id) {
      return NextResponse.json({ error: 'You can only review contracts you participated in' }, { status: 403 });
    }

    // Verify toUserId is the other party
    const otherUserId = contractData.familyUserId === session.user.id 
      ? contractData.caregiverUserId 
      : contractData.familyUserId;
    
    if (toUserId !== otherUserId) {
      return NextResponse.json({ error: 'Invalid toUserId for this contract' }, { status: 400 });
    }

    // Check if already reviewed
    const existingReview = await db.execute({
      sql: `SELECT id FROM Review WHERE contractId = ? AND fromUserId = ?`,
      args: [contractId, session.user.id]
    });

    if (existingReview.rows.length > 0) {
      return NextResponse.json({ error: 'You have already reviewed this contract' }, { status: 400 });
    }

    const reviewId = `review-${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO Review (
        id, contractId, fromUserId, toUserId, rating, comment,
        punctualityRating, professionalismRating, communicationRating, qualityRating,
        isPublic, isModerated, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      args: [
        reviewId, contractId, session.user.id, toUserId, rating, comment || null,
        punctualityRating || null, professionalismRating || null, 
        communicationRating || null, qualityRating || null, now
      ]
    });

    // Update caregiver's average rating if reviewing a caregiver
    const toUser = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [toUserId]
    });

    if (toUser.rows.length > 0 && toUser.rows[0].role === 'CAREGIVER') {
      // Recalculate average rating
      const stats = await db.execute({
        sql: `SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM Review WHERE toUserId = ?`,
        args: [toUserId]
      });

      if (stats.rows.length > 0) {
        const avgRating = stats.rows[0].avg_rating || 0;
        const totalReviews = stats.rows[0].total || 0;

        await db.execute({
          sql: `UPDATE ProfileCaregiver SET averageRating = ?, totalReviews = ? WHERE userId = ?`,
          args: [avgRating, totalReviews, toUserId]
        });
      }
    }

    return NextResponse.json({ 
      reviewId,
      message: 'Review created successfully' 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
