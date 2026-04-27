/**
 * Contract Creation Page (/app/contracts/new)
 *
 * PROPÓSITO: Página para criar novos contratos de cuidados entre famílias e cuidadores.
 * Esta página é acessada após uma proposta ser aceita ou uma família decidir criar um contrato direto.
 *
 * FLUXO:
 * 1. Família ou Cuidador acessa /app/contracts/new com query param ?proposalId=[id]
 * 2. Carrega informações do cuidador e detalhes da proposta
 * 3. Permite configurar: horário, frequência, taxa horária, benefícios
 * 4. Ao submeter, cria novo contrato via POST /api/contracts
 * 5. Redireciona para /app/contracts/[id] com sucesso
 *
 * ROLES PERMITIDOS: FAMILY (Família) - para criar e assinar contratos
 *
 * ACESSO:
 * - URL direta: /app/contracts/new
 * - Query params: ?proposalId=[id] (de proposta aceita)
 *
 * NOT IN SIDEBAR: Esta página não aparece no menu principal pois é acessada
 * via fluxo de aceitação de propostas. Link direto disponível apenas em contexto.
 */

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
import { SERVICE_TYPES, CONTRACT_FEE_EUR_CENTS, FREQUENCY_OPTIONS } from "@/lib/constants";

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
  {
    key: "COGNITIVE_SUPPORT",
    label: "Estimulacao Cognitiva",
    icon: "\uD83E\uDDE9",
  },
  { key: "NIGHT_CARE", label: "Cuidados Noturnos", icon: "\uD83C\uDF19" },
  { key: "NURSING_CARE", label: "Enfermagem", icon: "\uD83C\uDFE5" },
];

const SCHEDULE_OPTIONS = [
  { key: "morning", label: "Manha", desc: "06h - 12h", icon: "\u2600\uFE0F" },
  {
    key: "afternoon",
    label: "Tarde",
    desc: "12h - 18h",
    icon: "\uD83C\uDF24\uFE0F",
  },
  { key: "evening", label: "Noite", desc: "18h - 22h", icon: "\uD83C\uDF1C" },
  {
    key: "overnight",
    label: "Pernoite",
    desc: "22h - 06h",
    icon: "\uD83C\uDF19",
  },
];


function NewContractContent() {
  const searchParams = useSearchParams();
  const caregiverId = searchParams.get("caregiverId");
  const { status, data: session } = useSession();
  const isFamily = session?.user?.role === "FAMILY";

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
  const [platformFeePercent, setPlatformFeePercent] = useState(15);

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
          setCaregiverError(
            res.status === 404
              ? "Cuidador nao encontrado."
              : "Erro ao carregar cuidador.",
          );
          return;
        }
        const data = await res.json();
        const c = data.caregiver;
        setCaregiver({
          id: c.id,
          name: c.name,
          title: c.title,
          averageRating: c.averageRating,
          hourlyRateEur: c.hourlyRateEur,
        });
        setHourlyRate((c.hourlyRateEur || 2800) / 100);
      } catch {
        setCaregiverError("Erro inesperado ao carregar cuidador.");
      } finally {
        setCaregiverLoading(false);
      }
    }
    fetchCaregiver();

    // Fetch platform settings
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : { platformFeePercent: 15 }))
      .then((data) => setPlatformFeePercent(data.platformFeePercent || 15))
      .catch(() => setPlatformFeePercent(15));
  }, [caregiverId]);

  // Calculate actual hours based on dates
  const calculateTotalHours = () => {
    if (!startDate) return 0;

    const hoursPerWeek =
      frequency === "custom"
        ? customHours
        : FREQUENCY_OPTIONS.find((f) => f.key === frequency)?.hours || 10;

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
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // 0 = Sunday, 6 = Saturday
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
  const hoursPerWeek =
    frequency === "custom"
      ? customHours
      : FREQUENCY_OPTIONS.find((f) => f.key === frequency)?.hours || 10;
  const totalHours = calculateTotalHours();
  const totalEur = totalHours * hourlyRate;
  const platformFee = totalEur * (platformFeePercent / 100);
  const contractFee = CONTRACT_FEE_EUR_CENTS / 100;
  const caregiverReceives = totalEur - platformFee - contractFee;

  // Build description from questionnaire answers
  const buildDescription = () => {
    const parts: string[] = [];
    const needLabels = selectedNeeds
      .map((k) => CARE_NEEDS.find((n) => n.key === k)?.label)
      .filter(Boolean);
    if (needLabels.length)
      parts.push(`Cuidados necessarios: ${needLabels.join(", ")}`);
    if (elderName) parts.push(`Nome do idoso(a): ${elderName}`);
    if (elderAge) parts.push(`Idade: ${elderAge} anos`);
    if (elderConditions)
      parts.push(`Condicoes/observacoes: ${elderConditions}`);
    const schedLabels = selectedSchedule
      .map((k) => SCHEDULE_OPTIONS.find((s) => s.key === k)?.label)
      .filter(Boolean);
    if (schedLabels.length) parts.push(`Horarios: ${schedLabels.join(", ")}`);
    const freqLabel = FREQUENCY_OPTIONS.find((f) => f.key === frequency)?.label;
    if (freqLabel)
      parts.push(`Frequencia: ${freqLabel} (~${hoursPerWeek}h/semana)`);
    if (emergencyName)
      parts.push(`Contato de emergencia: ${emergencyName} (${emergencyPhone})`);
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
          throw new Error(
            "Voce precisa completar a verificacao de identidade (KYC) antes de criar um contrato.",
          );
        }
        if (errorData.code === "CAREGIVER_KYC_PENDING") {
          throw new Error(
            "O cuidador ainda nao completou a verificacao de identidade.",
          );
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
    setSelectedNeeds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleSchedule = (key: string) => {
    setSelectedSchedule((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Error/loading states
  if (caregiverError) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto pb-8 px-4 md:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2">
            Erro
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Nao conseguimos carregar o cuidador
          </p>
        </div>

        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/20">
            <IconAlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {caregiverError}
          </p>
          <Button asChild className="rounded-2xl h-12 px-8">
            <Link href="/app/search">Voltar para busca</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (caregiverLoading || !caregiver) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto pb-8 px-4 md:px-6 lg:px-8">
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded-2xl w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-3xl" />
          <div className="h-40 bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter leading-none mb-2">
          Novo Contrato
        </h1>
        <p className="text-base text-muted-foreground font-medium">
          Com {caregiver.name} • {caregiver.title}
        </p>
      </div>

      {/* Progress Bar */}
      {step <= totalSteps && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ====== STEP 1: Care Needs ====== */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black uppercase tracking-tighter leading-none mb-6">
              De que cuidados precisa?
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Selecione tudo que se aplica. Isto ajuda o cuidador a se preparar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CARE_NEEDS.map((need) => {
              const selected = selectedNeeds.includes(need.key);
              return (
                <button
                  key={need.key}
                  onClick={() => toggleNeed(need.key)}
                  className={`flex items-center gap-3 p-5 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5 shadow-card"
                      : "border-border hover:border-primary/30 hover:bg-secondary/50"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{need.icon}</span>
                  <span
                    className={`text-sm font-medium leading-tight ${selected ? "text-primary" : "text-foreground"}`}
                  >
                    {need.label}
                  </span>
                  {selected && (
                    <IconCheck className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => setStep(2)}
              disabled={selectedNeeds.length === 0}
              size="lg"
              className="flex-1 h-12 text-base font-semibold rounded-2xl"
            >
              Continuar
              <IconArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ====== STEP 2: About the Elderly ====== */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black uppercase tracking-tighter leading-none mb-6">
              Sobre o idoso(a)
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Informacoes basicas para o cuidador conhecer melhor.
            </p>
          </div>

          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                  Nome do idoso(a)
                </label>
                <Input
                  value={elderName}
                  onChange={(e) => setElderName(e.target.value)}
                  placeholder="Maria da Silva"
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                  Idade
                </label>
                <Input
                  type="number"
                  value={elderAge}
                  onChange={(e) => setElderAge(e.target.value)}
                  placeholder="75"
                  min={1}
                  max={120}
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                Condicoes ou observacoes importantes
              </label>
              <Textarea
                value={elderConditions}
                onChange={(e) => setElderConditions(e.target.value)}
                placeholder="Ex: Diabetes tipo 2, dificuldade de locomocao, toma medicacao as 8h e 20h..."
                rows={3}
                className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5 sm:p-7 space-y-4">
              <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                Contato de Emergencia
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Nome
                  </label>
                  <div className="relative">
                    <IconUser className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="Joao Silva"
                      className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Telefone
                  </label>
                  <div className="relative">
                    <IconPhone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+351 912 345 678"
                      type="tel"
                      className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              size="lg"
              className="h-12 rounded-2xl px-6"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setStep(3)}
              size="lg"
              className="flex-1 h-12 text-base font-semibold rounded-2xl"
            >
              Continuar
              <IconArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ====== STEP 3: Schedule & Frequency ====== */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black uppercase tracking-tighter leading-none mb-6">
              Horarios e frequencia
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Quando precisa do cuidador?
            </p>
          </div>

          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
            {/* Time of day */}
            <div className="space-y-3">
              <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                Periodos do dia
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SCHEDULE_OPTIONS.map((opt) => {
                  const selected = selectedSchedule.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleSchedule(opt.key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-card"
                          : "border-border hover:border-primary/30 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.icon}</span>
                        <span
                          className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}
                        >
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 ml-8">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                Frequencia
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFrequency(opt.key)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      frequency === opt.key
                        ? "border-primary bg-primary/5 shadow-card"
                        : "border-border hover:border-primary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${frequency === opt.key ? "text-primary" : "text-foreground"}`}
                    >
                      {opt.label}
                    </span>
                    {opt.hours > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{opt.hours}h/semana
                      </p>
                    )}
                  </button>
                ))}
              </div>
              {frequency === "custom" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Horas por semana
                  </label>
                  <Input
                    type="number"
                    value={customHours}
                    onChange={(e) =>
                      setCustomHours(Number(e.target.value) || 1)
                    }
                    min={1}
                    max={60}
                    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                Periodo do contrato
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Inicio
                  </label>
                  <div className="relative">
                    <IconCalendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Termino (opcional)
                  </label>
                  <div className="relative">
                    <IconCalendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              size="lg"
              className="h-12 rounded-2xl px-6"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!frequency || selectedSchedule.length === 0}
              size="lg"
              className="flex-1 h-12 text-base font-semibold rounded-2xl"
            >
              Revisar Contrato
              <IconArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ====== STEP 4: Review & Confirm ====== */}
      {step === 4 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black uppercase tracking-tighter leading-none mb-6">
              Revisar e confirmar
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              Verifique os detalhes. Voce pode editar o valor por hora.
            </p>
          </div>

          {/* Care summary */}
          <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden divide-y divide-border">
            {/* Needs */}
            <div className="p-5 sm:p-7">
              <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-3">
                Cuidados
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNeeds.map((key) => {
                  const need = CARE_NEEDS.find((n) => n.key === key);
                  return need ? (
                    <span
                      key={key}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                    >
                      {need.icon} {need.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Elder info */}
            {elderName && (
              <div className="p-5 sm:p-7">
                <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2">
                  Idoso(a)
                </p>
                <p className="text-sm font-medium text-foreground">
                  {elderName}
                  {elderAge ? `, ${elderAge} anos` : ""}
                </p>
                {elderConditions && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {elderConditions}
                  </p>
                )}
              </div>
            )}

            {/* Schedule */}
            <div className="p-5 sm:p-7">
              <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-4">
                Horario
              </p>
              <div className="space-y-3">
                <div className="bg-secondary rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                    Periodos:
                  </p>
                  <div className="space-y-1.5">
                    {selectedSchedule.map((k) => {
                      const opt = SCHEDULE_OPTIONS.find((s) => s.key === k);
                      return opt ? (
                        <div key={k} className="text-sm text-foreground">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground ml-2">
                            ({opt.desc})
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-1">
                    Frequencia:
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {FREQUENCY_OPTIONS.find((f) => f.key === frequency)?.label}{" "}
                    <span className="text-muted-foreground">
                      ({hoursPerWeek}h/semana)
                    </span>
                  </p>
                </div>
                {startDate && (
                  <div>
                    <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-1">
                      Periodo:
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {new Date(startDate + "T00:00:00").toLocaleDateString(
                        "pt-PT",
                      )}
                      {endDate
                        ? ` até ${new Date(endDate + "T00:00:00").toLocaleDateString("pt-PT")}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial - editable hourly rate */}
            <div className="p-5 sm:p-7">
              <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-4">
                Valores
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Valor por hora
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHourlyRate(Math.max(5, hourlyRate - 1))}
                      className="w-9 h-9 rounded-2xl border border-border flex items-center justify-center text-sm hover:bg-secondary transition-colors"
                    >
                      -
                    </button>
                    <span className="w-20 text-center font-display font-black text-base text-foreground">
                      €{hourlyRate.toFixed(2)}
                    </span>
                    <button
                      onClick={() =>
                        setHourlyRate(Math.min(100, hourlyRate + 1))
                      }
                      className="w-9 h-9 rounded-2xl border border-border flex items-center justify-center text-sm hover:bg-secondary transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-foreground font-medium">
                  <span className="text-muted-foreground">Horas/semana</span>
                  <span>{hoursPerWeek}h</span>
                </div>
                <div className="flex justify-between text-sm font-display font-bold text-foreground pt-3 border-t border-secondary">
                  <span>Total do período ({totalHours.toFixed(1)}h)</span>
                  <span>€{totalEur.toFixed(2)}</span>
                </div>
              </div>

              {!isFamily && (
                <div className="pt-4 space-y-2 border-t border-secondary">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Taxa plataforma ({platformFeePercent}%)</span>
                    <span className="text-destructive">
                      -€{platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Taxa de contrato</span>
                    <span className="text-destructive">
                      -€{contractFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-display font-bold text-foreground pt-2 border-t border-secondary">
                    <span>Cuidador recebe</span>
                    <span className="text-success">
                      €{caregiverReceives.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract fee notice - only show to caregivers */}
          {!isFamily && (
            <div className="flex items-start gap-3 p-5 sm:p-7 bg-info/5 border border-info/20 rounded-2xl">
              <IconInfo className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-display font-bold text-foreground">
                  Taxa de contrato de €
                  {(CONTRACT_FEE_EUR_CENTS / 100).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Esta taxa sera deduzida do valor que o cuidador recebe apos
                  aceitar o contrato.
                </p>
              </div>
            </div>
          )}

          {/* Additional notes */}
          <div className="space-y-2">
            <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
              Observacoes adicionais (opcional)
            </label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Algo mais que o cuidador precise saber..."
              rows={2}
              className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="flex items-start gap-3 p-5 sm:p-7 bg-destructive/5 border border-destructive/20 rounded-2xl">
              <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">
                {submitError}
              </p>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3 p-5 sm:p-7 bg-secondary border border-border rounded-2xl">
            <Checkbox
              id="terms"
              checked={agreedTerms}
              onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-xs text-foreground leading-relaxed cursor-pointer font-medium"
            >
              Li e concordo com os{" "}
              <Link href="/termos" className="text-primary underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="/privacidade" className="text-primary underline">
                Politica de Privacidade
              </Link>
              . Entendo que este contrato sera enviado ao cuidador para
              aceitacao.
            </Label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              size="lg"
              className="h-12 rounded-2xl px-6"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !agreedTerms}
              size="lg"
              className="flex-1 h-12 text-base font-semibold rounded-2xl shadow-lg shadow-primary/25"
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
        <div className="text-center py-8 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-success/10 flex items-center justify-center ring-4 ring-success/20">
            <IconCheck className="h-10 w-10 text-success" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter leading-none text-foreground">
              Contrato Criado!
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              O contrato foi enviado para{" "}
              <span className="font-display font-black text-foreground">
                {caregiver.name}
              </span>
              . Sera notificado(a) quando aceitar.
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-7 text-left space-y-3">
            <div className="flex items-center gap-3">
              <IconContract className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm font-display font-bold text-foreground">
                Contrato #{contractId}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <IconClock className="h-5 w-5 text-warning flex-shrink-0" />
              <span className="text-sm text-muted-foreground font-medium">
                Aguardando aceite do cuidador
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              O cuidador recebe uma notificacao e pode aceitar ou propor
              alteracoes. Apos aceite de ambas as partes, o contrato e ativado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              asChild
              className="flex-1 h-12 rounded-2xl"
            >
              <Link href="/app/contracts">Ver Contratos</Link>
            </Button>
            <Button asChild className="flex-1 h-12 rounded-2xl">
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
    <div className="space-y-8 max-w-2xl mx-auto pb-8">
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-muted rounded-2xl w-64" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-muted rounded-3xl" />
        <div className="h-40 bg-muted rounded-3xl" />
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
