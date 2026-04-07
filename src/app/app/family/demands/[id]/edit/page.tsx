'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
} from '@/components/icons';

interface Demand {
  id: string;
  familyUserId: string;
  title: string;
  description: string;
  hoursPerWeek: number;
  desiredStartDate: string;
  desiredEndDate: string;
  status: string;
}

interface FormData {
  title: string;
  description: string;
  hoursPerWeek: string;
  desiredStartDate: string;
  desiredEndDate: string;
}

export default function EditDemandPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    hoursPerWeek: '',
    desiredStartDate: '',
    desiredEndDate: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchDemand = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/demands/${resolvedParams.id}`);
        if (!response.ok) throw new Error('Demanda não encontrada');

        const demandData = await response.json();

        // Verify ownership
        if (demandData.familyUserId !== session?.user?.id) {
          throw new Error('Acesso negado');
        }

        setDemand(demandData);
        setFormData({
          title: demandData.title,
          description: demandData.description,
          hoursPerWeek: demandData.hoursPerWeek?.toString() || '',
          desiredStartDate: demandData.desiredStartDate || '',
          desiredEndDate: demandData.desiredEndDate || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar demanda');
      } finally {
        setLoading(false);
      }
    };

    fetchDemand();
  }, [status, resolvedParams.id, session?.user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return false;
    }
    if (formData.description.length < 100) {
      setError('Descrição deve ter pelo menos 100 caracteres');
      return false;
    }
    if (formData.hoursPerWeek && isNaN(Number(formData.hoursPerWeek))) {
      setError('Horas por semana deve ser um número válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/demands/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          hoursPerWeek: formData.hoursPerWeek ? Number(formData.hoursPerWeek) : null,
          desiredStartDate: formData.desiredStartDate || null,
          desiredEndDate: formData.desiredEndDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar demanda');
      }

      toast.success('Demanda atualizada com sucesso');
      router.push(`/app/family/demands/${resolvedParams.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar demanda';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded-lg" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && !demand) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/app/family/demands/${resolvedParams.id}`}
            className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Editar Demanda</h1>
            <p className="text-sm text-muted-foreground">
              Atualize os detalhes da sua demanda de serviços
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Informações da Demanda</CardTitle>
            <CardDescription>
              Edite os campos abaixo para atualizar sua demanda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
                  <IconAlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Título
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Cuidador para idoso em casa"
                  disabled={submitting}
                  className="h-10 rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva em detalhes o serviço que precisa..."
                  disabled={submitting}
                  rows={6}
                  className="rounded-lg resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/Mínimo 100 caracteres
                </p>
              </div>

              {/* Hours Per Week */}
              <div className="space-y-2">
                <Label htmlFor="hoursPerWeek" className="text-sm font-medium">
                  Horas por Semana
                </Label>
                <Input
                  id="hoursPerWeek"
                  name="hoursPerWeek"
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  placeholder="Ex: 20"
                  disabled={submitting}
                  min="0"
                  step="0.5"
                  className="h-10 rounded-lg"
                />
              </div>

              {/* Desired Start Date */}
              <div className="space-y-2">
                <Label htmlFor="desiredStartDate" className="text-sm font-medium">
                  Data Desejada de Início
                </Label>
                <Input
                  id="desiredStartDate"
                  name="desiredStartDate"
                  type="date"
                  value={formData.desiredStartDate}
                  onChange={handleChange}
                  disabled={submitting}
                  className="h-10 rounded-lg"
                />
              </div>

              {/* Desired End Date */}
              <div className="space-y-2">
                <Label htmlFor="desiredEndDate" className="text-sm font-medium">
                  Data Desejada de Término
                </Label>
                <Input
                  id="desiredEndDate"
                  name="desiredEndDate"
                  type="date"
                  value={formData.desiredEndDate}
                  onChange={handleChange}
                  disabled={submitting}
                  className="h-10 rounded-lg"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Link
                  href={`/app/family/demands/${resolvedParams.id}`}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancelar
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 rounded-lg"
                >
                  {submitting ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck className="h-4 w-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
