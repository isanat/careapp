-- Add Escrow Payments table for contract escrow management
-- This table holds payment information for contracts in escrow

CREATE TABLE IF NOT EXISTS escrow_payments (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  payment_intent_id TEXT UNIQUE NOT NULL,
  
  -- Amounts
  total_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  caregiver_amount_cents INTEGER NOT NULL,
  
  -- Status: CREATED, HELD, RELEASED, CANCELLED, PARTIAL_REFUND
  status TEXT DEFAULT 'CREATED',
  
  -- Stripe Connect
  family_customer_id TEXT,
  caregiver_account_id TEXT,
  transfer_id TEXT,
  platform_transfer_id TEXT,
  
  -- Timestamps
  captured_at TEXT,
  released_at TEXT,
  refunded_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- Indexes for escrow_payments
CREATE INDEX IF NOT EXISTS idx_escrow_contract ON escrow_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payment_intent ON escrow_payments(payment_intent_id);

-- Add escrow-related admin actions
-- These will be logged in admin_actions table with entity_type = 'ESCROW'
