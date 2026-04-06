-- ================================================
-- PAYMENT ARCHITECTURE REFACTOR
-- Separate Family (Payer) from Caregiver (Receiver)
-- Implement Stripe Connect for direct payouts
-- ================================================

-- ============================================
-- 1. CAREGIVER WALLET (Saldo Permanente)
-- ============================================
CREATE TABLE "CaregiverWallet" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalWithdrawn" INTEGER NOT NULL DEFAULT 0,
    "pendingPayments" INTEGER NOT NULL DEFAULT 0,
    "availableBalance" INTEGER NOT NULL DEFAULT 0,
    "stripeConnectAccountId" TEXT,
    "lastWithdrawalAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaregiverWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 2. CAREGIVER TRANSFER (Histórico de Recebimentos)
-- ============================================
CREATE TABLE "CaregiverTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "contractId" TEXT,
    "grossAmount" INTEGER NOT NULL,
    "platformFeePercent" INTEGER NOT NULL DEFAULT 15,
    "platformFeeCents" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "stripeTransferId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "CaregiverTransfer_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaregiverTransfer_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- 3. CAREGIVER WITHDRAWAL (Saques)
-- ============================================
CREATE TABLE "CaregiverWithdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "stripeFee" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "bankAccountLast4" TEXT,
    "stripePayoutId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivedAt" DATETIME,
    CONSTRAINT "CaregiverWithdrawal_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 4. FAMILY PAYMENT (Histórico de Pagamentos)
-- ============================================
CREATE TABLE "FamilyPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "demandId" TEXT,
    "contractId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "FamilyPayment_familyUserId_fkey" FOREIGN KEY ("familyUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyPayment_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FamilyPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- 5. FAMILY CREDIT (Créditos Temporários)
-- ============================================
CREATE TABLE "FamilyCredit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "sourceId" TEXT,
    "usedAt" DATETIME,
    "spentOnDemandId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyCredit_familyUserId_fkey" FOREIGN KEY ("familyUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyCredit_spentOnDemandId_fkey" FOREIGN KEY ("spentOnDemandId") REFERENCES "Demand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- 6. STRIPE PAYMENT HOLD (Escrow-like)
-- ============================================
CREATE TABLE "StripePaymentHold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "familyPaymentId" TEXT,
    "paymentIntentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AUTHORIZED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "capturedAt" DATETIME,
    "voidedAt" DATETIME,
    CONSTRAINT "StripePaymentHold_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StripePaymentHold_familyPaymentId_fkey" FOREIGN KEY ("familyPaymentId") REFERENCES "FamilyPayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX "CaregiverWallet_userId_idx" ON "CaregiverWallet"("userId");
CREATE INDEX "CaregiverTransfer_caregiverId_status_idx" ON "CaregiverTransfer"("caregiverId", "status");
CREATE INDEX "CaregiverTransfer_contractId_idx" ON "CaregiverTransfer"("contractId");
CREATE INDEX "CaregiverWithdrawal_caregiverId_status_idx" ON "CaregiverWithdrawal"("caregiverId", "status");
CREATE INDEX "FamilyPayment_familyUserId_type_idx" ON "FamilyPayment"("familyUserId", "type");
CREATE INDEX "FamilyPayment_contractId_idx" ON "FamilyPayment"("contractId");
CREATE INDEX "FamilyCredit_familyUserId_expiresAt_idx" ON "FamilyCredit"("familyUserId", "expiresAt");
CREATE INDEX "StripePaymentHold_contractId_status_idx" ON "StripePaymentHold"("contractId", "status");
