-- Add demand management fields for soft delete and close functionality
ALTER TABLE "Demand" ADD COLUMN "closedReason" TEXT;
ALTER TABLE "Demand" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Demand" ADD COLUMN "deletionReason" TEXT;

-- Add index for filtering out deleted demands
CREATE INDEX "Demand_deletedAt_idx" ON "Demand"("deletedAt");
