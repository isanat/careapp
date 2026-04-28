"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BloomCard } from "@/components/bloom-custom";
import { BloomSectionHeader } from "@/components/bloom-custom";
import { BloomBadge } from "@/components/bloom-custom";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconVideo,
  IconClock,
  IconCheck,
  IconX,
  IconCalendar,
  IconLoader2,
  IconAlertCircle,
} from "@/components/icons";
// Removed AppShell import - layout.tsx provides global AppShell wrapper

interface Interview {
  id: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string;
  otherPartyName: string;
  otherPartyRole: "family" | "caregiver";
  questionnaire?: any;
  createdAt: string;
}

export default function InterviewsPage() {
  const { data: session, status } = useSession();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchInterviews();
    }
  }, [status]);

  const fetchInterviews = async () => {
    try {
      const response = await apiFetch("/api/interviews");
      if (!response.ok) {
        throw new Error("Erro ao carregar entrevistas");
      }
      const data = await response.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar entrevistas");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Interview["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <BloomBadge variant="success">Concluída</BloomBadge>;
      case "SCHEDULED":
        return <BloomBadge variant="info">Agendada</BloomBadge>;
      case "CANCELLED":
        return <BloomBadge variant="destructive">Cancelada</BloomBadge>;
      case "NO_SHOW":
        return <BloomBadge variant="warning">Não Compareceu</BloomBadge>;
      default:
        return <BloomBadge>{status}</BloomBadge>;
    }
  };

  const getStatusIcon = (status: Interview["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <IconCheck className="h-5 w-5 text-green-500" />;
      case "SCHEDULED":
        return <IconClock className="h-5 w-5 text-blue-500" />;
      case "CANCELLED":
        return <IconX className="h-5 w-5 text-destructive" />;
      case "NO_SHOW":
        return <IconAlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const upcomingInterviews = interviews.filter(
    (i) => i.status === "SCHEDULED" && new Date(i.scheduledAt) > new Date()
  );

  const pastInterviews = interviews.filter(
    (i) => i.status !== "SCHEDULED" || new Date(i.scheduledAt) <= new Date()
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <BloomSectionHeader
          title="Entrevistas"
          description="Gerencie suas entrevistas agendadas"
          icon={<IconVideo className="h-6 w-6" />}
        />

        {error && (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-display font-black">Próximas Entrevistas</h2>
            <div className="grid gap-3">
              {upcomingInterviews.map((interview) => (
                <BloomCard key={interview.id} className="border-primary/20 bg-primary/5 hover:shadow-elevated">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base">
                            {interview.otherPartyRole === "family"
                              ? "Entrevista com Família"
                              : "Entrevista com Cuidador"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {interview.otherPartyName}
                          </p>
                        </div>
                        {getStatusBadge(interview.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDateTime(interview.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-muted-foreground" />
                          <span>Duração: {formatTime(interview.durationMinutes)}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/app/interview/${interview.id}`}>
                      <Button className="whitespace-nowrap">
                        <IconVideo className="h-4 w-4 mr-2" />
                        Entrar
                      </Button>
                    </Link>
                  </div>
                </BloomCard>
              ))}
            </div>
          </div>
        )}

        {/* Past Interviews */}
        {pastInterviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-display font-black">Histórico de Entrevistas</h2>
            <div className="grid gap-3">
              {pastInterviews.map((interview) => (
                <BloomCard key={interview.id} className="opacity-75 hover:shadow-elevated">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(interview.status)}
                        <div>
                          <h3 className="font-semibold text-base">
                            {interview.otherPartyRole === "family"
                              ? "Entrevista com Família"
                              : "Entrevista com Cuidador"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {interview.otherPartyName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4" />
                          <span>{formatDateTime(interview.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4" />
                          <span>Duração: {formatTime(interview.durationMinutes)}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/app/interview/${interview.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </BloomCard>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {interviews.length === 0 && (
          <BloomCard className="shadow-card">
            <div className="pt-12 pb-12 text-center">
              <IconVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma entrevista agendada</h3>
              <p className="text-muted-foreground">
                Quando familiares agendem entrevistas com você, elas aparecerão aqui
              </p>
            </div>
          </BloomCard>
        )}

        {/* Stats */}
        {interviews.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <BloomCard className="shadow-card hover:shadow-elevated">
              <div className="pt-6 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {upcomingInterviews.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {upcomingInterviews.length === 1 ? "Próxima" : "Próximas"}
                </p>
              </div>
            </BloomCard>
            <BloomCard className="shadow-card hover:shadow-elevated">
              <div className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {interviews.filter((i) => i.status === "COMPLETED").length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Concluídas</p>
              </div>
            </BloomCard>
            <BloomCard className="shadow-card hover:shadow-elevated">
              <div className="pt-6 text-center">
                <div className="text-2xl font-bold text-destructive">
                  {interviews.filter((i) => i.status === "CANCELLED").length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Canceladas</p>
              </div>
            </BloomCard>
          </div>
        )}
      </div>
    );
}
