/**
 * Bloom Design System - Status & Label Constants
 * Centralized mappings for status colors and labels used across careapp
 */

// Status Badge Color Variants (using Bloom design system colors)
export const STATUS_BADGE_VARIANTS = {
  DRAFT: 'bg-muted/10 text-muted-foreground border border-muted/30',
  PENDING_ACCEPTANCE: 'bg-warning/10 text-warning border border-warning/30',
  PENDING_PAYMENT: 'bg-warning/10 text-warning border border-warning/30',
  ACTIVE: 'bg-success/10 text-success border border-success/30',
  COMPLETED: 'bg-primary/10 text-primary border border-primary/30',
  CANCELLED: 'bg-destructive/10 text-destructive border border-destructive/30',
  COUNTER_PROPOSED: 'bg-info/10 text-info border border-info/30',
} as const;

// Status Display Labels (Portuguese)
export const STATUS_LABELS = {
  DRAFT: 'Rascunho',
  PENDING_ACCEPTANCE: 'Aguardando',
  PENDING_PAYMENT: 'Aguard. Pagamento',
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  COUNTER_PROPOSED: 'Contraproposta',
} as const;

// Service Type Labels (Portuguese)
export const SERVICE_TYPE_LABELS = {
  PERSONAL_CARE: 'Cuidados Pessoais',
  MEDICATION: 'Medicação',
  MOBILITY: 'Mobilidade',
  COMPANIONSHIP: 'Companhia',
  MEAL_PREPARATION: 'Refeições',
  LIGHT_HOUSEWORK: 'Domésticas',
  TRANSPORTATION: 'Transporte',
  COGNITIVE_SUPPORT: 'Cognitiva',
  NIGHT_CARE: 'Noturno',
  PALLIATIVE_CARE: 'Paliativos',
  PHYSIOTHERAPY: 'Fisioterapia',
  NURSING_CARE: 'Enfermagem',
} as const;

// Notification Type Labels
export const NOTIFICATION_TYPE_LABELS = {
  ALERT: 'Alerta',
  INFO: 'Informação',
  SUCCESS: 'Sucesso',
  WARNING: 'Aviso',
  ERROR: 'Erro',
} as const;

// Notification Type Badge Variants
export const NOTIFICATION_TYPE_VARIANTS = {
  ALERT: 'bg-destructive/10 text-destructive',
  INFO: 'bg-info/10 text-info',
  SUCCESS: 'bg-success/10 text-success',
  WARNING: 'bg-warning/10 text-warning',
  ERROR: 'bg-destructive/10 text-destructive',
} as const;

// Helper function to get status badge variant
export const getStatusBadgeVariant = (status: string): string => {
  return STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS]
    || STATUS_BADGE_VARIANTS.DRAFT;
};

// Helper function to get status label
export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS]
    || status;
};

// Helper function to get service type label
export const getServiceTypeLabel = (serviceType: string): string => {
  return SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS]
    || serviceType;
};

// Helper function to get notification type variant
export const getNotificationTypeVariant = (type: string): string => {
  return NOTIFICATION_TYPE_VARIANTS[type as keyof typeof NOTIFICATION_TYPE_VARIANTS]
    || NOTIFICATION_TYPE_VARIANTS.INFO;
};
