"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
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
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
} from "@/components/icons";

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

export default function EditDemandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    hoursPerWeek: "",
    desiredStartDate: "",
    desiredEndDate: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchDemand = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/demands/${resolvedParams.id}`);
        if (!response.ok) throw new Error("Demanda não encontrada");

        const demandData = await response.json();

        // Verify ownership
        if (demandData.familyUserId !== session?.user?.id) {
          throw new Error("Acesso negado");
        }

        setDemand(demandData);
        setFormData({
          title: demandData.title,
          description: demandData.description,
          hoursPerWeek: demandData.hoursPerWeek?.toString() || "",
          desiredStartDate: demandData.desiredStartDate || "",
          desiredEndDate: demandData.desiredEndDate || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar demanda",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDemand();
  }, [status, resolvedParams.id, session?.user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Título é obrigatório");
      return false;
    }
    if (formData.description.length < 100) {
      setError("Descrição deve ter pelo menos 100 caracteres");
      return false;
    }
    if (formData.hoursPerWeek && isNaN(Number(formData.hoursPerWeek))) {
      setError("Horas por semana deve ser um número válido");
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          hoursPerWeek: formData.hoursPerWeek
            ? Number(formData.hoursPerWeek)
            : null,
          desiredStartDate: formData.desiredStartDate || null,
          desiredEndDate: formData.desiredEndDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar demanda");
      }

      toast.success("Demanda atualizada com sucesso");
      router.push(`/app/family/demands/${resolvedParams.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar demanda";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-secondary rounded-3xl" />
            <div className="bg-card rounded-3xl p-7 border border-border shadow-card">
              <div className="space-y-6">
                <div className="h-10 bg-secondary rounded-2xl" />
                <div className="h-32 bg-secondary rounded-2xl" />
                <div className="h-10 bg-secondary rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && !demand) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-display font-bold text-foreground mb-1">
                Erro ao carregar
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link
            href={`/app/family/demands/${resolvedParams.id}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
          >
            <IconArrowLeft className="h-4 w-4" />
            <span className="text-xs font-display font-bold uppercase tracking-widest">
              Voltar
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2">
            Editar Demanda
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Atualize os detalhes da sua demanda de serviços
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
                <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-display font-bold text-foreground mb-1">
                    Erro ao atualizar
                  </p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase">
                Informações da Demanda
              </h2>

              {/* Title */}
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                >
                  Título
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Cuidador para idoso em casa"
                  disabled={submitting}
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                >
                  Descrição
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva em detalhes o serviço que precisa..."
                  disabled={submitting}
                  rows={6}
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/Mínimo 100 caracteres
                </p>
              </div>

              {/* Field Group - Hours and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hours Per Week */}
                <div className="space-y-2">
                  <label
                    htmlFor="hoursPerWeek"
                    className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                  >
                    Horas por Semana
                  </label>
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
                    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Desired Start Date */}
                <div className="space-y-2">
                  <label
                    htmlFor="desiredStartDate"
                    className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                  >
                    Data de Início
                  </label>
                  <Input
                    id="desiredStartDate"
                    name="desiredStartDate"
                    type="date"
                    value={formData.desiredStartDate}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Desired End Date */}
              <div className="space-y-2">
                <label
                  htmlFor="desiredEndDate"
                  className="text-xs font-display font-bold text-foreground uppercase tracking-widest mb-2 block"
                >
                  Data de Término
                </label>
                <Input
                  id="desiredEndDate"
                  name="desiredEndDate"
                  type="date"
                  value={formData.desiredEndDate}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
              <Link
                href={`/app/family/demands/${resolvedParams.id}`}
                className="flex items-center justify-center px-4 py-3 text-sm font-display font-bold uppercase tracking-widest rounded-2xl border border-border bg-card text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancelar
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 rounded-2xl"
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
        </div>
      </div>
    </AppShell>
  );
}
