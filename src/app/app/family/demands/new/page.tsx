'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/icons';

const SERVICE_TYPES = [
  'PERSONAL_CARE',
  'MEDICATION',
  'MOBILITY',
  'COMPANIONSHIP',
  'MEAL_PREPARATION',
  'LIGHT_HOUSEWORK',
  'TRANSPORTATION',
  'COGNITIVE_SUPPORT',
  'NIGHT_CARE',
  'PALLIATIVE_CARE',
  'PHYSIOTHERAPY',
  'NURSING_CARE',
];

const SERVICE_LABELS: Record<string, string> = {
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
  { value: 'NONE', label: 'Publicar Grátis', price: 0, desc: '1x por mês (sem boost)', icon: IconCheck },
  { value: 'BASIC', label: 'BASIC', price: 3, desc: '7 dias de visibilidade', icon: IconEuro },
  { value: 'PREMIUM', label: 'PREMIUM', price: 8, desc: '30 dias destacado', icon: IconStar },
  { value: 'URGENT', label: 'URGENTE', price: 15, desc: '3 dias no topo', icon: IconTrendingUp },
];

function NewDemandContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('NONE');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    serviceTypes: [],
    address: '',
    city: '',
    postalCode: '',
    requiredExperienceLevel: 'INTERMEDIATE',
    requiredCertifications: [],
    careType: 'RECURRING',
    desiredStartDate: '',
    desiredEndDate: '',
    hoursPerWeek: '',
    budgetEurCents: '',
    minimumHourlyRateEur: '',
    visibilityPackage: 'BASIC',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleServiceTypeChange = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(s => s !== serviceType)
        : [...prev.serviceTypes, serviceType],
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError('Título é obrigatório');
          return false;
        }
        if (formData.description.length < 100) {
          setError('Descrição deve ter pelo menos 100 caracteres');
          return false;
        }
        return true;

      case 2:
        if (formData.serviceTypes.length === 0) {
          setError('Selecione pelo menos um tipo de serviço');
          return false;
        }
        if (!formData.city.trim()) {
          setError('Localidade é obrigatória');
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

  const handleCreateDemand = async (visibilityPackage: string = 'NONE') => {
    if (!validateStep(4)) {
      setSubmitError('Verifique as informações preenchidas');
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : undefined,
          budgetEurCents: formData.budgetEurCents ? parseInt(formData.budgetEurCents) : undefined,
          minimumHourlyRateEur: formData.minimumHourlyRateEur ? parseInt(formData.minimumHourlyRateEur) : undefined,
          visibilityPackage: visibilityPackage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao criar demanda');
      }

      const data = await res.json();

      // Se pagou visibilidade, redireciona para checkout Stripe
      if (visibilityPackage !== 'NONE') {
        router.push(`/app/family/demands/${data.id}/boost?package=${visibilityPackage}`);
      } else {
        // Senão, vai pro dashboard
        router.push('/app/family/demands');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro inesperado');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Criar Nova Demanda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atraia cuidadores qualificados com uma demanda clara
          </p>
        </div>
        <Link
          href="/app/family/demands"
          className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Fechar"
        >
          <IconX className="h-5 w-5" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
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

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* Step 1: Informações Básicas */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Informações Básicas</h2>
            <p className="text-sm text-muted-foreground">
              Comece com os detalhes principais da sua demanda
            </p>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Título da Demanda</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Cuidadora para idosa em Lisboa"
                className="h-11 rounded-xl text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 caracteres
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Descrição Detalhada (mín. 100 caracteres)
              </Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhadamente a necessidade, condições, horários, requisitos especiais, etc."
                rows={5}
                className="rounded-xl text-sm resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/100 caracteres mínimos
                </p>
                {formData.description.length >= 100 && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <IconCheck className="h-3 w-3" />
                    OK
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={!formData.title.trim() || formData.description.length < 100}
            size="lg"
            className="w-full h-11 rounded-xl font-semibold gap-2"
          >
            Continuar
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Detalhes */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Detalhes da Demanda</h2>
            <p className="text-sm text-muted-foreground">
              Especifique os tipos de serviço e localização
            </p>
          </div>

          <div className="space-y-5">
            {/* Service Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipos de Serviço</Label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleServiceTypeChange(type)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      formData.serviceTypes.includes(type)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <Checkbox
                      checked={formData.serviceTypes.includes(type)}
                      onCheckedChange={() => handleServiceTypeChange(type)}
                      className="cursor-pointer"
                    />
                    <span className="text-xs font-medium">{SERVICE_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Localização</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">
                  Localidade
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ex: Lisboa, Porto, Covilhã"
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal" className="text-xs font-medium text-muted-foreground">
                  Código Postal (opcional)
                </Label>
                <Input
                  id="postal"
                  value={formData.postalCode}
                  onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Ex: 1000-001"
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-medium text-muted-foreground">
                  Endereço (opcional)
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço detalhado"
                  className="h-10 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Budget Section */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-sm font-semibold">Orçamento</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Total Budget */}
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-xs font-medium text-muted-foreground">
                    Orçamento Total (€)
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budgetEurCents ? parseInt(formData.budgetEurCents) / 100 : ''}
                    onChange={e => {
                      const value = e.target.value ? parseInt(e.target.value) * 100 : '';
                      setFormData(prev => ({ ...prev, budgetEurCents: value.toString() }));
                    }}
                    placeholder="Ex: 1500"
                    min="0"
                    step="50"
                    className="h-10 rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Orçamento total que pode gastar</p>
                </div>

                {/* Minimum Hourly Rate */}
                <div className="space-y-2">
                  <Label htmlFor="hourly" className="text-xs font-medium text-muted-foreground">
                    Taxa Mín./Hora (€)
                  </Label>
                  <Input
                    id="hourly"
                    type="number"
                    value={formData.minimumHourlyRateEur ? parseInt(formData.minimumHourlyRateEur) / 100 : ''}
                    onChange={e => {
                      const value = e.target.value ? parseInt(e.target.value) * 100 : '';
                      setFormData(prev => ({ ...prev, minimumHourlyRateEur: value.toString() }));
                    }}
                    placeholder="Ex: 12"
                    min="0"
                    step="1"
                    className="h-10 rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Mínimo negociável</p>
                </div>
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-sm font-medium">
                Nível de Experiência Requerido
              </Label>
              <select
                id="experience"
                value={formData.requiredExperienceLevel}
                onChange={e => setFormData(prev => ({ ...prev, requiredExperienceLevel: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="BEGINNER">Iniciante</option>
                <option value="INTERMEDIATE">Intermediário</option>
                <option value="ADVANCED">Avançado</option>
                <option value="EXPERT">Especialista</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              size="lg"
              className="h-11 rounded-xl px-4"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleNext}
              disabled={formData.serviceTypes.length === 0 || !formData.city.trim()}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule & Frequency */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Agenda e Frequência</h2>
            <p className="text-sm text-muted-foreground">
              Defina quando, quanto tempo e que tipo de cuidado precisa
            </p>
          </div>

          <div className="space-y-5">
            {/* Care Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Cuidado</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'RECURRING', label: 'Recorrente', desc: 'Cuidado regular' },
                  { value: 'URGENT', label: 'Urgente', desc: 'Necessidade imediata' },
                  { value: 'BOTH', label: 'Ambos', desc: 'Regular + Urgente' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, careType: option.value }))}
                    className={`px-3 py-2.5 rounded-lg border-2 text-sm text-left transition-all ${
                      formData.careType === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Datas</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground">
                  Data Desejada de Início
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.desiredStartDate}
                  onChange={e => setFormData(prev => ({ ...prev, desiredStartDate: e.target.value }))}
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-medium text-muted-foreground">
                  Data Desejada de Término (opcional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.desiredEndDate}
                  onChange={e => setFormData(prev => ({ ...prev, desiredEndDate: e.target.value }))}
                  className="h-10 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Hours per Week */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-primary" />
                <Label htmlFor="hours" className="text-sm font-medium">
                  Horas por Semana
                </Label>
              </div>
              <Input
                id="hours"
                type="number"
                value={formData.hoursPerWeek}
                onChange={e => setFormData(prev => ({ ...prev, hoursPerWeek: e.target.value }))}
                min="0"
                placeholder="Ex: 20"
                className="h-10 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              size="lg"
              className="h-11 rounded-xl px-4"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleNext}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Revisão */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Revisar Demanda</h2>
            <p className="text-sm text-muted-foreground">
              Verifique todas as informações antes de publicar
            </p>
          </div>

          {/* Summary Cards */}
          <div className="space-y-3">
            {/* Basic Info */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Informações Básicas
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">{formData.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {formData.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services & Location */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Serviços e Localização
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {formData.serviceTypes.map(type => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-[10px] font-medium px-2 py-0.5 h-auto"
                      >
                        {SERVICE_LABELS[type]}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm mt-2">
                    <IconMapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {formData.city}
                      {formData.postalCode && ` - ${formData.postalCode}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {(formData.desiredStartDate || formData.hoursPerWeek) && (
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Timeline
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {formData.desiredStartDate && (
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Início: {new Date(formData.desiredStartDate).toLocaleDateString('pt-PT')}</span>
                      </div>
                    )}
                    {formData.hoursPerWeek && (
                      <div className="flex items-center gap-2">
                        <IconClock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formData.hoursPerWeek} horas/semana</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget */}
            {(formData.budgetEurCents || formData.minimumHourlyRateEur) && (
              <Card className="border-primary/20 overflow-hidden bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Orçamento
                  </p>
                  <div className="space-y-2 text-sm">
                    {formData.budgetEurCents && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Orçamento Total:</span>
                        <span className="font-semibold">€{(parseInt(formData.budgetEurCents) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.minimumHourlyRateEur && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Taxa Mín./Hora:</span>
                        <span className="font-semibold">€{(parseInt(formData.minimumHourlyRateEur) / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              size="lg"
              className="h-11 rounded-xl px-4"
              disabled={loading}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setStep(5)}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2"
            >
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Visibility Package */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Escolha Visibilidade</h2>
            <p className="text-sm text-muted-foreground">
              Aumente as chances de receber propostas com visibilidade na plataforma
            </p>
          </div>

          {/* Visibility Options */}
          <div className="space-y-3">
            {VISIBILITY_PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <button
                  key={pkg.value}
                  onClick={() => setSelectedPackage(pkg.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPackage === pkg.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <p className="font-semibold">{pkg.label}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{pkg.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {pkg.price === 0 ? 'Grátis' : `€${pkg.price}`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Demandas com visibilidade recebem {' '}
              <span className="font-semibold">3x mais propostas</span> em média. Você pode sempre comprar mais visibilidade depois!
            </p>
          </div>

          {submitError && (
            <div className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <IconAlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(4)}
              size="lg"
              className="h-11 rounded-xl px-4"
              disabled={loading}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleCreateDemand(selectedPackage)}
              disabled={loading}
              size="lg"
              className="flex-1 h-11 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/25"
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  Publicar Demanda
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
    <AppShell>
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
    </AppShell>
  );
}
