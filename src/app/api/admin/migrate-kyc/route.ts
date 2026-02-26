import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// This endpoint adds KYC columns to the User table in Turso
// It should be called once after deploying new code with KYC features

export async function POST(request: NextRequest) {
  try {
    // Check for admin secret to prevent unauthorized access
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'idosolink-migrate-2024') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting KYC migration...');

    const results: { step: string; success: boolean; error?: string }[] = [];

    // Step 1: Check if User table exists
    try {
      const tableCheck = await db.execute({
        sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='User'`,
        args: []
      });
      
      if (tableCheck.rows.length === 0) {
        return NextResponse.json({
          error: 'User table not found. Please run base migrations first.',
        }, { status: 500 });
      }
      
      results.push({ step: 'check_user_table', success: true });
    } catch (e) {
      results.push({ step: 'check_user_table', success: false, error: String(e) });
      return NextResponse.json({ results, error: 'User table check failed' }, { status: 500 });
    }

    // Step 2: Get current columns in User table
    let existingColumns: string[] = [];
    try {
      const columnsResult = await db.execute({
        sql: `PRAGMA table_info(User)`,
        args: []
      });
      existingColumns = columnsResult.rows.map((row: any) => row.name as string);
      results.push({ step: 'get_existing_columns', success: true });
    } catch (e) {
      results.push({ step: 'get_existing_columns', success: false, error: String(e) });
      return NextResponse.json({ results, error: 'Failed to get columns' }, { status: 500 });
    }

    console.log('Existing columns:', existingColumns);

    // Step 3: Add missing KYC columns to User table
    const kycColumns = [
      { name: 'kycSessionId', sql: 'ALTER TABLE User ADD COLUMN kycSessionId TEXT' },
      { name: 'kycSessionToken', sql: 'ALTER TABLE User ADD COLUMN kycSessionToken TEXT' },
      { name: 'kycSessionCreatedAt', sql: 'ALTER TABLE User ADD COLUMN kycSessionCreatedAt TEXT' },
      { name: 'kycCompletedAt', sql: 'ALTER TABLE User ADD COLUMN kycCompletedAt TEXT' },
      { name: 'kycConfidence', sql: 'ALTER TABLE User ADD COLUMN kycConfidence INTEGER DEFAULT 0' },
    ];

    for (const col of kycColumns) {
      if (!existingColumns.includes(col.name)) {
        try {
          await db.execute({ sql: col.sql, args: [] });
          results.push({ step: `add_column_${col.name}`, success: true });
          console.log(`Added column: ${col.name}`);
        } catch (e: any) {
          // Column might already exist with different case
          if (e.message?.includes('duplicate column')) {
            results.push({ step: `add_column_${col.name}`, success: true, error: 'Column already exists' });
          } else {
            results.push({ step: `add_column_${col.name}`, success: false, error: String(e) });
          }
        }
      } else {
        results.push({ step: `add_column_${col.name}`, success: true, error: 'Already exists' });
      }
    }

    // Step 4: Add KYC columns to ProfileCaregiver table if it exists
    try {
      const caregiverTableCheck = await db.execute({
        sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='ProfileCaregiver'`,
        args: []
      });
      
      if (caregiverTableCheck.rows.length > 0) {
        const caregiverCols = await db.execute({
          sql: `PRAGMA table_info(ProfileCaregiver)`,
          args: []
        });
        const existingCaregiverCols = caregiverCols.rows.map((row: any) => row.name as string);

        const caregiverKycCols = [
          { name: 'kycSessionId', sql: 'ALTER TABLE ProfileCaregiver ADD COLUMN kycSessionId TEXT' },
          { name: 'kycSessionCreatedAt', sql: 'ALTER TABLE ProfileCaregiver ADD COLUMN kycSessionCreatedAt TEXT' },
          { name: 'kycCompletedAt', sql: 'ALTER TABLE ProfileCaregiver ADD COLUMN kycCompletedAt TEXT' },
          { name: 'kycConfidence', sql: 'ALTER TABLE ProfileCaregiver ADD COLUMN kycConfidence INTEGER DEFAULT 0' },
        ];

        for (const col of caregiverKycCols) {
          if (!existingCaregiverCols.includes(col.name)) {
            try {
              await db.execute({ sql: col.sql, args: [] });
              results.push({ step: `add_caregiver_column_${col.name}`, success: true });
            } catch (e: any) {
              if (e.message?.includes('duplicate column')) {
                results.push({ step: `add_caregiver_column_${col.name}`, success: true, error: 'Already exists' });
              } else {
                results.push({ step: `add_caregiver_column_${col.name}`, success: false, error: String(e) });
              }
            }
          } else {
            results.push({ step: `add_caregiver_column_${col.name}`, success: true, error: 'Already exists' });
          }
        }
      }
    } catch (e) {
      results.push({ step: 'caregiver_table_check', success: false, error: String(e) });
    }

    // Step 5: Verify final state
    try {
      const finalColumns = await db.execute({
        sql: `PRAGMA table_info(User)`,
        args: []
      });
      const finalColNames = finalColumns.rows.map((row: any) => row.name as string);
      results.push({ step: 'verify_columns', success: true });
      
      return NextResponse.json({
        success: true,
        message: 'KYC migration completed',
        results,
        userColumns: finalColNames,
      });
    } catch (e) {
      results.push({ step: 'verify_columns', success: false, error: String(e) });
      return NextResponse.json({ results }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET to check current migration status
export async function GET(request: NextRequest) {
  try {
    const userColumns = await db.execute({
      sql: `PRAGMA table_info(User)`,
      args: []
    });
    
    const columns = userColumns.rows.map((row: any) => ({
      name: row.name,
      type: row.type,
      notnull: row.notnull,
      defaultValue: row.dflt_value,
    }));

    const kycColumns = ['kycSessionId', 'kycSessionToken', 'kycSessionCreatedAt', 'kycCompletedAt', 'kycConfidence'];
    const existingKycCols = columns.filter((c: any) => kycColumns.includes(c.name));

    return NextResponse.json({
      table: 'User',
      totalColumns: columns.length,
      kycColumns: existingKycCols,
      hasAllKycColumns: kycColumns.every(name => columns.some((c: any) => c.name === name)),
      allColumns: columns.map((c: any) => c.name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check migration status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
