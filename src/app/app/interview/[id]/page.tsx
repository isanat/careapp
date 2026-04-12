"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AppShell } from "@/components/layout/app-shell";
import { AgoraRoom } from "@/components/video/agora-room";
import {
  IconVideo,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconStar,
  IconAlertCircle,
  IconExternalLink,
  IconContract,
  IconChat,
  IconArrowLeft,
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
  caregiverQuestionnaire: {
    familyRating?: number;
    clarityRating?: number;
    notes?: string;
    platformLiabilityAck?: boolean;
  } | null;
  familyCompletedAt?: string;
  caregiverCompletedAt?: string;
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

  // Legal acknowledgement fields
  const [interviewConducted, setInterviewConducted] = useState(false);
  const [agreedExpectations, setAgreedExpectations] = useState(false);
  const [noMisrepresentation, setNoMisrepresentation] = useState(false);
  const [platformLiabilityAck, setPlatformLiabilityAck] = useState(false);

  // Caregiver questionnaire state
  const [cgFamilyRating, setCgFamilyRating] = useState(3);
  const [cgClarityRating, setCgClarityRating] = useState(3);
  const [cgNotes, setCgNotes] = useState("");
  const [cgInterviewConducted, setCgInterviewConducted] = useState(false);
  const [cgPlatformAck, setCgPlatformAck] = useState(false);
  const [cgNoMisrepresentation, setCgNoMisrepresentation] = useState(false);
  const [userLeftMeeting, setUserLeftMeeting] = useState(false);

  const paramsRef = useRef(params);

  useEffect(() => {
    const loadInterview = async () => {
      const resolvedParams = await paramsRef.current;
      try {
        const response = await apiFetch(`/api/interviews/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Interview loaded:', {
            id: data.interview.id,
            status: data.interview.status,
            videoRoomUrl: data.interview.videoRoomUrl
          });
          setInterview(data.interview);
          if (data.interview.questionnaire) {
            setCommunicationRating(data.interview.questionnaire.communicationRating || 3);
            setExperienceRating(data.interview.questionnaire.experienceRating || 3);
            setPunctualityRating(data.interview.questionnaire.punctualityRating || 3);
            setWouldRecommend(data.interview.questionnaire.wouldRecommend ?? true);
            setProceedWithContract(data.interview.questionnaire.proceedWithContract ?? false);
            setNotes(data.interview.questionnaire.notes || "");
          }
        } else {
          setError("Entrevista nao encontrada");
        }
      } catch {
        setError("Falha ao carregar entrevista");
      } finally {
        setIsLoading(false);
      }
    };
    if (status === "authenticated") loadInterview();
  }, [status]);

  const handleStartInterview = async () => {
    if (!interview) return;
    try {
      await apiFetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      setInterview({ ...interview, status: "IN_PROGRESS" });
    } catch {
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
    } catch {
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
            notes,
            interviewConductedProperly: interviewConducted,
            agreedCareExpectations: agreedExpectations,
            noMisrepresentation,
            platformLiabilityAck,
          }
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (proceedWithContract && data.contractId) {
          router.push(`/app/contracts/new?caregiverId=${interview.caregiverUserId}`);
        } else {
          router.push("/app/dashboard?interview=completed");
        }
      } else {
        setError("Falha ao enviar questionario");
      }
    } catch {
      setError("Falha ao enviar questionario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCaregiverQuestionnaire = async () => {
    if (!interview) return;
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire: {
            familyRating: cgFamilyRating,
            clarityRating: cgClarityRating,
            notes: cgNotes,
            interviewConductedProperly: cgInterviewConducted,
            noMisrepresentation: cgNoMisrepresentation,
            platformLiabilityAck: cgPlatformAck,
          }
        })
      });
      if (response.ok) {
        router.push("/app/dashboard?interview=completed");
      } else {
        setError("Falha ao enviar feedback");
      }
    } catch {
      setError("Falha ao enviar feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveMeeting = async () => {
    // Don't automatically complete interview when user leaves Jitsi
    // User must click "Finalizar" button to confirm interview is complete
    setUserLeftMeeting(true);
    console.log("User left Jitsi meeting, waiting for explicit completion");
  };

  const getRoomName = (url: string): string => {
    try {
      const roomName = new URL(url).pathname.replace('/', '');
      console.log('Extracted room name from URL:', url, '->', roomName);
      return roomName;
    } catch (e) {
      console.error('Failed to parse URL for room name:', url, e);
      return url;
    }
  };

  // Star rating component
  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onClick={() => onChange(i)} className="p-0.5 touch-manipulation">
            <IconStar className={`h-6 w-6 transition-colors ${
              i <= value ? "fill-info text-info" : "text-muted-foreground/20"
            }`} />
          </button>
        ))}
      </div>
    </div>
  );

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
      case "SCHEDULED": return <Badge className="bg-warning/10 text-warning border-0">Agendada</Badge>;
      case "IN_PROGRESS": return <Badge className="bg-success/10 text-success border-0">Em Andamento</Badge>;
      case "COMPLETED": return <Badge className="bg-primary/10 text-primary border-0">Concluida</Badge>;
      case "CANCELLED": return <Badge className="bg-destructive/10 text-destructive border-0">Cancelada</Badge>;
      default: return null;
    }
  };

  const allLegalChecked = interviewConducted && noMisrepresentation && platformLiabilityAck;

  return (
    <AppShell hideBottomNav={interview.status === "IN_PROGRESS"}>
      <div className="space-y-6 max-w-4xl mx-auto pb-6">
        {/* Header - Bloom Elements style */}
        <div className="bg-card rounded-3xl border border-border shadow-card p-8 overflow-hidden">
          <div className="h-1 -mx-8 -mt-8 mb-6 bg-primary" />
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                <IconVideo className="h-5 w-5" />
              </div>
              <span className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest">Entrevista em Video</span>
            </div>
            {getStatusBadge()}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-foreground uppercase tracking-tighter">
            {isFamily ? "Entrevista com" : "Entrevista da"} {otherPartyName}
          </h1>
          {interview.status === "SCHEDULED" && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <IconClock className="h-4 w-4" />
              <span>
                {new Date(interview.scheduledAt).toLocaleDateString("pt-PT", {
                  weekday: "short", day: "numeric", month: "short"
                })} às {new Date(interview.scheduledAt).toLocaleTimeString("pt-PT", {
                  hour: "2-digit", minute: "2-digit"
                })} ({interview.durationMinutes} min)
              </span>
            </div>
          )}
        </div>

        {/* Error - Bloom Elements style */}
        {error && (
          <div className="bg-card rounded-3xl border border-border shadow-card p-8 border-l-4 border-l-destructive">
            <div className="flex items-start gap-4">
              <IconAlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* ====== SCHEDULED ====== */}
        {interview.status === "SCHEDULED" && (
          <div className="space-y-5">
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card">
              <h3 className="font-display font-black text-lg text-foreground mb-6 flex items-center gap-3 uppercase">
                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                  <IconVideo className="h-5 w-5" />
                </div>
                Preparação
              </h3>
              <div className="space-y-3">
                {[
                  { icon: "\uD83C\uDFA5", text: "Verifique se sua câmera e microfone funcionam" },
                  { icon: "\uD83D\uDD07", text: "Escolha um local silencioso e bem iluminado" },
                  { icon: "\uD83D\uDCDD", text: "Tenha suas perguntas anotadas" },
                  { icon: "\uD83D\uDD12", text: "A entrevista é privada e segura" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={handleStartInterview}
              size="lg"
              className="w-full h-14 text-base font-display font-bold uppercase tracking-wide"
            >
              <IconVideo className="h-5 w-5 mr-2" />
              Entrar na Sala de Entrevista
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/app/interviews")}
              size="lg"
              className="w-full h-12"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Entrevistas
            </Button>
          </div>
        )}

        {/* ====== IN PROGRESS ====== */}
        {interview.status === "IN_PROGRESS" && (
          <div className="space-y-5">
            <AgoraRoom
              channelName={roomName}
              displayName={session?.user?.name || "Usuario"}
              onLeave={handleLeaveMeeting}
              className="h-[calc(100vh-220px)] min-h-[400px]"
            />

            {/* Warning when user left meeting - Bloom Elements style */}
            {userLeftMeeting && (
              <div className="bg-card rounded-3xl p-8 border border-border shadow-card border-l-4 border-l-warning">
                <div className="flex items-start gap-4">
                  <IconAlertCircle className="h-6 w-6 text-warning flex-shrink-0" />
                  <div>
                    <p className="text-sm font-display font-bold text-foreground">Você saiu da reunião</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Para finalizar a entrevista e ir para feedback, clique em "Finalizar" abaixo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open(interview.videoRoomUrl, "_blank")}
                className="flex-1 h-12"
              >
                <IconExternalLink className="h-4 w-4 mr-2" />
                Nova Aba
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleCompleteInterview}
                className="flex-1 h-12"
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/app/interviews")}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Entrevistas
            </Button>
          </div>
        )}

        {/* ====== COMPLETED - Questionnaire (Family) - Bloom Elements style ====== */}
        {interview.status === "COMPLETED" && isFamily && !interview.familyCompletedAt && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-display font-black text-foreground uppercase tracking-tighter">Feedback da Entrevista</h2>
              <p className="text-base text-muted-foreground font-medium">
                Avalie a entrevista com {interview.caregiverName}. Este registro protege ambas as partes.
              </p>
            </div>

            {/* Section 1: About the interview itself */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-4">
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.3em]">
                Avaliação da Entrevista
              </p>
              <StarRating label="Comunicação" value={communicationRating} onChange={setCommunicationRating} />
              <StarRating label="Experiência demonstrada" value={experienceRating} onChange={setExperienceRating} />
              <StarRating label="Pontualidade" value={punctualityRating} onChange={setPunctualityRating} />
            </div>

            {/* Section 2: Recommendation */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-4">
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.3em]">
                Recomendação
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    wouldRecommend ? "border-success/40 bg-success/10 text-success" : "border-border/30 text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl block mb-2">{"\uD83D\uDC4D"}</span>
                  <span className="text-sm font-display font-bold">Recomendo</span>
                </button>
                <button
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    !wouldRecommend ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border/30 text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl block mb-2">{"\uD83D\uDC4E"}</span>
                  <span className="text-sm font-display font-bold">Não recomendo</span>
                </button>
              </div>
            </div>

            {/* Section 3: Legal acknowledgements */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-4">
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.3em]">
                Confirmações Importantes
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={interviewConducted}
                  onCheckedChange={(c) => setInterviewConducted(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Confirmo que a entrevista em video foi realizada e que ambas as partes
                  participaram de forma voluntaria.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={agreedExpectations}
                  onCheckedChange={(c) => setAgreedExpectations(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Discutimos as expectativas de cuidado, horarios e responsabilidades
                  durante a entrevista.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={noMisrepresentation}
                  onCheckedChange={(c) => setNoMisrepresentation(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Declaro que as informacoes que forneci sao verdadeiras e que nao houve
                  distorcao de informacoes por qualquer parte.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={platformLiabilityAck}
                  onCheckedChange={(c) => setPlatformLiabilityAck(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Entendo que a plataforma atua apenas como intermediaria para conectar familias
                  e cuidadores, nao sendo responsavel pela qualidade ou resultado dos servicos prestados.
                </span>
              </label>
            </div>

            {/* Section 4: Proceed with contract? */}
            <div className={`rounded-2xl border-2 p-4 transition-all ${
              proceedWithContract ? "border-primary bg-primary/5" : "border-border"
            }`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Proximo Passo
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setProceedWithContract(true)}
                  className={`flex-1 p-3.5 rounded-xl border-2 text-center transition-all ${
                    proceedWithContract ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                  }`}
                >
                  <IconContract className={`h-6 w-6 mx-auto mb-1 ${proceedWithContract ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium block ${proceedWithContract ? "text-primary" : ""}`}>
                    Criar Contrato
                  </span>
                  <span className="text-xs text-muted-foreground">Prosseguir com este cuidador</span>
                </button>
                <button
                  onClick={() => setProceedWithContract(false)}
                  className={`flex-1 p-3.5 rounded-xl border-2 text-center transition-all ${
                    !proceedWithContract ? "border-muted-foreground/30 bg-muted/30" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <IconClock className={`h-6 w-6 mx-auto mb-1 ${!proceedWithContract ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
                  <span className={`text-sm font-medium block ${!proceedWithContract ? "" : "text-muted-foreground"}`}>
                    Ainda nao
                  </span>
                  <span className="text-xs text-muted-foreground">Salvar para depois</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Observacoes sobre a entrevista (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O que foi discutido, acordos verbais, impressoes gerais..."
                rows={3}
                className="rounded-xl text-base resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Estas notas ficam registradas para sua referencia e seguranca.
              </p>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitQuestionnaire}
              disabled={isSubmitting || !allLegalChecked}
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
                  {proceedWithContract ? "Enviar e Criar Contrato" : "Enviar Feedback"}
                </>
              )}
            </Button>

            {!allLegalChecked && (
              <p className="text-xs text-center text-muted-foreground">
                Marque todas as confirmacoes para continuar.
              </p>
            )}
          </div>
        )}

        {/* ====== Already Completed (Family) ====== */}
        {interview.familyCompletedAt && isFamily && (
          <div className="space-y-5 max-w-3xl mx-auto">
            {/* Interview Summary */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-green-600 mb-1">Entrevista Concluída</h2>
                  <p className="text-sm text-muted-foreground">Feedback enviado e registrado</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center ring-4 ring-green-500/20">
                  <IconCheck className="h-8 w-8 text-green-500" />
                </div>
              </div>

              {/* Interview Details */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-500/20">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data</p>
                  <p className="font-semibold text-sm">
                    {new Date(interview.scheduledAt).toLocaleDateString("pt-PT", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })} às {new Date(interview.scheduledAt).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Duração</p>
                  <p className="font-semibold text-sm">{interview.durationMinutes} minutos</p>
                </div>
              </div>
            </div>

            {/* Your Feedback */}
            {interview.questionnaire && (
              <div className="bg-surface rounded-2xl border border-border/50 p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <IconStar className="h-4 w-4 text-blue-500" />
                  </div>
                  Seu Feedback
                </h3>

                {interview.questionnaire.communicationRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Comunicação</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.questionnaire?.communicationRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.questionnaire.experienceRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Experiência Demonstrada</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.questionnaire?.experienceRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.questionnaire.wouldRecommend !== undefined && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Recomendação:</span>
                    <Badge className={interview.questionnaire.wouldRecommend ? "bg-green-500" : "bg-red-500"}>
                      {interview.questionnaire.wouldRecommend ? "Recomenda" : "Não Recomenda"}
                    </Badge>
                  </div>
                )}

                {interview.questionnaire.notes && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm text-foreground">{interview.questionnaire.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Caregiver Feedback */}
            {interview.caregiverQuestionnaire && (
              <div className="bg-surface rounded-2xl border border-border/50 p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <IconStar className="h-4 w-4 text-purple-500" />
                  </div>
                  Feedback de {interview.caregiverName}
                </h3>

                {interview.caregiverQuestionnaire.familyRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Respeito e Cordialidade</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.caregiverQuestionnaire?.familyRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.caregiverQuestionnaire.clarityRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Clareza nas Expectativas</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.caregiverQuestionnaire?.clarityRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.caregiverQuestionnaire.notes && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm text-foreground">{interview.caregiverQuestionnaire.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-surface rounded-2xl border border-border/50 p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-green-500" />
                Próximos Passos
              </h3>
              {interview.questionnaire?.proceedWithContract ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Você decidiu prosseguir com o contrato. O próximo passo é formalizar o acordo.
                  </p>
                  <Button asChild className="w-full h-12 rounded-xl mt-3">
                    <Link href={`/app/contracts/new?caregiverId=${interview.caregiverUserId}`}>
                      <IconContract className="h-4 w-4 mr-2" />
                      Criar Contrato
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você decidiu não prosseguir no momento. Pode entrar em contato com {interview.caregiverName} para discussões futuras.
                </p>
              )}
            </div>

            {/* Quick actions to contact caregiver */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contato Direto
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild className="h-12 rounded-xl">
                  <Link href={`/app/chat?userId=${interview.caregiverUserId}`}>
                    <IconChat className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </Link>
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl"
              onClick={() => router.push("/app/dashboard")}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        )}

        {/* ====== COMPLETED - Caregiver Questionnaire ====== */}
        {interview.status === "COMPLETED" && !isFamily && !interview.caregiverCompletedAt && (
          <div className="space-y-5 max-w-lg mx-auto">
            <div>
              <h2 className="text-lg font-bold">Feedback da Entrevista</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Avalie a entrevista com a familia {interview.familyName}. Este registo protege ambas as partes.
              </p>
            </div>

            {/* Ratings */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Avaliacao da Familia
              </p>
              <StarRating label="Respeito e cordialidade" value={cgFamilyRating} onChange={setCgFamilyRating} />
              <StarRating label="Clareza nas expectativas" value={cgClarityRating} onChange={setCgClarityRating} />
            </div>

            {/* Legal confirmations */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4 space-y-3.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirmacoes Importantes
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={cgInterviewConducted}
                  onCheckedChange={(c) => setCgInterviewConducted(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Confirmo que a entrevista em video foi realizada e que ambas as partes
                  participaram de forma voluntaria.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={cgNoMisrepresentation}
                  onCheckedChange={(c) => setCgNoMisrepresentation(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Declaro que as informacoes que forneci sobre minhas qualificacoes e
                  experiencia sao verdadeiras.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={cgPlatformAck}
                  onCheckedChange={(c) => setCgPlatformAck(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  Entendo que a plataforma atua apenas como intermediaria para conectar familias
                  e cuidadores, nao sendo responsavel pela qualidade ou resultado dos servicos prestados.
                </span>
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Observacoes sobre a entrevista (opcional)</Label>
              <Textarea
                value={cgNotes}
                onChange={(e) => setCgNotes(e.target.value)}
                placeholder="Impressoes sobre a familia, o que foi discutido, acordos verbais..."
                rows={3}
                className="rounded-xl text-base resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitCaregiverQuestionnaire}
              disabled={isSubmitting || !cgInterviewConducted || !cgNoMisrepresentation || !cgPlatformAck}
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
                  Enviar Feedback
                </>
              )}
            </Button>

            {(!cgInterviewConducted || !cgNoMisrepresentation || !cgPlatformAck) && (
              <p className="text-xs text-center text-muted-foreground">
                Marque todas as confirmacoes para continuar.
              </p>
            )}
          </div>
        )}

        {/* ====== Caregiver - Already submitted questionnaire ====== */}
        {interview.status === "COMPLETED" && !isFamily && interview.caregiverCompletedAt && (
          <div className="space-y-5 max-w-3xl mx-auto">
            {/* Interview Summary */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-green-600 mb-1">Entrevista Concluída</h2>
                  <p className="text-sm text-muted-foreground">
                    {interview.familyCompletedAt
                      ? "Ambas as partes enviaram feedback"
                      : "Você enviou feedback, aguardando resposta da família"}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center ring-4 ring-green-500/20">
                  <IconCheck className="h-8 w-8 text-green-500" />
                </div>
              </div>

              {/* Interview Details */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-500/20">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data</p>
                  <p className="font-semibold text-sm">
                    {new Date(interview.scheduledAt).toLocaleDateString("pt-PT", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })} às {new Date(interview.scheduledAt).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Duração</p>
                  <p className="font-semibold text-sm">{interview.durationMinutes} minutos</p>
                </div>
              </div>
            </div>

            {/* Your Feedback */}
            {interview.caregiverQuestionnaire && (
              <div className="bg-surface rounded-2xl border border-border/50 p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <IconStar className="h-4 w-4 text-blue-500" />
                  </div>
                  Seu Feedback
                </h3>

                {interview.caregiverQuestionnaire.familyRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Respeito e Cordialidade</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.caregiverQuestionnaire?.familyRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.caregiverQuestionnaire.clarityRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Clareza nas Expectativas</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.caregiverQuestionnaire?.clarityRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.caregiverQuestionnaire.notes && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm text-foreground">{interview.caregiverQuestionnaire.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Family Feedback */}
            {interview.familyCompletedAt && interview.questionnaire && (
              <div className="bg-surface rounded-2xl border border-border/50 p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <IconStar className="h-4 w-4 text-purple-500" />
                  </div>
                  Feedback de {interview.familyName}
                </h3>

                {interview.questionnaire.communicationRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Comunicação</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.questionnaire?.communicationRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.questionnaire.experienceRating && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Experiência Demonstrada</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IconStar
                            key={i}
                            className={`h-4 w-4 ${
                              i <= (interview.questionnaire?.experienceRating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interview.questionnaire.wouldRecommend !== undefined && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Recomendação:</span>
                    <Badge className={interview.questionnaire.wouldRecommend ? "bg-green-500" : "bg-red-500"}>
                      {interview.questionnaire.wouldRecommend ? "Recomenda" : "Não Recomenda"}
                    </Badge>
                  </div>
                )}

                {interview.questionnaire.notes && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm text-foreground">{interview.questionnaire.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Status Summary */}
            {!interview.familyCompletedAt && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <IconClock className="h-4 w-4" />
                  A família ainda está avaliando a entrevista. Você será notificado quando houver novidades.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl"
              onClick={() => router.push("/app/dashboard")}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
