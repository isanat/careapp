-- Migration: Add document and background check columns to User table
-- These columns are referenced by the profile API but may be missing from the database
-- Run this against Turso database if profile save returns 500 errors

-- Personal document fields
ALTER TABLE User ADD COLUMN nif TEXT;
ALTER TABLE User ADD COLUMN documentType TEXT;
ALTER TABLE User ADD COLUMN documentNumber TEXT;

-- Background check fields
ALTER TABLE User ADD COLUMN backgroundCheckStatus TEXT DEFAULT 'PENDING';
ALTER TABLE User ADD COLUMN backgroundCheckUrl TEXT;
