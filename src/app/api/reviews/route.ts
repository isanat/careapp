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
        r.contract_id,
        r.from_user_id,
        r.to_user_id,
        r.rating,
        r.comment,
        r.punctuality_rating,
        r.professionalism_rating,
        r.communication_rating,
        r.quality_rating,
        r.is_public,
        r.created_at,
        u.name as reviewer_name,
        u.role as reviewer_role,
        c.title as contract_title
      FROM reviews r
      INNER JOIN users u ON r.from_user_id = u.id
      LEFT JOIN contracts c ON r.contract_id = c.id
      WHERE r.is_public = 1
    `;
    const args: string[] = [];

    if (toUserId) {
      sql += ` AND r.to_user_id = ?`;
      args.push(toUserId);
    }

    if (fromUserId) {
      sql += ` AND r.from_user_id = ?`;
      args.push(fromUserId);
    }

    if (contractId) {
      sql += ` AND r.contract_id = ?`;
      args.push(contractId);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const reviews = result.rows.map(row => ({
      id: row.id,
      contractId: row.contract_id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      rating: row.rating,
      comment: row.comment,
      punctualityRating: row.punctuality_rating,
      professionalismRating: row.professionalism_rating,
      communicationRating: row.communication_rating,
      qualityRating: row.quality_rating,
      isPublic: row.is_public === 1,
      createdAt: row.created_at,
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
      sql: `SELECT family_user_id, caregiver_user_id, status FROM contracts WHERE id = ?`,
      args: [contractId]
    });

    if (contract.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contractData = contract.rows[0];
    
    // Verify user is part of the contract
    if (contractData.family_user_id !== session.user.id && contractData.caregiver_user_id !== session.user.id) {
      return NextResponse.json({ error: 'You can only review contracts you participated in' }, { status: 403 });
    }

    // Verify toUserId is the other party
    const otherUserId = contractData.family_user_id === session.user.id 
      ? contractData.caregiver_user_id 
      : contractData.family_user_id;
    
    if (toUserId !== otherUserId) {
      return NextResponse.json({ error: 'Invalid toUserId for this contract' }, { status: 400 });
    }

    // Check if already reviewed
    const existingReview = await db.execute({
      sql: `SELECT id FROM reviews WHERE contract_id = ? AND from_user_id = ?`,
      args: [contractId, session.user.id]
    });

    if (existingReview.rows.length > 0) {
      return NextResponse.json({ error: 'You have already reviewed this contract' }, { status: 400 });
    }

    const reviewId = `review-${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO reviews (
        id, contract_id, from_user_id, to_user_id, rating, comment,
        punctuality_rating, professionalism_rating, communication_rating, quality_rating,
        is_public, is_moderated, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      args: [
        reviewId, contractId, session.user.id, toUserId, rating, comment || null,
        punctualityRating || null, professionalismRating || null, 
        communicationRating || null, qualityRating || null, now
      ]
    });

    // Update caregiver's average rating if reviewing a caregiver
    const toUser = await db.execute({
      sql: `SELECT role FROM users WHERE id = ?`,
      args: [toUserId]
    });

    if (toUser.rows.length > 0 && toUser.rows[0].role === 'CAREGIVER') {
      // Recalculate average rating
      const stats = await db.execute({
        sql: `SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE to_user_id = ?`,
        args: [toUserId]
      });

      if (stats.rows.length > 0) {
        const avgRating = stats.rows[0].avg_rating || 0;
        const totalReviews = stats.rows[0].total || 0;

        await db.execute({
          sql: `UPDATE profiles_caregiver SET average_rating = ?, total_reviews = ? WHERE user_id = ?`,
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
