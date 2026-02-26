"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  // User Status
  ACTIVE: { variant: "default", label: "Active" },
  PENDING: { variant: "secondary", label: "Pending" },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  INACTIVE: { variant: "outline", label: "Inactive" },

  // KYC Status
  VERIFIED: { variant: "default", label: "Verified" },
  UNVERIFIED: { variant: "secondary", label: "Unverified" },
  PENDING_VERIFICATION: { variant: "outline", label: "Pending" },
  REJECTED: { variant: "destructive", label: "Rejected" },

  // Contract Status
  DRAFT: { variant: "outline", label: "Draft" },
  PENDING_ACCEPTANCE: { variant: "secondary", label: "Pending Acceptance" },
  PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment" },
  COMPLETED: { variant: "default", label: "Completed" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
  DISPUTED: { variant: "destructive", label: "Disputed" },

  // Payment Status
  PAID: { variant: "default", label: "Paid" },
  FAILED: { variant: "destructive", label: "Failed" },
  REFUNDED: { variant: "outline", label: "Refunded" },

  // Role
  FAMILY: { variant: "default", label: "Family" },
  CAREGIVER: { variant: "secondary", label: "Caregiver" },
  ADMIN: { variant: "default", label: "Admin" },
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: "outline" as BadgeVariant, label: status };
  const displayVariant = variant || config.variant;
  const displayLabel = config.label;

  return (
    <Badge variant={displayVariant} className={cn("font-medium", className)}>
      {displayLabel}
    </Badge>
  );
}
