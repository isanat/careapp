"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconContract,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconClock,
  IconHeart,
  IconUser,
  IconPhone,
  IconAlertCircle,
  IconCalendar,
  IconLoader2,
  IconInfo,
} from "@/components/icons";
import { SERVICE_TYPES, CONTRACT_FEE_EUR_CENTS } from "@/lib/constants";

interface CaregiverInfo {
  id: string;
  name: string;
  title: string;
  averageRating: number;
  hourlyRateEur: number;
}

// Care need option with emoji icon
interface CareOption {
  key: string;
  label: string;
  icon: string;
}

const CARE_NEEDS: CareOption[] = [
  { key: "PERSONAL_CARE", label: "Higiene Pessoal", icon: "\uD83D\uDEC1" },
  { key: "MEDICATION", label: "Medicacao", icon: "\uD83D\uDC8A" },
  { key: "MOBILITY", label: "Mobilidade", icon: "\uD83E\uDDBD" },
  { key: "COMPANIONSHIP", label: "Companhia", icon: "\uD83E\uDDE1" },
  { key: "MEAL_PREPARATION", label: "Refeicoes", icon: "\uD83C\uDF73" },
  { key: "LIGHT_HOUSEWORK", label: "Tarefas Domesticas", icon: "\uD83E\uDDF9" },
  { key: "TRANSPORTATION", label: "Transporte", icon: "\uD83D\uDE97" },
  { key: "COGNITIVE_SUPPORT", label: "Estimulacao Cognitiva", icon: "\uD83E\uDDE9" },
  { key: "NIGHT_CARE", label: "Cuidados Noturnos", icon: "\uD83C\uDF19" },
  { key: "NURSING_CARE", label: "Enfermagem", icon: "\uD83C\uDFE5" },
];

const SCHEDULE_OPTIONS = [
  { key: "morning", label: "Manha", desc: "06h - 12h", icon: "\u2600\uFE0F" },
  { key: "afternoon", label: "Tarde", desc: "12h - 18h", icon: "\uD83C\uDF24\uFE0F" },
  { key: "evening", label: "Noite", desc: "18h - 22h", icon: "\uD83C\uDF1C" },
  { key: "overnight", label: "Pernoite", desc: "22h - 06h", icon: "\uD83C\uDF19" },
];

const FREQUENCY_OPTIONS = [
  { key: "daily", label: "Todos os dias", hours: 35 },
  { key: "weekdays", label: "Dias uteis (seg-sex)", hours: 25 },
  { key: "3x", label: "3x por semana", hours: 15 },
  { key: "2x", label: "2x por semana", hours: 10 },
  { key: "weekends", label: "Fins de semana", hours: 10 },
  { key: "custom", label: "Personalizado", hours: 0 },
];

function NewContractContent() {
  const searchParams = useSearchParams();
  const caregiverId = searchParams.get("caregiverId");
  const { status } = useSession();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  // Caregiver
  const [caregiver, setCaregiver] = useState<CaregiverInfo | null>(null);
  const [caregiverLoading, setCaregiverLoading] = useState(true);
  const [caregiverError, setCaregiverError] = useState<string | null>(null);

  // Step 1: Care needs
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  // Step 2: About the person receiving care
  const [elderName, setElderName] = useState("");
  const [elderAge, setElderAge] = useState("");
  const [elderConditions, setElderConditions] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Step 3: Schedule
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [customHours, setCustomHours] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 4: Review & edit
  const [hourlyRate, setHourlyRate] = useState(28); // in euros, not cents
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [platformFeePercent, setPlatformFeePercent] = useState(10); // Default 10%

  // Fetch caregiver data and platform settings
  useEffect(() => {
    async function fetchCaregiver() {
      if (!caregiverId) {
        setCaregiverLoading(false);
        setCaregiverError("ID do cuidador nao fornecido.");
        return;
      }
      try {
        setCaregiverLoading(true);
        const res = await apiFetch(`/api/caregivers/${caregiverId}`);
        if (!res.ok) {
          setCaregiverError(res.status === 404 ? "Cuidador nao encontrado." : "Erro ao carregar cuidador.");
          return;
        }
        const data = await res.json();
        const c = data.caregiver;
        setCaregiver({ id: c.id, name: c.name, title: c.title, averageRating: c.averageRating, hourlyRateEur: c.hourlyRateEur });
        // Convert from cents to euros
        setHourlyRate((c.hourlyRateEur || 2800) / 100);
      } catch {
        setCaregiverError("Erro inesperado ao carregar cuidador.");
      } finally {
        setCaregiverLoading(false);
      }
    }
    fetchCaregiver();

    // Fetch dynamic platform fee percentage
    apiFetch('/api/admin/settings')
      .then(res => res.ok ? res.json() : { platformFeePercent: 10 })
      .then(data => setPlatformFeePercent(data.platformFeePercent || 10))
      .catch(() => setPlatformFeePercent(10));
  }, [caregiverId]);

  // Calculate actual hours based on dates
  const calculateTotalHours = () => {
    if (!startDate) return 0;

    const hoursPerWeek = frequency === "custom"
      ? customHours
      : FREQUENCY_OPTIONS.find(f => f.key === frequency)?.hours || 10;

    const start = new Date(startDate + "T00:00:00");
    const end = endDate ? new Date(endDate + "T00:00:00") : start;

    // Add 1 day to include the end date
    const endWithInclusion = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    const diffMs = endWithInclusion.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Count weekdays if weekdays frequency
    let totalDays = diffDays;
    if (frequency === "weekdays") {
      totalDays = 0;
      let current = new Date(start);
      while (current < endWithInclusion) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
          totalDays++;
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (frequency === "weekends") {
      totalDays = 0;
      let current = new Date(start);
      while (current < endWithInclusion) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          totalDays++;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    const weeks = totalDays / 7;
    return Math.round(weeks * hoursPerWeek * 10) / 10; // Round to 1 decimal
  };

  // Calculated values
  const hoursPerWeek = frequency === "custom"
    ? customHours
    : FREQUENCY_OPTIONS.find(f => f.key === frequency)?.hours || 10;
  const totalHours = calculateTotalHours();
  const totalEur = totalHours * hourlyRate;
  const platformFee = totalEur * (platformFeePercent / 100);
  const contractFee = CONTRACT_FEE_EUR_CENTS / 100;
  const caregiverReceives = totalEur - platformFee - contractFee;

  // Build description from questionnaire answers
  const buildDescription = () => {
    const parts: string[] = [];
    const needLabels = selectedNeeds.map(k => CARE_NEEDS.find(n => n.key === k)?.label).filter(Boolean);
    if (needLabels.length) parts.push(`Cuidados necessarios: ${needLabels.join(", ")}`);
    if (elderName) parts.push(`Nome do idoso(a): ${elderName}`);
    if (elderAge) parts.push(`Idade: ${elderAge} anos`);
    if (elderConditions) parts.push(`Condicoes/observacoes: ${elderConditions}`);
    const schedLabels = selectedSchedule.map(k => SCHEDULE_OPTIONS.find(s => s.key === k)?.label).filter(Boolean);
    if (schedLabels.length) parts.push(`Horarios: ${schedLabels.join(", ")}`);
    const freqLabel = FREQUENCY_OPTIONS.find(f => f.key === frequency)?.label;
    if (freqLabel) parts.push(`Frequencia: ${freqLabel} (~${hoursPerWeek}h/semana)`);
    if (emergencyName) parts.push(`Contato de emergencia: ${emergencyName} (${emergencyPhone})`);
    if (additionalNotes) parts.push(`Observacoes: ${additionalNotes}`);
    return parts.join("\n");
  };

  const handleSubmit = async () => {
    if (!caregiver) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const title = `Cuidado ${elderName ? `para ${elderName}` : `com ${caregiver.name}`}`;
      const res = await apiFetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caregiverUserId: caregiver.id,
          title: title.slice(0, 200),
          hourlyRateEur: Math.round(hourlyRate * 100), // Convert from euros to cents
          totalHours: Math.round(totalHours),
          description: buildDescription().slice(0, 2000),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          serviceTypes: selectedNeeds.join(",") || undefined,
          hoursPerWeek: Math.round(hoursPerWeek),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.code === "KYC_REQUIRED") {
          throw new Error("Voce precisa completar a verificacao de identidade (KYC) antes de criar um contrato.");
        }
        if (errorData.code === "CAREGIVER_KYC_PENDING") {
          throw new Error("O cuidador ainda nao completou a verificacao de identidade.");
        }
        throw new Error(errorData.error || "Erro ao criar contrato.");
      }

      const data = await res.json();
      setContractId(data.contractId);
      setStep(5);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNeed = (key: string) => {
    setSelectedNeeds(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSchedule = (key: string) => {
    setSelectedSchedule(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Error/loading states
  if (caregiverError) {
    return (
      <div className="text-center py-16 px-6 max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/20">
          <IconAlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Erro</h2>
        <p className="text-muted-foreground text-sm mb-6">{caregiverError}</p>
        <Button asChild className="rounded-xl h-12 px-8">
          <Link href="/app/search">Voltar para busca</Link>
        </Button>
      </div>
    );
  }

  if (caregiverLoading || !caregiver) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Caregiver Header - compact */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {caregiver.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">Contrato com {caregiver.name}</p>
          <p className="text-xs text-muted-foreground">{caregiver.title}</p>
        </div>
        <Badge className="ml-auto flex-shrink-0 text-xs">{caregiver.hourlyRateEur}/h</Badge>
      </div>

      {/* Progress Bar */}
      {step <= totalSteps && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ====== STEP 1: Care Needs ====== */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">De que cuidados precisa?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione tudo que se aplica. Isto ajuda o cuidador a se preparar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {CARE_NEEDS.map(need => {
              const selected = selectedNeeds.includes(need.key);
              return (
                <button
                  key={need.key}
                  onClick={() => toggleNeed(need.key)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{need.icon}</span>
                  <span className={`text-sm font-medium leading-tight ${selected ? "text-primary" : ""}`}>
                    {need.label}
                  </span>
                  {selected && <IconCheck className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={selectedNeeds.length === 0}
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-xl"
          >
            Continuar
            <IconArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {/* ====== STEP 2: About the Elderly ====== */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">Sobre o idoso(a)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Informacoes basicas para o cuidador conhecer melhor.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Nome do idoso(a)</Label>
                <Input
                  value={elderName}
                  onChange={e => setElderName(e.target.value)}
                  placeholder="Maria da Silva"
                  className="h-12 rounded-xl text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Idade</Label>
                <Input
                  type="number"
                  value={elderAge}
                  onChange={e => setElderAge(e.target.value)}
                  placeholder="75"
                  min={1}
                  max={120}
                  className="h-12 rounded-xl text-base text-center"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Condicoes ou observacoes importantes</Label>
              <Textarea
                value={elderConditions}
                onChange={e => setElderConditions(e.target.value)}
                placeholder="Ex: Diabetes tipo 2, dificuldade de locomocao, toma medicacao as 8h e 20h..."
                rows={3}
                className="rounded-xl text-base resize-none"
              />
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5">
                Contato de Emergencia
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-600 dark:text-amber-500">Nome</Label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={emergencyName}
                      onChange={e => setEmergencyName(e.target.value)}
                      placeholder="Joao Silva"
                      className="h-12 rounded-xl text-base pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-600 dark:text-amber-500">Telefone</Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={emergencyPhone}
                      onChange={e => setEmergencyPhone(e.target.value)}
                      placeholder="+351 912 345 678"
                      type="tel"
                      className="h-12 rounded-xl text-base pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} size="lg" className="h-14 rounded-xl px-6">
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setStep(3)}
              size="lg"
              className="flex-1 h-14 text-base font-semibold rounded-xl"
            >
              Continuar
              <IconArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ====== STEP 3: Schedule & Frequency ====== */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">Horarios e frequencia</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Quando precisa do cuidador?
            </p>
          </div>

          {/* Time of day */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Periodos do dia</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {SCHEDULE_OPTIONS.map(opt => {
                const selected = selectedSchedule.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleSchedule(opt.key)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.icon}</span>
                      <span className={`text-sm font-medium ${selected ? "text-primary" : ""}`}>{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-7">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Frequencia</Label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFrequency(opt.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    frequency === opt.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className={`text-sm font-medium ${frequency === opt.key ? "text-primary" : ""}`}>
                    {opt.label}
                  </span>
                  {opt.hours > 0 && (
                    <p className="text-xs text-muted-foreground">~{opt.hours}h/semana</p>
                  )}
                </button>
              ))}
            </div>
            {frequency === "custom" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Horas por semana</Label>
                <Input
                  type="number"
                  value={customHours}
                  onChange={e => setCustomHours(Number(e.target.value) || 1)}
                  min={1}
                  max={60}
                  className="h-12 rounded-xl text-base"
                />
              </div>
            )}
          </div>

          {/* Dates - larger, clearer */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Periodo do contrato</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Inicio</Label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="h-12 rounded-xl text-base pl-9 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Termino (opcional)</Label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="h-12 rounded-xl text-base pl-9 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} size="lg" className="h-14 rounded-xl px-6">
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!frequency || selectedSchedule.length === 0}
              size="lg"
              className="flex-1 h-14 text-base font-semibold rounded-xl"
            >
              Revisar Contrato
              <IconArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ====== STEP 4: Review & Confirm ====== */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">Revisar e confirmar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Verifique os detalhes. Voce pode editar o valor por hora.
            </p>
          </div>

          {/* Care summary */}
          <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden">
            {/* Needs */}
            <div className="p-4 border-b border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cuidados</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNeeds.map(key => {
                  const need = CARE_NEEDS.find(n => n.key === key);
                  return need ? (
                    <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                      {need.icon} {need.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Elder info */}
            {elderName && (
              <div className="p-4 border-b border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Idoso(a)</p>
                <p className="text-sm font-medium">{elderName}{elderAge ? `, ${elderAge} anos` : ""}</p>
                {elderConditions && <p className="text-xs text-muted-foreground mt-1">{elderConditions}</p>}
              </div>
            )}

            {/* Schedule */}
            <div className="p-4 border-b border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Horario</p>
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Periodos:</p>
                  <div className="space-y-1">
                    {selectedSchedule.map(k => {
                      const opt = SCHEDULE_OPTIONS.find(s => s.key === k);
                      return opt ? (
                        <div key={k} className="text-sm">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground ml-2">({opt.desc})</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Frequencia:</p>
                  <p className="text-sm font-medium">
                    {FREQUENCY_OPTIONS.find(f => f.key === frequency)?.label}
                    {" "}
                    <span className="text-muted-foreground">({hoursPerWeek}h/semana)</span>
                  </p>
                </div>
                {startDate && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Periodo:</p>
                    <p className="text-sm">
                      {new Date(startDate + "T00:00:00").toLocaleDateString("pt-PT")}
                      {endDate ? ` até ${new Date(endDate + "T00:00:00").toLocaleDateString("pt-PT")}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial - editable hourly rate */}
            <div className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Valores</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor por hora</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setHourlyRate(Math.max(5, hourlyRate - 1))}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="w-16 text-center font-bold text-base">€{hourlyRate.toFixed(2)}</span>
                    <button
                      onClick={() => setHourlyRate(Math.min(100, hourlyRate + 1))}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Horas/semana</span>
                  <span className="font-medium">{hoursPerWeek}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total do período ({totalHours.toFixed(1)}h)</span>
                  <span className="font-bold text-base">€{totalEur.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taxa plataforma ({platformFeePercent}%)</span>
                  <span className="text-red-500">-€{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taxa de contrato</span>
                  <span className="text-red-500">-€{contractFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Cuidador recebe</span>
                  <span className="text-green-600">€{caregiverReceives.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract fee notice */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <IconInfo className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-400">
                Taxa de contrato de €{(CONTRACT_FEE_EUR_CENTS / 100).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                Esta taxa sera deduzida do valor que o cuidador recebe apos aceitar o contrato.
              </p>
            </div>
          </div>

          {/* Additional notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Observacoes adicionais (opcional)</Label>
            <Textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="Algo mais que o cuidador precise saber..."
              rows={2}
              className="rounded-xl text-base resize-none"
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3 p-3.5 bg-muted/50 rounded-xl">
            <Checkbox
              id="terms"
              checked={agreedTerms}
              onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer">
              Li e concordo com os{" "}
              <Link href="/termos" className="text-primary underline">Termos de Uso</Link>{" "}
              e{" "}
              <Link href="/privacidade" className="text-primary underline">Politica de Privacidade</Link>.
              Entendo que este contrato sera enviado ao cuidador para aceitacao.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)} size="lg" className="h-14 rounded-xl px-6">
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !agreedTerms}
              size="lg"
              className="flex-1 h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-5 w-5 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <IconContract className="h-5 w-5 mr-2" />
                  Criar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ====== STEP 5: Success ====== */}
      {step === 5 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center ring-4 ring-green-500/20">
            <IconCheck className="h-10 w-10 text-green-500" />
          </div>

          <h2 className="text-xl font-bold mb-2">Contrato Criado!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            O contrato foi enviado para <span className="font-medium text-foreground">{caregiver.name}</span>.
            Sera notificado(a) quando aceitar.
          </p>

          <div className="bg-surface rounded-xl border border-border/50 p-4 text-left mb-6 space-y-2">
            <div className="flex items-center gap-2">
              <IconContract className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Contrato #{contractId}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Aguardando aceite do cuidador</span>
            </div>
            <p className="text-xs text-muted-foreground">
              O cuidador recebe uma notificacao e pode aceitar ou propor alteracoes.
              Apos aceite de ambas as partes, o contrato e ativado.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex-1 h-12 rounded-xl">
              <Link href="/app/contracts">Ver Contratos</Link>
            </Button>
            <Button asChild className="flex-1 h-12 rounded-xl">
              <Link href="/app/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-muted rounded-2xl" />
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingFallback />}>
        <NewContractContent />
      </Suspense>
    </AppShell>
  );
}
