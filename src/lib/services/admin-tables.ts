/**
 * Admin Tables Service
 * 
 * Serviço para acesso às tabelas administrativas que foram migradas para o Prisma schema.
 * Usa libsql diretamente para manter consistência com o resto do projeto.
 */

import { db } from './db-turso';
import { generateId } from './utils/id';

// ==================== TYPES ====================

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions?: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImpersonationLog {
  id: string;
  adminUserId: string;
  targetUserId: string;
  reason?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ModerationQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  reportedBy?: string;
  reason: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  reviewedBy?: string;
  reviewedAt?: string;
  action?: string;
  notes?: string;
  createdAt: string;
}

export interface PlatformMetric {
  id: string;
  metricKey: string;
  metricValue: string;
  computedAt: string;
  period?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  recipients: string;
  filters?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// ==================== ADMIN NOTIFICATIONS ====================

export async function getAdminNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<AdminNotification[]> {
  let sql = 'SELECT * FROM AdminNotification';
  const args: (string | number)[] = [];
  
  if (options?.unreadOnly) {
    sql += ' WHERE isRead = 0';
  }
  
  sql += ` ORDER BY createdAt DESC LIMIT ?`;
  args.push(options?.limit || 50);
  
  const result = await db.execute({ sql, args });
  return result.rows as unknown as AdminNotification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM AdminNotification WHERE isRead = 0',
    args: [],
  });
  return Number(result.rows[0]?.count || 0);
}

export async function createAdminNotification(data: {
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}): Promise<string> {
  const id = generateId('notif');
  const now = new Date().toISOString();
  
  await db.execute({
    sql: `INSERT INTO AdminNotification (id, type, title, message, entityType, entityId, severity, isRead, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    args: [id, data.type, data.title, data.message, data.entityType || null, data.entityId || null, data.severity || 'INFO', now],
  });
  
  return id;
}

export async function markNotificationAsRead(id: string, adminUserId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE AdminNotification SET isRead = 1, readAt = ?, readBy = ? WHERE id = ?',
    args: [now, adminUserId, id],
  });
}

export async function markAllNotificationsAsRead(adminUserId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE AdminNotification SET isRead = 1, readAt = ?, readBy = ? WHERE isRead = 0',
    args: [now, adminUserId],
  });
}

export async function deleteAdminNotification(id: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM AdminNotification WHERE id = ?',
    args: [id],
  });
}

// ==================== API KEYS ====================

export async function getApiKeys(activeOnly = true): Promise<ApiKey[]> {
  let sql = 'SELECT id, name, keyPrefix, permissions, isActive, lastUsedAt, expiresAt, createdBy, createdAt FROM ApiKey';
  if (activeOnly) {
    sql += ' WHERE isActive = 1';
  }
  sql += ' ORDER BY createdAt DESC';
  
  const result = await db.execute({ sql, args: [] });
  return result.rows as unknown as ApiKey[];
}

export async function createApiKey(data: {
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions?: string;
  createdBy: string;
  expiresAt?: string;
}): Promise<string> {
  const id = generateId('apikey');
  const now = new Date().toISOString();
  
  await db.execute({
    sql: `INSERT INTO ApiKey (id, name, keyHash, keyPrefix, permissions, isActive, createdBy, expiresAt, createdAt)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    args: [id, data.name, data.keyHash, data.keyPrefix, data.permissions || null, data.createdBy, data.expiresAt || null, now],
  });
  
  return id;
}

export async function validateApiKey(keyPrefix: string, keyHash: string): Promise<ApiKey | null> {
  const result = await db.execute({
    sql: `SELECT * FROM ApiKey WHERE keyPrefix = ? AND keyHash = ? AND isActive = 1`,
    args: [keyPrefix, keyHash],
  });
  
  if (result.rows.length === 0) return null;
  
  // Update lastUsedAt
  await db.execute({
    sql: 'UPDATE ApiKey SET lastUsedAt = ? WHERE id = ?',
    args: [new Date().toISOString(), (result.rows[0] as { id: string }).id],
  });
  
  return result.rows[0] as unknown as ApiKey;
}

export async function revokeApiKey(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE ApiKey SET isActive = 0 WHERE id = ?',
    args: [id],
  });
}

// ==================== EMAIL TEMPLATES ====================

export async function getEmailTemplates(activeOnly = true): Promise<EmailTemplate[]> {
  let sql = 'SELECT * FROM EmailTemplate';
  if (activeOnly) {
    sql += ' WHERE isActive = 1';
  }
  sql += ' ORDER BY key ASC';
  
  const result = await db.execute({ sql, args: [] });
  return result.rows as unknown as EmailTemplate[];
}

export async function getEmailTemplateByKey(key: string): Promise<EmailTemplate | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM EmailTemplate WHERE key = ? AND isActive = 1',
    args: [key],
  });
  
  return result.rows.length > 0 ? result.rows[0] as unknown as EmailTemplate : null;
}

export async function upsertEmailTemplate(data: {
  key: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string;
}): Promise<string> {
  const id = generateId('emailtpl');
  const now = new Date().toISOString();
  
  // Check if exists
  const existing = await db.execute({
    sql: 'SELECT id FROM EmailTemplate WHERE key = ?',
    args: [data.key],
  });
  
  if (existing.rows.length > 0) {
    // Update
    await db.execute({
      sql: `UPDATE EmailTemplate SET subject = ?, bodyHtml = ?, bodyText = ?, variables = ?, updatedAt = ? WHERE key = ?`,
      args: [data.subject, data.bodyHtml, data.bodyText || null, data.variables || null, now, data.key],
    });
    return (existing.rows[0] as { id: string }).id;
  } else {
    // Insert
    await db.execute({
      sql: `INSERT INTO EmailTemplate (id, key, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [id, data.key, data.subject, data.bodyHtml, data.bodyText || null, data.variables || null, now, now],
    });
    return id;
  }
}

// ==================== IMPERSONATION LOGS ====================

export async function createImpersonationLog(data: {
  adminUserId: string;
  targetUserId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  const id = generateId('implog');
  const now = new Date().toISOString();
  
  await db.execute({
    sql: `INSERT INTO ImpersonationLog (id, adminUserId, targetUserId, reason, startedAt, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.adminUserId, data.targetUserId, data.reason || null, now, data.ipAddress || null, data.userAgent || null],
  });
  
  return id;
}

export async function endImpersonation(id: string): Promise<void> {
  const now = new Date().toISOString();
  
  // Get startedAt to calculate duration
  const log = await db.execute({
    sql: 'SELECT startedAt FROM ImpersonationLog WHERE id = ?',
    args: [id],
  });
  
  if (log.rows.length > 0) {
    const startedAt = new Date((log.rows[0] as { startedAt: string }).startedAt);
    const durationSeconds = Math.floor((new Date().getTime() - startedAt.getTime()) / 1000);
    
    await db.execute({
      sql: 'UPDATE ImpersonationLog SET endedAt = ?, durationSeconds = ? WHERE id = ?',
      args: [now, durationSeconds, id],
    });
  }
}

export async function getImpersonationLogs(limit = 50): Promise<ImpersonationLog[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM ImpersonationLog ORDER BY startedAt DESC LIMIT ?',
    args: [limit],
  });
  return result.rows as unknown as ImpersonationLog[];
}

// ==================== MODERATION QUEUE ====================

export async function getModerationQueue(options?: {
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  entityType?: string;
  limit?: number;
}): Promise<ModerationQueueItem[]> {
  let sql = 'SELECT * FROM ModerationQueue';
  const args: (string | number)[] = [];
  const conditions: string[] = [];
  
  if (options?.status) {
    conditions.push('status = ?');
    args.push(options.status);
  }
  if (options?.entityType) {
    conditions.push('entityType = ?');
    args.push(options.entityType);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY createdAt DESC LIMIT ?';
  args.push(options?.limit || 50);
  
  const result = await db.execute({ sql, args });
  return result.rows as unknown as ModerationQueueItem[];
}

export async function createModerationItem(data: {
  entityType: string;
  entityId: string;
  reason: string;
  reportedBy?: string;
}): Promise<string> {
  const id = generateId('mod');
  
  await db.execute({
    sql: `INSERT INTO ModerationQueue (id, entityType, entityId, reportedBy, reason, status, createdAt)
          VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
    args: [id, data.entityType, data.entityId, data.reportedBy || null, data.reason, new Date().toISOString()],
  });
  
  return id;
}

export async function resolveModerationItem(
  id: string,
  adminUserId: string,
  action: 'DELETE' | 'WARN' | 'BAN' | 'DISMISS',
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  
  await db.execute({
    sql: `UPDATE ModerationQueue SET status = 'RESOLVED', reviewedBy = ?, reviewedAt = ?, action = ?, notes = ? WHERE id = ?`,
    args: [adminUserId, now, action, notes || null, id],
  });
}

// ==================== PLATFORM METRICS ====================

export async function getPlatformMetrics(options?: {
  metricKey?: string;
  period?: string;
}): Promise<PlatformMetric[]> {
  let sql = 'SELECT * FROM PlatformMetric';
  const args: string[] = [];
  const conditions: string[] = [];
  
  if (options?.metricKey) {
    conditions.push('metricKey = ?');
    args.push(options.metricKey);
  }
  if (options?.period) {
    conditions.push('period = ?');
    args.push(options.period);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY computedAt DESC';
  
  const result = await db.execute({ sql, args });
  return result.rows as unknown as PlatformMetric[];
}

export async function setPlatformMetric(data: {
  metricKey: string;
  metricValue: string;
  period?: string;
}): Promise<string> {
  const id = generateId('metric');
  const now = new Date().toISOString();
  
  // Upsert: delete old metric with same key and period
  if (data.period) {
    await db.execute({
      sql: 'DELETE FROM PlatformMetric WHERE metricKey = ? AND period = ?',
      args: [data.metricKey, data.period],
    });
  } else {
    await db.execute({
      sql: 'DELETE FROM PlatformMetric WHERE metricKey = ? AND period IS NULL',
      args: [data.metricKey],
    });
  }
  
  // Insert new
  await db.execute({
    sql: `INSERT INTO PlatformMetric (id, metricKey, metricValue, computedAt, period)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, data.metricKey, data.metricValue, now, data.period || null],
  });
  
  return id;
}

// ==================== SCHEDULED REPORTS ====================

export async function getScheduledReports(activeOnly = true): Promise<ScheduledReport[]> {
  let sql = 'SELECT * FROM ScheduledReport';
  if (activeOnly) {
    sql += ' WHERE isActive = 1';
  }
  sql += ' ORDER BY nextRunAt ASC';
  
  const result = await db.execute({ sql, args: [] });
  return result.rows as unknown as ScheduledReport[];
}

export async function createScheduledReport(data: {
  name: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  filters?: string;
  createdBy: string;
  nextRunAt: string;
}): Promise<string> {
  const id = generateId('report');
  const now = new Date().toISOString();
  
  await db.execute({
    sql: `INSERT INTO ScheduledReport (id, name, reportType, frequency, recipients, filters, isActive, createdBy, nextRunAt, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    args: [id, data.name, data.reportType, data.frequency, JSON.stringify(data.recipients), data.filters || null, data.createdBy, data.nextRunAt, now],
  });
  
  return id;
}

export async function updateReportLastRun(id: string, nextRunAt: string): Promise<void> {
  const now = new Date().toISOString();
  
  await db.execute({
    sql: 'UPDATE ScheduledReport SET lastRunAt = ?, nextRunAt = ? WHERE id = ?',
    args: [now, nextRunAt, id],
  });
}

export async function deactivateScheduledReport(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE ScheduledReport SET isActive = 0 WHERE id = ?',
    args: [id],
  });
}
