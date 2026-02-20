import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Types for the review data
interface ReviewData {
  id: string;
  contractId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string | null;
  punctualityRating: number | null;
  professionalismRating: number | null;
  communicationRating: number | null;
  qualityRating: number | null;
  isPublic: boolean;
  isModerated: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined data
  fromUserName?: string;
  toUserName?: string;
  fromUserProfileImage?: string;
  toUserProfileImage?: string;
  contractTitle?: string;
}

/**
 * GET /api/reviews/[id]
 * Get a single review by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await db.execute({
      sql: `
        SELECT 
          r.id, r.contractId, r.fromUserId, r.toUserId, 
          r.rating, r.comment, r.punctualityRating, r.professionalismRating,
          r.communicationRating, r.qualityRating, r.isPublic, r.isModerated,
          r.createdAt, r.updatedAt,
          u_from.name as fromUserName,
          u_from.profileImage as fromUserProfileImage,
          u_to.name as toUserName,
          u_to.profileImage as toUserProfileImage,
          c.title as contractTitle
        FROM Review r
        LEFT JOIN User u_from ON r.fromUserId = u_from.id
        LEFT JOIN User u_to ON r.toUserId = u_to.id
        LEFT JOIN Contract c ON r.contractId = c.id
        WHERE r.id = ?
      `,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Check visibility permissions
    const isPublic = row.isPublic === 1;
    const isAuthor = row.fromUserId === session.user.id;
    const isReviewedUser = row.toUserId === session.user.id;

    if (!isPublic && !isAuthor && !isReviewedUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const review: ReviewData = {
      id: row.id as string,
      contractId: row.contractId as string,
      fromUserId: row.fromUserId as string,
      toUserId: row.toUserId as string,
      rating: row.rating as number,
      comment: row.comment as string | null,
      punctualityRating: row.punctualityRating as number | null,
      professionalismRating: row.professionalismRating as number | null,
      communicationRating: row.communicationRating as number | null,
      qualityRating: row.qualityRating as number | null,
      isPublic: row.isPublic === 1,
      isModerated: row.isModerated === 1,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      fromUserName: row.fromUserName as string | undefined,
      toUserName: row.toUserName as string | undefined,
      fromUserProfileImage: row.fromUserProfileImage as string | undefined,
      toUserProfileImage: row.toUserProfileImage as string | undefined,
      contractTitle: row.contractTitle as string | undefined,
    };

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/reviews/[id]
 * Update a review (only by author)
 * Body:
 * - rating: number 1-5 (optional)
 * - comment: string (optional)
 * - punctualityRating: number 1-5 (optional)
 * - professionalismRating: number 1-5 (optional)
 * - communicationRating: number 1-5 (optional)
 * - qualityRating: number 1-5 (optional)
 * - isPublic: boolean (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      rating,
      comment,
      punctualityRating,
      professionalismRating,
      communicationRating,
      qualityRating,
      isPublic,
    } = body;

    // Get the review and verify ownership
    const reviewResult = await db.execute({
      sql: `SELECT id, fromUserId, toUserId FROM Review WHERE id = ?`,
      args: [id],
    });

    if (reviewResult.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviewResult.rows[0];

    // Only the author can update the review
    if (review.fromUserId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the author can update this review' 
      }, { status: 403 });
    }

    // Validate ratings if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    const optionalRatings = [punctualityRating, professionalismRating, communicationRating, qualityRating];
    for (const optRating of optionalRatings) {
      if (optRating !== undefined && optRating !== null && (optRating < 1 || optRating > 5)) {
        return NextResponse.json({ 
          error: 'All ratings must be between 1 and 5' 
        }, { status: 400 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    if (rating !== undefined) {
      updates.push('rating = ?');
      args.push(rating);
    }

    if (comment !== undefined) {
      updates.push('comment = ?');
      args.push(comment || null);
    }

    if (punctualityRating !== undefined) {
      updates.push('punctualityRating = ?');
      args.push(punctualityRating || null);
    }

    if (professionalismRating !== undefined) {
      updates.push('professionalismRating = ?');
      args.push(professionalismRating || null);
    }

    if (communicationRating !== undefined) {
      updates.push('communicationRating = ?');
      args.push(communicationRating || null);
    }

    if (qualityRating !== undefined) {
      updates.push('qualityRating = ?');
      args.push(qualityRating || null);
    }

    if (isPublic !== undefined) {
      updates.push('isPublic = ?');
      args.push(isPublic ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ 
        error: 'No fields to update' 
      }, { status: 400 });
    }

    // Add updatedAt
    const now = new Date().toISOString();
    updates.push('updatedAt = ?');
    args.push(now);

    // Add the review id to args
    args.push(id);

    await db.execute({
      sql: `UPDATE Review SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    // Update the average rating for the reviewed user
    const toUserId = review.toUserId as string;
    await updateUserAverageRating(toUserId);

    return NextResponse.json({ 
      success: true, 
      message: 'Review updated successfully' 
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/reviews/[id]
 * Delete a review (only by author)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the review and verify ownership
    const reviewResult = await db.execute({
      sql: `SELECT id, fromUserId, toUserId FROM Review WHERE id = ?`,
      args: [id],
    });

    if (reviewResult.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviewResult.rows[0];

    // Only the author can delete the review
    if (review.fromUserId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the author can delete this review' 
      }, { status: 403 });
    }

    const toUserId = review.toUserId as string;

    // Delete the review
    await db.execute({
      sql: `DELETE FROM Review WHERE id = ?`,
      args: [id],
    });

    // Update the average rating for the reviewed user
    await updateUserAverageRating(toUserId);

    return NextResponse.json({ 
      success: true, 
      message: 'Review deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update the average rating for a user (caregiver)
 */
async function updateUserAverageRating(userId: string) {
  try {
    // Get all reviews for this user
    const result = await db.execute({
      sql: `SELECT rating FROM Review WHERE toUserId = ?`,
      args: [userId],
    });

    // Update the caregiver profile
    if (result.rows.length === 0) {
      // No reviews, reset to 0
      await db.execute({
        sql: `UPDATE ProfileCaregiver 
              SET averageRating = 0, totalReviews = 0, updatedAt = ? 
              WHERE userId = ?`,
        args: [new Date().toISOString(), userId],
      });
    } else {
      // Calculate average rating
      const ratings = result.rows.map(row => row.rating as number);
      const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

      await db.execute({
        sql: `UPDATE ProfileCaregiver 
              SET averageRating = ?, totalReviews = ?, updatedAt = ? 
              WHERE userId = ?`,
        args: [averageRating, ratings.length, new Date().toISOString(), userId],
      });
    }
  } catch (error) {
    console.error('Error updating user average rating:', error);
  }
}
