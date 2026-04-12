"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { BloomCard, BloomBadge, BloomSectionHeader, BloomEmpty } from "@/components/bloom";
import {
  IconVideo,
  IconClock,
  IconCheck,
  IconX,
  IconCalendar,
  IconLoader2,
  IconAlertCircle,
} from "@/components/icons";

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
        return <BloomBadge variant="primary">Agendada</BloomBadge>;
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
      <AppShell>
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header - Bloom style */}
        <BloomSectionHeader
          title="Entrevistas"
          description="Gerencie suas entrevistas agendadas"
          icon={<IconVideo className="h-6 w-6 text-primary" />}
        />

        {error && (
          <BloomCard topBar topBarColor="bg-destructive">
            <div className="flex items-start gap-4">
              <IconAlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              <p className="text-sm font-medium text-muted-foreground">{error}</p>
            </div>
          </BloomCard>
        )}

        {/* Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-black text-foreground uppercase">Próximas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingInterviews.map((interview) => (
                <Link key={interview.id} href={`/app/interview/${interview.id}`} className="group">
                  <BloomCard interactive topBar>
                    {/* Header with Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-black text-foreground truncate uppercase text-sm">
                          {interview.otherPartyRole === "family"
                            ? "Entrevista com Família"
                            : "Entrevista com Cuidador"}
                        </h3>
                        <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 truncate">{interview.otherPartyName}</p>
                      </div>
                      {getStatusBadge(interview.status)}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-border/30">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IconCalendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Data</p>
                          <p className="text-xs font-semibold text-foreground truncate mt-1">
                            {new Date(interview.scheduledAt).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IconClock className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Duração</p>
                          <p className="text-xs font-semibold text-foreground mt-1">
                            {formatTime(interview.durationMinutes)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4">
                      <Button className="w-full h-10 text-xs font-semibold uppercase">
                        <IconVideo className="h-4 w-4 mr-2" />
                        Entrar
                      </Button>
                    </div>
                  </BloomCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Interviews */}
        {pastInterviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-black text-foreground uppercase">Histórico</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastInterviews.map((interview) => {
                const statusColorMap: Record<string, { border: string; top: string; badge: string }> = {
                  COMPLETED: { border: "border-success/30 hover:border-success/50", top: "bg-success", badge: "bg-success/10 text-success" },
                  CANCELLED: { border: "border-error/30 hover:border-error/50", top: "bg-error", badge: "bg-error/10 text-error" },
                  NO_SHOW: { border: "border-warning/30 hover:border-warning/50", top: "bg-warning", badge: "bg-warning/10 text-warning" },
                };
                const statusConfig = statusColorMap[interview.status] || statusColorMap.COMPLETED;

                return (
                  <Link key={interview.id} href={`/app/interview/${interview.id}`} className="group">
                    <div className={`bg-surface rounded-xl p-4 border-2 ${statusConfig.border} transition-all card-interactive h-full`}>
                      {/* Top color bar */}
                      <div className={`h-1 -mx-4 -mt-4 mb-4 rounded-t-lg ${statusConfig.top}`} />

                      {/* Header with Icon and Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                            backgroundColor: interview.status === 'COMPLETED' ? 'hsl(var(--success) / 0.1)' :
                                           interview.status === 'CANCELLED' ? 'hsl(var(--destructive) / 0.1)' :
                                           'hsl(var(--warning) / 0.1)'
                          }}>
                            {getStatusIcon(interview.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {interview.otherPartyRole === "family"
                                ? "Entrevista com Família"
                                : "Entrevista com Cuidador"}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{interview.otherPartyName}</p>
                          </div>
                        </div>
                        <span className={`${statusConfig.badge} border border-current/30 rounded-lg text-[10px] px-2.5 py-1 shrink-0 font-display font-bold uppercase tracking-widest`}>
                          {interview.status === "COMPLETED" ? "Concluída" :
                           interview.status === "CANCELLED" ? "Cancelada" :
                           "Não Compareceu"}
                        </span>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/30 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                            <IconCalendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-medium">Data/Hora</p>
                            <p className="text-xs font-semibold text-foreground truncate">
                              {new Date(interview.scheduledAt).toLocaleDateString("pt-PT")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                            <IconClock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground font-medium">Duração</p>
                            <p className="text-xs font-semibold text-foreground">
                              {formatTime(interview.durationMinutes)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* View Button */}
                      <Button variant="outline" className="w-full h-8 text-xs" size="sm">
                        <IconVideo className="h-3.5 w-3.5 mr-1.5" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {interviews.length === 0 && !isLoading && (
          <BloomEmpty
            icon={<IconVideo className="h-8 w-8" />}
            title="Nenhuma entrevista agendada"
            description="Suas entrevistas aparecerão aqui quando agendadas"
          />
        )}
      </div>
    </AppShell>
  );
}
