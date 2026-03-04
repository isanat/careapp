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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  IconStar
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

// Service types available for caregivers
const SERVICE_TYPES = [
  { id: "PERSONAL_CARE", label: "Cuidados Pessoais", description: "Higiene, banho, alimentação" },
  { id: "MEDICATION", label: "Administração de Medicação", description: "Controle e aplicação de medicamentos" },
  { id: "MOBILITY", label: "Mobilidade", description: "Ajuda com locomoção e exercícios" },
  { id: "COMPANIONSHIP", label: "Companhia", description: "Conversa, passeios, atividades" },
  { id: "MEAL_PREPARATION", label: "Preparo de Refeições", description: "Cozinha e nutrição" },
  { id: "LIGHT_HOUSEWORK", label: "Tarefas Domésticas", description: "Limpeza leve, organização" },
  { id: "TRANSPORTATION", label: "Transporte", description: "Consultas, compras, passeios" },
  { id: "COGNITIVE_SUPPORT", label: "Estimulação Cognitiva", description: "Atividades mentais, memória" },
  { id: "NIGHT_CARE", label: "Cuidados Noturnos", description: "Acompanhamento durante a noite" },
  { id: "PALLIATIVE_CARE", label: "Cuidados Paliativos", description: "Suporte e conforto" },
  { id: "PHYSIOTHERAPY", label: "Fisioterapia", description: "Exercícios e reabilitação" },
  { id: "NURSING_CARE", label: "Enfermagem", description: "Procedimentos técnicos" },
];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        setError("Por favor, preencha o título e experiência");
        return;
      }
    }
    if (step === 2) {
      if (profileData.services.length === 0) {
        setError("Selecione pelo menos um serviço");
        return;
      }
      if (!profileData.hourlyRate) {
        setError("Por favor, informe seu valor por hora");
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
        throw new Error(data.error || "Falha ao salvar perfil");
      }

      // Redirect to KYC verification
      router.push(`/auth/kyc?userId=${userId || session?.user?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold">Complete seu Perfil Profissional</h1>
          <p className="text-muted-foreground">
            Cuidador(a) - {APP_NAME}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <IconCheck className="h-5 w-5" /> : s}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-3 text-center text-sm mb-8">
          <div>
            <p className={step >= 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
              Informações
            </p>
          </div>
          <div>
            <p className={step >= 2 ? "text-foreground font-medium" : "text-muted-foreground"}>
              Serviços
            </p>
          </div>
          <div>
            <p className={step >= 3 ? "text-foreground font-medium" : "text-muted-foreground"}>
              Disponibilidade
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <IconAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold">Suas Informações</h2>
                  <p className="text-sm text-muted-foreground">
                    Conte-nos sobre sua experiência como cuidador(a)
                  </p>
                </div>

                {/* Photo Upload Placeholder */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                      <IconUser className="h-12 w-12 text-muted-foreground" />
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
                  <Label htmlFor="title">Título Profissional *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Enfermeira, Cuidadora, Técnica de Enfermagem..."
                    value={profileData.title}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Como você se identifica profissionalmente?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Anos de Experiência *</Label>
                  <Select
                    value={profileData.experienceYears}
                    onValueChange={(v) => setProfileData((p) => ({ ...p, experienceYears: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua experiência" />
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
                  <Label htmlFor="bio">Sobre você</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Conte um pouco sobre sua experiência, especializações e o que te motiva como cuidador(a)..."
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Ex: Lisboa, Porto..."
                      value={profileData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages">Idiomas</Label>
                    <Input
                      id="languages"
                      name="languages"
                      placeholder="Ex: Português, Inglês..."
                      value={profileData.languages}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certificações</Label>
                  <Input
                    id="certifications"
                    name="certifications"
                    placeholder="Ex: Curso de Cuidador, Técnico de Enfermagem..."
                    value={profileData.certifications}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}

            {/* Step 2: Services */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold">Serviços e Valores</h2>
                  <p className="text-sm text-muted-foreground">
                    Selecione os serviços que você oferece e seu valor
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Tipos de Serviço *</Label>
                  <div className="grid gap-3">
                    {SERVICE_TYPES.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          profileData.services.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={profileData.services.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{service.label}</p>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Valor por Hora (€) *</Label>
                  <div className="relative">
                    <IconEuro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hourlyRate"
                      name="hourlyRate"
                      type="number"
                      step="0.50"
                      min="5"
                      placeholder="15.00"
                      value={profileData.hourlyRate}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor sugerido: €12-20/hora para cuidados básicos, €15-25/hora para especializados
                  </p>
                </div>
              </>
            )}

            {/* Step 3: Availability */}
            {step === 3 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold">Disponibilidade</h2>
                  <p className="text-sm text-muted-foreground">
                    Quando você está disponível para trabalhar?
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Horários Disponíveis *</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {AVAILABILITY_OPTIONS.map((avail) => (
                      <label
                        key={avail.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          profileData.availability.includes(avail.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={profileData.availability.includes(avail.id)}
                          onCheckedChange={() => handleAvailabilityToggle(avail.id)}
                        />
                        <span className="text-sm">{avail.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium">Resumo do seu perfil</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Título:</span>
                      <span className="font-medium">{profileData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experiência:</span>
                      <span className="font-medium">
                        {EXPERIENCE_LEVELS.find((l) => l.value === profileData.experienceYears)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serviços:</span>
                      <span className="font-medium">{profileData.services.length} selecionados</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor/hora:</span>
                      <span className="font-medium">€{profileData.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disponibilidade:</span>
                      <span className="font-medium">{profileData.availability.length} horários</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-700">Cadastro Gratuito</p>
                      <p className="text-muted-foreground">
                        Como cuidador(a), você não precisa pagar para se cadastrar.
                        Após completar seu perfil, passará por verificação.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
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
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
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
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Precisa de ajuda?{" "}
          <Link href="/ajuda" className="text-primary hover:underline">
            Fale conosco
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </main>
    }>
      <ProfileSetupContent />
    </Suspense>
  );
}
