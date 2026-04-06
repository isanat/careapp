/*
  Warnings:

  - You are about to drop the column `tokenPriceEurCents` on the `PlatformSettings` table. All the data in the column will be lost.
  - You are about to drop the column `totalReserveEurCents` on the `PlatformSettings` table. All the data in the column will be lost.
  - You are about to drop the column `totalTokensBurned` on the `PlatformSettings` table. All the data in the column will be lost.
  - You are about to drop the column `totalTokensMinted` on the `PlatformSettings` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Demand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceTypes" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PT',
    "latitude" REAL,
    "longitude" REAL,
    "requiredExperienceLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "requiredCertifications" TEXT,
    "careType" TEXT NOT NULL DEFAULT 'RECURRING',
    "desiredStartDate" DATETIME,
    "desiredEndDate" DATETIME,
    "hoursPerWeek" INTEGER,
    "scheduleJson" TEXT,
    "budgetEurCents" INTEGER,
    "minimumHourlyRateEur" INTEGER,
    "visibilityPackage" TEXT NOT NULL DEFAULT 'NONE',
    "visibilityExpiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "Demand_familyUserId_fkey" FOREIGN KEY ("familyUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DemandView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandView_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DemandView_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisibilityPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "familyUserId" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "amountEurCents" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisibilityPurchase_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DemandNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandNotification_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DemandNotification_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "proposedHourlyRate" INTEGER,
    "estimatedStartDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptedAt" DATETIME,
    "rejectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proposal_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activationCostEurCents" INTEGER NOT NULL DEFAULT 3500,
    "contractFeeEurCents" INTEGER NOT NULL DEFAULT 500,
    "platformFeePercent" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PlatformSettings" ("activationCostEurCents", "contractFeeEurCents", "id", "platformFeePercent", "updatedAt") SELECT "activationCostEurCents", "contractFeeEurCents", "id", "platformFeePercent", "updatedAt" FROM "PlatformSettings";
DROP TABLE "PlatformSettings";
ALTER TABLE "new_PlatformSettings" RENAME TO "PlatformSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Demand_familyUserId_status_createdAt_idx" ON "Demand"("familyUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Demand_status_visibilityPackage_visibilityExpiresAt_idx" ON "Demand"("status", "visibilityPackage", "visibilityExpiresAt");

-- CreateIndex
CREATE INDEX "Demand_city_status_idx" ON "Demand"("city", "status");

-- CreateIndex
CREATE INDEX "Demand_createdAt_idx" ON "Demand"("createdAt");

-- CreateIndex
CREATE INDEX "DemandView_demandId_viewedAt_idx" ON "DemandView"("demandId", "viewedAt");

-- CreateIndex
CREATE INDEX "DemandView_caregiverId_viewedAt_idx" ON "DemandView"("caregiverId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DemandView_demandId_caregiverId_viewedAt_key" ON "DemandView"("demandId", "caregiverId", "viewedAt");

-- CreateIndex
CREATE INDEX "VisibilityPurchase_demandId_status_idx" ON "VisibilityPurchase"("demandId", "status");

-- CreateIndex
CREATE INDEX "VisibilityPurchase_familyUserId_createdAt_idx" ON "VisibilityPurchase"("familyUserId", "createdAt");

-- CreateIndex
CREATE INDEX "VisibilityPurchase_expiresAt_idx" ON "VisibilityPurchase"("expiresAt");

-- CreateIndex
CREATE INDEX "VisibilityPurchase_status_completedAt_idx" ON "VisibilityPurchase"("status", "completedAt");

-- CreateIndex
CREATE INDEX "DemandNotification_caregiverId_readAt_idx" ON "DemandNotification"("caregiverId", "readAt");

-- CreateIndex
CREATE INDEX "DemandNotification_demandId_idx" ON "DemandNotification"("demandId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandNotification_demandId_caregiverId_type_sentAt_key" ON "DemandNotification"("demandId", "caregiverId", "type", "sentAt");

-- CreateIndex
CREATE INDEX "Proposal_demandId_status_idx" ON "Proposal"("demandId", "status");

-- CreateIndex
CREATE INDEX "Proposal_caregiverId_status_idx" ON "Proposal"("caregiverId", "status");

-- CreateIndex
CREATE INDEX "Proposal_createdAt_idx" ON "Proposal"("createdAt");
