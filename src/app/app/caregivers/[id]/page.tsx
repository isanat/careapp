"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconStar,
  IconMapPin,
  IconClock,
  IconUser,
  IconCheck,
  IconCalendar,
  IconPhone,
  IconMail,
  IconHeart,
  IconContract,
  IconVideo,
  IconShield,
  IconLock,
  IconChat,
  IconArrowLeft,
} from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { ScheduleInterviewDialog } from "@/components/interviews/schedule-dialog";

interface CaregiverReview {
  id: string | number;
  rating: number;
  comment: string;
  punctualityRating?: number;
  professionalismRating?: number;
  communicationRating?: number;
  qualityRating?: number;
  date: string;
  reviewerName: string;
}

interface CaregiverData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
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
  hasActiveContract: boolean;
  badges: string[];
  reviews: CaregiverReview[];
}

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  IDENTITY_VERIFIED: { label: "Identidade Verificada", color: "bg-success", icon: "shield" },
  BACKGROUND_CHECKED: { label: "Antecedentes Verificados", color: "bg-primary", icon: "shield" },
  PROFILE_VERIFIED: { label: "Perfil Verificado", color: "bg-success", icon: "check" },
  EXPERIENCED: { label: "Experiente (5+ contratos)", color: "bg-secondary", icon: "star" },
  TOP_RATED: { label: "Melhor Avaliado", color: "bg-warning", icon: "star" },
  DEDICATED: { label: "Dedicado (100h+)", color: "bg-primary", icon: "clock" },
};

export default function CaregiverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

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
            setError("Cuidador nao encontrado.");
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
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro ao enviar mensagem.", variant: "destructive" });
      setIsSendingMessage(false);
    }
  }, [caregiver, router]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-8">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/app/search" className="flex items-center gap-2">
              <IconArrowLeft className="h-4 w-4" />
              Voltar para busca
            </Link>
          </Button>
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
            <div className="flex flex-col md:flex-row gap-6 animate-pulse">
              <div className="h-20 w-20 rounded-3xl bg-secondary flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-secondary rounded-lg w-48" />
                <div className="h-4 bg-secondary rounded-lg w-32" />
                <div className="h-4 bg-secondary rounded-lg w-64" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !caregiver) {
    return (
      <AppShell>
        <div className="space-y-8">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/app/search" className="flex items-center gap-2">
              <IconArrowLeft className="h-4 w-4" />
              Voltar para busca
            </Link>
          </Button>
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card text-center space-y-4">
            <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto">
              <IconShield className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-display font-black text-foreground">{error || "Cuidador nao encontrado."}</p>
            <Button asChild>
              <Link href="/app/search">Voltar para busca</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const educationList = caregiver.education
    ? caregiver.education.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Calculate average sub-ratings from reviews
  const reviewsWithSubRatings = caregiver.reviews.filter(r => r.punctualityRating);
  const avgSubRatings = reviewsWithSubRatings.length > 0 ? {
    punctuality: reviewsWithSubRatings.reduce((s, r) => s + (Number(r.punctualityRating) || 0), 0) / reviewsWithSubRatings.length,
    professionalism: reviewsWithSubRatings.reduce((s, r) => s + (Number(r.professionalismRating) || 0), 0) / reviewsWithSubRatings.length,
    communication: reviewsWithSubRatings.reduce((s, r) => s + (Number(r.communicationRating) || 0), 0) / reviewsWithSubRatings.length,
    quality: reviewsWithSubRatings.reduce((s, r) => s + (Number(r.qualityRating) || 0), 0) / reviewsWithSubRatings.length,
  } : null;

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/app/search" className="flex items-center gap-2">
            <IconArrowLeft className="h-4 w-4" />
            Voltar para busca
          </Link>
        </Button>

        {/* Profile Header Section */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-start">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-display font-black text-primary flex-shrink-0">
                {caregiver.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl font-display font-black uppercase mb-1">
                  {caregiver.name}
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  {caregiver.title}
                </p>
                {caregiver.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-2 justify-center md:justify-start">
                    <IconStar className="h-5 w-5 text-primary fill-primary" />
                    <span className="text-lg font-display font-black text-primary">
                      {caregiver.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({caregiver.totalReviews} avaliacoes)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges & Details */}
            <div className="flex-1 space-y-4">
              {caregiver.verificationStatus === "VERIFIED" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/30 rounded-xl w-fit">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span className="text-xs font-display font-bold text-success uppercase tracking-widest">
                    Verificado
                  </span>
                </div>
              )}

              {/* Trust Badges */}
              {caregiver.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {caregiver.badges.map(badge => {
                    const config = BADGE_CONFIG[badge];
                    if (!config) return null;
                    return (
                      <div
                        key={badge}
                        className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 flex items-center gap-1"
                      >
                        {config.icon === "shield" ? <IconShield className="h-3 w-3" /> :
                         config.icon === "star" ? <IconStar className="h-3 w-3" /> :
                         config.icon === "clock" ? <IconClock className="h-3 w-3" /> :
                         <IconCheck className="h-3 w-3" />}
                        {config.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info Details */}
              <div className="flex flex-wrap gap-6 pt-2 text-sm">
                {caregiver.city && (
                  <div className="flex items-center gap-2">
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{caregiver.city}</span>
                  </div>
                )}
                {caregiver.experienceYears > 0 && (
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{caregiver.experienceYears} anos de experiencia</span>
                  </div>
                )}
              </div>

              {/* Services */}
              {caregiver.services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {caregiver.services.map((service) => (
                    <span
                      key={service}
                      className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary border border-primary/30"
                    >
                      {SERVICE_TYPES[service as keyof typeof SERVICE_TYPES] || service}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex flex-col items-stretch md:items-end gap-3 md:w-52">
              <div className="text-center md:text-right">
                <p className="text-3xl font-display font-black text-foreground">
                  €{(caregiver.hourlyRateEur / 100).toFixed(2)}/h
                </p>
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  por hora
                </p>
              </div>

              {/* Contact Info */}
              {caregiver.hasActiveContract && (caregiver.phone || caregiver.email) && (
                <div className="p-3 bg-success/10 border border-success/30 rounded-2xl space-y-1">
                  <p className="text-[10px] font-display font-bold text-success uppercase tracking-widest">
                    Contato direto
                  </p>
                  {caregiver.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <IconPhone className="h-3.5 w-3.5" />
                      <span>{caregiver.phone}</span>
                    </div>
                  )}
                  {caregiver.email && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <IconMail className="h-3.5 w-3.5" />
                      <span>{caregiver.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* No Contract Info */}
              {!caregiver.hasActiveContract && (
                <div className="p-3 bg-secondary/50 border border-border/50 rounded-2xl flex items-center gap-1.5">
                  <IconLock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                    Contato apos contrato
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full" asChild>
                  <Link href={`/app/contracts/new?caregiverId=${caregiver.id}`}>
                    <IconContract className="h-4 w-4 mr-2" />
                    Criar Contrato
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSendMessage}
                  disabled={isSendingMessage}
                >
                  <IconChat className="h-4 w-4 mr-2" />
                  {isSendingMessage ? "Abrindo..." : "Mensagem"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsInterviewDialogOpen(true)}
                >
                  <IconVideo className="h-4 w-4 mr-2" />
                  Entrevista
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Protection Notice */}
        <div className="flex items-start gap-3 p-5 sm:p-7 bg-info/5 border border-info/20 rounded-2xl">
          <IconShield className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-bold text-info uppercase tracking-widest">
              Protecao da Plataforma
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Toda comunicacao e feita pelo chat da plataforma. Contratos formalizados
              incluem protecao juridica, recibos fiscais e historico verificavel para ambas as partes.
              Dados de contato direto so sao disponibilizados apos contrato ativo.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {caregiver.bio && (
              <section className="space-y-4">
                <h2 className="text-xl font-display font-black uppercase mb-4">
                  Sobre
                </h2>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {caregiver.bio}
                  </p>
                </div>
              </section>
            )}

            {/* Education & Certifications */}
            {(educationList.length > 0 || caregiver.certifications.length > 0) && (
              <section className="space-y-4">
                <h2 className="text-xl font-display font-black uppercase mb-4">
                  Formacao e Certificacoes
                </h2>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-6">
                  {educationList.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-display font-bold text-foreground uppercase tracking-widest">
                        Formacao Academica
                      </h4>
                      <div className="space-y-3">
                        {educationList.map((edu, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/50"
                          >
                            <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <IconCheck className="h-4 w-4 text-success" />
                            </div>
                            <span className="text-sm text-muted-foreground">{edu}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {educationList.length > 0 && caregiver.certifications.length > 0 && (
                    <div className="border-t border-border/50" />
                  )}
                  {caregiver.certifications.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-display font-bold text-foreground uppercase tracking-widest">
                        Certificacoes
                      </h4>
                      <div className="space-y-3">
                        {caregiver.certifications.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/50"
                          >
                            <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <IconCheck className="h-4 w-4 text-success" />
                            </div>
                            <span className="text-sm text-muted-foreground">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Detailed Ratings */}
            {avgSubRatings && (
              <section className="space-y-4">
                <h2 className="text-xl font-display font-black uppercase mb-4">
                  Avaliacoes Detalhadas
                </h2>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-4">
                  {[
                    { label: "Pontualidade", value: avgSubRatings.punctuality },
                    { label: "Profissionalismo", value: avgSubRatings.professionalism },
                    { label: "Comunicacao", value: avgSubRatings.communication },
                    { label: "Qualidade", value: avgSubRatings.quality },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-4 border-b border-border/50 last:border-b-0">
                      <span className="text-sm text-muted-foreground font-medium">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(item.value / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-display font-bold w-12 text-right">{item.value.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {caregiver.reviews.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-display font-black uppercase mb-4">
                  Avaliacoes Recentes
                </h2>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-4">
                  {caregiver.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-display font-bold text-foreground">{review.reviewerName}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Number(review.rating) }).map((_, i) => (
                              <IconStar key={i} className="h-4 w-4 text-primary fill-primary" />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {new Date(String(review.date)).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Availability */}
            <section className="space-y-4">
              <h3 className="text-xl font-display font-black uppercase mb-4">
                Disponibilidade
              </h3>
              <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IconClock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {caregiver.availableNow
                      ? "Disponivel agora"
                      : "Indisponivel no momento"}
                  </span>
                </div>
              </div>
            </section>

            {/* Languages */}
            {caregiver.languages.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xl font-display font-black uppercase mb-4">
                  Idiomas
                </h3>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-3">
                  {caregiver.languages.map((lang) => (
                    <div key={lang} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                      <span className="text-sm font-medium text-foreground">{lang}</span>
                      <div className="w-4 h-4 rounded-full bg-success/20 border border-success/30" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Stats */}
            <section className="space-y-4">
              <h3 className="text-xl font-display font-black uppercase mb-4">
                Estatisticas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card text-center space-y-2">
                  <p className="text-3xl font-display font-black text-foreground">
                    {caregiver.totalContracts}
                  </p>
                  <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                    Contratos
                  </p>
                </div>
                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card text-center space-y-2">
                  <p className="text-3xl font-display font-black text-foreground">
                    {caregiver.totalReviews}
                  </p>
                  <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                    Avaliacoes
                  </p>
                </div>
              </div>
            </section>

            {/* Why use the platform */}
            <section className="space-y-4">
              <div className="bg-primary/10 rounded-3xl p-5 sm:p-7 border border-primary/30 shadow-card space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <IconShield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-display font-bold text-primary uppercase tracking-widest">
                    Porque usar a plataforma?
                  </h3>
                </div>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  {[
                    "Contratos com validade juridica",
                    "Recibos fiscais automaticos",
                    "Pagamentos seguros e rastreavies",
                    "Historico e avaliacoes verificaveis",
                    "Mediacao em caso de disputas",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconCheck className="h-3 w-3 text-success" />
                      </div>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
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
