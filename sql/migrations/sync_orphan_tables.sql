-- Migration: Sync Orphan Tables with Prisma Schema
-- This migration ensures all orphan tables have the correct structure
-- Run this with: turso db shell idosolink < this_file.sql
-- Or via API

-- ==================== AdminNotification ====================
-- Check if table exists and has correct structure

CREATE TABLE IF NOT EXISTS AdminNotification (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entityType TEXT,
  entityId TEXT,
  severity TEXT DEFAULT 'INFO',
  isRead INTEGER DEFAULT 0,
  readAt TEXT,
  readBy TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_read_created ON AdminNotification(isRead, createdAt);
CREATE INDEX IF NOT EXISTS idx_admin_notif_type_created ON AdminNotification(type, createdAt);

-- ==================== ApiKey ====================

CREATE TABLE IF NOT EXISTS ApiKey (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  keyHash TEXT NOT NULL UNIQUE,
  keyPrefix TEXT NOT NULL,
  permissions TEXT,
  isActive INTEGER DEFAULT 1,
  lastUsedAt TEXT,
  expiresAt TEXT,
  createdBy TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apikey_active ON ApiKey(isActive);
CREATE INDEX IF NOT EXISTS idx_apikey_createdby ON ApiKey(createdBy);

-- ==================== EmailTemplate ====================

CREATE TABLE IF NOT EXISTS EmailTemplate (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  bodyHtml TEXT NOT NULL,
  bodyText TEXT,
  variables TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_template_active ON EmailTemplate(isActive);

-- ==================== ImpersonationLog ====================

CREATE TABLE IF NOT EXISTS ImpersonationLog (
  id TEXT PRIMARY KEY,
  adminUserId TEXT NOT NULL,
  targetUserId TEXT NOT NULL,
  reason TEXT,
  startedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  endedAt TEXT,
  durationSeconds INTEGER,
  ipAddress TEXT,
  userAgent TEXT
);

CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON ImpersonationLog(adminUserId, startedAt);
CREATE INDEX IF NOT EXISTS idx_impersonation_target ON ImpersonationLog(targetUserId, startedAt);

-- ==================== ModerationQueue ====================

CREATE TABLE IF NOT EXISTS ModerationQueue (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  reportedBy TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  reviewedBy TEXT,
  reviewedAt TEXT,
  action TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_status ON ModerationQueue(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_moderation_entity ON ModerationQueue(entityType, entityId);

-- ==================== PlatformMetric ====================

CREATE TABLE IF NOT EXISTS PlatformMetric (
  id TEXT PRIMARY KEY,
  metricKey TEXT NOT NULL,
  metricValue TEXT NOT NULL,
  computedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  period TEXT
);

CREATE INDEX IF NOT EXISTS idx_metric_key ON PlatformMetric(metricKey, computedAt);
CREATE INDEX IF NOT EXISTS idx_metric_period ON PlatformMetric(period);

-- ==================== ScheduledReport ====================

CREATE TABLE IF NOT EXISTS ScheduledReport (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reportType TEXT NOT NULL,
  frequency TEXT NOT NULL,
  recipients TEXT NOT NULL,
  filters TEXT,
  lastRunAt TEXT,
  nextRunAt TEXT,
  isActive INTEGER DEFAULT 1,
  createdBy TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_active ON ScheduledReport(isActive, nextRunAt);
CREATE INDEX IF NOT EXISTS idx_report_createdby ON ScheduledReport(createdBy);

-- ==================== Verification ====================
-- Verify all tables exist

SELECT 'AdminNotification' as table_name, COUNT(*) as count FROM AdminNotification
UNION ALL
SELECT 'ApiKey', COUNT(*) FROM ApiKey
UNION ALL
SELECT 'EmailTemplate', COUNT(*) FROM EmailTemplate
UNION ALL
SELECT 'ImpersonationLog', COUNT(*) FROM ImpersonationLog
UNION ALL
SELECT 'ModerationQueue', COUNT(*) FROM ModerationQueue
UNION ALL
SELECT 'PlatformMetric', COUNT(*) FROM PlatformMetric
UNION ALL
SELECT 'ScheduledReport', COUNT(*) FROM ScheduledReport;
