export function parseElderNeeds(raw: string): string {
  if (!raw) return "";
  try {
    const data = JSON.parse(raw);
    const parts: string[] = [];
    const mobilityLabels: Record<string, string> = {
      total: "Sem mobilidade",
      parcial: "Mobilidade parcial",
      boa: "Boa mobilidade",
    };
    if (data.mobilityLevel)
      parts.push(`Mobilidade: ${mobilityLabels[data.mobilityLevel] || data.mobilityLevel}`);
    const condLabels: Record<string, string> = {
      cancer: "Cancro",
      artrite: "Artrite",
      avc: "AVC",
      diabetes: "Diabetes",
      demencia: "Demência",
      alzheimer: "Alzheimer",
      parkinson: "Parkinson",
      insuficiencia_cardiaca: "Insuficiência cardíaca",
    };
    if (Array.isArray(data.medicalConditions) && data.medicalConditions.length > 0)
      parts.push(`Condições médicas: ${data.medicalConditions.map((c: string) => condLabels[c] || c).join(", ")}`);
    if (data.medicalConditionsNotes)
      parts.push(`Notas médicas: ${data.medicalConditionsNotes}`);
    if (Array.isArray(data.dietaryRestrictions) && data.dietaryRestrictions.length > 0)
      parts.push(`Restrições alimentares: ${data.dietaryRestrictions.join(", ")}`);
    if (Array.isArray(data.servicesNeeded) && data.servicesNeeded.length > 0) {
      const svcLabels: Record<string, string> = {
        personal_care: "Cuidados pessoais",
        medication: "Medicação",
        meal_preparation: "Preparação de refeições",
        mobility: "Mobilidade",
        companionship: "Companhia",
        cognitive_support: "Estimulação cognitiva",
        night_care: "Cuidados noturnos",
        transportation: "Transporte",
      };
      parts.push(`Serviços necessários: ${data.servicesNeeded.map((s: string) => svcLabels[s] || s).join(", ")}`);
    }
    if (data.additionalNotes) parts.push(`Notas adicionais: ${data.additionalNotes}`);
    return parts.length > 0 ? parts.join("\n") : raw;
  } catch {
    return raw;
  }
}

export function validateNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const digits = nif.split("").map(Number);
  const checkSum = digits
    .slice(0, 8)
    .reduce((sum, d, i) => sum + d * (9 - i), 0);
  const remainder = checkSum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  return checkDigit === digits[8];
}

export function formatPhonePT(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("351")) {
    const num = digits.slice(3);
    if (num.length <= 3) return `+351 ${num}`;
    if (num.length <= 6) return `+351 ${num.slice(0, 3)} ${num.slice(3)}`;
    return `+351 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 9)}`;
  }
  if (digits.length <= 3) return `+351 ${digits}`;
  if (digits.length <= 6)
    return `+351 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}
