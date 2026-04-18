/**
 * Turso Database Recovery & Synchronization Endpoint
 *
 * POST /api/admin/sync-turso
 *
 * Rebuilds the complete database schema from Prisma definitions,
 * clears all data, and creates admin user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import * as bcrypt from "bcryptjs";

const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  "libsql://idosolink-isanat.aws-us-east-1.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || "";

// Generate secure temporary password for initial setup
function generateTemporaryPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ============================================================
// Complete schema DDL matching prisma/schema.prisma exactly
// ============================================================
const SCHEMA_STATEMENTS = [
  // ==================== User ====================
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'FAMILY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "nif" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "emailVerified" DATETIME,
    "phoneVerified" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "kycSessionId" TEXT,
    "kycSessionToken" TEXT,
    "kycSessionCreatedAt" DATETIME,
    "kycCompletedAt" DATETIME,
    "kycConfidence" INTEGER NOT NULL DEFAULT 0,
    "backgroundCheckStatus" TEXT DEFAULT 'PENDING',
    "backgroundCheckUrl" TEXT,
    "profileImage" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'pt',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Lisbon',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone")`,

  // ==================== ProfileFamily ====================
  `CREATE TABLE IF NOT EXISTS "ProfileFamily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PT',
    "latitude" REAL,
    "longitude" REAL,
    "elderName" TEXT,
    "elderAge" INTEGER,
    "elderNeeds" TEXT,
    "medicalConditions" TEXT,
    "mobilityLevel" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "preferredServices" TEXT,
    "preferredSchedule" TEXT,
    "budgetRange" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileFamily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ProfileFamily_userId_key" ON "ProfileFamily"("userId")`,

  // ==================== ProfileCaregiver ====================
  `CREATE TABLE IF NOT EXISTS "ProfileCaregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "experienceYears" INTEGER,
    "education" TEXT,
    "certifications" TEXT,
    "languages" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PT',
    "latitude" REAL,
    "longitude" REAL,
    "radiusKm" INTEGER NOT NULL DEFAULT 20,
    "services" TEXT,
    "hourlyRateEur" INTEGER NOT NULL DEFAULT 15,
    "minimumHours" INTEGER NOT NULL DEFAULT 2,
    "availabilityJson" TEXT,
    "availableNow" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "documentType" TEXT,
    "documentNumber" TEXT,
    "documentVerified" BOOLEAN NOT NULL DEFAULT false,
    "backgroundCheckStatus" TEXT,
    "kycSessionId" TEXT,
    "kycSessionCreatedAt" DATETIME,
    "kycCompletedAt" DATETIME,
    "kycConfidence" INTEGER NOT NULL DEFAULT 0,
    "totalContracts" INTEGER NOT NULL DEFAULT 0,
    "totalHoursWorked" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "featured" INTEGER NOT NULL DEFAULT 0,
    "profileImage" TEXT,
    "portfolioImages" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileCaregiver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ProfileCaregiver_userId_key" ON "ProfileCaregiver"("userId")`,

  // ==================== Payment ====================
  `CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "amountEurCents" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "contractId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "refundedAt" DATETIME,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Payment_userId_status_idx" ON "Payment"("userId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt")`,

  // ==================== Contract ====================
  `CREATE TABLE IF NOT EXISTS "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyUserId" TEXT NOT NULL,
    "caregiverUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "description" TEXT,
    "tasksJson" TEXT,
    "serviceTypes" TEXT,
    "hoursPerWeek" INTEGER,
    "scheduleJson" TEXT,
    "hourlyRateEur" INTEGER NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "totalEurCents" INTEGER NOT NULL,
    "platformFeePct" INTEGER NOT NULL DEFAULT 15,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "familyFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "caregiverFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "acceptedByFamilyAt" DATETIME,
    "acceptedByCaregiverAt" DATETIME,
    "totalPaidEurCents" INTEGER NOT NULL DEFAULT 0,
    "presenceConfirmationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "Contract_familyUserId_fkey" FOREIGN KEY ("familyUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_caregiverUserId_fkey" FOREIGN KEY ("caregiverUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Contract_familyUserId_status_idx" ON "Contract"("familyUserId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Contract_caregiverUserId_status_idx" ON "Contract"("caregiverUserId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Contract_status_createdAt_idx" ON "Contract"("status", "createdAt")`,

  // ==================== ContractAcceptance ====================
  `CREATE TABLE IF NOT EXISTS "ContractAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "acceptedByFamilyAt" DATETIME,
    "familyIpAddress" TEXT,
    "familyUserAgent" TEXT,
    "acceptedByCaregiverAt" DATETIME,
    "caregiverIpAddress" TEXT,
    "caregiverUserAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractAcceptance_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ContractAcceptance_contractId_key" ON "ContractAcceptance"("contractId")`,

  // ==================== Review ====================
  `CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "punctualityRating" INTEGER,
    "professionalismRating" INTEGER,
    "communicationRating" INTEGER,
    "qualityRating" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Review_toUserId_createdAt_idx" ON "Review"("toUserId", "createdAt")`,

  // ==================== ChatRoom ====================
  `CREATE TABLE IF NOT EXISTS "ChatRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,

  // ==================== ChatParticipant ====================
  `CREATE TABLE IF NOT EXISTS "ChatParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" DATETIME,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatParticipant_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ChatParticipant_chatRoomId_userId_key" ON "ChatParticipant"("chatRoomId", "userId")`,

  // ==================== ChatMessage ====================
  `CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatRoomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "metadata" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatMessage_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ChatMessage_chatRoomId_createdAt_idx" ON "ChatMessage"("chatRoomId", "createdAt")`,

  // ==================== Notification ====================
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt")`,

  // ==================== PlatformSettings ====================
  `CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activationCostEurCents" INTEGER NOT NULL DEFAULT 3500,
    "contractFeeEurCents" INTEGER NOT NULL DEFAULT 500,
    "platformFeePercent" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
  )`,

  // ==================== Account (NextAuth) ====================
  `CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,

  // ==================== Session (NextAuth) ====================
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`,
  `CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`,

  // ==================== VerificationToken ====================
  `CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,

  // ==================== Interview ====================
  `CREATE TABLE IF NOT EXISTS "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyUserId" TEXT NOT NULL,
    "caregiverUserId" TEXT NOT NULL,
    "contractId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "videoRoomUrl" TEXT,
    "videoProvider" TEXT NOT NULL DEFAULT 'jitsi',
    "questionnaireJson" TEXT,
    "familyCompletedAt" DATETIME,
    "caregiverQuestionnaireJson" TEXT,
    "caregiverNotes" TEXT,
    "caregiverCompletedAt" DATETIME,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Interview_familyUserId_status_idx" ON "Interview"("familyUserId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Interview_caregiverUserId_status_idx" ON "Interview"("caregiverUserId", "status")`,

  // ==================== TermsAcceptance ====================
  `CREATE TABLE IF NOT EXISTS "TermsAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "termsType" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL DEFAULT '1.0',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "TermsAcceptance_userId_termsType_idx" ON "TermsAcceptance"("userId", "termsType")`,

  // ==================== EscrowPayment ====================
  `CREATE TABLE IF NOT EXISTS "EscrowPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "caregiverAmountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "familyCustomerId" TEXT,
    "caregiverAccountId" TEXT,
    "transferId" TEXT,
    "platformTransferId" TEXT,
    "capturedAt" DATETIME,
    "releasedAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EscrowPayment_paymentIntentId_key" ON "EscrowPayment"("paymentIntentId")`,
  `CREATE INDEX IF NOT EXISTS "EscrowPayment_contractId_idx" ON "EscrowPayment"("contractId")`,

  // ==================== AdminUser ====================
  `CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "customPermissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAdminActionAt" DATETIME,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_userId_key" ON "AdminUser"("userId")`,
  `CREATE INDEX IF NOT EXISTS "AdminUser_role_idx" ON "AdminUser"("role")`,
  `CREATE INDEX IF NOT EXISTS "AdminUser_isActive_idx" ON "AdminUser"("isActive")`,

  // ==================== AdminAction ====================
  `CREATE TABLE IF NOT EXISTS "AdminAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAction_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "AdminAction_adminUserId_createdAt_idx" ON "AdminAction"("adminUserId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AdminAction_entityType_entityId_idx" ON "AdminAction"("entityType", "entityId")`,
  `CREATE INDEX IF NOT EXISTS "AdminAction_createdAt_idx" ON "AdminAction"("createdAt")`,

  // ==================== SupportTicket ====================
  `CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedToId" TEXT,
    "assignedAt" DATETIME,
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "resolvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status")`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority")`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId")`,

  // ==================== SupportTicketMessage ====================
  `CREATE TABLE IF NOT EXISTS "SupportTicketMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt")`,

  // ==================== Receipt ====================
  `CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "familyUserId" TEXT NOT NULL,
    "caregiverUserId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "hoursWorked" INTEGER NOT NULL,
    "hourlyRateEurCents" INTEGER NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "caregiverAmountCents" INTEGER NOT NULL,
    "familyNif" TEXT,
    "caregiverNif" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_contractId_idx" ON "Receipt"("contractId")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_familyUserId_createdAt_idx" ON "Receipt"("familyUserId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_caregiverUserId_createdAt_idx" ON "Receipt"("caregiverUserId", "createdAt")`,

  // ==================== RecurringPayment ====================
  `CREATE TABLE IF NOT EXISTS "RecurringPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "familyUserId" TEXT NOT NULL,
    "caregiverUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "caregiverAmountCents" INTEGER NOT NULL,
    "billingDay" INTEGER NOT NULL DEFAULT 1,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastPaymentAt" DATETIME,
    "nextPaymentAt" DATETIME,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "RecurringPayment_contractId_idx" ON "RecurringPayment"("contractId")`,
  `CREATE INDEX IF NOT EXISTS "RecurringPayment_status_nextPaymentAt_idx" ON "RecurringPayment"("status", "nextPaymentAt")`,

  // ==================== AdminNotification ====================
  `CREATE TABLE IF NOT EXISTS "AdminNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "readBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "AdminNotification_isRead_createdAt_idx" ON "AdminNotification"("isRead", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AdminNotification_type_createdAt_idx" ON "AdminNotification"("type", "createdAt")`,

  // ==================== ApiKey ====================
  `CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash")`,
  `CREATE INDEX IF NOT EXISTS "ApiKey_isActive_idx" ON "ApiKey"("isActive")`,
  `CREATE INDEX IF NOT EXISTS "ApiKey_createdBy_idx" ON "ApiKey"("createdBy")`,

  // ==================== EmailTemplate ====================
  `CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_key_key" ON "EmailTemplate"("key")`,
  `CREATE INDEX IF NOT EXISTS "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive")`,

  // ==================== ImpersonationLog ====================
  `CREATE TABLE IF NOT EXISTS "ImpersonationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "durationSeconds" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS "ImpersonationLog_adminUserId_startedAt_idx" ON "ImpersonationLog"("adminUserId", "startedAt")`,
  `CREATE INDEX IF NOT EXISTS "ImpersonationLog_targetUserId_startedAt_idx" ON "ImpersonationLog"("targetUserId", "startedAt")`,

  // ==================== ModerationQueue ====================
  `CREATE TABLE IF NOT EXISTS "ModerationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reportedBy" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "action" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "ModerationQueue_status_createdAt_idx" ON "ModerationQueue"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ModerationQueue_entityType_entityId_idx" ON "ModerationQueue"("entityType", "entityId")`,

  // ==================== PlatformMetric ====================
  `CREATE TABLE IF NOT EXISTS "PlatformMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricKey" TEXT NOT NULL,
    "metricValue" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS "PlatformMetric_metricKey_computedAt_idx" ON "PlatformMetric"("metricKey", "computedAt")`,
  `CREATE INDEX IF NOT EXISTS "PlatformMetric_period_idx" ON "PlatformMetric"("period")`,

  // ==================== ScheduledReport ====================
  `CREATE TABLE IF NOT EXISTS "ScheduledReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "filters" TEXT,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "ScheduledReport_isActive_nextRunAt_idx" ON "ScheduledReport"("isActive", "nextRunAt")`,
  `CREATE INDEX IF NOT EXISTS "ScheduledReport_createdBy_idx" ON "ScheduledReport"("createdBy")`,

  // ==================== PresenceConfirmation ====================
  `CREATE TABLE IF NOT EXISTS "PresenceConfirmation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "qrGeneratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qrExpiresAt" DATETIME NOT NULL,
    "scannedAt" DATETIME,
    "scannedByUserId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PresenceConfirmation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PresenceConfirmation_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PresenceConfirmation_qrCode_key" ON "PresenceConfirmation"("qrCode")`,
  `CREATE INDEX IF NOT EXISTS "PresenceConfirmation_contractId_idx" ON "PresenceConfirmation"("contractId")`,
  `CREATE INDEX IF NOT EXISTS "PresenceConfirmation_qrCode_idx" ON "PresenceConfirmation"("qrCode")`,
  `CREATE INDEX IF NOT EXISTS "PresenceConfirmation_scannedByUserId_idx" ON "PresenceConfirmation"("scannedByUserId")`,
  `CREATE INDEX IF NOT EXISTS "PresenceConfirmation_qrExpiresAt_idx" ON "PresenceConfirmation"("qrExpiresAt")`,

  // ==================== Prisma migrations table ====================
  `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`,
];

async function rebuildSchema(db: any) {
  console.log("🔨 Rebuilding complete database schema (32 tables)...");

  await db.execute("PRAGMA foreign_keys = OFF");

  // First: drop ALL existing tables to ensure clean schema
  const existingTables = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
  );
  const tableNames = (existingTables.rows || []).map((r: any) => r.name);
  console.log(`Dropping ${tableNames.length} existing tables...`);

  for (const table of tableNames) {
    try {
      await db.execute(`DROP TABLE IF EXISTS "${table}"`);
    } catch (e) {
      // ignore
    }
  }

  // Now create all tables fresh with correct Prisma schema
  let created = 0;
  let errors = 0;

  for (const sql of SCHEMA_STATEMENTS) {
    try {
      await db.execute(sql);
      created++;
    } catch (error: any) {
      errors++;
      console.warn(`Warning: ${error.message?.substring(0, 100)}`);
    }
  }

  await db.execute("PRAGMA foreign_keys = ON");

  console.log(
    `✅ Schema rebuilt: ${created} statements executed, ${errors} warnings`,
  );
  return { created, errors };
}

async function clearAllData(db: any) {
  console.log("🗑️ Clearing all data...");

  const tablesResult = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'`,
  );

  const tables = (tablesResult.rows || []).map((row: any) => row.name);

  await db.execute("PRAGMA foreign_keys = OFF");

  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM "${table}"`);
    } catch (e) {
      // Table might not exist yet
    }
  }

  await db.execute("PRAGMA foreign_keys = ON");

  console.log(`✅ Cleared data from ${tables.length} tables`);
  return tables.length;
}

async function createAdminUser(db: any) {
  // Generate secure temporary password for initial setup
  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const now = new Date().toISOString();
  const userId = `user_admin_${Date.now()}`;
  const adminId = `admin_${Date.now()}`;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  await db.execute({
    sql: `INSERT INTO "User" ("id","email","name","passwordHash","role","status","verificationStatus","preferredLanguage","timezone","createdAt","updatedAt","kycConfidence")
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      userId,
      adminEmail,
      "Administrator",
      passwordHash,
      "ADMIN",
      "ACTIVE",
      "VERIFIED",
      "pt",
      "Europe/Lisbon",
      now,
      now,
      0,
    ],
  });

  await db.execute({
    sql: `INSERT INTO "AdminUser" ("id","userId","role","isActive","twoFactorEnabled","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?)`,
    args: [adminId, userId, "ADMIN", 1, 0, now, now],
  });

  // Return setup confirmation without exposing the password in responses
  // Admin should use password reset email or secure setup flow
  return {
    email: adminEmail,
    setupCompleted: true,
    note: "Use password reset email to set admin password",
  };
}

async function handleSync(request: NextRequest) {
  try {
    const authToken = request.headers.get("X-Admin-Token");
    const expectedToken =
      process.env.SYNC_ADMIN_TOKEN || "sync-turso-token-2024";

    if (authToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!TURSO_TOKEN) {
      return NextResponse.json(
        { error: "TURSO_AUTH_TOKEN not configured" },
        { status: 500 },
      );
    }

    const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

    // Step 1: Rebuild ALL tables from Prisma schema
    const schemaResult = await rebuildSchema(db);

    // Step 2: Clear all data
    const tablesCleared = await clearAllData(db);

    // Step 3: Create admin user
    const adminCreds = await createAdminUser(db);

    // Step 4: Verify tables exist
    const verification = await db.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    );
    const tableNames = (verification.rows || []).map((r: any) => r.name);

    return NextResponse.json({
      success: true,
      message: "Turso database fully rebuilt and synchronized",
      status: {
        schemaRebuilt: true,
        statementsExecuted: schemaResult.created,
        warnings: schemaResult.errors,
        tablesCleared,
        tablesExist: tableNames,
        totalTables: tableNames.length,
        adminUserCreated: true,
        adminSetup: { email: adminCreds.email, note: adminCreds.note },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        error: "Synchronization failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}
export async function POST(request: NextRequest) {
  return handleSync(request);
}
