import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';
import { adminSettingsSchema } from '@/lib/validations/schemas';

// GET - Platform settings
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const result = await db.execute({
      sql: `SELECT * FROM PlatformSettings LIMIT 1`,
      args: []
    });

    const settings = result.rows[0] || {
      activationCostEurCents: 3500,
      contractFeeEurCents: 500,
      platformFeePercent: 15,
    };

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const body = await request.json();
    const parsed = adminSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { activationCostEurCents, contractFeeEurCents, platformFeePercent } = parsed.data;

    // Check if settings exist
    const existingResult = await db.execute({
      sql: `SELECT id FROM PlatformSettings LIMIT 1`,
      args: []
    });

    if (existingResult.rows.length === 0) {
      // Create default settings
      await db.execute({
        sql: `INSERT INTO PlatformSettings (id, activationCostEurCents, contractFeeEurCents, platformFeePercent, updatedAt)
          VALUES ('platform-settings-v1', ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [activationCostEurCents || 3500, contractFeeEurCents || 500, platformFeePercent || 15]
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
      args: [generateId("action"), adminUserId, JSON.stringify(body), new Date().toISOString()]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
