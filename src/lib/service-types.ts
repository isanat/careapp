/**
 * Service type translations from English to Portuguese
 */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  PERSONAL_CARE: 'Cuidados Pessoais',
  MEDICATION: 'Administração de Medicação',
  MOBILITY: 'Ajuda com Mobilidade',
  COMPANIONSHIP: 'Companhia e Conversa',
  MEAL_PREPARATION: 'Preparo de Refeições',
  LIGHT_HOUSEWORK: 'Tarefas Domésticas',
  TRANSPORTATION: 'Transporte',
  COGNITIVE_SUPPORT: 'Estimulação Cognitiva',
  NIGHT_CARE: 'Cuidados Noturnos',
  PALLIATIVE_CARE: 'Cuidados Paliativos',
  PHYSIOTHERAPY: 'Fisioterapia',
  NURSING_CARE: 'Enfermagem',
};

export function getServiceTypeLabel(serviceType: string): string {
  return SERVICE_TYPE_LABELS[serviceType] || serviceType;
}

export function getServiceTypeLabels(serviceTypes: string[]): string[] {
  return serviceTypes.map(getServiceTypeLabel);
}
