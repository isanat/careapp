import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function fixSchema() {
  console.log('🔧 Adding missing columns...\n');

  // Add missing columns to profiles_caregiver
  const cgColumns = [
    "ALTER TABLE profiles_caregiver ADD COLUMN verification_status TEXT DEFAULT 'UNVERIFIED'",
    "ALTER TABLE profiles_caregiver ADD COLUMN document_verified INTEGER DEFAULT 0",
    "ALTER TABLE profiles_caregiver ADD COLUMN available_now INTEGER DEFAULT 0",
    "ALTER TABLE profiles_caregiver ADD COLUMN education TEXT",
    "ALTER TABLE profiles_caregiver ADD COLUMN certifications TEXT",
    "ALTER TABLE profiles_caregiver ADD COLUMN languages TEXT",
  ];

  for (const sql of cgColumns) {
    try {
      await db.execute(sql);
      console.log(`  ✅ ${sql.split('ADD COLUMN')[1]?.split(' ')[1] || 'column'}`);
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log(`  ℹ️ Column already exists`);
      } else {
        console.log(`  ⚠️ ${e.message}`);
      }
    }
  }

  // Add missing columns to profiles_family
  const fmColumns = [
    "ALTER TABLE profiles_family ADD COLUMN elder_needs TEXT",
    "ALTER TABLE profiles_family ADD COLUMN emergency_contact_name TEXT",
    "ALTER TABLE profiles_family ADD COLUMN emergency_contact_phone TEXT",
  ];

  for (const sql of fmColumns) {
    try {
      await db.execute(sql);
      console.log(`  ✅ ${sql.split('ADD COLUMN')[1]?.split(' ')[1] || 'column'}`);
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log(`  ℹ️ Column already exists`);
      } else {
        console.log(`  ⚠️ ${e.message}`);
      }
    }
  }

  console.log('\n✅ Schema updated!');
}

fixSchema().catch(console.error);
