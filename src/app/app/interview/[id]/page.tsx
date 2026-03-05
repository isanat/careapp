"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/layout/app-shell";
import { VideoRoom } from "@/components/video/video-room";
import {
  IconVideo,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconStar,
  IconAlertCircle,
  IconExternalLink
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";

interface Interview {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string;
  familyName: string;
  caregiverName: string;
  familyUserId: string;
  caregiverUserId: string;
  questionnaire: {
    communicationRating?: number;
    experienceRating?: number;
    punctualityRating?: number;
    wouldRecommend?: boolean;
    proceedWithContract?: boolean;
    notes?: string;
  } | null;
  familyCompletedAt?: string;
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Questionnaire state
  const [communicationRating, setCommunicationRating] = useState(3);
  const [experienceRating, setExperienceRating] = useState(3);
  const [punctualityRating, setPunctualityRating] = useState(3);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [proceedWithContract, setProceedWithContract] = useState(false);
  const [notes, setNotes] = useState("");
  
  const paramsRef = useRef(params);

  useEffect(() => {
    const loadInterview = async () => {
      const resolvedParams = await paramsRef.current;
      try {
        const response = await apiFetch(`/api/interviews/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          setInterview(data.interview);
          
          // Pre-fill questionnaire if exists
          if (data.interview.questionnaire) {
            setCommunicationRating(data.interview.questionnaire.communicationRating || 3);
            setExperienceRating(data.interview.questionnaire.experienceRating || 3);
            setPunctualityRating(data.interview.questionnaire.punctualityRating || 3);
            setWouldRecommend(data.interview.questionnaire.wouldRecommend ?? true);
            setProceedWithContract(data.interview.questionnaire.proceedWithContract ?? false);
            setNotes(data.interview.questionnaire.notes || "");
          }
        } else {
          setError("Entrevista não encontrada");
        }
      } catch (err) {
        setError("Falha ao carregar entrevista");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      loadInterview();
    }
  }, [status]);

  const handleStartInterview = async () => {
    if (!interview) return;
    
    try {
      await apiFetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      
      // Update local state
      setInterview({ ...interview, status: "IN_PROGRESS" });
    } catch (err) {
      setError("Falha ao iniciar entrevista");
    }
  };

  const handleCompleteInterview = async () => {
    if (!interview) return;
    
    try {
      await apiFetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      });
      
      setInterview({ ...interview, status: "COMPLETED" });
    } catch (err) {
      setError("Falha ao finalizar entrevista");
    }
  };

  const handleSubmitQuestionnaire = async () => {
    if (!interview) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire: {
            communicationRating,
            experienceRating,
            punctualityRating,
            wouldRecommend,
            proceedWithContract,
            notes
          }
        })
      });

      if (response.ok) {
        router.push("/app/dashboard?interview=completed");
      } else {
        setError("Falha ao enviar questionário");
      }
    } catch (err) {
      setError("Falha ao enviar questionário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveMeeting = async () => {
    // Automatically mark as completed when leaving
    if (interview?.status === "IN_PROGRESS") {
      await handleCompleteInterview();
    }
  };

  // Extract room name from URL (format: https://meet.jit.si/roomName)
  const getRoomName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace('/', '');
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-5 max-w-4xl mx-auto">
          <div className="h-28 bg-muted rounded-2xl" />
          <div className="h-[60vh] bg-muted rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell>
        <div className="text-center py-16 px-6 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/20">
            <IconAlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Erro</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Button className="rounded-xl h-12 px-8" onClick={() => router.push("/app/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  const isFamily = session?.user?.role === "FAMILY";
  const otherPartyName = isFamily ? interview.caregiverName : interview.familyName;
  const roomName = getRoomName(interview.videoRoomUrl);

  const getStatusBadge = () => {
    switch (interview.status) {
      case "SCHEDULED":
        return <Badge variant="secondary">Agendada</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-green-500">Em Andamento</Badge>;
      case "COMPLETED":
        return <Badge className="bg-primary">Concluída</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppShell hideBottomNav={interview.status === "IN_PROGRESS"}>
      <div className="space-y-5 max-w-4xl mx-auto pb-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-soft-md gradient-violet">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconVideo className="h-5 w-5" />
                <span className="text-sm font-medium opacity-80">Entrevista em Video</span>
              </div>
              {getStatusBadge()}
            </div>
            <h1 className="text-xl font-bold">
              {isFamily ? "Entrevista com" : "Entrevista da"} {otherPartyName}
            </h1>
            {interview.status === "SCHEDULED" && (
              <div className="flex items-center gap-2 mt-2 text-sm opacity-80">
                <IconClock className="h-4 w-4" />
                <span>
                  {new Date(interview.scheduledAt).toLocaleDateString("pt-PT", {
                    weekday: "short", day: "numeric", month: "short"
                  })} as {new Date(interview.scheduledAt).toLocaleTimeString("pt-PT", {
                    hour: "2-digit", minute: "2-digit"
                  })} ({interview.durationMinutes} min)
                </span>
              </div>
            )}
          </div>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 h-32 w-32 rounded-full bg-white/5" />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Scheduled Status - Before Interview */}
        {interview.status === "SCHEDULED" && (
          <div className="space-y-4">
            {/* Preparation Tips */}
            <div className="bg-surface rounded-2xl p-5 shadow-card border border-border/50">
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconVideo className="h-4 w-4 text-primary" />
                </span>
                Preparacao
              </h3>
              <div className="space-y-3">
                {[
                  { icon: "\uD83C\uDFA5", text: "Verifique se sua camera e microfone funcionam" },
                  { icon: "\uD83D\uDD07", text: "Escolha um local silencioso e bem iluminado" },
                  { icon: "\uD83D\uDCDD", text: "Tenha suas perguntas anotadas" },
                  { icon: "\uD83D\uDD12", text: "A entrevista e privada e segura" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-lg flex-shrink-0">{tip.icon}</span>
                    <span className="text-muted-foreground">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enter Room Button */}
            <Button
              onClick={handleStartInterview}
              size="lg"
              className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90"
            >
              <IconVideo className="h-6 w-6 mr-3" />
              Entrar na Sala de Entrevista
            </Button>
          </div>
        )}

        {/* In Progress - Video Room */}
        {interview.status === "IN_PROGRESS" && (
          <div className="space-y-3">
            {/* Video takes full available height */}
            <VideoRoom
              roomName={roomName}
              displayName={session?.user?.name || "Usuario"}
              email={session?.user?.email}
              subject={`Entrevista: ${otherPartyName}`}
              isModerator={isFamily}
              enableLobby={true}
              enablePrejoinPage={true}
              onLeave={handleLeaveMeeting}
              className="h-[calc(100vh-220px)] min-h-[400px]"
            />

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open(interview.videoRoomUrl, "_blank")}
                className="flex-1 h-12 rounded-xl"
              >
                <IconExternalLink className="h-4 w-4 mr-2" />
                Nova Aba
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleCompleteInterview}
                className="flex-1 h-12 rounded-xl"
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </div>
          </div>
        )}

        {/* Completed - Questionnaire (Family only) */}
        {interview.status === "COMPLETED" && isFamily && !interview.familyCompletedAt && (
          <div className="bg-surface rounded-2xl p-5 shadow-card border border-border/50 space-y-6">
            <div>
              <h2 className="text-lg font-bold">Questionario Pos-Entrevista</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Avalie sua experiencia com {interview.caregiverName}
              </p>
            </div>

            {/* Ratings */}
            {[
              { label: "Comunicacao", value: communicationRating, setter: setCommunicationRating },
              { label: "Experiencia e Qualificacoes", value: experienceRating, setter: setExperienceRating },
              { label: "Pontualidade", value: punctualityRating, setter: setPunctualityRating },
            ].map(({ label, value, setter }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setter(i + 1)}
                        className="p-0.5"
                      >
                        <IconStar className={`h-5 w-5 transition-colors ${
                          i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([v]) => setter(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
              </div>
            ))}

            {/* Recommendation */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <Label className="text-sm">Recomendaria este cuidador?</Label>
              <div className="flex gap-2">
                <Button
                  variant={wouldRecommend ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWouldRecommend(true)}
                  className="rounded-lg"
                >
                  <IconCheck className="h-3.5 w-3.5 mr-1" />
                  Sim
                </Button>
                <Button
                  variant={!wouldRecommend ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setWouldRecommend(false)}
                  className="rounded-lg"
                >
                  <IconX className="h-3.5 w-3.5 mr-1" />
                  Nao
                </Button>
              </div>
            </div>

            {/* Proceed with Contract */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${
              proceedWithContract ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Prosseguir com Contrato?</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confirmar que deseja contratar este cuidador
                  </p>
                </div>
                <Button
                  variant={proceedWithContract ? "default" : "outline"}
                  size="lg"
                  onClick={() => setProceedWithContract(!proceedWithContract)}
                  className="rounded-xl h-12 px-6"
                >
                  {proceedWithContract ? <IconCheck className="h-4 w-4 mr-1.5" /> : null}
                  {proceedWithContract ? "Sim!" : "Ainda Nao"}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">Observacoes (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma observacao adicional..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitQuestionnaire}
              disabled={isSubmitting}
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <IconCheck className="h-5 w-5 mr-2" />
                  Enviar Questionario
                </>
              )}
            </Button>
          </div>
        )}

        {/* Already Completed */}
        {interview.familyCompletedAt && (
          <div className="text-center py-12 px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center ring-4 ring-green-500/20">
              <IconCheck className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Questionario Enviado</h2>
            <p className="text-muted-foreground text-sm">
              {proceedWithContract
                ? "O contrato esta aguardando a aceitacao do cuidador."
                : "Seu feedback foi registrado."}
            </p>
            <Button className="mt-6 rounded-xl h-12 px-8" onClick={() => router.push("/app/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </div>
        )}

        {/* Caregiver View - Completed */}
        {interview.status === "COMPLETED" && !isFamily && (
          <div className="text-center py-12 px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center ring-4 ring-green-500/20">
              <IconCheck className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Entrevista Concluida</h2>
            <p className="text-muted-foreground text-sm">
              A familia ira avaliar a entrevista e voce sera notificado sobre o resultado.
            </p>
            <Button className="mt-6 rounded-xl h-12 px-8" onClick={() => router.push("/app/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
