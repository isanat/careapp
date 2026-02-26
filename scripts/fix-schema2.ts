import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function fixSchema() {
  console.log('🔧 Adding all missing columns...\n');

  const columns = [
    // profiles_caregiver
    "ALTER TABLE profiles_caregiver ADD COLUMN updated_at TEXT",
    "ALTER TABLE profiles_caregiver ADD COLUMN available_now INTEGER DEFAULT 0",
    
    // profiles_family
    "ALTER TABLE profiles_family ADD COLUMN updated_at TEXT",
    "ALTER TABLE profiles_family ADD COLUMN elder_needs TEXT",
    "ALTER TABLE profiles_family ADD COLUMN emergency_contact_name TEXT",
    "ALTER TABLE profiles_family ADD COLUMN emergency_contact_phone TEXT",
    
    // contracts
    "ALTER TABLE contracts ADD COLUMN updated_at TEXT",
    "ALTER TABLE contracts ADD COLUMN platform_fee_pct INTEGER DEFAULT 10",
    "ALTER TABLE contracts ADD COLUMN service_types TEXT",
    "ALTER TABLE contracts ADD COLUMN hours_per_week INTEGER",
    
    // reviews
    "ALTER TABLE reviews ADD COLUMN updated_at TEXT",
  ];

  for (const sql of columns) {
    try {
      await db.execute(sql);
      const colMatch = sql.match(/ADD COLUMN (\w+)/);
      console.log(`  ✅ Added: ${colMatch?.[1] || 'column'}`);
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        const colMatch = sql.match(/ADD COLUMN (\w+)/);
        console.log(`  ℹ️ Already exists: ${colMatch?.[1]}`);
      } else {
        console.log(`  ⚠️ ${e.message}`);
      }
    }
  }

  console.log('\n✅ Schema updated!');
}

fixSchema().catch(console.error);
