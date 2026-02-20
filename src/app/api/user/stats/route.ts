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

    // Get user status
    const userResult = await db.execute({
      sql: `SELECT status, verificationStatus FROM User WHERE id = ?`,
      args: [userId]
    });

    const userStatus = userResult.rows.length > 0 ? {
      status: userResult.rows[0].status,
      verificationStatus: userResult.rows[0].verificationStatus,
    } : null;

    // Get wallet balance
    const walletResult = await db.execute({
      sql: `SELECT balanceTokens, id FROM Wallet WHERE userId = ?`,
      args: [userId]
    });
    
    const balanceTokens = walletResult.rows.length > 0 
      ? Number(walletResult.rows[0].balanceTokens) || 0 
      : 0;

    const hasWallet = walletResult.rows.length > 0;

    // Check if profile is complete
    let profileComplete = false;
    if (isCaregiver) {
      const profileResult = await db.execute({
        sql: `SELECT title, bio, city, services FROM ProfileCaregiver WHERE userId = ?`,
        args: [userId]
      });
      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        profileComplete = !!(profile.title && profile.bio && profile.city && profile.services);
      }
    } else {
      const profileResult = await db.execute({
        sql: `SELECT elderName, city FROM ProfileFamily WHERE userId = ?`,
        args: [userId]
      });
      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        profileComplete = !!(profile.elderName && profile.city);
      }
    }

    // Get contracts count
    const contractsResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM Contract 
            WHERE ${isCaregiver ? 'caregiverUserId' : 'familyUserId'} = ? 
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
        sql: `SELECT averageRating, totalReviews, totalHoursWorked 
              FROM ProfileCaregiver WHERE userId = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        stats.rating = Number(profile.averageRating) || 0;
        stats.totalReviews = Number(profile.totalReviews) || 0;
        stats.totalHours = Number(profile.totalHoursWorked) || 0;
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
      sql: `SELECT type, reason, amountTokens, createdAt 
            FROM TokenLedger 
            WHERE userId = ? 
            ORDER BY createdAt DESC 
            LIMIT 5`,
      args: [userId]
    });

    const recentActivity = activityResult.rows.map(tx => ({
      type: tx.type,
      description: tx.reason,
      amount: Number(tx.amountTokens) || 0,
      date: tx.createdAt,
    }));

    return NextResponse.json({
      stats,
      recentActivity,
      userStatus: {
        ...userStatus,
        hasWallet,
        profileComplete,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
