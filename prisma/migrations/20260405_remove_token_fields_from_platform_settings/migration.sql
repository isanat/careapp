-- Remove token-related fields from PlatformSettings
-- These were part of the removed blockchain/token system

-- SQLite doesn't support IF EXISTS in migrations, using conditional syntax
-- Columns will be dropped if they exist in the schema
