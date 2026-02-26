# IdosoLink Admin Panel Architecture

## Complete Technical Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Permission Levels & RBAC](#2-permission-levels--rbac)
3. [Page Structure & Navigation](#3-page-structure--navigation)
4. [Component Hierarchy](#4-component-hierarchy)
5. [API Endpoints](#5-api-endpoints)
6. [Database Queries](#6-database-queries)
7. [Data Tables Specification](#7-data-tables-specification)
8. [Actions Per Entity](#8-actions-per-entity)
9. [Flow Diagrams](#9-flow-diagrams)
10. [Audit & Logging](#10-audit--logging)
11. [Security Considerations](#11-security-considerations)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Overview

### 1.1 Purpose

The Admin Panel provides comprehensive management capabilities for the IdosoLink platform, enabling administrators to:
- Monitor platform health and KPIs
- Manage users, caregivers, and families
- Handle contracts, disputes, and payments
- Control token economics
- Moderate content and reviews
- Configure platform settings
- Access analytics and reports
- Audit all administrative actions

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19 |
| UI Components | shadcn/ui, Tailwind CSS |
| Charts | Recharts |
| State | React Query (TanStack Query) |
| Database | SQLite (Turso) via Prisma |
| Auth | NextAuth.js with Admin Role |
| Real-time | WebSocket for live updates |

### 1.3 Design Principles

1. **Secure by Default**: All admin actions require authentication and authorization
2. **Audit Everything**: Every action is logged with user, timestamp, and details
3. **Mobile Responsive**: Admin panel works on tablets for on-call admins
4. **Progressive Disclosure**: Complex actions hidden behind confirmations
5. **Fail Safely**: Destructive operations require multiple confirmations

---

## 2. Permission Levels & RBAC

### 2.1 Admin Roles

```typescript
enum AdminRole {
  SUPER_ADMIN    = 'SUPER_ADMIN',    // Full access
  ADMIN          = 'ADMIN',          // Most operations
  SUPPORT        = 'SUPPORT',        // Read + user support
  MODERATOR      = 'MODERATOR',      // Content moderation
  ANALYST        = 'ANALYST',        // Read-only + analytics
}
```

### 2.2 Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | SUPPORT | MODERATOR | ANALYST |
|------------|:-----------:|:-----:|:-------:|:---------:|:-------:|
| **Dashboard** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Users** |
| View Users List | ✅ | ✅ | ✅ | ❌ | ✅ |
| View User Details | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit User Data | ✅ | ✅ | ✅ | ❌ | ❌ |
| Suspend/Activate User | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete User | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impersonate User | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Caregivers** |
| View Caregiver List | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verify Caregiver (KYC) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set Featured Status | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Caregiver Stats | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Contracts** |
| View Contracts | ✅ | ✅ | ✅ | ❌ | ✅ |
| Cancel Contract | ✅ | ✅ | ✅ | ❌ | ❌ |
| Handle Disputes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Force Complete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Payments** |
| View Payments | ✅ | ✅ | ✅ | ❌ | ✅ |
| Process Refunds | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Escrow | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Stripe Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tokens** |
| View Token Stats | ✅ | ✅ | ❌ | ❌ | ✅ |
| Manual Token Adjustment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modify Token Price | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Moderation** |
| Moderate Reviews | ✅ | ✅ | ✅ | ✅ | ❌ |
| Moderate Chat Messages | ✅ | ✅ | ✅ | ✅ | ❌ |
| Moderate Profiles | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ban Users | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Settings** |
| View Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modify Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modify Fee Structure | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin Management** |
| Create Admin Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modify Admin Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ✅ | ❌ | ✅ |

### 2.3 Database Schema Extension

```prisma
// Add to schema.prisma

model AdminUser {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id])
  
  role            AdminRole   @default(ADMIN)
  
  // Permissions override (JSON)
  customPermissions String?   // Override specific permissions
  
  // Access
  isActive        Boolean     @default(true)
  lastAdminActionAt DateTime?
  
  // Two-Factor Authentication
  twoFactorEnabled Boolean    @default(false)
  twoFactorSecret  String?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  adminActions    AdminAction[]
  
  @@index([role])
}

model AdminAction {
  id              String    @id @default(cuid())
  adminUserId     String
  adminUser       AdminUser @relation(fields: [adminUserId], references: [id])
  
  // Action Details
  action          String    // CREATE, UPDATE, DELETE, VIEW, IMPERSONATE, etc.
  entityType      String    // USER, CONTRACT, PAYMENT, TOKEN, etc.
  entityId        String?   // ID of affected entity
  
  // Data
  oldValue        String?   // JSON of previous state
  newValue        String?   // JSON of new state
  
  // Context
  ipAddress       String?
  userAgent       String?
  reason          String?   // Required for destructive actions
  
  createdAt       DateTime  @default(now())
  
  @@index([adminUserId, createdAt])
  @@index([entityType, entityId])
  @@index([createdAt])
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  SUPPORT
  MODERATOR
  ANALYST
}
```

---

## 3. Page Structure & Navigation

### 3.1 Admin Panel Routes

```
/admin
├── /dashboard                    # Main dashboard with KPIs
├── /users
│   ├── /                         # Users list with filters
│   ├── /[id]                     # User detail view
│   └── /new                      # Create new user (admin only)
├── /caregivers
│   ├── /                         # Caregivers list
│   ├── /[id]                     # Caregiver detail
│   ├── /pending                  # Pending verifications
│   └── /featured                 # Featured caregivers management
├── /contracts
│   ├── /                         # Contracts list
│   ├── /[id]                     # Contract detail
│   ├── /disputes                 # Active disputes
│   └── /cancelled                # Cancelled contracts
├── /payments
│   ├── /                         # Payments list
│   ├── /[id]                     # Payment detail
│   ├── /refunds                  # Refund requests
│   └── /escrow                   # Escrow management
├── /tokens
│   ├── /                         # Token overview
│   ├── /transactions             # Token ledger
│   ├── /adjustments              # Manual adjustments
│   └── /economics                # Token economics settings
├── /moderation
│   ├── /                         # Moderation dashboard
│   ├── /reviews                  # Review moderation
│   ├── /chat                     # Chat message moderation
│   ├── /profiles                 # Profile moderation
│   └── /reports                  # User reports
├── /settings
│   ├── /                         # Platform settings
│   ├── /fees                     # Fee configuration
│   ├── /features                 # Feature flags
│   └── /integrations             # External services
├── /analytics
│   ├── /                         # Analytics overview
│   ├── /users                    # User analytics
│   ├── /financial                # Financial analytics
│   ├── /tokens                   # Token analytics
│   └── /export                   # Export reports
├── /logs
│   ├── /                         # Audit logs
│   ├── /admin                    # Admin action logs
│   └── /system                   # System event logs
├── /notifications
│   ├── /                         # Admin notifications
│   ├── /alerts                   # Alert configuration
│   └── /templates                # Notification templates
└── /support
    ├── /                         # Support dashboard
    ├── /tickets                  # Support tickets
    └── /impersonation            # User impersonation log
```

### 3.2 Navigation Structure

```tsx
// Admin Sidebar Navigation

const adminNavigation = {
  main: [
    { 
      label: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: 'LayoutDashboard',
      badge: null 
    },
    { 
      label: 'Usuários', 
      href: '/admin/users', 
      icon: 'Users',
      badge: { count: 5, variant: 'warning' } // Pending verifications
    },
    { 
      label: 'Cuidadores', 
      href: '/admin/caregivers', 
      icon: 'UserCheck',
      badge: { count: 12, variant: 'default' } // Pending KYC
    },
    { 
      label: 'Contratos', 
      href: '/admin/contracts', 
      icon: 'FileText',
      badge: { count: 3, variant: 'destructive' } // Disputes
    },
    { 
      label: 'Pagamentos', 
      href: '/admin/payments', 
      icon: 'CreditCard' 
    },
    { 
      label: 'Tokens', 
      href: '/admin/tokens', 
      icon: 'Coins' 
    },
  ],
  moderation: [
    { 
      label: 'Moderação', 
      href: '/admin/moderation', 
      icon: 'Shield',
      badge: { count: 8, variant: 'warning' } // Pending reviews
    },
  ],
  system: [
    { 
      label: 'Configurações', 
      href: '/admin/settings', 
      icon: 'Settings',
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    { 
      label: 'Analytics', 
      href: '/admin/analytics', 
      icon: 'BarChart3' 
    },
    { 
      label: 'Logs', 
      href: '/admin/logs', 
      icon: 'FileSearch' 
    },
    { 
      label: 'Notificações', 
      href: '/admin/notifications', 
      icon: 'Bell' 
    },
    { 
      label: 'Suporte', 
      href: '/admin/support', 
      icon: 'Headphones' 
    },
  ],
};
```

### 3.3 Page Layout Structure

```tsx
// Admin Layout Component

<AdminLayout>
  <AdminSidebar />           {/* Collapsible sidebar */}
  <AdminHeader>              {/* Top header */}
    <Breadcrumb />
    <AdminUserMenu />
    <AdminNotifications />
  </AdminHeader>
  <AdminMain>
    <AdminPageHeader>        {/* Page title + actions */}
      <PageTitle />
      <PageActions />
    </AdminPageHeader>
    <AdminContent>           {/* Main content area */}
      {children}
    </AdminContent>
  </AdminMain>
  <AdminFooter />            {/* Optional footer */}
</AdminLayout>
```

---

## 4. Component Hierarchy

### 4.1 Shared Admin Components

```
src/components/admin/
├── layout/
│   ├── admin-layout.tsx         # Main layout wrapper
│   ├── admin-sidebar.tsx        # Navigation sidebar
│   ├── admin-header.tsx         # Top header with breadcrumbs
│   ├── admin-footer.tsx         # Footer with version info
│   └── admin-mobile-nav.tsx     # Mobile navigation
├── common/
│   ├── page-header.tsx          # Page title + breadcrumb
│   ├── data-table.tsx           # Reusable data table
│   ├── data-filters.tsx         # Filter panel component
│   ├── stats-card.tsx           # KPI stat card
│   ├── chart-container.tsx      # Chart wrapper
│   ├── empty-state.tsx          # Empty data state
│   ├── loading-skeleton.tsx     # Loading states
│   └── error-boundary.tsx       # Error handling
├── forms/
│   ├── user-form.tsx            # User create/edit form
│   ├── caregiver-form.tsx       # Caregiver edit form
│   ├── contract-form.tsx        # Contract edit form
│   ├── settings-form.tsx        # Settings form
│   └── token-adjustment-form.tsx # Token adjustment form
├── modals/
│   ├── confirmation-modal.tsx   # Action confirmation
│   ├── user-detail-modal.tsx    # Quick user view
│   ├── refund-modal.tsx         # Process refund
│   ├── dispute-modal.tsx        # Handle dispute
│   ├── impersonation-modal.tsx  # User impersonation
│   └── audit-log-modal.tsx      # View audit details
├── tables/
│   ├── users-table.tsx          # Users data table
│   ├── caregivers-table.tsx     # Caregivers data table
│   ├── contracts-table.tsx      # Contracts data table
│   ├── payments-table.tsx       # Payments data table
│   ├── tokens-table.tsx         # Token ledger table
│   ├── reviews-table.tsx        # Reviews moderation table
│   └── audit-logs-table.tsx     # Audit logs table
├── charts/
│   ├── revenue-chart.tsx        # Revenue over time
│   ├── users-chart.tsx          # User growth chart
│   ├── tokens-chart.tsx         # Token distribution
│   ├── contracts-chart.tsx      # Contract stats
│   └── kpi-gauge.tsx            # KPI gauge chart
├── widgets/
│   ├── recent-activity.tsx      # Recent admin actions
│   ├── alerts-widget.tsx        # Active alerts
│   ├── pending-verifications.tsx # Pending items
│   ├── quick-actions.tsx        # Quick action buttons
│   └── platform-health.tsx      # System health status
└── guards/
    ├── admin-guard.tsx          # Auth check wrapper
    ├── permission-guard.tsx     # Permission check wrapper
    └── role-guard.tsx           # Role check wrapper
```

### 4.2 Page-Specific Components

```
src/app/admin/
├── dashboard/
│   └── components/
│       ├── kpi-cards.tsx        # Main KPI cards
│       ├── revenue-chart.tsx    # Revenue chart
│       ├── user-stats.tsx       # User statistics
│       ├── contract-stats.tsx   # Contract statistics
│       ├── token-stats.tsx      # Token statistics
│       └── recent-activity.tsx  # Activity feed
├── users/
│   └── components/
│       ├── user-filters.tsx     # User search filters
│       ├── user-card.tsx        # User card view
│       ├── user-timeline.tsx    # User activity timeline
│       └── user-contracts.tsx   # User's contracts
├── caregivers/
│   └── components/
│       ├── kyc-review.tsx       # KYC verification panel
│       ├── featured-manager.tsx # Featured status management
│       ├── stats-editor.tsx     # Edit caregiver stats
│       └── availability-calendar.tsx
├── contracts/
│   └── components/
│       ├── dispute-panel.tsx    # Dispute handling UI
│       ├── contract-timeline.tsx # Contract lifecycle
│       ├── payment-breakdown.tsx # Payment details
│       └── escrow-status.tsx    # Escrow status widget
├── payments/
│   └── components/
│       ├── refund-form.tsx      # Refund processing
│       ├── payment-receipt.tsx  # Receipt view
│       └── transaction-log.tsx  # Transaction history
├── tokens/
│   └── components/
│       ├── token-supply.tsx     # Token supply widget
│       ├── reserve-status.tsx   # Reserve status
│       ├── adjustment-form.tsx  # Manual adjustment
│       └── price-history.tsx    # Price history chart
├── moderation/
│   └── components/
│       ├── review-card.tsx      # Review moderation card
│       ├── chat-message-card.tsx # Chat message card
│       ├── profile-flag-card.tsx # Flagged profile
│       └── moderation-actions.tsx # Action buttons
├── settings/
│   └── components/
│       ├── fee-config.tsx       # Fee configuration
│       ├── feature-flags.tsx    # Feature toggle
│       └── integration-status.tsx # Integration health
└── analytics/
    └── components/
        ├── export-form.tsx      # Export configuration
        ├── custom-report.tsx    # Custom report builder
        └── scheduled-reports.tsx # Scheduled reports
```

---

## 5. API Endpoints

### 5.1 Admin API Structure

```
/api/admin/
├── /dashboard
│   ├── GET /stats               # Dashboard KPIs
│   ├── GET /revenue             # Revenue data
│   ├── GET /activity            # Recent activity
│   └── GET /health              # Platform health
├── /users
│   ├── GET /                    # List users (paginated)
│   ├── GET /[id]                # Get user details
│   ├── POST /                   # Create user
│   ├── PATCH /[id]              # Update user
│   ├── DELETE /[id]             # Delete user (soft)
│   ├── POST /[id]/suspend       # Suspend user
│   ├── POST /[id]/activate      # Activate user
│   ├── POST /[id]/impersonate   # Generate impersonation token
│   └── GET /[id]/activity       # User activity log
├── /caregivers
│   ├── GET /                    # List caregivers
│   ├── GET /pending             # Pending verifications
│   ├── GET /[id]                # Caregiver details
│   ├── PATCH /[id]              # Update caregiver
│   ├── POST /[id]/verify        # Approve verification
│   ├── POST /[id]/reject        # Reject verification
│   ├── POST /[id]/feature       # Set featured status
│   └── PATCH /[id]/stats        # Update statistics
├── /contracts
│   ├── GET /                    # List contracts
│   ├── GET /disputes            # List disputes
│   ├── GET /[id]                # Contract details
│   ├── POST /[id]/cancel        # Cancel contract
│   ├── POST /[id]/complete      # Force complete
│   ├── POST /[id]/dispute       # Open dispute
│   └── POST /[id]/resolve       # Resolve dispute
├── /payments
│   ├── GET /                    # List payments
│   ├── GET /refunds             # List refund requests
│   ├── GET /[id]                # Payment details
│   ├── POST /[id]/refund        # Process refund
│   └── GET /escrow              # Escrow payments list
├── /tokens
│   ├── GET /stats               # Token statistics
│   ├── GET /transactions        # Token ledger
│   ├── POST /adjust             # Manual adjustment
│   └── PATCH /price             # Update token price
├── /moderation
│   ├── GET /reviews             # Pending reviews
│   ├── POST /reviews/[id]/approve
│   ├── POST /reviews/[id]/reject
│   ├── GET /chat                # Flagged messages
│   ├── POST /chat/[id]/moderate
│   └── GET /reports             # User reports
├── /settings
│   ├── GET /                    # Get all settings
│   ├── PATCH /                  # Update settings
│   ├── GET /fees                # Fee structure
│   ├── PATCH /fees              # Update fees
│   └── GET /features            # Feature flags
├── /analytics
│   ├── GET /overview            # Analytics overview
│   ├── GET /users               # User analytics
│   ├── GET /financial           # Financial analytics
│   ├── GET /tokens              # Token analytics
│   └── POST /export             # Export data
├── /logs
│   ├── GET /                    # Audit logs
│   ├── GET /admin               # Admin actions
│   └── GET /[id]                # Log details
├── /notifications
│   ├── GET /                    # Admin notifications
│   ├── POST /[id]/read          # Mark as read
│   └── GET /alerts              # Alert configuration
└── /support
    ├── GET /tickets             # Support tickets
    └── GET /impersonation       # Impersonation logs
```

### 5.2 API Request/Response Examples

#### Dashboard Stats

```typescript
// GET /api/admin/dashboard/stats

interface DashboardStatsResponse {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalCaregivers: number;
    verifiedCaregivers: number;
    activeContracts: number;
    pendingDisputes: number;
    totalRevenueEur: number;
    revenueToday: number;
    tokensInCirculation: number;
    reserveEur: number;
  };
  alerts: {
    pendingKyc: number;
    pendingDisputes: number;
    pendingRefunds: number;
    flaggedContent: number;
  };
  health: {
    database: 'healthy' | 'degraded' | 'down';
    stripe: 'healthy' | 'degraded' | 'down';
    easypay: 'healthy' | 'degraded' | 'down';
    blockchain: 'healthy' | 'degraded' | 'down';
  };
}
```

#### Users List

```typescript
// GET /api/admin/users?page=1&limit=20&status=ACTIVE&role=FAMILY&search=maria

interface UsersListResponse {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    verificationStatus: VerificationStatus;
    createdAt: string;
    lastLoginAt: string | null;
    walletBalance: number;
    contractsCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    roles: Array<{ value: string; count: number }>;
    statuses: Array<{ value: string; count: number }>;
  };
}
```

#### Process Refund

```typescript
// POST /api/admin/payments/[id]/refund

interface RefundRequest {
  amount: number;           // Amount in cents, optional for partial
  reason: string;           // Required
  notifyUser: boolean;      // Send email notification
}

interface RefundResponse {
  success: boolean;
  refund: {
    id: string;
    paymentId: string;
    amount: number;
    status: string;
    stripeRefundId: string;
    createdAt: string;
  };
  auditLogId: string;       // Reference to audit entry
}
```

---

## 6. Database Queries

### 6.1 Dashboard Queries

```sql
-- Dashboard KPIs

-- Total users count
SELECT COUNT(*) as totalUsers FROM User;

-- Active users (last 30 days)
SELECT COUNT(*) as activeUsers 
FROM User 
WHERE lastLoginAt >= datetime('now', '-30 days');

-- New users today
SELECT COUNT(*) as newUsersToday 
FROM User 
WHERE date(createdAt) = date('now');

-- Total caregivers
SELECT COUNT(*) as totalCaregivers 
FROM User 
WHERE role = 'CAREGIVER';

-- Verified caregivers
SELECT COUNT(*) as verifiedCaregivers 
FROM ProfileCaregiver 
WHERE verificationStatus = 'VERIFIED';

-- Active contracts
SELECT COUNT(*) as activeContracts 
FROM Contract 
WHERE status = 'ACTIVE';

-- Pending disputes
SELECT COUNT(*) as pendingDisputes 
FROM Contract 
WHERE status = 'DISPUTED';

-- Total revenue
SELECT COALESCE(SUM(amountEurCents), 0) as totalRevenue 
FROM Payment 
WHERE status = 'COMPLETED';

-- Revenue today
SELECT COALESCE(SUM(amountEurCents), 0) as revenueToday 
FROM Payment 
WHERE status = 'COMPLETED' 
  AND date(paidAt) = date('now');

-- Tokens in circulation
SELECT totalTokensMinted - totalTokensBurned as tokensInCirculation,
       totalReserveEurCents as reserveEur
FROM PlatformSettings 
LIMIT 1;
```

### 6.2 User Management Queries

```sql
-- Users list with filters
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.status,
  u.verificationStatus,
  u.createdAt,
  u.lastLoginAt,
  w.balanceTokens as walletBalance,
  (SELECT COUNT(*) FROM Contract WHERE familyUserId = u.id OR caregiverUserId = u.id) as contractsCount
FROM User u
LEFT JOIN Wallet w ON u.id = w.userId
WHERE 1=1
  AND (:role IS NULL OR u.role = :role)
  AND (:status IS NULL OR u.status = :status)
  AND (:search IS NULL OR u.name LIKE '%' || :search || '%' OR u.email LIKE '%' || :search || '%')
ORDER BY u.createdAt DESC
LIMIT :limit OFFSET :offset;

-- User detail with all relations
SELECT 
  u.*,
  w.id as walletId,
  w.address as walletAddress,
  w.balanceTokens,
  w.balanceEurCents,
  pf.elderName,
  pf.city as familyCity,
  pc.title as caregiverTitle,
  pc.bio,
  pc.totalContracts,
  pc.averageRating,
  pc.totalReviews
FROM User u
LEFT JOIN Wallet w ON u.id = w.userId
LEFT JOIN ProfileFamily pf ON u.id = pf.userId
LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE u.id = :userId;

-- User activity timeline
SELECT 
  'PAYMENT' as type,
  p.id as id,
  p.description as title,
  p.amountEurCents as amount,
  p.status,
  p.createdAt
FROM Payment p
WHERE p.userId = :userId
UNION ALL
SELECT 
  'CONTRACT_FAMILY' as type,
  c.id as id,
  c.title,
  c.totalEurCents as amount,
  c.status,
  c.createdAt
FROM Contract c
WHERE c.familyUserId = :userId
UNION ALL
SELECT 
  'CONTRACT_CAREGIVER' as type,
  c.id as id,
  c.title,
  c.totalEurCents as amount,
  c.status,
  c.createdAt
FROM Contract c
WHERE c.caregiverUserId = :userId
ORDER BY createdAt DESC
LIMIT 50;

-- User contracts summary
SELECT 
  c.id,
  c.title,
  c.status,
  c.totalEurCents,
  c.startDate,
  c.endDate,
  CASE 
    WHEN c.familyUserId = :userId THEN 'FAMILY'
    ELSE 'CAREGIVER'
  END as role,
  CASE 
    WHEN c.familyUserId = :userId THEN uCaregiver.name
    ELSE uFamily.name
  END as otherPartyName
FROM Contract c
LEFT JOIN User uFamily ON c.familyUserId = uFamily.id
LEFT JOIN User uCaregiver ON c.caregiverUserId = uCaregiver.id
WHERE c.familyUserId = :userId OR c.caregiverUserId = :userId
ORDER BY c.createdAt DESC;
```

### 6.3 Caregiver Management Queries

```sql
-- Caregivers pending KYC verification
SELECT 
  u.id,
  u.email,
  u.name,
  pc.title,
  pc.city,
  pc.experienceYears,
  pc.verificationStatus,
  pc.kycSessionId,
  pc.kycCompletedAt,
  pc.kycConfidence,
  u.createdAt
FROM User u
JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE pc.verificationStatus = 'PENDING'
ORDER BY u.createdAt ASC;

-- Caregiver statistics for verification
SELECT 
  u.id,
  u.name,
  pc.totalContracts,
  pc.totalHoursWorked,
  pc.averageRating,
  pc.totalReviews,
  (SELECT COUNT(*) FROM Review WHERE toUserId = u.id AND isModerated = 0) as unmoderatedReviews,
  (SELECT COALESCE(AVG(rating), 0) FROM Review WHERE toUserId = u.id AND createdAt >= datetime('now', '-90 days')) as recentRating
FROM User u
JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE u.id = :caregiverId;

-- Featured caregivers
SELECT 
  u.id,
  u.name,
  pc.title,
  pc.city,
  pc.averageRating,
  pc.totalContracts,
  pc.featured
FROM User u
JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE pc.featured = 1 OR pc.verificationStatus = 'VERIFIED'
ORDER BY pc.averageRating DESC, pc.totalContracts DESC
LIMIT 20;
```

### 6.4 Contract Management Queries

```sql
-- Contracts with disputes
SELECT 
  c.id,
  c.title,
  c.status,
  c.totalEurCents,
  c.createdAt,
  c.updatedAt,
  uFamily.name as familyName,
  uFamily.email as familyEmail,
  uCaregiver.name as caregiverName,
  uCaregiver.email as caregiverEmail,
  e.status as escrowStatus,
  e.totalAmountCents as escrowAmount
FROM Contract c
JOIN User uFamily ON c.familyUserId = uFamily.id
JOIN User uCaregiver ON c.caregiverUserId = uCaregiver.id
LEFT JOIN EscrowPayment e ON c.id = e.contractId
WHERE c.status = 'DISPUTED'
ORDER BY c.updatedAt ASC;

-- Contract timeline
SELECT 
  'CREATED' as event,
  c.createdAt as timestamp,
  NULL as details
FROM Contract c
WHERE c.id = :contractId
UNION ALL
SELECT 
  'FAMILY_ACCEPTED' as event,
  ca.acceptedByFamilyAt as timestamp,
  ca.familyIpAddress as details
FROM ContractAcceptance ca
WHERE ca.contractId = :contractId AND ca.acceptedByFamilyAt IS NOT NULL
UNION ALL
SELECT 
  'CAREGIVER_ACCEPTED' as event,
  ca.acceptedByCaregiverAt as timestamp,
  ca.caregiverIpAddress as details
FROM ContractAcceptance ca
WHERE ca.contractId = :contractId AND ca.acceptedByCaregiverAt IS NOT NULL
UNION ALL
SELECT 
  'PAYMENT' as event,
  p.paidAt as timestamp,
  printf('%d cents - %s', p.amountEurCents, p.type) as details
FROM Payment p
WHERE p.contractId = :contractId AND p.status = 'COMPLETED'
UNION ALL
SELECT 
  'STATUS_CHANGE' as event,
  c.updatedAt as timestamp,
  c.status as details
FROM Contract c
WHERE c.id = :contractId AND c.status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED')
ORDER BY timestamp;

-- Contract payment breakdown
SELECT 
  p.id,
  p.type,
  p.status,
  p.amountEurCents,
  p.tokensAmount,
  p.paidAt,
  p.refundedAt,
  u.name as userName
FROM Payment p
JOIN User u ON p.userId = u.id
WHERE p.contractId = :contractId
ORDER BY p.createdAt;
```

### 6.5 Payment Management Queries

```sql
-- Payments list with filters
SELECT 
  p.id,
  p.type,
  p.status,
  p.provider,
  p.amountEurCents,
  p.tokensAmount,
  p.createdAt,
  p.paidAt,
  u.email as userEmail,
  u.name as userName,
  c.title as contractTitle
FROM Payment p
JOIN User u ON p.userId = u.id
LEFT JOIN Contract c ON p.contractId = c.id
WHERE 1=1
  AND (:type IS NULL OR p.type = :type)
  AND (:status IS NULL OR p.status = :status)
  AND (:userId IS NULL OR p.userId = :userId)
ORDER BY p.createdAt DESC
LIMIT :limit OFFSET :offset;

-- Refund requests (payments that can be refunded)
SELECT 
  p.id,
  p.amountEurCents,
  p.tokensAmount,
  p.paidAt,
  p.stripePaymentIntentId,
  u.email as userEmail,
  u.name as userName,
  w.balanceTokens as userTokenBalance,
  tl.id as ledgerEntryId,
  tl.type as ledgerType
FROM Payment p
JOIN User u ON p.userId = u.id
LEFT JOIN Wallet w ON u.id = w.userId
LEFT JOIN TokenLedger tl ON tl.referenceId = p.id AND tl.reason IN ('ACTIVATION_BONUS', 'TOKEN_PURCHASE')
WHERE p.status = 'COMPLETED'
  AND p.refundedAt IS NULL
  AND p.type IN ('ACTIVATION', 'TOKEN_PURCHASE')
ORDER BY p.paidAt DESC;

-- Escrow payments status
SELECT 
  e.id,
  e.contractId,
  e.totalAmountCents,
  e.platformFeeCents,
  e.caregiverAmountCents,
  e.status,
  e.capturedAt,
  e.releasedAt,
  c.title as contractTitle,
  uFamily.name as familyName,
  uCaregiver.name as caregiverName
FROM EscrowPayment e
JOIN Contract c ON e.contractId = c.id
JOIN User uFamily ON c.familyUserId = uFamily.id
JOIN User uCaregiver ON c.caregiverUserId = uCaregiver.id
WHERE e.status = 'HELD'
ORDER BY e.capturedAt ASC;
```

### 6.6 Token Management Queries

```sql
-- Token statistics
SELECT 
  (SELECT totalTokensMinted FROM PlatformSettings LIMIT 1) as totalMinted,
  (SELECT totalTokensBurned FROM PlatformSettings LIMIT 1) as totalBurned,
  (SELECT totalTokensMinted - totalTokensBurned FROM PlatformSettings LIMIT 1) as inCirculation,
  (SELECT totalReserveEurCents FROM PlatformSettings LIMIT 1) as reserveEurCents,
  (SELECT tokenPriceEurCents FROM PlatformSettings LIMIT 1) as currentPriceCents,
  (SELECT COUNT(DISTINCT userId) FROM Wallet WHERE balanceTokens > 0) as holdersCount,
  (SELECT COALESCE(SUM(balanceTokens), 0) FROM Wallet) as walletBalances;

-- Token transaction history
SELECT 
  tl.id,
  tl.type,
  tl.reason,
  tl.amountTokens,
  tl.amountEurCents,
  tl.description,
  tl.txHash,
  tl.createdAt,
  u.email as userEmail,
  u.name as userName
FROM TokenLedger tl
JOIN User u ON tl.userId = u.id
WHERE 1=1
  AND (:userId IS NULL OR tl.userId = :userId)
  AND (:type IS NULL OR tl.type = :type)
  AND (:reason IS NULL OR tl.reason = :reason)
ORDER BY tl.createdAt DESC
LIMIT :limit OFFSET :offset;

-- Token distribution by reason
SELECT 
  reason,
  type,
  SUM(amountTokens) as totalTokens,
  SUM(amountEurCents) as totalEurCents,
  COUNT(*) as transactionCount
FROM TokenLedger
GROUP BY reason, type
ORDER BY totalTokens DESC;
```

### 6.7 Moderation Queries

```sql
-- Pending review moderation
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.createdAt,
  r.isPublic,
  c.title as contractTitle,
  uFrom.name as fromUserName,
  uTo.name as toUserName,
  uTo.role as toUserRole
FROM Review r
JOIN Contract c ON r.contractId = c.id
JOIN User uFrom ON r.fromUserId = uFrom.id
JOIN User uTo ON r.toUserId = uTo.id
WHERE r.isModerated = 0
ORDER BY r.createdAt ASC;

-- Flagged chat messages (conceptual - would need content moderation)
SELECT 
  cm.id,
  cm.content,
  cm.messageType,
  cm.createdAt,
  u.name as senderName,
  u.email as senderEmail,
  cr.type as roomType,
  cr.referenceId
FROM ChatMessage cm
JOIN User u ON cm.senderId = u.id
JOIN ChatRoom cr ON cm.chatRoomId = cr.id
WHERE cm.isDeleted = 0
ORDER BY cm.createdAt DESC
LIMIT 50;

-- Caregivers with low ratings (potential issues)
SELECT 
  u.id,
  u.name,
  u.email,
  pc.totalReviews,
  pc.averageRating,
  (SELECT COUNT(*) FROM Review WHERE toUserId = u.id AND rating <= 2) as lowRatings,
  (SELECT GROUP_CONCAT(comment, ' | ') FROM Review WHERE toUserId = u.id AND rating <= 2 LIMIT 5) as recentLowComments
FROM User u
JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE pc.averageRating < 3.0
  AND pc.totalReviews >= 3
ORDER BY pc.averageRating ASC;
```

### 6.8 Analytics Queries

```sql
-- Revenue over time (daily for last 30 days)
SELECT 
  date(paidAt) as date,
  type,
  COUNT(*) as count,
  SUM(amountEurCents) as revenue
FROM Payment
WHERE status = 'COMPLETED'
  AND paidAt >= datetime('now', '-30 days')
GROUP BY date(paidAt), type
ORDER BY date;

-- User growth over time
SELECT 
  date(createdAt) as date,
  role,
  COUNT(*) as newUsers
FROM User
WHERE createdAt >= datetime('now', '-90 days')
GROUP BY date(createdAt), role
ORDER BY date;

-- Contract statistics
SELECT 
  status,
  COUNT(*) as count,
  SUM(totalEurCents) as totalValue,
  AVG(totalEurCents) as avgValue
FROM Contract
GROUP BY status;

-- Geographic distribution
SELECT 
  city,
  role,
  COUNT(*) as count
FROM User u
LEFT JOIN ProfileFamily pf ON u.id = pf.userId
LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE COALESCE(pf.city, pc.city) IS NOT NULL
GROUP BY COALESCE(pf.city, pc.city), role
ORDER BY count DESC
LIMIT 20;
```

---

## 7. Data Tables Specification

### 7.1 Users Table

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| Avatar | Image | ❌ | ❌ | User profile image |
| Nome | String | ✅ (search) | ✅ | User full name |
| Email | String | ✅ (search) | ✅ | Email address |
| Função | Badge | ✅ | ✅ | FAMILY / CAREGIVER |
| Status | Badge | ✅ | ✅ | ACTIVE / SUSPENDED / INACTIVE |
| KYC | Badge | ✅ | ✅ | VERIFIED / PENDING / UNVERIFIED |
| Carteira | Number | ❌ | ✅ | Token balance |
| Contratos | Number | ❌ | ✅ | Total contracts |
| Criado | Date | ✅ (range) | ✅ | Registration date |
| Último Acesso | Date | ✅ (range) | ✅ | Last login |
| Ações | Actions | ❌ | ❌ | View, Edit, Suspend |

**Actions:**
- 👁️ Ver Detalhes (modal/page)
- ✏️ Editar (inline/modal)
- 🚫 Suspender (confirmation)
- ✅ Ativar (confirmation)
- 🔐 Impersonate (admin only)
- 🗑️ Excluir (double confirmation)

### 7.2 Caregivers Table

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| Avatar | Image | ❌ | ❌ | Profile image |
| Nome | String | ✅ (search) | ✅ | Full name |
| Título | String | ✅ (search) | ❌ | Professional title |
| Cidade | String | ✅ | ✅ | Location |
| Verificação | Badge | ✅ | ✅ | KYC status |
| Avaliação | Rating | ✅ | ✅ | Average rating (1-5) |
| Contratos | Number | ❌ | ✅ | Total completed |
| Horas | Number | ❌ | ✅ | Hours worked |
| Featured | Badge | ✅ | ✅ | Featured status |
| Disponível | Badge | ✅ | ✅ | Available now |
| Criado | Date | ✅ (range) | ✅ | Registration date |
| Ações | Actions | ❌ | ❌ | View, Verify, Feature |

**Actions:**
- 👁️ Ver Detalhes
- ✅ Aprovar KYC
- ❌ Rejeitar KYC
- ⭐ Feature/Unfeature
- ✏️ Editar Estatísticas
- 📊 Ver Relatório

### 7.3 Contracts Table

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| ID | String | ✅ (search) | ❌ | Contract ID (short) |
| Título | String | ✅ (search) | ✅ | Contract title |
| Família | String | ✅ (search) | ❌ | Family user name |
| Cuidador | String | ✅ (search) | ❌ | Caregiver name |
| Status | Badge | ✅ | ✅ | Contract status |
| Valor | Currency | ✅ (range) | ✅ | Total value in EUR |
| Tokens | Number | ❌ | ✅ | Token fees |
| Data Início | Date | ✅ (range) | ✅ | Start date |
| Data Fim | Date | ✅ (range) | ✅ | End date |
| Criado | Date | ✅ (range) | ✅ | Creation date |
| Ações | Actions | ❌ | ❌ | View, Cancel, Resolve |

**Actions:**
- 👁️ Ver Detalhes
- ❌ Cancelar Contrato
- ⚖️ Abrir Disputa
- ✅ Resolver Disputa
- 💰 Ver Pagamentos
- 📝 Ver Logs

### 7.4 Payments Table

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| ID | String | ✅ (search) | ❌ | Payment ID |
| Usuário | String | ✅ (search) | ❌ | User name/email |
| Tipo | Badge | ✅ | ✅ | ACTIVATION / TOKEN_PURCHASE / CONTRACT_FEE |
| Status | Badge | ✅ | ✅ | PENDING / COMPLETED / FAILED / REFUNDED |
| Provider | Badge | ✅ | ✅ | STRIPE / BANK_TRANSFER / INTERNAL |
| Valor EUR | Currency | ✅ (range) | ✅ | Amount in EUR |
| Tokens | Number | ❌ | ✅ | Token amount |
| Contrato | String | ✅ (search) | ❌ | Related contract |
| Pago em | Date | ✅ (range) | ✅ | Payment date |
| Criado | Date | ✅ (range) | ✅ | Creation date |
| Ações | Actions | ❌ | ❌ | View, Refund |

**Actions:**
- 👁️ Ver Detalhes
- 💰 Processar Reembolso
- 📄 Ver no Stripe
- 📊 Ver Transações

### 7.5 Token Ledger Table

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| ID | String | ✅ (search) | ❌ | Ledger entry ID |
| Usuário | String | ✅ (search) | ❌ | User name/email |
| Tipo | Badge | ✅ | ✅ | CREDIT / DEBIT |
| Razão | Badge | ✅ | ✅ | Transaction reason |
| Tokens | Number | ✅ (range) | ✅ | Token amount |
| EUR | Currency | ❌ | ✅ | EUR equivalent |
| Descrição | String | ✅ (search) | ❌ | Human-readable description |
| Referência | String | ✅ (search) | ❌ | Related entity |
| Tx Hash | String | ✅ (search) | ❌ | Blockchain hash |
| Data | Date | ✅ (range) | ✅ | Transaction date |
| Ações | Actions | ❌ | ❌ | View |

**Actions:**
- 👁️ Ver Detalhes
- 🔗 Ver na Blockchain
- 👤 Ver Usuário

### 7.6 Reviews Table (Moderation)

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| ID | String | ❌ | ❌ | Review ID |
| De | String | ✅ (search) | ❌ | Reviewer name |
| Para | String | ✅ (search) | ❌ | Reviewee name |
| Rating | Rating | ✅ | ✅ | Star rating |
| Comentário | Text | ✅ (search) | ❌ | Review text |
| Contrato | String | ✅ (search) | ❌ | Related contract |
| Público | Badge | ✅ | ✅ | Public status |
| Moderado | Badge | ✅ | ✅ | Moderation status |
| Criado | Date | ✅ (range) | ✅ | Creation date |
| Ações | Actions | ❌ | ❌ | Approve, Reject, Edit |

**Actions:**
- ✅ Aprovar
- ❌ Rejeitar
- ✏️ Editar
- 🚫 Ocultar
- 👁️ Ver Contrato

### 7.7 Audit Logs Table

| Column | Type | Filterable | Sortable | Description |
|--------|------|:----------:|:--------:|-------------|
| ID | String | ❌ | ❌ | Log ID |
| Admin | String | ✅ (search) | ❌ | Admin user name |
| Ação | Badge | ✅ | ✅ | Action type |
| Entidade | String | ✅ | ✅ | Entity type |
| ID Entidade | String | ✅ (search) | ❌ | Entity ID |
| IP | String | ✅ (search) | ❌ | IP address |
| Razão | Text | ✅ (search) | ❌ | Action reason |
| Data | Date | ✅ (range) | ✅ | Action date |
| Ações | Actions | ❌ | ❌ | View Details |

**Actions:**
- 👁️ Ver Detalhes (shows old/new values)
- 🔄 Reverter (if applicable)

---

## 8. Actions Per Entity

### 8.1 User Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| List Users | `/api/admin/users` | GET | SUPPORT+ | No | No |
| View User | `/api/admin/users/[id]` | GET | SUPPORT+ | No | Yes |
| Create User | `/api/admin/users` | POST | ADMIN+ | No | Yes |
| Update User | `/api/admin/users/[id]` | PATCH | ADMIN+ | No | Yes |
| Delete User | `/api/admin/users/[id]` | DELETE | SUPER_ADMIN | Double | Yes |
| Suspend User | `/api/admin/users/[id]/suspend` | POST | ADMIN+ | Yes | Yes |
| Activate User | `/api/admin/users/[id]/activate` | POST | ADMIN+ | Yes | Yes |
| Impersonate | `/api/admin/users/[id]/impersonate` | POST | ADMIN+ | Yes | Yes |
| Reset KYC | `/api/admin/users/[id]/reset-kyc` | POST | ADMIN+ | Yes | Yes |
| Reset Password | `/api/admin/users/[id]/reset-password` | POST | ADMIN+ | No | Yes |
| View Activity | `/api/admin/users/[id]/activity` | GET | SUPPORT+ | No | Yes |

### 8.2 Caregiver Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| List Caregivers | `/api/admin/caregivers` | GET | SUPPORT+ | No | No |
| View Caregiver | `/api/admin/caregivers/[id]` | GET | SUPPORT+ | No | Yes |
| Update Caregiver | `/api/admin/caregivers/[id]` | PATCH | ADMIN+ | No | Yes |
| Verify KYC | `/api/admin/caregivers/[id]/verify` | POST | ADMIN+ | Yes | Yes |
| Reject KYC | `/api/admin/caregivers/[id]/reject` | POST | ADMIN+ | Yes | Yes |
| Set Featured | `/api/admin/caregivers/[id]/feature` | POST | ADMIN+ | Yes | Yes |
| Update Stats | `/api/admin/caregivers/[id]/stats` | PATCH | ADMIN+ | No | Yes |
| Export Data | `/api/admin/caregivers/export` | GET | ANALYST+ | No | Yes |

### 8.3 Contract Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| List Contracts | `/api/admin/contracts` | GET | SUPPORT+ | No | No |
| View Contract | `/api/admin/contracts/[id]` | GET | SUPPORT+ | No | Yes |
| Cancel Contract | `/api/admin/contracts/[id]/cancel` | POST | ADMIN+ | Double | Yes |
| Force Complete | `/api/admin/contracts/[id]/complete` | POST | ADMIN+ | Yes | Yes |
| Open Dispute | `/api/admin/contracts/[id]/dispute` | POST | ADMIN+ | Yes | Yes |
| Resolve Dispute | `/api/admin/contracts/[id]/resolve` | POST | ADMIN+ | Double | Yes |
| View Timeline | `/api/admin/contracts/[id]/timeline` | GET | SUPPORT+ | No | No |
| View Payments | `/api/admin/contracts/[id]/payments` | GET | SUPPORT+ | No | No |

### 8.4 Payment Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| List Payments | `/api/admin/payments` | GET | SUPPORT+ | No | No |
| View Payment | `/api/admin/payments/[id]` | GET | SUPPORT+ | No | Yes |
| Process Refund | `/api/admin/payments/[id]/refund` | POST | ADMIN+ | Double | Yes |
| View Stripe | `/api/admin/payments/[id]/stripe` | GET | ADMIN+ | No | Yes |
| View Escrow | `/api/admin/payments/escrow` | GET | ADMIN+ | No | No |
| Release Escrow | `/api/admin/payments/escrow/[id]/release` | POST | ADMIN+ | Yes | Yes |
| Refund Escrow | `/api/admin/payments/escrow/[id]/refund` | POST | ADMIN+ | Double | Yes |

### 8.5 Token Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| View Stats | `/api/admin/tokens/stats` | GET | SUPPORT+ | No | No |
| List Transactions | `/api/admin/tokens/transactions` | GET | SUPPORT+ | No | No |
| Manual Adjust | `/api/admin/tokens/adjust` | POST | ADMIN+ | Double | Yes |
| Update Price | `/api/admin/tokens/price` | PATCH | SUPER_ADMIN | Double | Yes |
| Export Ledger | `/api/admin/tokens/export` | GET | ANALYST+ | No | Yes |

### 8.6 Moderation Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| List Pending Reviews | `/api/admin/moderation/reviews` | GET | MODERATOR+ | No | No |
| Approve Review | `/api/admin/moderation/reviews/[id]/approve` | POST | MODERATOR+ | No | Yes |
| Reject Review | `/api/admin/moderation/reviews/[id]/reject` | POST | MODERATOR+ | Yes | Yes |
| Edit Review | `/api/admin/moderation/reviews/[id]` | PATCH | MODERATOR+ | No | Yes |
| Hide Review | `/api/admin/moderation/reviews/[id]/hide` | POST | MODERATOR+ | Yes | Yes |
| List Flagged Chat | `/api/admin/moderation/chat` | GET | MODERATOR+ | No | No |
| Delete Message | `/api/admin/moderation/chat/[id]` | DELETE | MODERATOR+ | Yes | Yes |
| Warn User | `/api/admin/moderation/warn/[userId]` | POST | MODERATOR+ | Yes | Yes |

### 8.7 Settings Actions

| Action | Endpoint | Method | Permission | Confirmation | Audit |
|--------|----------|--------|------------|--------------|-------|
| View Settings | `/api/admin/settings` | GET | ADMIN+ | No | No |
| Update Settings | `/api/admin/settings` | PATCH | ADMIN+ | No | Yes |
| View Fees | `/api/admin/settings/fees` | GET | ADMIN+ | No | No |
| Update Fees | `/api/admin/settings/fees` | PATCH | SUPER_ADMIN | Double | Yes |
| View Features | `/api/admin/settings/features` | GET | ADMIN+ | No | No |
| Toggle Feature | `/api/admin/settings/features/[id]` | PATCH | ADMIN+ | No | Yes |

---

## 9. Flow Diagrams

### 9.1 User Suspension Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SUSPENSION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Admin                    System                    User
  │                         │                        │
  ├─ Select User────────────►                        │
  │                         │                        │
  ├─ Click "Suspend"────────►                        │
  │                         │                        │
  │   ┌─────────────────────┴────────────────────┐   │
  │   │ Confirmation Modal                       │   │
  │   │ - Reason (required)                      │   │
  │   │ - Duration (optional)                    │   │
  │   │ - Notify user checkbox                   │   │
  │   │ - Active contracts warning               │   │
  │   └─────────────────────┬────────────────────┘   │
  │                         │                        │
  ├─ Confirm────────────────►                        │
  │                         │                        │
  │                         ├─ Validate permissions  │
  │                         ├─ Check active contracts│
  │                         │                        │
  │                    ┌────┴────┐                   │
  │                    │ Has     │                   │
  │                    │ Active  │                   │
  │                    │Contracts│                   │
  │                    └────┬────┘                   │
  │                         │                        │
  │              ┌──────────┴──────────┐             │
  │              │                     │             │
  │              ▼                     ▼             │
  │         Show Warning         Proceed with        │
  │         about contracts      suspension          │
  │              │                     │             │
  │              └──────────┬──────────┘             │
  │                         │                        │
  │                         ├─ Update User.status   │
  │                         ├─ Create AdminAction   │
  │                         ├─ Cancel contracts     │
  │                         ├─ Release escrow       │
  │                         │                        │
  │                         ├─ Send notification────►│
  │                         │                        │
  │◄── Success Message ─────┤                        │
  │                         │                        │
  │                         │      ┌─────────────────┤
  │                         │      │ Email: Account  │
  │                         │      │ Suspended       │
  │                         │      └─────────────────┤
  │                         │                        │
```

### 9.2 Dispute Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   DISPUTE RESOLUTION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

Admin                System              Family           Caregiver
  │                     │                   │                  │
  ├─ View Disputes─────►│                   │                  │
  │                     │                   │                  │
  ├─ Select Dispute────►│                   │                  │
  │                     │                   │                  │
  │   ┌─────────────────┴───────────────────────────────────┐   │
  │   │ Dispute Detail View                                 │   │
  │   │ - Contract details                                  │   │
  │   │ - Escrow status                                     │   │
  │   │ - Chat history                                      │   │
  │   │ - Evidence from both parties                        │   │
  │   │ - Timeline of events                                │   │
  │   └─────────────────────┬───────────────────────────────┘   │
  │                         │                   │                  │
  │   ┌─────────────────────┴───────────────┐   │                  │
  │   │ Resolution Options                  │   │                  │
  │   │ 1. Release to Caregiver (default)   │   │                  │
  │   │ 2. Refund to Family                 │   │                  │
  │   │ 3. Split (custom %)                 │   │                  │
  │   │ 4. Hold for investigation           │   │                  │
  │   └─────────────────────┬───────────────┘   │                  │
  │                         │                   │                  │
  ├─ Choose Resolution─────►│                   │                  │
  │                         │                   │                  │
  │   ┌─────────────────────┴───────────────────────┐             │
  │   │ Resolution Confirmation                     │             │
  │   │ - Resolution type                           │             │
  │   │ - Amount breakdown                          │             │
  │   │ - Reason (required)                         │             │
  │   │ - Notify parties checkbox                   │             │
  │   │ - Warning: This action is irreversible      │             │
  │   └─────────────────────┬───────────────────────┘             │
  │                         │                   │                  │
  ├─ Confirm Resolution────►│                   │                  │
  │                         │                   │                  │
  │                         ├─ Validate admin   │                  │
  │                         ├─ Validate escrow  │                  │
  │                         │                   │                  │
  │                         ├─ Process Stripe Transfer           │
  │                         │                   │                  │
  │                         ├─ Update Contract.status            │
  │                         ├─ Update EscrowPayment.status       │
  │                         ├─ Create AdminAction                │
  │                         │                   │                  │
  │                         ├─ Send Notification─────────────────►│
  │                         ├─ Send Notification─────────────────►│
  │                         │                   │                  │
  │◄── Success Message──────┤                   │                  │
  │                         │                   │                  │
```

### 9.3 KYC Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   KYC VERIFICATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Admin                    System                 Didit           Caregiver
  │                         │                     │                  │
  │                         │◄────────────────────┤                  │
  │                         │  KYC Webhook        │                  │
  │                         │  (session complete) │                  │
  │                         │                     │                  │
  │                         ├─ Store KYC data     │                  │
  │                         ├─ Update status─────►│                  │
  │                         │  to PENDING_REVIEW  │ Notification     │
  │                         │                     │                  │
  ├─ View Pending KYC──────►│                     │                  │
  │                         │                     │                  │
  │   ┌─────────────────────┴─────────────────────┐                │
  │   │ KYC Review Dashboard                      │                │
  │   │ - Didit verification result               │                │
  │   │ - Confidence score                        │                │
  │   │ - Document images (if available)          │                │
  │   │ - Selfie comparison                       │                │
  │   │ - Profile data                            │                │
  │   │ - Background check status                 │                │
  │   └─────────────────────┬─────────────────────┘                │
  │                         │                     │                  │
  │   ┌─────────────────────┴─────────────────┐                    │
  │   │ Decision Options                      │                    │
  │   │ ✅ Approve - Full verification        │                    │
  │   │ ⚠️ Approve with limits - Basic only   │                    │
  │   │ ❌ Reject - Failed verification       │                    │
  │   │ 🔄 Request re-verification            │                    │
  │   └─────────────────────┬─────────────────┘                    │
  │                         │                     │                  │
  ├─ Make Decision──────────►│                     │                  │
  │                         │                     │                  │
  │                         ├─ Update ProfileCaregiver              │
  │                         ├─ Set verificationStatus               │
  │                         ├─ Create AdminAction                   │
  │                         │                     │                  │
  │                         ├─ If Approved:       │                  │
  │                         │  - Enable profile    │                  │
  │                         │  - Send welcome─────►│                  │
  │                         │                     │ Notification     │
  │                         │                     │                  │
  │                         ├─ If Rejected:       │                  │
  │                         │  - Disable profile   │                  │
  │                         │  - Send reason─────►│                  │
  │                         │                     │ Notification     │
  │                         │                     │                  │
  │◄── Success Message──────┤                     │                  │
  │                         │                     │                  │
```

### 9.4 Refund Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   REFUND PROCESSING FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Admin                    System                 Stripe            User
  │                         │                     │                 │
  ├─ View Payments─────────►│                     │                 │
  │                         │                     │                 │
  ├─ Select Payment────────►│                     │                 │
  │                         │                     │                 │
  │   ┌─────────────────────┴─────────────────────┐                │
  │   │ Payment Detail                           │                │
  │   │ - Payment info                           │                │
  │   │ - User info                              │                │
  │   │ - Token balance                          │                │
  │   │ - Ledger entries                         │                │
  │   │ - Refundable amount                      │                │
  │   └─────────────────────┬─────────────────────┘                │
  │                         │                     │                 │
  ├─ Click "Refund"────────►│                     │                 │
  │                         │                     │                 │
  │   ┌─────────────────────┴─────────────────────┐                │
  │   │ Refund Modal                             │                │
  │   │ - Amount (full/partial)                  │                │
  │   │ - Reason (required)                      │                │
  │   │ - Token deduction checkbox               │                │
  │   │ - Notify user checkbox                   │                │
  │   │ - Warning: Irreversible action           │                │
  │   └─────────────────────┬─────────────────────┘                │
  │                         │                     │                 │
  ├─ Confirm Refund────────►│                     │                 │
  │                         │                     │                 │
  │                         ├─ Validate admin    │                 │
  │                         ├─ Validate payment  │                 │
  │                         │                     │                 │
  │                         ├─ Call Stripe API───►│                 │
  │                         │                     │                 │
  │                         │◄──── Refund Result──┤                 │
  │                         │                     │                 │
  │                         ├─ Update Payment.status               │
  │                         ├─ Update Payment.refundedAt           │
  │                         │                     │                 │
  │                         ├─ If token deduction:                 │
  │                         │  - Deduct from Wallet                │
  │                         │  - Create TokenLedger (DEBIT)        │
  │                         │  - Update PlatformSettings           │
  │                         │                     │                 │
  │                         ├─ Create AdminAction  │                 │
  │                         │                     │                 │
  │                         ├─ Send notification──────────────────►│
  │                         │                     │                 │
  │◄── Success Message──────┤                     │                 │
  │                         │                     │                 │
```

### 9.5 Token Adjustment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   TOKEN ADJUSTMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Admin                    System                 Blockchain        User
  │                         │                     │                 │
  ├─ View Token Stats──────►│                     │                 │
  │                         │                     │                 │
  ├─ Click "Adjust"────────►│                     │                 │
  │                         │                     │                 │
  │   ┌─────────────────────┴─────────────────────┐                │
  │   │ Token Adjustment Form                    │                │
  │   │ - User selection                         │                │
  │   │ - Amount (+/-)                           │                │
  │   │ - Reason (dropdown + custom)             │                │
  │   │ - Description (required)                 │                │
  │   │ - Reference ID (optional)                │                │
  │   │ - Mint/Burn on blockchain checkbox       │                │
  │   └─────────────────────┬─────────────────────┘                │
  │                         │                     │                 │
  ├─ Submit Adjustment──────►│                     │                 │
  │                         │                     │                 │
  │   ┌─────────────────────┴─────────────────────┐                │
  │   │ Confirmation Modal                       │                │
  │   │ - Adjustment details                     │                │
  │   │ - Impact preview                         │                │
  │   │ - Warning: Affects token economics       │                │
  │   │ - Supervisor approval (if required)      │                │
  │   └─────────────────────┬─────────────────────┘                │
  │                         │                     │                 │
  ├─ Confirm────────────────►│                     │                 │
  │                         │                     │                 │
  │                         ├─ Validate admin    │                 │
  │                         ├─ Validate amount   │                 │
  │                         │                     │                 │
  │                         ├─ If blockchain:    │                 │
  │                         │  - Mint/Burn───────►│                 │
  │                         │◄──── Tx Hash────────┤                 │
  │                         │                     │                 │
  │                         ├─ Update Wallet.balance               │
  │                         ├─ Create TokenLedger                  │
  │                         ├─ Update PlatformSettings             │
  │                         │                     │                 │
  │                         ├─ Create AdminAction  │                 │
  │                         │                     │                 │
  │                         ├─ Send notification──────────────────►│
  │                         │                     │                 │
  │◄── Success Message──────┤                     │                 │
  │                         │                     │                 │
```

---

## 10. Audit & Logging

### 10.1 AdminAction Model

```prisma
model AdminAction {
  id              String    @id @default(cuid())
  adminUserId     String
  adminUser       AdminUser @relation(fields: [adminUserId], references: [id])
  
  // Action Details
  action          String    // CREATE, UPDATE, DELETE, VIEW, IMPERSONATE, etc.
  entityType      String    // USER, CONTRACT, PAYMENT, TOKEN, etc.
  entityId        String?   // ID of affected entity
  
  // Data
  oldValue        String?   // JSON of previous state
  newValue        String?   // JSON of new state
  
  // Context
  ipAddress       String?
  userAgent       String?
  reason          String?   // Required for destructive actions
  
  createdAt       DateTime  @default(now())
  
  @@index([adminUserId, createdAt])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### 10.2 Logged Actions

| Action Category | Actions Logged |
|-----------------|----------------|
| **Authentication** | Login, Logout, Failed login, Password change |
| **User Management** | View, Create, Update, Delete, Suspend, Activate, Impersonate |
| **Caregiver Management** | Verify, Reject, Feature, Update stats |
| **Contract Management** | View, Cancel, Complete, Open Dispute, Resolve Dispute |
| **Payment Management** | View, Refund, Release Escrow |
| **Token Management** | Adjust balance, Update price |
| **Moderation** | Approve review, Reject review, Delete message, Warn user |
| **Settings** | Update any setting, Toggle feature |
| **Analytics** | Export data |
| **Admin Management** | Create admin, Update role, Disable admin |

### 10.3 Log Entry Structure

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  adminUser: {
    id: string;
    email: string;
    role: AdminRole;
  };
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  changes?: {
    oldValue: any;
    newValue: any;
  };
  context: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
  reason?: string;
  relatedEntities?: Array<{
    type: string;
    id: string;
  }>;
}

type ActionType = 
  | 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'SUSPEND' | 'ACTIVATE' | 'IMPERSONATE'
  | 'VERIFY' | 'REJECT' | 'FEATURE'
  | 'CANCEL' | 'COMPLETE' | 'DISPUTE' | 'RESOLVE'
  | 'REFUND' | 'RELEASE'
  | 'ADJUST' | 'PRICE_UPDATE'
  | 'APPROVE' | 'WARN'
  | 'EXPORT';

type EntityType =
  | 'USER' | 'PROFILE_FAMILY' | 'PROFILE_CAREGIVER'
  | 'CONTRACT' | 'CONTRACT_ACCEPTANCE'
  | 'PAYMENT' | 'ESCROW_PAYMENT'
  | 'WALLET' | 'TOKEN_LEDGER'
  | 'REVIEW' | 'TIP' | 'CHAT_MESSAGE'
  | 'PLATFORM_SETTINGS' | 'ADMIN_USER';
```

### 10.4 Log Retention Policy

| Log Type | Retention Period | Archive Policy |
|----------|------------------|----------------|
| Admin Actions | 2 years | Archive to cold storage |
| Login History | 1 year | Delete |
| View Actions | 90 days | Delete |
| Export Actions | 2 years | Archive |
| Security Events | 5 years | Permanent archive |

---

## 11. Security Considerations

### 11.1 Authentication Requirements

1. **Strong Password Policy**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Password history check (last 5 passwords)

2. **Two-Factor Authentication (2FA)**
   - Required for SUPER_ADMIN and ADMIN roles
   - Recommended for all roles
   - TOTP (Google Authenticator) or SMS

3. **Session Management**
   - Session timeout: 30 minutes idle
   - Maximum session: 8 hours
   - Concurrent sessions: Maximum 2
   - IP binding for sensitive operations

### 11.2 Authorization Checks

```typescript
// Permission check middleware
async function checkPermission(
  adminUser: AdminUser,
  action: string,
  entityType: string
): Promise<boolean> {
  // Check if admin is active
  if (!adminUser.isActive) {
    throw new Error('Admin account is disabled');
  }
  
  // Check custom permissions override
  if (adminUser.customPermissions) {
    const permissions = JSON.parse(adminUser.customPermissions);
    if (permissions.denied?.includes(`${action}:${entityType}`)) {
      return false;
    }
  }
  
  // Check role-based permissions
  const rolePermissions = PERMISSION_MATRIX[adminUser.role];
  return rolePermissions[`${action}:${entityType}`] ?? false;
}
```

### 11.3 Sensitive Operations

Operations requiring additional verification:

| Operation | Additional Verification |
|-----------|------------------------|
| Delete User | 2FA + Confirmation |
| Process Refund > €100 | 2FA + Supervisor approval |
| Token Adjustment > 1000 | 2FA + Supervisor approval |
| Update Token Price | 2FA + Super Admin approval |
| Impersonate User | 2FA + Reason required |
| Export User Data | Reason required |

### 11.4 IP Whitelisting

```typescript
// Optional IP whitelist for admin access
const ADMIN_IP_WHITELIST = [
  // Office IPs
  '192.168.1.0/24',
  // VPN IPs
  '10.0.0.0/8',
];

async function validateAdminAccess(
  request: NextRequest,
  adminUser: AdminUser
): Promise<boolean> {
  // Skip IP check in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check if IP whitelist is enabled for this admin
  if (adminUser.ipWhitelistEnabled) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0];
    if (!isIpInWhitelist(clientIp, ADMIN_IP_WHITELIST)) {
      logSecurityEvent('UNAUTHORIZED_IP_ACCESS', { adminId: adminUser.id, ip: clientIp });
      return false;
    }
  }
  
  return true;
}
```

### 11.5 Rate Limiting

```typescript
// Admin API rate limits
const ADMIN_RATE_LIMITS = {
  'api/admin/users': { requests: 100, window: '1m' },
  'api/admin/payments/refund': { requests: 10, window: '1m' },
  'api/admin/tokens/adjust': { requests: 5, window: '1m' },
  'api/admin/export': { requests: 3, window: '1h' },
};
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Admin authentication & authorization
- [ ] Admin layout & navigation
- [ ] Dashboard with basic KPIs
- [ ] User list & detail view (read-only)
- [ ] Audit logging infrastructure

### Phase 2: User Management (Week 3-4)

- [ ] User CRUD operations
- [ ] User suspension/activation
- [ ] KYC verification review
- [ ] Impersonation feature
- [ ] User activity timeline

### Phase 3: Financial Operations (Week 5-6)

- [ ] Payment management
- [ ] Refund processing
- [ ] Escrow management
- [ ] Token adjustments
- [ ] Financial reports

### Phase 4: Contract & Moderation (Week 7-8)

- [ ] Contract management
- [ ] Dispute resolution
- [ ] Review moderation
- [ ] Chat moderation
- [ ] User reports

### Phase 5: Advanced Features (Week 9-10)

- [ ] Advanced analytics
- [ ] Export functionality
- [ ] Scheduled reports
- [ ] Platform settings
- [ ] Feature flags

### Phase 6: Polish & Security (Week 11-12)

- [ ] 2FA implementation
- [ ] IP whitelisting
- [ ] Rate limiting
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

## Appendix A: Environment Variables

```env
# Admin Panel
ADMIN_SECRET_KEY=your-admin-secret-key
ADMIN_2FA_REQUIRED=true
ADMIN_IP_WHITELIST_ENABLED=false

# Audit Logging
AUDIT_LOG_RETENTION_DAYS=730
AUDIT_ARCHIVE_ENABLED=true

# Rate Limiting
ADMIN_RATE_LIMIT_ENABLED=true
```

## Appendix B: Error Codes

| Code | Description |
|------|-------------|
| ADMIN_001 | Unauthorized admin access |
| ADMIN_002 | Insufficient permissions |
| ADMIN_003 | Admin account disabled |
| ADMIN_004 | 2FA required |
| ADMIN_005 | IP not whitelisted |
| ADMIN_006 | Rate limit exceeded |
| ADMIN_007 | Invalid confirmation token |
| ADMIN_008 | Action requires supervisor approval |

---

*Document Version: 1.0*
*Last Updated: February 2025*
*Author: IdosoLink Development Team*
