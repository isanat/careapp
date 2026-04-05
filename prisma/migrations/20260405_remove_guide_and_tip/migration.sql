-- Remove GuideAcceptance and Tip tables (unused features)

-- Drop Tip table and related foreign keys
DROP TABLE IF EXISTS "Tip";

-- Drop GuideAcceptance table
DROP TABLE IF EXISTS "GuideAcceptance";
