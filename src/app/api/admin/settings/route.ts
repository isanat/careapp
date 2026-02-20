import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Platform settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT * FROM PlatformSettings LIMIT 1`,
      args: []
    });

    const settings = result.rows[0] || {
      activationCostEurCents: 3500,
      contractFeeEurCents: 500,
      platformFeePercent: 15,
      tokenPriceEurCents: 1,
      totalTokensMinted: 0,
      totalTokensBurned: 0,
      totalReserveEurCents: 0,
    };

    // Get feature flags
    const flagsResult = await db.execute({
      sql: `SELECT * FROM FeatureFlag`,
      args: []
    });

    return NextResponse.json({
      settings,
      featureFlags: flagsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activationCostEurCents, contractFeeEurCents, platformFeePercent, tokenPriceEurCents } = body;

    // Check if settings exist
    const existingResult = await db.execute({
      sql: `SELECT id FROM PlatformSettings LIMIT 1`,
      args: []
    });

    if (existingResult.rows.length === 0) {
      // Create default settings
      await db.execute({
        sql: `INSERT INTO PlatformSettings (id, activationCostEurCents, contractFeeEurCents, platformFeePercent, tokenPriceEurCents)
          VALUES ('settings-default', ?, ?, ?, ?)`,
        args: [activationCostEurCents || 3500, contractFeeEurCents || 500, platformFeePercent || 15, tokenPriceEurCents || 1]
      });
    } else {
      // Update existing settings
      const updates: string[] = [];
      const args: any[] = [];

      if (activationCostEurCents !== undefined) {
        updates.push('activationCostEurCents = ?');
        args.push(activationCostEurCents);
      }
      if (contractFeeEurCents !== undefined) {
        updates.push('contractFeeEurCents = ?');
        args.push(contractFeeEurCents);
      }
      if (platformFeePercent !== undefined) {
        updates.push('platformFeePercent = ?');
        args.push(platformFeePercent);
      }
      if (tokenPriceEurCents !== undefined) {
        updates.push('tokenPriceEurCents = ?');
        args.push(tokenPriceEurCents);
      }

      if (updates.length > 0) {
        updates.push('updatedAt = CURRENT_TIMESTAMP');
        args.push(existingResult.rows[0].id);
        
        await db.execute({
          sql: `UPDATE PlatformSettings SET ${updates.join(', ')} WHERE id = ?`,
          args
        });
      }
    }

    // Log admin action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, newValue, createdAt)
        VALUES (?, ?, 'UPDATE_SETTINGS', 'PLATFORM', ?, ?)`,
      args: [`action-${Date.now()}`, session.user.id, JSON.stringify(body), new Date().toISOString()]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
