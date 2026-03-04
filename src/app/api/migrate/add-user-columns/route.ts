import { NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Temporary migration endpoint - DELETE after running
// POST /api/migrate/add-user-columns
export async function POST() {
  const results: string[] = [];

  const columns = [
    { name: 'nif', def: 'TEXT' },
    { name: 'documentType', def: 'TEXT' },
    { name: 'documentNumber', def: 'TEXT' },
    { name: 'backgroundCheckStatus', def: "TEXT DEFAULT 'PENDING'" },
    { name: 'backgroundCheckUrl', def: 'TEXT' },
  ];

  for (const col of columns) {
    try {
      await db.execute({
        sql: `ALTER TABLE User ADD COLUMN ${col.name} ${col.def}`,
        args: [],
      });
      results.push(`✅ Added column: ${col.name}`);
    } catch (e: any) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        results.push(`⏭️ Column already exists: ${col.name}`);
      } else {
        results.push(`❌ Error adding ${col.name}: ${e.message}`);
      }
    }
  }

  // Verify columns exist
  try {
    const check = await db.execute({
      sql: `SELECT nif, documentType, documentNumber, backgroundCheckStatus, backgroundCheckUrl FROM User LIMIT 1`,
      args: [],
    });
    results.push(`✅ Verification: all columns accessible`);
  } catch (e: any) {
    results.push(`❌ Verification failed: ${e.message}`);
  }

  return NextResponse.json({ results });
}
