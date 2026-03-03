"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  IconExternalLink,
  IconMessageSquare
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

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
  const [activeTab, setActiveTab] = useState<string>("video");
  
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
        const response = await fetch(`/api/interviews/${resolvedParams.id}`);
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
      await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      
      // Update local state
      setInterview({ ...interview, status: "IN_PROGRESS" });
      setActiveTab("video");
    } catch (err) {
      setError("Falha ao iniciar entrevista");
    }
  };

  const handleCompleteInterview = async () => {
    if (!interview) return;
    
    try {
      await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      });
      
      setInterview({ ...interview, status: "COMPLETED" });
      setActiveTab("questionnaire");
    } catch (err) {
      setError("Falha ao finalizar entrevista");
    }
  };

  const handleSubmitQuestionnaire = async () => {
    if (!interview) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/interviews/${interview.id}`, {
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
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell>
        <Card className="border-destructive/20 max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <IconAlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push("/app/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
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
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconVideo className="h-6 w-6" />
              Entrevista em Vídeo
            </h1>
            <p className="text-muted-foreground">
              {isFamily ? "Entrevista com" : "Entrevista da"} {otherPartyName}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Scheduled Status - Before Interview */}
        {interview.status === "SCHEDULED" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <IconClock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(interview.scheduledAt).toLocaleDateString("pt-PT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(interview.scheduledAt).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })} • {interview.durationMinutes} minutos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">Preparação para a Entrevista</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Verifique se sua câmera e microfone estão funcionando</li>
                  <li>• Escolha um local silencioso e bem iluminado</li>
                  <li>• Tenha suas perguntas anotadas</li>
                  <li>• A entrevista será gravada apenas com consentimento</li>
                </ul>
              </div>

              <Button onClick={handleStartInterview} className="w-full" size="lg">
                <IconVideo className="h-4 w-4 mr-2" />
                Entrar na Sala de Entrevista
              </Button>
            </CardContent>
          </Card>
        )}

        {/* In Progress - Video Room */}
        {interview.status === "IN_PROGRESS" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="video">
                <IconVideo className="h-4 w-4 mr-2" />
                Vídeo
              </TabsTrigger>
              <TabsTrigger value="info">
                <IconMessageSquare className="h-4 w-4 mr-2" />
                Informações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="mt-4">
              <div className="space-y-4">
                <VideoRoom
                  roomName={roomName}
                  displayName={session?.user?.name || "Usuário"}
                  email={session?.user?.email}
                  subject={`Entrevista: ${isFamily ? interview.caregiverName : interview.familyName}`}
                  isModerator={isFamily}
                  enableLobby={true}
                  enablePrejoinPage={true}
                  onLeave={handleLeaveMeeting}
                  className="h-[600px]"
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(interview.videoRoomUrl, "_blank")}
                  >
                    <IconExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCompleteInterview}
                  >
                    <IconCheck className="h-4 w-4 mr-2" />
                    Finalizar Entrevista
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Entrevista</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Família</p>
                      <p className="font-medium">{interview.familyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cuidador(a)</p>
                      <p className="font-medium">{interview.caregiverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duração Prevista</p>
                      <p className="font-medium">{interview.durationMinutes} minutos</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">Em andamento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Completed - Questionnaire (Family only) */}
        {interview.status === "COMPLETED" && isFamily && !interview.familyCompletedAt && (
          <Card>
            <CardHeader>
              <CardTitle>Questionário Pós-Entrevista</CardTitle>
              <CardDescription>
                Por favor, avalie sua experiência com {interview.caregiverName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Communication Rating */}
              <div className="space-y-2">
                <Label>Comunicação</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[communicationRating]}
                    onValueChange={([value]) => setCommunicationRating(value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: communicationRating }).map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience Rating */}
              <div className="space-y-2">
                <Label>Experiência e Qualificações</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[experienceRating]}
                    onValueChange={([value]) => setExperienceRating(value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: experienceRating }).map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Punctuality Rating */}
              <div className="space-y-2">
                <Label>Pontualidade</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[punctualityRating]}
                    onValueChange={([value]) => setPunctualityRating(value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: punctualityRating }).map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex items-center justify-between">
                <Label>Recomendaria este cuidador?</Label>
                <Button
                  variant={wouldRecommend ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWouldRecommend(!wouldRecommend)}
                >
                  {wouldRecommend ? <IconCheck className="h-4 w-4 mr-1" /> : null}
                  {wouldRecommend ? "Sim" : "Não"}
                </Button>
              </div>

              {/* Proceed with Contract */}
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <Label className="text-base font-semibold">Prosseguir com Contrato?</Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmar que deseja contratar este cuidador
                  </p>
                </div>
                <Button
                  variant={proceedWithContract ? "default" : "outline"}
                  onClick={() => setProceedWithContract(!proceedWithContract)}
                >
                  {proceedWithContract ? <IconCheck className="h-4 w-4 mr-1" /> : null}
                  {proceedWithContract ? "Sim, Prosseguir" : "Ainda Não"}
                </Button>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Observações Adicionais (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação adicional sobre a entrevista..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button 
                onClick={handleSubmitQuestionnaire} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Enviar Questionário
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already Completed */}
        {interview.familyCompletedAt && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <IconCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-green-600">Questionário Enviado</h2>
              <p className="text-muted-foreground mt-1">
                {proceedWithContract 
                  ? "O contrato está aguardando a aceitação do cuidador."
                  : "Seu feedback foi registrado."
                }
              </p>
              <Button className="mt-4" onClick={() => router.push("/app/dashboard")}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Caregiver View - Completed */}
        {interview.status === "COMPLETED" && !isFamily && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <IconCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-green-600">Entrevista Concluída</h2>
              <p className="text-muted-foreground mt-1">
                A família irá avaliar a entrevista e você será notificado sobre o resultado.
              </p>
              <Button className="mt-4" onClick={() => router.push("/app/dashboard")}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
