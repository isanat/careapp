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
          r.id, r.contract_id, r.from_user_id, r.to_user_id, 
          r.rating, r.comment, r.punctuality_rating, r.professionalism_rating,
          r.communication_rating, r.quality_rating, r.is_public, r.is_moderated,
          r.created_at, r.updated_at,
          u_from.name as from_user_name,
          u_from.profile_image as from_user_profile_image,
          u_to.name as to_user_name,
          u_to.profile_image as to_user_profile_image,
          c.title as contract_title
        FROM reviews r
        LEFT JOIN users u_from ON r.from_user_id = u_from.id
        LEFT JOIN users u_to ON r.to_user_id = u_to.id
        LEFT JOIN contracts c ON r.contract_id = c.id
        WHERE r.id = ?
      `,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Check visibility permissions
    const isPublic = row.is_public === 1;
    const isAuthor = row.from_user_id === session.user.id;
    const isReviewedUser = row.to_user_id === session.user.id;

    if (!isPublic && !isAuthor && !isReviewedUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const review: ReviewData = {
      id: row.id as string,
      contractId: row.contract_id as string,
      fromUserId: row.from_user_id as string,
      toUserId: row.to_user_id as string,
      rating: row.rating as number,
      comment: row.comment as string | null,
      punctualityRating: row.punctuality_rating as number | null,
      professionalismRating: row.professionalism_rating as number | null,
      communicationRating: row.communication_rating as number | null,
      qualityRating: row.quality_rating as number | null,
      isPublic: row.is_public === 1,
      isModerated: row.is_moderated === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      fromUserName: row.from_user_name as string | undefined,
      toUserName: row.to_user_name as string | undefined,
      fromUserProfileImage: row.from_user_profile_image as string | undefined,
      toUserProfileImage: row.to_user_profile_image as string | undefined,
      contractTitle: row.contract_title as string | undefined,
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
 * - punctuality_rating: number 1-5 (optional)
 * - professionalism_rating: number 1-5 (optional)
 * - communication_rating: number 1-5 (optional)
 * - quality_rating: number 1-5 (optional)
 * - is_public: boolean (optional)
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
      punctuality_rating,
      professionalism_rating,
      communication_rating,
      quality_rating,
      is_public,
    } = body;

    // Get the review and verify ownership
    const reviewResult = await db.execute({
      sql: `SELECT id, from_user_id, to_user_id FROM reviews WHERE id = ?`,
      args: [id],
    });

    if (reviewResult.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviewResult.rows[0];

    // Only the author can update the review
    if (review.from_user_id !== session.user.id) {
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

    const optionalRatings = [punctuality_rating, professionalism_rating, communication_rating, quality_rating];
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

    if (punctuality_rating !== undefined) {
      updates.push('punctuality_rating = ?');
      args.push(punctuality_rating || null);
    }

    if (professionalism_rating !== undefined) {
      updates.push('professionalism_rating = ?');
      args.push(professionalism_rating || null);
    }

    if (communication_rating !== undefined) {
      updates.push('communication_rating = ?');
      args.push(communication_rating || null);
    }

    if (quality_rating !== undefined) {
      updates.push('quality_rating = ?');
      args.push(quality_rating || null);
    }

    if (is_public !== undefined) {
      updates.push('is_public = ?');
      args.push(is_public ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ 
        error: 'No fields to update' 
      }, { status: 400 });
    }

    // Add updated_at
    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    args.push(now);

    // Add the review id to args
    args.push(id);

    await db.execute({
      sql: `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    // Update the average rating for the reviewed user
    const toUserId = review.to_user_id as string;
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
      sql: `SELECT id, from_user_id, to_user_id FROM reviews WHERE id = ?`,
      args: [id],
    });

    if (reviewResult.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviewResult.rows[0];

    // Only the author can delete the review
    if (review.from_user_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the author can delete this review' 
      }, { status: 403 });
    }

    const toUserId = review.to_user_id as string;

    // Delete the review
    await db.execute({
      sql: `DELETE FROM reviews WHERE id = ?`,
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
      sql: `SELECT rating FROM reviews WHERE to_user_id = ?`,
      args: [userId],
    });

    // Update the caregiver profile
    if (result.rows.length === 0) {
      // No reviews, reset to 0
      await db.execute({
        sql: `UPDATE profiles_caregiver 
              SET average_rating = 0, total_reviews = 0, updated_at = ? 
              WHERE user_id = ?`,
        args: [new Date().toISOString(), userId],
      });
    } else {
      // Calculate average rating
      const ratings = result.rows.map(row => row.rating as number);
      const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

      await db.execute({
        sql: `UPDATE profiles_caregiver 
              SET average_rating = ?, total_reviews = ?, updated_at = ? 
              WHERE user_id = ?`,
        args: [averageRating, ratings.length, new Date().toISOString(), userId],
      });
    }
  } catch (error) {
    console.error('Error updating user average rating:', error);
  }
}
