"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_TYPES as BASE_SERVICE_TYPES } from "@/lib/profile-constants";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconArrowLeft,
  IconArrowRight,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconStar,
  IconEuro,
  IconTrendingUp,
} from "@/components/icons";

// Service types from centralized constants
const SERVICE_TYPE_IDS = BASE_SERVICE_TYPES.map((s) => s.id);

const SERVICE_LABELS: Record<string, string> = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Administração de Medicação",
  MOBILITY: "Ajuda com Mobilidade",
  COMPANIONSHIP: "Companhia e Conversa",
  MEAL_PREPARATION: "Preparo de Refeições",
  LIGHT_HOUSEWORK: "Tarefas Domésticas",
  TRANSPORTATION: "Transporte",
  COGNITIVE_SUPPORT: "Estimulação Cognitiva",
  NIGHT_CARE: "Cuidados Noturnos",
  PALLIATIVE_CARE: "Cuidados Paliativos",
  PHYSIOTHERAPY: "Fisioterapia",
  NURSING_CARE: "Enfermagem",
};

interface FormData {
  title: string;
  description: string;
  serviceTypes: string[];
  address: string;
  city: string;
  postalCode: string;
  requiredExperienceLevel: string;
  requiredCertifications: string[];
  careType: string;
  desiredStartDate: string;
  desiredEndDate: string;
  hoursPerWeek: string;
  budgetEurCents: string; // Total budget in cents (€100 = 10000)
  minimumHourlyRateEur: string; // Minimum hourly rate in cents
  visibilityPackage: string;
}

const VISIBILITY_PACKAGES = [
  {
    value: "NONE",
    label: "Publicar Grátis",
    price: 0,
    desc: "1x por mês (sem boost)",
    icon: IconCheck,
  },
  {
    value: "BASIC",
    label: "BASIC",
    price: 3,
    desc: "7 dias de visibilidade",
    icon: IconEuro,
  },
  {
    value: "PREMIUM",
    label: "PREMIUM",
    price: 8,
    desc: "30 dias destacado",
    icon: IconStar,
  },
  {
    value: "URGENT",
    label: "URGENTE",
    price: 15,
    desc: "3 dias no topo",
    icon: IconTrendingUp,
  },
];

function NewDemandContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("NONE");

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    serviceTypes: [],
    address: "",
    city: "",
    postalCode: "",
    requiredExperienceLevel: "INTERMEDIATE",
    requiredCertifications: [],
    careType: "RECURRING",
    desiredStartDate: "",
    desiredEndDate: "",
    hoursPerWeek: "",
    budgetEurCents: "",
    minimumHourlyRateEur: "",
    visibilityPackage: "BASIC",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleServiceTypeChange = (serviceType: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter((s) => s !== serviceType)
        : [...prev.serviceTypes, serviceType],
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError("Título é obrigatório");
          return false;
        }
        if (formData.description.length < 100) {
          setError("Descrição deve ter pelo menos 100 caracteres");
          return false;
        }
        return true;

      case 2:
        if (formData.serviceTypes.length === 0) {
          setError("Selecione pelo menos um tipo de serviço");
          return false;
        }
        if (!formData.city.trim()) {
          setError("Localidade é obrigatória");
          return false;
        }
        return true;

      case 3:
        // All optional
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleCreateDemand = async (visibilityPackage: string = "NONE") => {
    if (!validateStep(4)) {
      setSubmitError("Verifique as informações preenchidas");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          serviceTypes: formData.serviceTypes,
          address: formData.address || undefined,
          city: formData.city,
          postalCode: formData.postalCode || undefined,
          requiredExperienceLevel: formData.requiredExperienceLevel,
          requiredCertifications: formData.requiredCertifications,
          careType: formData.careType,
          desiredStartDate: formData.desiredStartDate || undefined,
          desiredEndDate: formData.desiredEndDate || undefined,
          hoursPerWeek: formData.hoursPerWeek
            ? parseInt(formData.hoursPerWeek)
            : undefined,
          budgetEurCents: formData.budgetEurCents
            ? parseInt(formData.budgetEurCents)
            : undefined,
          minimumHourlyRateEur: formData.minimumHourlyRateEur
            ? parseInt(formData.minimumHourlyRateEur)
            : undefined,
          visibilityPackage: visibilityPackage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao criar demanda");
      }

      const data = await res.json();

      // Se pagou visibilidade, redireciona para checkout Stripe
      if (visibilityPackage !== "NONE") {
        router.push(
          `/app/family/demands/${data.id}/boost?package=${visibilityPackage}`,
        );
      } else {
        // Senão, vai pro dashboard
        router.push("/app/family/demands");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro inesperado");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-secondary rounded-3xl" />
          <div className="h-12 bg-secondary rounded-3xl" />
          <div className="h-64 bg-secondary rounded-3xl" />
        </div>
      </div>
    );
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header Section */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 text-foreground">
            Criar Nova Demanda
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atraia cuidadores qualificados com uma demanda clara
          </p>
        </div>
        <Link
          href="/app/family/demands"
          className="h-10 w-10 rounded-2xl hover:bg-secondary flex items-center justify-center transition-all"
          aria-label="Fechar"
        >
          <IconX className="h-5 w-5" />
        </Link>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
            Passo {step} de {totalSteps}
          </span>
          <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="flex items-center justify-between max-w-lg">
          {[...Array(totalSteps)].map((_, i) => {
            const isCompleted = i < step - 1;
            const isCurrent = i === step - 1;
            return (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-md"
                      : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full ${isCompleted ? "bg-primary" : "bg-border"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl mb-6">
          <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-foreground">
              Erro
            </p>
            <p className="text-xs text-destructive mt-1">{error}</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl mb-6">
          <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-foreground">
              Erro ao criar demanda
            </p>
            <p className="text-xs text-destructive mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Step 1: Informações Básicas */}
      {step === 1 && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Passo 1: Informações Básicas
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  Informações Básicas
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comece com os detalhes principais da sua demanda
                </p>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Título da Demanda
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Ex: Cuidadora para idosa em Lisboa"
                    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/100 caracteres
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                    Descrição Detalhada (mín. 100 caracteres)
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descreva detalhadamente a necessidade, condições, horários, requisitos especiais, etc."
                    rows={5}
                    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/100 caracteres mínimos
                    </p>
                    {formData.description.length >= 100 && (
                      <div className="flex items-center gap-1 text-xs text-success font-medium">
                        <IconCheck className="h-4 w-4" />
                        OK
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              onClick={handleNext}
              disabled={
                !formData.title.trim() || formData.description.length < 100
              }
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold uppercase gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Detalhes */}
      {step === 2 && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Passo 2: Detalhes da Demanda
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  Detalhes da Demanda
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Especifique os tipos de serviço e localização
                </p>
              </div>

              {/* Service Types */}
              <div className="space-y-3">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                  Tipos de Serviço
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SERVICE_TYPE_IDS.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleServiceTypeChange(type)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                        formData.serviceTypes.includes(type)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-secondary"
                      }`}
                    >
                      <Checkbox
                        checked={formData.serviceTypes.includes(type)}
                        onCheckedChange={() => handleServiceTypeChange(type)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {SERVICE_LABELS[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                    <IconMapPin className="h-5 w-5" />
                  </div>
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                    Localização
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="city"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                    >
                      Localidade
                    </label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="Ex: Lisboa, Porto, Covilhã"
                      className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="postal"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                    >
                      Código Postal{" "}
                      <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <Input
                      id="postal"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="Ex: 1000-001"
                      className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="address"
                    className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                  >
                    Endereço{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Endereço detalhado"
                    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Budget Section */}
              <div className="space-y-4 p-5 sm:p-6 bg-secondary rounded-2xl border border-border">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                  Orçamento
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Defina o orçamento total disponível e a taxa mínima por hora
                  que está disposto a pagar
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Budget */}
                  <div className="space-y-2">
                    <label
                      htmlFor="budget"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                    >
                      Orçamento Total (€)
                    </label>
                    <Input
                      id="budget"
                      type="number"
                      value={
                        formData.budgetEurCents
                          ? parseInt(formData.budgetEurCents) / 100
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          ? parseInt(e.target.value) * 100
                          : "";
                        setFormData((prev) => ({
                          ...prev,
                          budgetEurCents: value.toString(),
                        }));
                      }}
                      placeholder="Ex: 1500"
                      min="0"
                      step="50"
                      className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Orçamento total que pode gastar
                    </p>
                  </div>

                  {/* Minimum Hourly Rate */}
                  <div className="space-y-2">
                    <label
                      htmlFor="hourly"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                    >
                      Taxa Mín./Hora (€)
                    </label>
                    <Input
                      id="hourly"
                      type="number"
                      value={
                        formData.minimumHourlyRateEur
                          ? parseInt(formData.minimumHourlyRateEur) / 100
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          ? parseInt(e.target.value) * 100
                          : "";
                        setFormData((prev) => ({
                          ...prev,
                          minimumHourlyRateEur: value.toString(),
                        }));
                      }}
                      placeholder="Ex: 12"
                      min="0"
                      step="1"
                      className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo negociável
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label
                  htmlFor="experience"
                  className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                >
                  Nível de Experiência Requerido
                </label>
                <select
                  id="experience"
                  value={formData.requiredExperienceLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiredExperienceLevel: e.target.value,
                    }))
                  }
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-foreground cursor-pointer"
                >
                  <option value="BEGINNER">Iniciante</option>
                  <option value="INTERMEDIATE">Intermediário</option>
                  <option value="ADVANCED">Avançado</option>
                  <option value="EXPERT">Especialista</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  ▾
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              size="lg"
              className="h-11 rounded-2xl px-6"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                formData.serviceTypes.length === 0 || !formData.city.trim()
              }
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold uppercase gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule & Frequency */}
      {step === 3 && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Passo 3: Agenda e Frequência
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  Agenda e Frequência
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Defina quando, quanto tempo e que tipo de cuidado precisa
                </p>
              </div>

              {/* Care Type */}
              <div className="space-y-3">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                  Tipo de Cuidado
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: "RECURRING",
                      label: "Recorrente",
                      desc: "Cuidado regular",
                    },
                    {
                      value: "URGENT",
                      label: "Urgente",
                      desc: "Necessidade imediata",
                    },
                    {
                      value: "BOTH",
                      label: "Ambos",
                      desc: "Regular + Urgente",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          careType: option.value,
                        }))
                      }
                      className={`px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                        formData.careType === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-secondary"
                      }`}
                    >
                      <p className="font-display font-bold text-foreground text-sm uppercase">
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                    <IconCalendar className="h-5 w-5" />
                  </div>
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                    Datas
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="startDate"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                    >
                      Data Desejada de Início
                    </label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.desiredStartDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          desiredStartDate: e.target.value,
                        }))
                      }
                      className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="endDate"
                      className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                    >
                      Data Desejada de Término{" "}
                      <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.desiredEndDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          desiredEndDate: e.target.value,
                        }))
                      }
                      className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Hours per Week */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                    <IconClock className="h-5 w-5" />
                  </div>
                  <label
                    htmlFor="hours"
                    className="text-xs font-display font-bold text-foreground uppercase tracking-widest"
                  >
                    Horas por Semana
                  </label>
                </div>
                <Input
                  id="hours"
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hoursPerWeek: e.target.value,
                    }))
                  }
                  min="0"
                  placeholder="Ex: 20"
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              size="lg"
              className="h-11 rounded-2xl px-6"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleNext}
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold uppercase gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Revisão */}
      {step === 4 && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Passo 4: Revisar Demanda
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  Revisar Demanda
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Verifique todas as informações antes de publicar
                </p>
              </div>

              {/* Summary Cards */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="p-5 bg-secondary rounded-2xl border border-border/50">
                  <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">
                    Informações Básicas
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-display font-bold text-foreground">
                        {formData.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {formData.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services & Location */}
                <div className="p-5 bg-secondary rounded-2xl border border-border/50">
                  <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">
                    Serviços e Localização
                  </p>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.serviceTypes.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 text-[10px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary"
                        >
                          {SERVICE_LABELS[type]}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <IconMapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium">
                        {formData.city}
                        {formData.postalCode && ` - ${formData.postalCode}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {(formData.desiredStartDate || formData.hoursPerWeek) && (
                  <div className="p-5 bg-secondary rounded-2xl border border-border/50">
                    <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">
                      Timeline
                    </p>
                    <div className="space-y-2 text-sm">
                      {formData.desiredStartDate && (
                        <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-foreground font-medium">
                            Início:{" "}
                            {new Date(
                              formData.desiredStartDate,
                            ).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                      )}
                      {formData.hoursPerWeek && (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-foreground font-medium">
                            {formData.hoursPerWeek} horas/semana
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget */}
                {(formData.budgetEurCents || formData.minimumHourlyRateEur) && (
                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20">
                    <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">
                      Orçamento
                    </p>
                    <div className="space-y-2 text-sm">
                      {formData.budgetEurCents && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Orçamento Total:
                          </span>
                          <span className="font-display font-bold text-foreground">
                            €
                            {(parseInt(formData.budgetEurCents) / 100).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      )}
                      {formData.minimumHourlyRateEur && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Taxa Mín./Hora:
                          </span>
                          <span className="font-display font-bold text-foreground">
                            €
                            {(
                              parseInt(formData.minimumHourlyRateEur) / 100
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {submitError && (
            <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
              <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-display font-bold text-foreground">
                  Erro ao revisar
                </p>
                <p className="text-xs text-destructive mt-1">{submitError}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              size="lg"
              className="h-11 rounded-2xl px-6"
              disabled={loading}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setStep(5)}
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold uppercase gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Visibility Package - PREMIUM DESIGN */}
      {step === 5 && (
        <div className="space-y-8">
          {/* Premium Header */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Passo 5: Escolher Visibilidade
            </h4>
            <div className="relative">
              <div className="absolute -top-12 -left-4 -right-4 h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <IconStar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-display font-bold text-primary uppercase tracking-widest">
                    Escolha Visibilidade
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 text-foreground">
                    Potencialize sua Demanda
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                    Demandas com visibilidade recebem{" "}
                    <span className="font-display font-bold text-primary">
                      3x mais propostas
                    </span>{" "}
                    em média. Escolha o pacote perfeito para você.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Visibility Packages - Premium Grid */}
          <div className="space-y-3">
            {VISIBILITY_PACKAGES.map((pkg, idx) => {
              const Icon = pkg.icon;
              const isSelected = selectedPackage === pkg.value;
              const isRecommended = pkg.value === "PREMIUM";

              return (
                <button
                  key={pkg.value}
                  onClick={() => setSelectedPackage(pkg.value)}
                  className={`relative group p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-card shadow-elevated"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-elevated"
                  } ${isRecommended && !isSelected ? "ring-2 ring-primary/20" : ""}`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-[10px] font-display font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                      Mais Popular
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Icon + Title + Description */}
                    <div className="flex-1 text-left">
                      <div className="flex items-start gap-3 mb-2">
                        <div
                          className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-primary group-hover:bg-primary/10"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-lg text-foreground uppercase">
                            {pkg.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pkg.desc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right flex-shrink-0">
                      {pkg.price === 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-2xl font-display font-black text-foreground">
                            Grátis
                          </p>
                          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                            1x/mês
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-3xl font-display font-black text-primary">
                            €{pkg.price}
                          </p>
                          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                            {pkg.desc.split("/")[1] || "7 dias"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    <div
                      className={`ml-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border group-hover:border-primary/40"
                      }`}
                    >
                      {isSelected && (
                        <IconCheck className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Benefits Comparison - Simple */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6 bg-secondary rounded-2xl border border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconCheck className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                  Visibilidade Destacada
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  Mais visualizações e alcance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconCheck className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                  Mais Propostas
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  3x em média de candidatos
                </p>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
              <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-display font-bold text-foreground">
                  Erro ao criar demanda
                </p>
                <p className="text-xs text-destructive mt-1">{submitError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(4)}
              size="lg"
              className="h-11 rounded-2xl px-6"
              disabled={loading}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleCreateDemand(selectedPackage)}
              disabled={loading}
              size="lg"
              className="flex-1 h-11 rounded-2xl font-display font-bold uppercase gap-2 shadow-elevated"
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : selectedPackage === "NONE" ? (
                <>
                  Publicar Grátis
                  <IconArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Ir para Pagamento €
                  {
                    VISIBILITY_PACKAGES.find((p) => p.value === selectedPackage)
                      ?.price
                  }
                  <IconArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewDemandPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto space-y-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
        </div>
      }
    >
      <NewDemandContent />
    </Suspense>
  );
}
