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
import { Card, CardContent } from "@/components/ui/card";
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

const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPES).map(([id, label]) => ({
  id,
  label,
}));

const LANGUAGE_OPTIONS = [
  { id: "pt", label: "Portugues" },
  { id: "en", label: "Ingles" },
  { id: "es", label: "Espanhol" },
  { id: "fr", label: "Frances" },
  { id: "de", label: "Alemao" },
  { id: "it", label: "Italiano" },
  { id: "uk", label: "Ucraniano" },
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
    medicalConditions: "",
    dietaryRestrictions: "",
    // Step 2: Necessidades de Cuidado
    servicesNeeded: [] as string[],
    preferredSchedule: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            dietaryRestrictions: formData.dietaryRestrictions,
            servicesNeeded: formData.servicesNeeded,
            preferredSchedule: formData.preferredSchedule,
            preferredLanguages: formData.preferredLanguages,
            additionalNotes: formData.additionalNotes,
          }),
          emergencyContact: formData.emergencyContactName,
          emergencyPhone: formData.emergencyContactPhone,
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
          <h1 className="text-2xl font-bold">Configure o Cuidado</h1>
          <p className="text-muted-foreground">
            Familia - {APP_NAME}
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
              Dados do Idoso
            </p>
          </div>
          <div>
            <p className={step >= 2 ? "text-foreground font-medium" : "text-muted-foreground"}>
              Necessidades
            </p>
          </div>
          <div>
            <p className={step >= 3 ? "text-foreground font-medium" : "text-muted-foreground"}>
              Emergencia
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

            {/* Step 1: Dados do Idoso */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <IconUser className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Dados do Idoso</h2>
                  <p className="text-sm text-muted-foreground">
                    Informacoes sobre a pessoa que recebera os cuidados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elderName">Nome do Idoso *</Label>
                  <Input
                    id="elderName"
                    name="elderName"
                    placeholder="Nome completo"
                    value={formData.elderName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="elderAge">Idade</Label>
                    <Input
                      id="elderAge"
                      name="elderAge"
                      type="number"
                      min="0"
                      max="150"
                      placeholder="Ex: 78"
                      value={formData.elderAge}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobilityLevel">Nivel de Mobilidade</Label>
                    <Select
                      value={formData.mobilityLevel}
                      onValueChange={(v) => setFormData((p) => ({ ...p, mobilityLevel: v }))}
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">Condicoes Medicas</Label>
                  <Textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    placeholder="Ex: Diabetes, hipertensao, Alzheimer..."
                    value={formData.medicalConditions}
                    onChange={handleInputChange}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Liste as condicoes medicas relevantes para o cuidado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietaryRestrictions">Restricoes Alimentares</Label>
                  <Textarea
                    id="dietaryRestrictions"
                    name="dietaryRestrictions"
                    placeholder="Ex: Sem gluten, sem lactose, dieta para diabeticos..."
                    value={formData.dietaryRestrictions}
                    onChange={handleInputChange}
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Step 2: Necessidades de Cuidado */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <IconHeart className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Necessidades de Cuidado</h2>
                  <p className="text-sm text-muted-foreground">
                    Que tipos de cuidado a sua familia precisa?
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Tipos de Servico Necessarios *</Label>
                  <div className="grid gap-3">
                    {SERVICE_TYPE_OPTIONS.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.servicesNeeded.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={formData.servicesNeeded.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                        />
                        <span className="text-sm font-medium">{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="preferredSchedule">Horario Preferido</Label>
                  <Textarea
                    id="preferredSchedule"
                    name="preferredSchedule"
                    placeholder="Ex: Segunda a sexta, das 8h as 18h; fins de semana pela manha..."
                    value={formData.preferredSchedule}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Idiomas Preferidos</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <label
                        key={lang.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.preferredLanguages.includes(lang.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={formData.preferredLanguages.includes(lang.id)}
                          onCheckedChange={() => handleLanguageToggle(lang.id)}
                        />
                        <span className="text-sm">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Contato de Emergencia */}
            {step === 3 && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <IconPhone className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Contato de Emergencia</h2>
                  <p className="text-sm text-muted-foreground">
                    Informacoes de contato para situacoes de emergencia
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Nome do Contato *</Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    placeholder="Nome completo do contato de emergencia"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Telefone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      placeholder="+351 912 345 678"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelationship">Parentesco</Label>
                    <Input
                      id="emergencyContactRelationship"
                      name="emergencyContactRelationship"
                      placeholder="Ex: Filho(a), Esposo(a)..."
                      value={formData.emergencyContactRelationship}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="city">Endereco / Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Ex: Lisboa, Porto, Coimbra..."
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Notas Adicionais</Label>
                  <Textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    placeholder="Qualquer informacao adicional relevante para o cuidador..."
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium">Resumo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Idoso:</span>
                      <span className="font-medium">
                        {formData.elderName}{formData.elderAge ? `, ${formData.elderAge} anos` : ""}
                      </span>
                    </div>
                    {formData.mobilityLevel && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mobilidade:</span>
                        <span className="font-medium">
                          {MOBILITY_LEVELS.find((l) => l.value === formData.mobilityLevel)?.label}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicos:</span>
                      <span className="font-medium">{formData.servicesNeeded.length} selecionados</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emergencia:</span>
                      <span className="font-medium">{formData.emergencyContactName || "-"}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => { setError(""); setStep(step - 1); }} className="flex-1">
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
                      Completar Cadastro
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

export default function FamilySetupPage() {
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
      <FamilySetupContent />
    </Suspense>
  );
}
