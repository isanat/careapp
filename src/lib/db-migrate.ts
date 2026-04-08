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

      // Demand table (Marketplace)
      `CREATE TABLE IF NOT EXISTS Demand (
        id TEXT PRIMARY KEY,
        familyUserId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        serviceTypes TEXT NOT NULL,
        address TEXT,
        city TEXT NOT NULL,
        postalCode TEXT,
        country TEXT DEFAULT 'PT',
        latitude REAL,
        longitude REAL,
        requiredExperienceLevel TEXT DEFAULT 'INTERMEDIATE',
        requiredCertifications TEXT,
        careType TEXT DEFAULT 'RECURRING',
        desiredStartDate TEXT,
        desiredEndDate TEXT,
        hoursPerWeek INTEGER,
        scheduleJson TEXT,
        budgetEurCents INTEGER,
        minimumHourlyRateEur INTEGER,
        visibilityPackage TEXT DEFAULT 'NONE',
        visibilityExpiresAt TEXT,
        status TEXT DEFAULT 'ACTIVE',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        closedAt TEXT,
        closedReason TEXT,
        deletedAt TEXT,
        deletionReason TEXT,
        FOREIGN KEY (familyUserId) REFERENCES User(id) ON DELETE CASCADE
      )`,

      `CREATE INDEX IF NOT EXISTS idx_demand_family ON Demand(familyUserId, status, createdAt)`,
      `CREATE INDEX IF NOT EXISTS idx_demand_status ON Demand(status, visibilityPackage, visibilityExpiresAt)`,
      `CREATE INDEX IF NOT EXISTS idx_demand_city ON Demand(city, status)`,
      `CREATE INDEX IF NOT EXISTS idx_demand_created ON Demand(createdAt)`,

      // DemandView table (track views - one per caregiver per day)
      `CREATE TABLE IF NOT EXISTS DemandView (
        id TEXT PRIMARY KEY,
        demandId TEXT NOT NULL,
        caregiverId TEXT NOT NULL,
        viewedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (demandId) REFERENCES Demand(id) ON DELETE CASCADE,
        FOREIGN KEY (caregiverId) REFERENCES User(id) ON DELETE CASCADE,
        UNIQUE(demandId, caregiverId)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_demandview_demand ON DemandView(demandId, viewedAt)`,
      `CREATE INDEX IF NOT EXISTS idx_demandview_caregiver ON DemandView(caregiverId, viewedAt)`,

      // VisibilityPurchase table
      `CREATE TABLE IF NOT EXISTS VisibilityPurchase (
        id TEXT PRIMARY KEY,
        demandId TEXT NOT NULL,
        familyUserId TEXT NOT NULL,
        package TEXT NOT NULL,
        amountEurCents INTEGER NOT NULL,
        stripePaymentIntentId TEXT,
        stripeCheckoutSessionId TEXT,
        status TEXT DEFAULT 'PENDING',
        purchasedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        expiresAt TEXT NOT NULL,
        completedAt TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (demandId) REFERENCES Demand(id) ON DELETE CASCADE
      )`,

      `CREATE INDEX IF NOT EXISTS idx_visibility_demand ON VisibilityPurchase(demandId, status)`,
      `CREATE INDEX IF NOT EXISTS idx_visibility_family ON VisibilityPurchase(familyUserId, createdAt)`,
      `CREATE INDEX IF NOT EXISTS idx_visibility_expires ON VisibilityPurchase(expiresAt)`,
      `CREATE INDEX IF NOT EXISTS idx_visibility_status ON VisibilityPurchase(status, completedAt)`,

      // DemandNotification table
      `CREATE TABLE IF NOT EXISTS DemandNotification (
        id TEXT PRIMARY KEY,
        demandId TEXT NOT NULL,
        caregiverId TEXT NOT NULL,
        type TEXT NOT NULL,
        sentAt TEXT DEFAULT CURRENT_TIMESTAMP,
        readAt TEXT,
        emailSent INTEGER DEFAULT 0,
        pushSent INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (demandId) REFERENCES Demand(id) ON DELETE CASCADE,
        FOREIGN KEY (caregiverId) REFERENCES User(id) ON DELETE CASCADE,
        UNIQUE(demandId, caregiverId, type, sentAt)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_notification_caregiver ON DemandNotification(caregiverId, readAt)`,
      `CREATE INDEX IF NOT EXISTS idx_notification_demand ON DemandNotification(demandId)`,

      // Proposal table (proposals for demands)
      `CREATE TABLE IF NOT EXISTS Proposal (
        id TEXT PRIMARY KEY,
        demandId TEXT NOT NULL,
        caregiverId TEXT NOT NULL,
        message TEXT NOT NULL,
        proposedHourlyRate INTEGER,
        estimatedStartDate TEXT,
        status TEXT DEFAULT 'PENDING',
        acceptedAt TEXT,
        rejectedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (demandId) REFERENCES Demand(id) ON DELETE CASCADE,
        FOREIGN KEY (caregiverId) REFERENCES User(id) ON DELETE CASCADE
      )`,

      `CREATE INDEX IF NOT EXISTS idx_proposal_demand ON Proposal(demandId, status)`,
      `CREATE INDEX IF NOT EXISTS idx_proposal_caregiver ON Proposal(caregiverId, status)`,
      `CREATE INDEX IF NOT EXISTS idx_proposal_created ON Proposal(createdAt)`,
    ];

    // ALTER TABLE migrations - these may fail if column already exists, that's OK
    const alterMigrations = [
      `ALTER TABLE Interview ADD COLUMN caregiverQuestionnaireJson TEXT`,
      `ALTER TABLE Interview ADD COLUMN caregiverCompletedAt TEXT`,
      // Demand budget columns - added after initial table creation
      `ALTER TABLE Demand ADD COLUMN budgetEurCents INTEGER`,
      `ALTER TABLE Demand ADD COLUMN minimumHourlyRateEur INTEGER`,
      `ALTER TABLE Demand ADD COLUMN closedReason TEXT`,
      `ALTER TABLE Demand ADD COLUMN deletedAt TEXT`,
      `ALTER TABLE Demand ADD COLUMN deletionReason TEXT`,
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
