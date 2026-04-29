"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconLogo,
  IconUser,
  IconCamera,
  IconBriefcase,
  IconClock,
  IconEuro,
  IconCheck,
  IconAlert,
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconHeart,
  IconPill,
  IconHome,
  IconCare,
  IconStar,
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { SERVICE_TYPES as BASE_SERVICE_TYPES } from "@/lib/profile-constants";
import {
  tokens,
  cn,
  getAlertClasses,
  getLabelClasses,
  getFormInputClasses,
  getSetupFormInputClasses,
  getHeadingClasses,
} from "@/lib/design-tokens";

// Service types with descriptions for setup wizard
const SERVICE_TYPES = BASE_SERVICE_TYPES.map((service) => ({
  ...service,
  description: getServiceDescription(service.id),
}));

function getServiceDescription(id: string): string {
  const descriptions: Record<string, string> = {
    PERSONAL_CARE: "Higiene, banho, alimentação",
    MEDICATION: "Controlo e aplicação de medicamentos",
    MOBILITY: "Ajuda com locomoção e exercícios",
    COMPANIONSHIP: "Conversa, passeios, actividades",
    MEAL_PREPARATION: "Cozinha e nutrição",
    LIGHT_HOUSEWORK: "Limpeza leve, organização",
    TRANSPORTATION: "Consultas, compras, passeios",
    COGNITIVE_SUPPORT: "Actividades mentais, memória",
    NIGHT_CARE: "Acompanhamento durante a noite",
    PALLIATIVE_CARE: "Suporte e conforto",
    PHYSIOTHERAPY: "Exercícios e reabilitação",
    NURSING_CARE: "Procedimentos técnicos",
  };
  return descriptions[id] || "";
}

const EXPERIENCE_LEVELS = [
  { value: "0", label: "Sem experiência formal" },
  { value: "1", label: "Menos de 1 ano" },
  { value: "2", label: "1-2 anos" },
  { value: "3", label: "3-5 anos" },
  { value: "4", label: "5-10 anos" },
  { value: "5", label: "Mais de 10 anos" },
];

const AVAILABILITY_OPTIONS = [
  { id: "weekday_morning", label: "Dias úteis - Manhã" },
  { id: "weekday_afternoon", label: "Dias úteis - Tarde" },
  { id: "weekday_evening", label: "Dias úteis - Noite" },
  { id: "weekend_morning", label: "Fins de semana - Manhã" },
  { id: "weekend_afternoon", label: "Fins de semana - Tarde" },
  { id: "weekend_evening", label: "Fins de semana - Noite" },
  { id: "overnight", label: "Pernoite" },
  { id: "live_in", label: "Residencial (morar junto)" },
];

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userId = searchParams.get("userId");
  const { t } = useI18n();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Profile data
  const [profileData, setProfileData] = useState({
    title: "",
    bio: "",
    experienceYears: "",
    services: [] as string[],
    hourlyRate: "",
    availability: [] as string[],
    city: "",
    certifications: "",
    languages: "",
  });

  useEffect(() => {
    if (status === "unauthenticated" && !userId) {
      router.push("/auth/register?role=caregiver");
    }
  }, [status, userId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setProfileData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleAvailabilityToggle = (availId: string) => {
    setProfileData((prev) => ({
      ...prev,
      availability: prev.availability.includes(availId)
        ? prev.availability.filter((a) => a !== availId)
        : [...prev.availability, availId],
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!profileData.title || !profileData.experienceYears) {
        setError("Por favor, preencha o título e a experiência");
        return;
      }
    }
    if (step === 2) {
      if (profileData.services.length === 0) {
        setError("Selecione pelo menos um serviço");
        return;
      }
      if (!profileData.hourlyRate) {
        setError("Por favor, indique o seu valor por hora");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (profileData.availability.length === 0) {
      setError("Selecione pelo menos um horário de disponibilidade");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileType: "caregiver",
          title: profileData.title,
          bio: profileData.bio,
          experienceYears: parseInt(profileData.experienceYears),
          services: profileData.services,
          hourlyRateEur: Math.round(parseFloat(profileData.hourlyRate) * 100), // Convert to cents
          availability: profileData.availability,
          city: profileData.city,
          certifications: profileData.certifications,
          languages: profileData.languages,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao guardar perfil");
      }

      // Redirect to KYC verification
      router.push(`/auth/kyc?userId=${userId || session?.user?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="bg-card rounded-3xl p-7 border border-border shadow-card max-w-2xl w-full">
          <div className="py-12 text-center">
            <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Carregando...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 mb-6"
          >
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 text-foreground">
            Complete o seu Perfil
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Profissional de Cuidados - {APP_NAME}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-3 max-w-lg mx-auto w-full">
          {[1, 2, 3].map((s, index) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold transition-all shrink-0 ${
                  s <= step
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                {s < step ? <IconCheck className="h-5 w-5" /> : s}
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-0.5 rounded-full ${
                    index < step - 1 ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-3 text-center gap-2 px-4">
          <div>
            <p
              className={`text-[10px] font-display font-black uppercase tracking-widest ${
                step >= 1 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Informações
            </p>
          </div>
          <div>
            <p
              className={`text-[10px] font-display font-black uppercase tracking-widest ${
                step >= 2 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Serviços
            </p>
          </div>
          <div>
            <p
              className={`text-[10px] font-display font-black uppercase tracking-widest ${
                step >= 3 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Disponibilidade
            </p>
          </div>
        </div>

        {/* Form Card */}
        <section className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          {error && (
            <div className={cn(getAlertClasses("error"), "mb-6")}>
              <IconAlert className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  As suas Informações
                </h2>
                <p className="text-base text-muted-foreground font-medium">
                  Fale-nos sobre a sua experiência como cuidador(a)
                </p>
              </div>

              {/* Photo Upload Placeholder */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center">
                    <IconUser className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-1 -right-1 rounded-full h-8 w-8"
                  >
                    <IconCamera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className={cn(getLabelClasses("primary"), "mb-2 block")}
                >
                  Título Profissional *
                </label>
                <input
                  id="title"
                  name="title"
                  placeholder="Ex.: Enfermeira, Cuidadora, Técnica de Enfermagem..."
                  value={profileData.title}
                  onChange={handleInputChange}
                  className={getSetupFormInputClasses()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Como se identifica profissionalmente?
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="experienceYears"
                  className={cn(getLabelClasses("primary"), "mb-2 block")}
                >
                  Anos de Experiência *
                </label>
                <Select
                  value={profileData.experienceYears}
                  onValueChange={(v) =>
                    setProfileData((p) => ({ ...p, experienceYears: v }))
                  }
                >
                  <SelectTrigger className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground">
                    <SelectValue placeholder="Selecione a sua experiência" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className={cn(getLabelClasses("primary"), "mb-2 block")}
                >
                  Sobre si
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  placeholder="Fale um pouco sobre a sua experiência, especializações e o que o/a motiva como cuidador(a)..."
                  value={profileData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className={cn(getSetupFormInputClasses(), "resize-none")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="city"
                    className={cn(getLabelClasses("primary"), "mb-2 block")}
                  >
                    Cidade
                  </label>
                  <input
                    id="city"
                    name="city"
                    placeholder="Ex: Lisboa, Porto..."
                    value={profileData.city}
                    onChange={handleInputChange}
                    className={getSetupFormInputClasses()}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="languages"
                    className={cn(getLabelClasses("primary"), "mb-2 block")}
                  >
                    Idiomas
                  </label>
                  <input
                    id="languages"
                    name="languages"
                    placeholder="Ex: Português, Inglês..."
                    value={profileData.languages}
                    onChange={handleInputChange}
                    className={getSetupFormInputClasses()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="certifications"
                  className={cn(getLabelClasses("primary"), "mb-2 block")}
                >
                  Certificações
                </label>
                <input
                  id="certifications"
                  name="certifications"
                  placeholder="Ex.: Curso de Cuidador, Técnico de Enfermagem..."
                  value={profileData.certifications}
                  onChange={handleInputChange}
                  className={getSetupFormInputClasses()}
                />
              </div>
            </div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  Serviços e Valores
                </h2>
                <p className="text-base text-muted-foreground font-medium">
                  Selecione os serviços que oferece e o seu valor
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                  Tipos de Serviço *
                </label>
                <div className="grid gap-3">
                  {SERVICE_TYPES.map((service) => (
                    <label
                      key={service.id}
                      className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                        profileData.services.includes(service.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-5 h-5 rounded-md border-2 border-border flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-primary transition-all">
                          {profileData.services.includes(service.id) && (
                            <IconCheck className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-display font-bold text-foreground uppercase">
                            {service.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.services.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6" />

              <div className="space-y-2">
                <label
                  htmlFor="hourlyRate"
                  className={cn(getLabelClasses("primary"), "mb-2 block")}
                >
                  Valor por Hora (€) *
                </label>
                <div className="relative">
                  <IconEuro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    step="0.50"
                    min="5"
                    placeholder="15.00"
                    value={profileData.hourlyRate}
                    onChange={handleInputChange}
                    className="w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor sugerido: €12-20/hora para cuidados básicos, €15-25/hora
                  para especializados
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-display font-black uppercase mb-2 text-foreground">
                  Disponibilidade
                </h2>
                <p className="text-base text-muted-foreground font-medium">
                  Quando está disponível para trabalhar?
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block">
                  Horários Disponíveis *
                </label>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {AVAILABILITY_OPTIONS.map((avail) => (
                    <label
                      key={avail.id}
                      className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                        profileData.availability.includes(avail.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md border-2 border-border flex items-center justify-center flex-shrink-0 transition-all">
                        {profileData.availability.includes(avail.id) && (
                          <IconCheck className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {avail.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={profileData.availability.includes(avail.id)}
                        onChange={() => handleAvailabilityToggle(avail.id)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6" />

              {/* Summary */}
              <div className="bg-secondary rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-widest">
                  Resumo do Perfil
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Título:</span>
                    <span className="font-medium text-foreground">
                      {profileData.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Experiência:</span>
                    <span className="font-medium text-foreground">
                      {
                        EXPERIENCE_LEVELS.find(
                          (l) => l.value === profileData.experienceYears,
                        )?.label
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Serviços:</span>
                    <span className="font-medium text-foreground">
                      {profileData.services.length} selecionados
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Valor/hora:</span>
                    <span className="font-medium text-foreground">
                      €{profileData.hourlyRate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">
                      Disponibilidade:
                    </span>
                    <span className="font-medium text-foreground">
                      {profileData.availability.length} horários
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-success/5 border border-success/20 rounded-2xl">
                <IconCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground text-sm uppercase">
                    Registo Gratuito
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Como cuidador(a), não precisa de pagar para se registar.
                    Após completar o seu perfil, passará por verificação.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1">
                Continuar
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />A
                    guardar...
                  </>
                ) : (
                  <>
                    Completar Perfil
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </section>

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground">
          Precisa de ajuda?{" "}
          <Link href="/ajuda" className="text-primary hover:underline">
            Fale connosco
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="bg-card rounded-3xl p-7 border border-border shadow-card max-w-2xl w-full">
            <div className="py-12 text-center">
              <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          </div>
        </main>
      }
    >
      <ProfileSetupContent />
    </Suspense>
  );
}
