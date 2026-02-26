"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconContract,
  IconToken,
  IconCheck,
  IconArrowRight
} from "@/components/icons";
import { SERVICE_TYPES, CONTRACT_FEE_EUR_CENTS, TOKEN_SYMBOL, PLATFORM_FEE_PERCENT } from "@/lib/constants";

function NewContractContent() {
  const searchParams = useSearchParams();
  const caregiverId = searchParams.get("caregiverId");
  const { status } = useSession();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    serviceType: "",
    hoursPerWeek: 10,
    hourlyRate: 25,
    startDate: "",
    endDate: "",
    schedule: "",
    tasks: "",
    elderInfo: "",
    specialNeeds: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  // Mock caregiver data
  const caregiver = {
    id: caregiverId || "1",
    name: "Carmela Oliveira",
    title: "Enfermeira",
    rating: 4.9,
    hourlyRate: 25,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalHours = formData.hoursPerWeek * 4; // Approximate monthly
  const totalEur = totalHours * formData.hourlyRate;
  const platformFee = totalEur * (PLATFORM_FEE_PERCENT / 100);
  const caregiverReceives = totalEur - platformFee;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // In real app, submit to API
    setTimeout(() => {
      setStep(4);
      setIsSubmitting(false);
    }, 2000);
  };

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Criar Contrato</h1>
        <p className="text-muted-foreground">
          Configure o contrato de cuidado com {caregiver.name}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {["Detalhes", "Horários", "Confirmar", "Concluído"].map((label, index) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > index + 1
                  ? "bg-primary text-primary-foreground"
                  : step === index + 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > index + 1 ? <IconCheck className="h-4 w-4" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${step === index + 1 ? "font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {index < 3 && (
              <div className="w-8 sm:w-16 h-0.5 bg-muted mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Service Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Serviço</CardTitle>
            <CardDescription>
              Defina o tipo de cuidado e informações importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Caregiver Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                {caregiver.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium">{caregiver.name}</p>
                <p className="text-sm text-muted-foreground">{caregiver.title}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-semibold">€{caregiver.hourlyRate}/hora</p>
                <p className="text-sm text-muted-foreground">⭐ {caregiver.rating}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Contrato</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Cuidado diário para idosa"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, serviceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elderInfo">Informações sobre o idoso</Label>
              <Textarea
                id="elderInfo"
                name="elderInfo"
                placeholder="Nome, idade, necessidades especiais..."
                value={formData.elderInfo}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialNeeds">Necessidades especiais (opcional)</Label>
              <Textarea
                id="specialNeeds"
                name="specialNeeds"
                placeholder="Medicamentos, restrições alimentares, mobilidade..."
                value={formData.specialNeeds}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contato de emergência</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  placeholder="Nome"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefone</Label>
                <Input
                  id="emergencyPhone"
                  name="emergencyPhone"
                  placeholder="+351 912 345 678"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Continuar
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Schedule & Hours */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Horários e Duração</CardTitle>
            <CardDescription>
              Defina a carga horária e período do contrato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hoursPerWeek">Horas por semana</Label>
                <Input
                  id="hoursPerWeek"
                  name="hoursPerWeek"
                  type="number"
                  min={1}
                  max={60}
                  value={formData.hoursPerWeek}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Valor por hora (€)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min={10}
                  max={100}
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Horários preferidos</Label>
              <Textarea
                id="schedule"
                name="schedule"
                placeholder="Ex: Segunda a Sexta, 09h às 13h"
                value={formData.schedule}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de início</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de término (opcional)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tasks">Tarefas e responsabilidades</Label>
              <Textarea
                id="tasks"
                name="tasks"
                placeholder="Descreva as tarefas esperadas..."
                value={formData.tasks}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Continuar
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisar e Confirmar</CardTitle>
            <CardDescription>
              Verifique todos os detalhes antes de criar o contrato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas/semana</span>
                  <span className="font-medium">{formData.hoursPerWeek}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor/hora</span>
                  <span className="font-medium">€{formData.hourlyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimativa mensal</span>
                  <span className="font-medium">{totalHours}h</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total estimado</span>
                  <span className="font-semibold">€{totalEur}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa plataforma ({PLATFORM_FEE_PERCENT}%)</span>
                  <span className="text-red-500">-€{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Cuidador recebe</span>
                  <span className="text-green-600">€{caregiverReceives.toFixed(2)}</span>
                </div>
              </div>

              {/* Contract Fee */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <IconToken className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Taxa de Contrato</p>
                    <p className="text-sm text-muted-foreground">
                      Você paga €{CONTRACT_FEE_EUR_CENTS / 100} em {TOKEN_SYMBOL} tokens para criar este contrato.
                      O cuidador também paga €{CONTRACT_FEE_EUR_CENTS / 100} ao aceitar.
                    </p>
                  </div>
                  <Badge>€{CONTRACT_FEE_EUR_CENTS / 100}</Badge>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm">
                Li e concordo com os{" "}
                <Link href="/termos" className="text-primary underline">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="text-primary underline">
                  Política de Privacidade
                </Link>
                . Entendo que este contrato será registrado na blockchain.
              </Label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Contrato"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <IconCheck className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Contrato Criado!</h2>
              <p className="text-muted-foreground">
                Seu contrato foi enviado para {caregiver.name} aceitar.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-left space-y-2">
              <div className="flex items-center gap-2">
                <IconContract className="h-4 w-4 text-primary" />
                <span className="font-medium">Contrato #12345</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Status: Aguardando aceite do cuidador
              </p>
              <p className="text-sm text-muted-foreground">
                Registrado na blockchain: Pendente (será gravado após aceite)
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/app/contracts">Ver Contratos</Link>
              </Button>
              <Button asChild>
                <Link href="/app/dashboard">Ir para Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-64"></div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
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
