-- Migration: Add KYC and Interview Features
-- Run this against Turso database

-- ==================== ADD KYC COLUMNS TO PROFILES_CAREGIVER ====================
ALTER TABLE profiles_caregiver ADD COLUMN kyc_session_id TEXT;
ALTER TABLE profiles_caregiver ADD COLUMN kyc_session_created_at TEXT;
ALTER TABLE profiles_caregiver ADD COLUMN kyc_completed_at TEXT;
ALTER TABLE profiles_caregiver ADD COLUMN kyc_confidence INTEGER DEFAULT 0;

-- ==================== INTERVIEWS TABLE ====================
-- Stores video interview sessions between families and caregivers
CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  family_user_id TEXT NOT NULL,
  caregiver_user_id TEXT NOT NULL,
  contract_id TEXT,
  status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  scheduled_at TEXT NOT NULL,
  video_room_url TEXT,
  video_provider TEXT DEFAULT 'jitsi', -- jitsi, twilio, etc.
  duration_minutes INTEGER DEFAULT 30,
  
  -- Post-interview questionnaire (family fills this)
  family_questionnaire TEXT, -- JSON: { communication: 1-5, experience_match: 1-5, proceed: boolean, notes: string }
  family_completed_at TEXT,
  
  -- Caregiver feedback
  caregiver_notes TEXT,
  caregiver_completed_at TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  ended_at TEXT,
  
  FOREIGN KEY (family_user_id) REFERENCES users(id),
  FOREIGN KEY (caregiver_user_id) REFERENCES users(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- ==================== TERMS ACCEPTANCE TABLE ====================
-- Tracks when users accept legal documents
CREATE TABLE IF NOT EXISTS terms_acceptance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  terms_type TEXT NOT NULL, -- 'terms_of_use', 'privacy_policy', 'contract_template', 'mediation_policy'
  terms_version TEXT DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== GUIDE ACCEPTANCE TABLE ====================
-- Tracks when users acknowledge the best practices guide
CREATE TABLE IF NOT EXISTS guide_acceptance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  guide_type TEXT DEFAULT 'best_practices',
  guide_version TEXT DEFAULT '1.0',
  acknowledged_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== ESCROW PAYMENTS TABLE ====================
-- Extended payment tracking for escrow functionality
CREATE TABLE IF NOT EXISTS escrow_payments (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL, -- Stripe PaymentIntent ID
  
  -- Amounts
  total_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  caregiver_amount_cents INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'HELD', -- HELD, RELEASED, REFUNDED, PARTIAL_REFUND
  
  -- Stripe Connect
  family_customer_id TEXT,
  caregiver_account_id TEXT, -- Stripe Connect account ID
  transfer_id TEXT, -- Transfer to caregiver
  platform_transfer_id TEXT, -- Transfer to platform
  
  -- Timestamps
  captured_at TEXT,
  released_at TEXT,
  refunded_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_interviews_family ON interviews(family_user_id, status);
CREATE INDEX IF NOT EXISTS idx_interviews_caregiver ON interviews(caregiver_user_id, status);
CREATE INDEX IF NOT EXISTS idx_terms_user ON terms_acceptance(user_id, terms_type);
CREATE INDEX IF NOT EXISTS idx_guide_user ON guide_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_contract ON escrow_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_kyc_session ON profiles_caregiver(kyc_session_id);
