"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import {
  BloomSectionHeader,
  BloomBadge,
  BloomEmpty,
} from "@/components/bloom-custom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  IconVideo,
  IconCalendar,
  IconClock,
  IconUser,
  IconCheck,
  IconX,
  IconChevronRight,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface Interview {
  id: string;
  status: InterviewStatus;
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string | null;
  otherPartyName: string;
  otherPartyRole: "caregiver" | "family";
  questionnaire: object | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUpcoming(interview: Interview): boolean {
  return (
    interview.status === "SCHEDULED" &&
    new Date(interview.scheduledAt) > new Date()
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveStatusLabel(interview: Interview): string {
  if (interview.status === "CANCELLED") return "Cancelada";
  // Both COMPLETED and SCHEDULED with past date are treated as completed
  return "Concluída";
}

function resolveStatusVariant(
  interview: Interview
): "success" | "destructive" | "secondary" {
  if (interview.status === "CANCELLED") return "destructive";
  return "success";
}

// ---------------------------------------------------------------------------
// Detail Modal
// ---------------------------------------------------------------------------

interface DetailModalProps {
  interview: Interview;
  onClose: () => void;
}

function DetailModal({ interview, onClose }: DetailModalProps) {
  const statusLabel = resolveStatusLabel(interview);
  const showRecording =
    interview.status === "COMPLETED" && !!interview.videoRoomUrl;

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-foreground/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-elevated p-8 relative border border-border">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          aria-label="Fechar"
        >
          <IconX className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <IconVideo className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-foreground tracking-tight">
              Detalhe da Entrevista
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(interview.scheduledAt)} · {formatTime(interview.scheduledAt)}
            </p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-4 mb-6">
          {/* Participant */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <IconUser className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Participante</p>
              <p className="text-sm font-semibold text-foreground">
                {interview.otherPartyName}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <IconCalendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data e hora</p>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(interview.scheduledAt)} às {formatTime(interview.scheduledAt)}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <IconClock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duração</p>
              <p className="text-sm font-semibold text-foreground">
                {interview.durationMinutes}m
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              {interview.status === "CANCELLED" ? (
                <IconX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <IconCheck className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="text-sm font-semibold text-foreground">{statusLabel}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {showRecording && (
            <Button
              className="flex-1"
              onClick={() => window.open(interview.videoRoomUrl!, "_blank")}
            >
              <IconVideo className="w-4 h-4 mr-2" />
              Rever Gravação
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Interview Card
// ---------------------------------------------------------------------------

interface UpcomingCardProps {
  interview: Interview;
}

function UpcomingCard({ interview }: UpcomingCardProps) {
  const hasRoom = !!interview.videoRoomUrl;

  return (
    <div className="bg-card rounded-3xl border-2 border-info/30 shadow-card p-6 flex items-center gap-4">
      <div className="w-14 h-14 bg-info/10 rounded-2xl flex items-center justify-center shrink-0">
        <IconVideo className="w-6 h-6 text-info" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-foreground text-base leading-tight truncate">
          {interview.otherPartyName}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconCalendar className="w-3.5 h-3.5 shrink-0" />
            {new Date(interview.scheduledAt).toLocaleDateString("pt-PT")}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconClock className="w-3.5 h-3.5 shrink-0" />
            {interview.durationMinutes}m
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconClock className="w-3.5 h-3.5 shrink-0" />
            {formatTime(interview.scheduledAt)}
          </span>
        </div>
      </div>

      <Button
        size="sm"
        disabled={!hasRoom}
        onClick={() => hasRoom && window.open(interview.videoRoomUrl!, "_blank")}
        className="shrink-0"
      >
        ENTRAR
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Past Interview Card
// ---------------------------------------------------------------------------

interface PastCardProps {
  interview: Interview;
  onDetails: (interview: Interview) => void;
}

function PastCard({ interview, onDetails }: PastCardProps) {
  const statusLabel = resolveStatusLabel(interview);
  const variant = resolveStatusVariant(interview);

  return (
    <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated transition-all">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
          <IconUser className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-foreground text-base leading-tight truncate">
            {interview.otherPartyName}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <IconCalendar className="w-3.5 h-3.5 shrink-0" />
              {new Date(interview.scheduledAt).toLocaleDateString("pt-PT")}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <IconClock className="w-3.5 h-3.5 shrink-0" />
              {interview.durationMinutes}m
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:shrink-0">
        <BloomBadge
          variant={
            variant === "success"
              ? "success"
              : variant === "destructive"
              ? "destructive"
              : "secondary"
          }
          className="text-xs"
        >
          {statusLabel}
        </BloomBadge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDetails(interview)}
          className="flex items-center gap-1 text-sm"
        >
          Ver Detalhes
          <IconChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function InterviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-3xl border border-border shadow-card p-6 flex items-center gap-4"
        >
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

function InterviewsPageContent() {
  useSession();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/interviews");
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: não foi possível carregar as entrevistas.`);
        }
        const data = await res.json();
        setInterviews(data.interviews ?? []);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar as entrevistas."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInterviews();
  }, []);

  const upcoming = interviews.filter(isUpcoming);
  const past = interviews.filter((i) => !isUpcoming(i));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <BloomSectionHeader
        title="Entrevistas"
        description="Acompanhe o estado das entrevistas agendadas e realizadas."
      />

      {/* Loading */}
      {loading && <InterviewsSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="bg-card rounded-3xl border-2 border-destructive/30 shadow-card p-6 text-center">
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconX className="w-6 h-6 text-destructive" />
          </div>
          <p className="font-display font-bold text-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente novamente mais tarde ou contacte o suporte.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && interviews.length === 0 && (
        <BloomEmpty
          icon={<IconVideo className="w-8 h-8" />}
          title="Sem entrevistas"
          description="Não tem nenhuma entrevista agendada ou realizada neste momento."
        />
      )}

      {/* Upcoming interviews section */}
      {!loading && !error && upcoming.length > 0 && (
        <section className="space-y-4">
          <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-info pl-4">
            Próximas Entrevistas
          </p>
          <div className="space-y-3">
            {upcoming.map((interview) => (
              <UpcomingCard key={interview.id} interview={interview} />
            ))}
          </div>
        </section>
      )}

      {/* Past interviews section */}
      {!loading && !error && past.length > 0 && (
        <section className="space-y-4">
          <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
            Histórico
          </p>
          <div className="space-y-3">
            {past.map((interview) => (
              <PastCard
                key={interview.id}
                interview={interview}
                onDetails={setSelectedInterview}
              />
            ))}
          </div>
        </section>
      )}

      {/* Detail modal */}
      {selectedInterview && (
        <DetailModal
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
        />
      )}
    </div>
  );
}

export default function InterviewsPage() {
  return (
    <div suppressHydrationWarning>
      <InterviewsPageContent />
    </div>
  );
}
