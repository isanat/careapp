-- Add KYC session tracking fields to profiles_caregiver
-- Run this migration to add Didit integration fields

ALTER TABLE profiles_caregiver ADD COLUMN kyc_session_id TEXT;
ALTER TABLE profiles_caregiver ADD COLUMN kyc_session_created_at TEXT;
ALTER TABLE profiles_caregiver ADD COLUMN kyc_completed_at TEXT;
ALTER TABLE profiles_caregiver ADD COLUMN kyc_confidence INTEGER DEFAULT 0;
