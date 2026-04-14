"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { BloomSectionHeader, BloomEmpty, BloomCard, BloomBadge, BloomSectionDivider } from "@/components/bloom-custom";
import {
  IconVideo,
  IconClock,
  IconCheck,
  IconX,
  IconCalendar,
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
          <Skeleton className="h-24 rounded-3xl w-full" />
          <Skeleton className="h-24 rounded-3xl w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <BloomSectionHeader
          title="Entrevistas"
          desc="Acompanhe o estado das entrevistas agendadas e realizadas."
        />

        {error && (
          <div className="bg-card rounded-3xl p-5 sm:p-7 border-2 border-destructive/30 bg-destructive/5 flex items-center gap-3 shadow-card">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
          <section className="space-y-4">
            <BloomSectionDivider title="Próximas Entrevistas" borderColor="primary" />
            <div className="grid grid-cols-1 gap-4">
              {upcomingInterviews.map((interview) => (
                <Link key={interview.id} href={`/app/interview/${interview.id}`}>
                  <BloomCard variant="interactive">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center ring-4 ring-secondary shrink-0 text-primary">
                          <IconVideo className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-lg font-display font-black text-foreground uppercase tracking-tight">
                              {interview.otherPartyRole === "family" ? "Entrevista com Família" : "Entrevista com Cuidador"}
                            </h4>
                            <BloomBadge variant="primary">Agendada</BloomBadge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mt-1">{interview.otherPartyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-display font-black text-muted-foreground/50 uppercase tracking-widest">Data</p>
                          <p className="text-3xl font-display font-black text-foreground tracking-tighter leading-none">
                            {new Date(interview.scheduledAt).toLocaleDateString("pt-PT")}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-1">{formatTime(interview.durationMinutes)}</p>
                        </div>
                        <Button variant="default" size="sm">
                          <IconVideo className="h-4 w-4 mr-1.5" />
                          Entrar
                        </Button>
                      </div>
                    </div>
                  </BloomCard>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Past Interviews */}
        {pastInterviews.length > 0 && (
          <section className="space-y-4">
            <BloomSectionDivider title="Histórico" borderColor="primary" />
            <div className="grid grid-cols-1 gap-4">
              {pastInterviews.map((interview) => (
                <Link key={interview.id} href={`/app/interview/${interview.id}`}>
                  <BloomCard variant="interactive">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center ring-4 ring-secondary shrink-0 text-muted-foreground">
                          <IconVideo className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-lg font-display font-black text-foreground uppercase tracking-tight">
                              {interview.otherPartyRole === "family" ? "Entrevista com Família" : "Entrevista com Cuidador"}
                            </h4>
                            <BloomBadge variant={
                              interview.status === "COMPLETED" ? "success" :
                              interview.status === "CANCELLED" ? "destructive" :
                              "warning"
                            }>
                              {interview.status === "COMPLETED" ? "Concluída" :
                               interview.status === "CANCELLED" ? "Cancelada" :
                               "Não Compareceu"}
                            </BloomBadge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mt-1">{interview.otherPartyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-display font-black text-muted-foreground/50 uppercase tracking-widest">Data</p>
                          <p className="text-3xl font-display font-black text-foreground tracking-tighter leading-none">
                            {new Date(interview.scheduledAt).toLocaleDateString("pt-PT")}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-1">{formatTime(interview.durationMinutes)}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </BloomCard>
                </Link>
              ))}
            </div>
          </section>
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
