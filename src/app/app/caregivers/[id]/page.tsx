"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconStar,
  IconMapPin,
  IconClock,
  IconEuro,
  IconUser,
  IconCheck,
  IconCalendar,
  IconPhone,
  IconMail,
  IconHeart,
  IconContract,
  IconVideo
} from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/constants";
import { ScheduleInterviewDialog } from "@/components/interviews/schedule-dialog";

interface CaregiverReview {
  id: string | number;
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
}

interface CaregiverData {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  verificationStatus: string;
  title: string;
  bio: string;
  city: string;
  services: string[];
  hourlyRateEur: number;
  averageRating: number;
  totalReviews: number;
  totalContracts: number;
  experienceYears: number;
  education: string | null;
  certifications: string[];
  languages: string[];
  availability: Record<string, unknown> | null;
  availableNow: boolean;
  reviews: CaregiverReview[];
}

export default function CaregiverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { status } = useSession();
  const router = useRouter();

  const [caregiver, setCaregiver] = useState<CaregiverData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchCaregiver() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiFetch(`/api/caregivers/${resolvedParams.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Cuidador não encontrado.");
            return;
          }
          throw new Error("Erro ao carregar perfil do cuidador.");
        }
        const data = await res.json();
        setCaregiver(data.caregiver);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado ao carregar perfil.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCaregiver();
  }, [resolvedParams.id]);

  const handleSendMessage = useCallback(async () => {
    if (!caregiver) return;
    setIsSendingMessage(true);
    try {
      const res = await apiFetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: caregiver.id }),
      });
      if (!res.ok) {
        throw new Error("Erro ao criar sala de chat.");
      }
      const data = await res.json();
      router.push(`/app/chat?room=${data.chatRoomId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
      setIsSendingMessage(false);
    }
  }, [caregiver, router]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/app/search">
              ← Voltar para busca
            </Link>
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 animate-pulse">
                <div className="h-24 w-24 rounded-full bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-64" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-20" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-10 bg-muted rounded w-24" />
                  <div className="h-10 bg-muted rounded w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !caregiver) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/app/search">
              ← Voltar para busca
            </Link>
          </Button>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-lg text-destructive">{error || "Cuidador não encontrado."}</p>
              <Button asChild>
                <Link href="/app/search">Voltar para busca</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const educationList = caregiver.education
    ? caregiver.education.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/app/search">
            ← Voltar para busca
          </Link>
        </Button>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {caregiver.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{caregiver.name}</h1>
                  {caregiver.verificationStatus === "VERIFIED" && (
                    <Badge className="bg-green-500">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{caregiver.title}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <IconStar className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-lg">{caregiver.averageRating}</span>
                    <span className="text-muted-foreground">
                      ({caregiver.totalReviews} avaliações)
                    </span>
                  </div>
                  {caregiver.city && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <IconMapPin className="h-4 w-4" />
                      <span>{caregiver.city}</span>
                    </div>
                  )}
                  {caregiver.experienceYears > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <IconCalendar className="h-4 w-4" />
                      <span>{caregiver.experienceYears} anos de experiência</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {caregiver.services.map((service) => (
                    <Badge key={service} variant="secondary">
                      {SERVICE_TYPES[service as keyof typeof SERVICE_TYPES] || service}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-3xl font-bold">€{caregiver.hourlyRateEur}</p>
                  <p className="text-muted-foreground">por hora</p>
                </div>
                <Button size="lg" asChild>
                  <Link href={`/app/contracts/new?caregiverId=${caregiver.id}`}>
                    <IconContract className="h-4 w-4 mr-2" />
                    Criar Contrato
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSendMessage}
                  disabled={isSendingMessage}
                >
                  <IconMail className="h-4 w-4 mr-2" />
                  {isSendingMessage ? "Abrindo chat..." : "Enviar Mensagem"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsInterviewDialogOpen(true)}
                >
                  <IconVideo className="h-4 w-4 mr-2" />
                  Agendar Entrevista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {caregiver.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {caregiver.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Education & Certifications */}
            {(educationList.length > 0 || caregiver.certifications.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Formação e Certificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {educationList.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Formação Acadêmica</h4>
                      <ul className="space-y-1">
                        {educationList.map((edu, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <IconCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            {edu}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {educationList.length > 0 && caregiver.certifications.length > 0 && (
                    <Separator />
                  )}
                  {caregiver.certifications.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Certificações</h4>
                      <ul className="space-y-1">
                        {caregiver.certifications.map((cert, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <IconCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {caregiver.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {caregiver.reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.reviewerName}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Number(review.rating) }).map((_, i) => (
                                <IconStar key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(String(review.date)).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <IconClock className="h-5 w-5 text-primary" />
                  <span>
                    {caregiver.availableNow
                      ? "Disponível agora"
                      : "Indisponível no momento"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            {caregiver.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Idiomas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caregiver.languages.map((lang) => (
                      <Badge key={lang} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg col-span-2">
                    <p className="text-2xl font-bold">{caregiver.totalContracts}</p>
                    <p className="text-xs text-muted-foreground">Contratos</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg col-span-2">
                    <p className="text-2xl font-bold">{caregiver.totalReviews}</p>
                    <p className="text-xs text-muted-foreground">Avaliações</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ScheduleInterviewDialog
        caregiverUserId={caregiver.id}
        caregiverName={caregiver.name}
        open={isInterviewDialogOpen}
        onOpenChange={setIsInterviewDialogOpen}
      />
    </AppShell>
  );
}
