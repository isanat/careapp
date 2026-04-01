-- CreateTable
CREATE TABLE "User" (
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
);

-- CreateTable
CREATE TABLE "ProfileFamily" (
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
);

-- CreateTable
CREATE TABLE "ProfileCaregiver" (
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
);

-- CreateTable
CREATE TABLE "Payment" (
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
);

-- CreateTable
CREATE TABLE "Contract" (
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
);

-- CreateTable
CREATE TABLE "ContractAcceptance" (
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
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amountTokens" INTEGER NOT NULL,
    "amountEurCents" INTEGER NOT NULL,
    "message" TEXT,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tip_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tip_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
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
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" DATETIME,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatParticipant_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
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
);

-- CreateTable
CREATE TABLE "Notification" (
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
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activationCostEurCents" INTEGER NOT NULL DEFAULT 3500,
    "contractFeeEurCents" INTEGER NOT NULL DEFAULT 500,
    "platformFeePercent" INTEGER NOT NULL DEFAULT 15,
    "tokenPriceEurCents" INTEGER NOT NULL DEFAULT 100,
    "totalReserveEurCents" INTEGER NOT NULL DEFAULT 0,
    "totalTokensMinted" INTEGER NOT NULL DEFAULT 0,
    "totalTokensBurned" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
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
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Interview" (
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
);

-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "termsType" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL DEFAULT '1.0',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GuideAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "guideType" TEXT NOT NULL DEFAULT 'best_practices',
    "guideVersion" TEXT NOT NULL DEFAULT '1.0',
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- CreateTable
CREATE TABLE "EscrowPayment" (
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
);

-- CreateTable
CREATE TABLE "AdminUser" (
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
);

-- CreateTable
CREATE TABLE "AdminAction" (
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
);

-- CreateTable
CREATE TABLE "SupportTicket" (
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
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receipt" (
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
);

-- CreateTable
CREATE TABLE "RecurringPayment" (
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
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "targetRoles" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminNotification" (
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
);

-- CreateTable
CREATE TABLE "ApiKey" (
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
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImpersonationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "durationSeconds" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- CreateTable
CREATE TABLE "ModerationQueue" (
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
);

-- CreateTable
CREATE TABLE "PlatformMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricKey" TEXT NOT NULL,
    "metricValue" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
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
);

-- CreateTable
CREATE TABLE "PresenceConfirmation" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileFamily_userId_key" ON "ProfileFamily"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileCaregiver_userId_key" ON "ProfileCaregiver"("userId");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_familyUserId_status_idx" ON "Contract"("familyUserId", "status");

-- CreateIndex
CREATE INDEX "Contract_caregiverUserId_status_idx" ON "Contract"("caregiverUserId", "status");

-- CreateIndex
CREATE INDEX "Contract_status_createdAt_idx" ON "Contract"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAcceptance_contractId_key" ON "ContractAcceptance"("contractId");

-- CreateIndex
CREATE INDEX "Tip_toUserId_createdAt_idx" ON "Tip"("toUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Tip_contractId_idx" ON "Tip"("contractId");

-- CreateIndex
CREATE INDEX "Review_toUserId_createdAt_idx" ON "Review"("toUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_chatRoomId_userId_key" ON "ChatParticipant"("chatRoomId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_chatRoomId_createdAt_idx" ON "ChatMessage"("chatRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Interview_familyUserId_status_idx" ON "Interview"("familyUserId", "status");

-- CreateIndex
CREATE INDEX "Interview_caregiverUserId_status_idx" ON "Interview"("caregiverUserId", "status");

-- CreateIndex
CREATE INDEX "TermsAcceptance_userId_termsType_idx" ON "TermsAcceptance"("userId", "termsType");

-- CreateIndex
CREATE INDEX "GuideAcceptance_userId_idx" ON "GuideAcceptance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowPayment_paymentIntentId_key" ON "EscrowPayment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "EscrowPayment_contractId_idx" ON "EscrowPayment"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_userId_key" ON "AdminUser"("userId");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE INDEX "AdminUser_isActive_idx" ON "AdminUser"("isActive");

-- CreateIndex
CREATE INDEX "AdminAction_adminUserId_createdAt_idx" ON "AdminAction"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_entityType_entityId_idx" ON "AdminAction"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_contractId_idx" ON "Receipt"("contractId");

-- CreateIndex
CREATE INDEX "Receipt_familyUserId_createdAt_idx" ON "Receipt"("familyUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Receipt_caregiverUserId_createdAt_idx" ON "Receipt"("caregiverUserId", "createdAt");

-- CreateIndex
CREATE INDEX "RecurringPayment_contractId_idx" ON "RecurringPayment"("contractId");

-- CreateIndex
CREATE INDEX "RecurringPayment_status_nextPaymentAt_idx" ON "RecurringPayment"("status", "nextPaymentAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "AdminNotification_isRead_createdAt_idx" ON "AdminNotification"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_type_createdAt_idx" ON "AdminNotification"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiKey_createdBy_idx" ON "ApiKey"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ImpersonationLog_adminUserId_startedAt_idx" ON "ImpersonationLog"("adminUserId", "startedAt");

-- CreateIndex
CREATE INDEX "ImpersonationLog_targetUserId_startedAt_idx" ON "ImpersonationLog"("targetUserId", "startedAt");

-- CreateIndex
CREATE INDEX "ModerationQueue_status_createdAt_idx" ON "ModerationQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationQueue_entityType_entityId_idx" ON "ModerationQueue"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PlatformMetric_metricKey_computedAt_idx" ON "PlatformMetric"("metricKey", "computedAt");

-- CreateIndex
CREATE INDEX "PlatformMetric_period_idx" ON "PlatformMetric"("period");

-- CreateIndex
CREATE INDEX "ScheduledReport_isActive_nextRunAt_idx" ON "ScheduledReport"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledReport_createdBy_idx" ON "ScheduledReport"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceConfirmation_qrCode_key" ON "PresenceConfirmation"("qrCode");

-- CreateIndex
CREATE INDEX "PresenceConfirmation_contractId_idx" ON "PresenceConfirmation"("contractId");

-- CreateIndex
CREATE INDEX "PresenceConfirmation_qrCode_idx" ON "PresenceConfirmation"("qrCode");

-- CreateIndex
CREATE INDEX "PresenceConfirmation_scannedByUserId_idx" ON "PresenceConfirmation"("scannedByUserId");

-- CreateIndex
CREATE INDEX "PresenceConfirmation_qrExpiresAt_idx" ON "PresenceConfirmation"("qrExpiresAt");
