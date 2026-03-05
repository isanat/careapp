import { type Client } from '@libsql/client';

// Auto-migration: runs CREATE TABLE IF NOT EXISTS on startup
// Safe to run multiple times - only creates tables that don't exist
export async function runAutoMigrations(db: Client) {
  try {
    const migrations = [
      // Receipt table
      `CREATE TABLE IF NOT EXISTS Receipt (
        id TEXT PRIMARY KEY,
        contractId TEXT NOT NULL,
        familyUserId TEXT NOT NULL,
        caregiverUserId TEXT NOT NULL,
        receiptNumber TEXT UNIQUE NOT NULL,
        periodStart TEXT NOT NULL,
        periodEnd TEXT NOT NULL,
        hoursWorked INTEGER NOT NULL,
        hourlyRateEurCents INTEGER NOT NULL,
        totalAmountCents INTEGER NOT NULL,
        platformFeeCents INTEGER NOT NULL,
        caregiverAmountCents INTEGER NOT NULL,
        familyNif TEXT,
        caregiverNif TEXT,
        status TEXT DEFAULT 'GENERATED',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Receipt indexes
      `CREATE INDEX IF NOT EXISTS idx_receipt_contract ON Receipt(contractId)`,
      `CREATE INDEX IF NOT EXISTS idx_receipt_family ON Receipt(familyUserId, createdAt)`,
      `CREATE INDEX IF NOT EXISTS idx_receipt_caregiver ON Receipt(caregiverUserId, createdAt)`,

      // RecurringPayment table
      `CREATE TABLE IF NOT EXISTS RecurringPayment (
        id TEXT PRIMARY KEY,
        contractId TEXT NOT NULL,
        familyUserId TEXT NOT NULL,
        caregiverUserId TEXT NOT NULL,
        amountCents INTEGER NOT NULL,
        platformFeeCents INTEGER NOT NULL,
        caregiverAmountCents INTEGER NOT NULL,
        billingDay INTEGER DEFAULT 1,
        periodStart TEXT NOT NULL,
        periodEnd TEXT,
        status TEXT DEFAULT 'ACTIVE',
        lastPaymentAt TEXT,
        nextPaymentAt TEXT,
        failedAttempts INTEGER DEFAULT 0,
        stripeSubscriptionId TEXT,
        stripeCustomerId TEXT,
        stripePriceId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // RecurringPayment indexes
      `CREATE INDEX IF NOT EXISTS idx_rp_contract ON RecurringPayment(contractId)`,
      `CREATE INDEX IF NOT EXISTS idx_rp_status ON RecurringPayment(status, nextPaymentAt)`,
    ];

    // ALTER TABLE migrations - these may fail if column already exists, that's OK
    const alterMigrations = [
      `ALTER TABLE Interview ADD COLUMN caregiverQuestionnaireJson TEXT`,
      `ALTER TABLE Interview ADD COLUMN caregiverCompletedAt TEXT`,
    ];

    for (const sql of migrations) {
      await db.execute({ sql, args: [] });
    }

    for (const sql of alterMigrations) {
      try {
        await db.execute({ sql, args: [] });
      } catch {
        // Column already exists - expected
      }
    }

    console.log('[DB] Auto-migrations completed successfully');
  } catch (error) {
    console.error('[DB] Auto-migration error:', error);
    // Don't throw - app should still work even if migration fails
    // (tables may already exist from previous deploy)
  }
}
