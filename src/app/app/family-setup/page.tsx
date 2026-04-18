"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconLogo,
  IconCheck,
  IconAlert,
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconUser,
  IconHeart,
  IconPhone,
} from "@/components/icons";
import { APP_NAME, SERVICE_TYPES } from "@/lib/constants";

const MOBILITY_LEVELS = [
  { value: "independente", label: "Independente" },
  { value: "parcial", label: "Mobilidade Parcial" },
  { value: "cadeira_de_rodas", label: "Cadeira de Rodas" },
  { value: "acamado", label: "Acamado" },
];

const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPES).map(
  ([id, label]) => ({
    id,
    label,
  }),
);

const LANGUAGE_OPTIONS = [
  { id: "pt", label: "Portugues" },
  { id: "en", label: "Ingles" },
  { id: "es", label: "Espanhol" },
  { id: "fr", label: "Frances" },
  { id: "de", label: "Alemao" },
  { id: "it", label: "Italiano" },
  { id: "uk", label: "Ucraniano" },
];

const SCHEDULE_DAYS = [
  { id: "segunda", label: "Segunda-feira" },
  { id: "terca", label: "Terça-feira" },
  { id: "quarta", label: "Quarta-feira" },
  { id: "quinta", label: "Quinta-feira" },
  { id: "sexta", label: "Sexta-feira" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const SCHEDULE_TIMES = [
  { id: "manha", label: "Manhã (6h-12h)" },
  { id: "tarde", label: "Tarde (12h-18h)" },
  { id: "noite", label: "Noite (18h-00h)" },
  { id: "madrugada", label: "Madrugada (00h-6h)" },
];

const SCHEDULE_DURATION = [
  { id: "part_time", label: "Part-time (até 4h/dia)" },
  { id: "full_time", label: "Full-time (4-8h/dia)" },
  { id: "24h", label: "24/7 (incluindo fins de semana)" },
];

const MEDICAL_CONDITIONS = [
  { id: "diabetes", label: "Diabetes" },
  { id: "hipertensao", label: "Hipertensão" },
  { id: "alzheimer", label: "Alzheimer/Demência" },
  { id: "parkinson", label: "Parkinson" },
  { id: "avc", label: "AVC/Sequelas" },
  { id: "insuficiencia_cardiaca", label: "Insuficiência Cardíaca" },
  { id: "doenca_pulmonar", label: "Doença Pulmonar" },
  { id: "artrite", label: "Artrite/Osteoporose" },
  { id: "cancer", label: "Câncer em Tratamento" },
  { id: "incontinencia", label: "Incontinência" },
  { id: "depressao", label: "Depressão/Ansiedade" },
  { id: "outro", label: "Outra (descrever abaixo)" },
];

const DIETARY_RESTRICTIONS = [
  { id: "diabetes_diet", label: "Dieta para Diabéticos" },
  { id: "sem_sodio", label: "Sem Sódio" },
  { id: "hipoprotei", label: "Hipoproteica" },
  { id: "sem_gluten", label: "Sem Glúten" },
  { id: "sem_lactose", label: "Sem Lactose" },
  { id: "vegetariana", label: "Vegetariana" },
  { id: "vegana", label: "Vegana" },
  { id: "alergias", label: "Alergias (descrever abaixo)" },
  { id: "disfagia", label: "Disfagia (dificuldade de engolir)" },
  { id: "purê", label: "Necessita Comida em Purê" },
  { id: "nenhuma", label: "Nenhuma" },
];

function FamilySetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userId = searchParams.get("userId");

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Step 1: Dados do Idoso
    elderName: "",
    elderAge: "",
    mobilityLevel: "",
    medicalConditions: [] as string[],
    medicalConditionsNotes: "",
    dietaryRestrictions: [] as string[],
    dietaryRestrictionsNotes: "",
    // Step 2: Necessidades de Cuidado
    servicesNeeded: [] as string[],
    preferredScheduleDays: [] as string[],
    preferredScheduleTimes: [] as string[],
    preferredScheduleDuration: [] as string[],
    preferredLanguages: [] as string[],
    // Step 3: Contato de Emergencia
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    city: "",
    additionalNotes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated" && !userId) {
      router.push("/auth/register?role=family");
    }
  }, [status, userId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(serviceId)
        ? prev.servicesNeeded.filter((s) => s !== serviceId)
        : [...prev.servicesNeeded, serviceId],
    }));
  };

  const handleLanguageToggle = (langId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredLanguages: prev.preferredLanguages.includes(langId)
        ? prev.preferredLanguages.filter((l) => l !== langId)
        : [...prev.preferredLanguages, langId],
    }));
  };

  const handleScheduleDayToggle = (dayId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredScheduleDays: prev.preferredScheduleDays.includes(dayId)
        ? prev.preferredScheduleDays.filter((d) => d !== dayId)
        : [...prev.preferredScheduleDays, dayId],
    }));
  };

  const handleScheduleTimeToggle = (timeId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredScheduleTimes: prev.preferredScheduleTimes.includes(timeId)
        ? prev.preferredScheduleTimes.filter((t) => t !== timeId)
        : [...prev.preferredScheduleTimes, timeId],
    }));
  };

  const handleScheduleDurationToggle = (durationId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredScheduleDuration: prev.preferredScheduleDuration.includes(
        durationId,
      )
        ? prev.preferredScheduleDuration.filter((d) => d !== durationId)
        : [...prev.preferredScheduleDuration, durationId],
    }));
  };

  const handleMedicalConditionToggle = (conditionId: string) => {
    setFormData((prev) => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(conditionId)
        ? prev.medicalConditions.filter((c) => c !== conditionId)
        : [...prev.medicalConditions, conditionId],
    }));
  };

  const handleDietaryRestrictionToggle = (restrictionId: string) => {
    setFormData((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restrictionId)
        ? prev.dietaryRestrictions.filter((d) => d !== restrictionId)
        : [...prev.dietaryRestrictions, restrictionId],
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.elderName) {
        setError("Por favor, informe o nome do idoso");
        return;
      }
    }
    if (step === 2) {
      if (formData.servicesNeeded.length === 0) {
        setError("Selecione pelo menos um tipo de servico");
        return;
      }
      if (formData.preferredScheduleDays.length === 0) {
        setError("Selecione pelo menos um dia da semana");
        return;
      }
      if (formData.preferredScheduleTimes.length === 0) {
        setError("Selecione pelo menos um horário");
        return;
      }
      if (formData.preferredScheduleDuration.length === 0) {
        setError("Selecione pelo menos um tipo de cuidado");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
      setError("Por favor, preencha o contato de emergencia");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elderName: formData.elderName,
          elderAge: formData.elderAge ? parseInt(formData.elderAge) : null,
          elderNeeds: JSON.stringify({
            mobilityLevel: formData.mobilityLevel,
            medicalConditions: formData.medicalConditions,
            medicalConditionsNotes: formData.medicalConditionsNotes,
            dietaryRestrictions: formData.dietaryRestrictions,
            dietaryRestrictionsNotes: formData.dietaryRestrictionsNotes,
            servicesNeeded: formData.servicesNeeded,
            preferredScheduleDays: formData.preferredScheduleDays,
            preferredScheduleTimes: formData.preferredScheduleTimes,
            preferredScheduleDuration: formData.preferredScheduleDuration,
            preferredLanguages: formData.preferredLanguages,
            additionalNotes: formData.additionalNotes,
          }),
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          city: formData.city,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao salvar perfil");
      }

      // Redirect to verification
      router.push(`/app/verify?userId=${userId || session?.user?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <div className="w-full max-w-2xl bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card text-center space-y-6 py-12">
          <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            Carregando...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2"
          >
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter leading-none">
              Configure o Cuidado
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Familia - {APP_NAME}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm transition-all ${
                    s < step
                      ? "bg-success text-success-foreground shadow-md"
                      : s === step
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {s < step ? <IconCheck className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full mx-2 transition-all ${
                      s < step ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="grid grid-cols-3 text-center gap-4 px-4">
            <div>
              <p
                className={`text-[10px] font-display font-black uppercase tracking-widest transition-colors ${
                  step >= 1 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Dados do Idoso
              </p>
            </div>
            <div>
              <p
                className={`text-[10px] font-display font-black uppercase tracking-widest transition-colors ${
                  step >= 2 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Necessidades
              </p>
            </div>
            <div>
              <p
                className={`text-[10px] font-display font-black uppercase tracking-widest transition-colors ${
                  step >= 3 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Emergencia
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="space-y-8">
          {error && (
            <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
              <IconAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-display font-bold text-foreground text-sm">
                  Erro
                </p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Dados do Idoso */}
          {step === 1 && (
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-8">
              <section className="space-y-4">
                <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                  Dados do Idoso
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Informacoes sobre a pessoa que recebera os cuidados
                </p>
              </section>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="elderName"
                    className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                  >
                    Nome do Idoso *
                  </Label>
                  <Input
                    id="elderName"
                    name="elderName"
                    placeholder="Nome completo"
                    value={formData.elderName}
                    onChange={handleInputChange}
                    className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="elderAge"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                    >
                      Idade
                    </Label>
                    <Input
                      id="elderAge"
                      name="elderAge"
                      type="number"
                      min="0"
                      max="150"
                      placeholder="Ex: 78"
                      value={formData.elderAge}
                      onChange={handleInputChange}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="mobilityLevel"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                    >
                      Nivel de Mobilidade
                    </Label>
                    <Select
                      value={formData.mobilityLevel}
                      onValueChange={(v) =>
                        setFormData((p) => ({ ...p, mobilityLevel: v }))
                      }
                    >
                      <SelectTrigger className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOBILITY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                      Condições Médicas
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2 mb-4">
                      Selecione todas as condições que se aplicam
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MEDICAL_CONDITIONS.map((condition) => (
                      <label
                        key={condition.id}
                        className={`flex items-center gap-3 p-3 border rounded-2xl text-sm cursor-pointer transition-all ${
                          formData.medicalConditions.includes(condition.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Checkbox
                          checked={formData.medicalConditions.includes(
                            condition.id,
                          )}
                          onCheckedChange={() =>
                            handleMedicalConditionToggle(condition.id)
                          }
                        />
                        <span className="text-sm text-foreground">
                          {condition.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.medicalConditions.includes("outro") && (
                    <Textarea
                      placeholder="Descreva outras condições médicas..."
                      value={formData.medicalConditionsNotes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicalConditionsNotes: e.target.value,
                        })
                      }
                      rows={2}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                      Restrições Alimentares
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2 mb-4">
                      Selecione todas as restrições alimentares
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DIETARY_RESTRICTIONS.map((restriction) => (
                      <label
                        key={restriction.id}
                        className={`flex items-center gap-3 p-3 border rounded-2xl text-sm cursor-pointer transition-all ${
                          formData.dietaryRestrictions.includes(restriction.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Checkbox
                          checked={formData.dietaryRestrictions.includes(
                            restriction.id,
                          )}
                          onCheckedChange={() =>
                            handleDietaryRestrictionToggle(restriction.id)
                          }
                        />
                        <span className="text-sm text-foreground">
                          {restriction.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.dietaryRestrictions.includes("alergias") && (
                    <Textarea
                      placeholder="Descreva as alergias e restrições específicas..."
                      value={formData.dietaryRestrictionsNotes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dietaryRestrictionsNotes: e.target.value,
                        })
                      }
                      rows={2}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Necessidades de Cuidado */}
          {step === 2 && (
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-8">
              <section className="space-y-4">
                <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                  Necessidades de Cuidado
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Que tipos de cuidado a sua familia precisa?
                </p>
              </section>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                    Tipos de Servico Necessarios *
                  </Label>
                  <div className="space-y-3">
                    {SERVICE_TYPE_OPTIONS.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                          formData.servicesNeeded.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Checkbox
                          checked={formData.servicesNeeded.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceToggle(service.id)
                          }
                        />
                        <span className="text-sm font-medium text-foreground">
                          {service.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h5 className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-6">
                    Horário Preferido
                  </h5>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Dias da Semana
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SCHEDULE_DAYS.map((day) => (
                          <label
                            key={day.id}
                            className={`flex items-center gap-3 p-3 border rounded-2xl text-sm cursor-pointer transition-all ${
                              formData.preferredScheduleDays.includes(day.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <Checkbox
                              checked={formData.preferredScheduleDays.includes(
                                day.id,
                              )}
                              onCheckedChange={() =>
                                handleScheduleDayToggle(day.id)
                              }
                            />
                            <span className="text-sm text-foreground">
                              {day.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Horários
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SCHEDULE_TIMES.map((time) => (
                          <label
                            key={time.id}
                            className={`flex items-center gap-3 p-3 border rounded-2xl text-sm cursor-pointer transition-all ${
                              formData.preferredScheduleTimes.includes(time.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <Checkbox
                              checked={formData.preferredScheduleTimes.includes(
                                time.id,
                              )}
                              onCheckedChange={() =>
                                handleScheduleTimeToggle(time.id)
                              }
                            />
                            <span className="text-sm text-foreground">
                              {time.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Tipo de Cuidado
                      </Label>
                      <div className="space-y-3">
                        {SCHEDULE_DURATION.map((duration) => (
                          <label
                            key={duration.id}
                            className={`flex items-center gap-3 p-3 border rounded-2xl text-sm cursor-pointer transition-all ${
                              formData.preferredScheduleDuration.includes(
                                duration.id,
                              )
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <Checkbox
                              checked={formData.preferredScheduleDuration.includes(
                                duration.id,
                              )}
                              onCheckedChange={() =>
                                handleScheduleDurationToggle(duration.id)
                              }
                            />
                            <span className="text-sm text-foreground">
                              {duration.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <Label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-4 block">
                    Idiomas Preferidos
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <label
                        key={lang.id}
                        className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all ${
                          formData.preferredLanguages.includes(lang.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Checkbox
                          checked={formData.preferredLanguages.includes(
                            lang.id,
                          )}
                          onCheckedChange={() => handleLanguageToggle(lang.id)}
                        />
                        <span className="text-sm text-foreground">
                          {lang.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contato de Emergencia */}
          {step === 3 && (
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-8">
              <section className="space-y-4">
                <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
                  Contato de Emergencia
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Informacoes de contato para situacoes de emergencia
                </p>
              </section>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="emergencyContactName"
                    className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                  >
                    Nome do Contato *
                  </Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    placeholder="Nome completo do contato de emergencia"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactPhone"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                    >
                      Telefone *
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      placeholder="+351 912 345 678"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactRelationship"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                    >
                      Parentesco
                    </Label>
                    <Input
                      id="emergencyContactRelationship"
                      name="emergencyContactRelationship"
                      placeholder="Ex: Filho(a), Esposo(a)..."
                      value={formData.emergencyContactRelationship}
                      onChange={handleInputChange}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                    >
                      Endereco / Cidade
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Ex: Lisboa, Porto, Coimbra..."
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2 mt-6">
                    <Label
                      htmlFor="additionalNotes"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                    >
                      Notas Adicionais
                    </Label>
                    <Textarea
                      id="additionalNotes"
                      name="additionalNotes"
                      placeholder="Qualquer informacao adicional relevante para o cuidador..."
                      value={formData.additionalNotes}
                      onChange={handleInputChange}
                      rows={3}
                      className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-border pt-6">
                  <h4 className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-4">
                    Resumo
                  </h4>
                  <div className="bg-secondary rounded-2xl p-5 space-y-3 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Idoso
                      </span>
                      <span className="text-sm font-display font-bold text-foreground">
                        {formData.elderName}
                        {formData.elderAge ? `, ${formData.elderAge} anos` : ""}
                      </span>
                    </div>
                    {formData.mobilityLevel && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Mobilidade
                        </span>
                        <span className="text-sm font-display font-bold text-foreground">
                          {
                            MOBILITY_LEVELS.find(
                              (l) => l.value === formData.mobilityLevel,
                            )?.label
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Servicos
                      </span>
                      <span className="text-sm font-display font-bold text-foreground">
                        {formData.servicesNeeded.length} selecionados
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Emergencia
                      </span>
                      <span className="text-sm font-display font-bold text-foreground">
                        {formData.emergencyContactName || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError("");
                      setStep(step - 1);
                    }}
                    className="flex-1 rounded-2xl"
                  >
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
                {step < 3 ? (
                  <Button onClick={handleNext} className="flex-1 rounded-2xl">
                    Continuar
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl"
                  >
                    {isLoading ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />A
                        guardar...
                      </>
                    ) : (
                      <>
                        Completar Registo
                        <IconArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground">
            Precisa de ajuda?{" "}
            <Link href="/ajuda" className="text-primary hover:underline">
              Fale connosco
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function FamilySetupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
          <div className="w-full max-w-2xl bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card text-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        </main>
      }
    >
      <FamilySetupContent />
    </Suspense>
  );
}
