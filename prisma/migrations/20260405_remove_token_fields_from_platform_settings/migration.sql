-- Remove token-related fields from PlatformSettings
-- These were part of the removed blockchain/token system

ALTER TABLE "PlatformSettings" DROP COLUMN IF EXISTS "tokenPriceEurCents";
ALTER TABLE "PlatformSettings" DROP COLUMN IF EXISTS "totalReserveEurCents";
ALTER TABLE "PlatformSettings" DROP COLUMN IF EXISTS "totalTokensMinted";
ALTER TABLE "PlatformSettings" DROP COLUMN IF EXISTS "totalTokensBurned";
