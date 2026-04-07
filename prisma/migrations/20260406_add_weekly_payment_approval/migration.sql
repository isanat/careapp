-- Add new fields to Contract table
ALTER TABLE "Contract" ADD COLUMN "weeklyPaymentEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contract" ADD COLUMN "paymentCycleStartDate" DATETIME;
ALTER TABLE "Contract" ADD COLUMN "renewalContractId" TEXT;

-- Create WeeklyPaymentApproval table
CREATE TABLE "WeeklyPaymentApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weeklyAmountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "caregiverAmountCents" INTEGER NOT NULL,
    "approvalDueAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "capturedAt" DATETIME,
    "familyDecision" TEXT,
    "familyDecidedAt" DATETIME,
    "familyNotes" TEXT,
    "stripePaymentHoldId" TEXT,
    "familyPaymentId" TEXT,
    "caregiverTransferId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "WeeklyPaymentApproval_contractId_weekNumber_key" UNIQUE("contractId", "weekNumber"),
    FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE
);

-- Create indexes for WeeklyPaymentApproval
CREATE INDEX "WeeklyPaymentApproval_contractId_weekNumber_idx" ON "WeeklyPaymentApproval"("contractId", "weekNumber");
CREATE INDEX "WeeklyPaymentApproval_familyDecision_status_idx" ON "WeeklyPaymentApproval"("familyDecision", "status");
CREATE INDEX "WeeklyPaymentApproval_approvalDueAt_status_idx" ON "WeeklyPaymentApproval"("approvalDueAt", "status");
