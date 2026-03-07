import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Migration for monetization protection tables (Receipt, RecurringPayment)
// Also adds caregiverQuestionnaireJson to Interview if missing
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== 'seniorcare-migrate-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { step: string; success: boolean; error?: string }[] = [];

  // 1. Receipt table
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS Receipt (
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
      args: []
    });
    results.push({ step: 'Receipt table', success: true });
  } catch (e: any) {
    results.push({ step: 'Receipt table', success: false, error: e.message });
  }

  // Receipt indexes
  try {
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_receipt_contract ON Receipt(contractId)`, args: [] });
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_receipt_family ON Receipt(familyUserId, createdAt)`, args: [] });
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_receipt_caregiver ON Receipt(caregiverUserId, createdAt)`, args: [] });
    results.push({ step: 'Receipt indexes', success: true });
  } catch (e: any) {
    results.push({ step: 'Receipt indexes', success: false, error: e.message });
  }

  // 2. RecurringPayment table
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS RecurringPayment (
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
      args: []
    });
    results.push({ step: 'RecurringPayment table', success: true });
  } catch (e: any) {
    results.push({ step: 'RecurringPayment table', success: false, error: e.message });
  }

  // RecurringPayment indexes
  try {
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_rp_contract ON RecurringPayment(contractId)`, args: [] });
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_rp_status ON RecurringPayment(status, nextPaymentAt)`, args: [] });
    results.push({ step: 'RecurringPayment indexes', success: true });
  } catch (e: any) {
    results.push({ step: 'RecurringPayment indexes', success: false, error: e.message });
  }

  // 3. Add caregiverQuestionnaireJson to Interview (from previous migration that may not have run)
  try {
    await db.execute({
      sql: `ALTER TABLE Interview ADD COLUMN caregiverQuestionnaireJson TEXT`,
      args: []
    });
    results.push({ step: 'Interview.caregiverQuestionnaireJson', success: true });
  } catch (e: any) {
    // Column may already exist
    results.push({ step: 'Interview.caregiverQuestionnaireJson', success: true, error: 'Already exists or: ' + e.message });
  }

  // 4. Add caregiverCompletedAt to Interview
  try {
    await db.execute({
      sql: `ALTER TABLE Interview ADD COLUMN caregiverCompletedAt TEXT`,
      args: []
    });
    results.push({ step: 'Interview.caregiverCompletedAt', success: true });
  } catch (e: any) {
    results.push({ step: 'Interview.caregiverCompletedAt', success: true, error: 'Already exists or: ' + e.message });
  }

  return NextResponse.json({
    message: 'Monetization migration completed',
    results,
    allSuccessful: results.every(r => r.success),
  });
}
