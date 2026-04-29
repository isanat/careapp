/**
 * Profile Constants
 * Centralized constants for profile-related forms and data
 */

/**
 * Available service types for caregivers
 * Used in: profile/page.tsx, profile/setup/page.tsx, family/demands/new/page.tsx
 */
export const SERVICE_TYPES = [
  { id: "PERSONAL_CARE", label: "Cuidados Pessoais" },
  { id: "MEDICATION", label: "Medicação" },
  { id: "MOBILITY", label: "Mobilidade" },
  { id: "COMPANIONSHIP", label: "Companhia" },
  { id: "MEAL_PREPARATION", label: "Refeições" },
  { id: "LIGHT_HOUSEWORK", label: "Tarefas Domésticas" },
  { id: "TRANSPORTATION", label: "Transporte" },
  { id: "COGNITIVE_SUPPORT", label: "Estimulação Cognitiva" },
  { id: "NIGHT_CARE", label: "Cuidados Noturnos" },
  { id: "PALLIATIVE_CARE", label: "Cuidados Paliativos" },
  { id: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { id: "NURSING_CARE", label: "Enfermagem" },
];

/**
 * Available document types for identification
 * Used in: profile/page.tsx
 */
export const DOCUMENT_TYPES = [
  {
    id: "CC",
    label: "Cartão de Cidadão",
    placeholder: "12345678 1 ZZ2",
    maxLength: 15,
  },
  {
    id: "PASSPORT",
    label: "Passaporte",
    placeholder: "AA123456",
    maxLength: 9,
  },
  {
    id: "RESIDENCE",
    label: "Título de Residência",
    placeholder: "Numero do titulo",
    maxLength: 20,
  },
];

/**
 * Helper function to get service type label by id
 */
export function getServiceTypeLabel(id: string): string {
  return SERVICE_TYPES.find((s) => s.id === id)?.label || id;
}

/**
 * Helper function to get document type config by id
 */
export function getDocumentTypeConfig(id: string) {
  return DOCUMENT_TYPES.find((d) => d.id === id);
}
