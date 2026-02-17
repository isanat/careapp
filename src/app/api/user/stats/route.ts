import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const isCaregiver = session.user.role === 'CAREGIVER';

    // Get wallet balance
    const walletResult = await db.execute({
      sql: `SELECT balance_tokens FROM wallets WHERE user_id = ?`,
      args: [userId]
    });
    
    const balanceTokens = walletResult.rows.length > 0 
      ? Number(walletResult.rows[0].balance_tokens) || 0 
      : 0;

    // Get contracts count
    const contractsResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM contracts 
            WHERE ${isCaregiver ? 'caregiver_user_id' : 'family_user_id'} = ? 
            AND status = 'ACTIVE'`,
      args: [userId]
    });
    
    const activeContracts = contractsResult.rows.length > 0 
      ? Number(contractsResult.rows[0].count) || 0 
      : 0;

    // Get caregiver-specific stats
    let stats: Record<string, any> = {
      tokenBalance: balanceTokens,
      tokenValueEur: balanceTokens * 0.01,
      activeContracts,
    };

    if (isCaregiver) {
      // Get caregiver profile stats
      const profileResult = await db.execute({
        sql: `SELECT average_rating, total_reviews, total_hours_worked 
              FROM profiles_caregiver WHERE user_id = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        stats.rating = Number(profile.average_rating) || 0;
        stats.totalReviews = Number(profile.total_reviews) || 0;
        stats.totalHours = Number(profile.total_hours_worked) || 0;
      } else {
        stats.rating = 0;
        stats.totalReviews = 0;
        stats.totalHours = 0;
      }
    } else {
      // For family users
      stats.totalHours = activeContracts * 20; // Estimate
    }

    // Get recent activity
    const activityResult = await db.execute({
      sql: `SELECT type, reason, amount_tokens, created_at 
            FROM token_ledger 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5`,
      args: [userId]
    });

    const recentActivity = activityResult.rows.map(tx => ({
      type: tx.type,
      description: tx.reason,
      amount: Number(tx.amount_tokens) || 0,
      date: tx.created_at,
    }));

    return NextResponse.json({
      stats,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
