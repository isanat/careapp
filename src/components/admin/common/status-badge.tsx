"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "verified"
  | "unverified"
  | "rejected"
  | "disputed"
  | "completed"
  | "cancelled"
  | "processing"
  | "failed"
  | "refunded";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  active: { label: "Ativo", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  inactive: { label: "Inativo", variant: "secondary" },
  pending: { label: "Pendente", variant: "secondary", className: "bg-amber-500 hover:bg-amber-600 text-white" },
  suspended: { label: "Suspenso", variant: "destructive" },
  verified: { label: "Verificado", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  unverified: { label: "Não verificado", variant: "outline" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  disputed: { label: "Em disputa", variant: "destructive", className: "bg-orange-500 hover:bg-orange-600" },
  completed: { label: "Concluído", variant: "default", className: "bg-green-500 hover:bg-green-600" },
  cancelled: { label: "Cancelado", variant: "secondary" },
  processing: { label: "Processando", variant: "secondary", className: "bg-blue-500 hover:bg-blue-600 text-white" },
  failed: { label: "Falhou", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "outline" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
