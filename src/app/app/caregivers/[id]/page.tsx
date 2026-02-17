"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  IconContract
} from "@/components/icons";
import { SERVICE_TYPES, TOKEN_SYMBOL } from "@/lib/constants";

// Mock caregiver data
const mockCaregiver = {
  id: "1",
  name: "Carmela Oliveira",
  title: "Enfermeira",
  rating: 4.9,
  totalReviews: 47,
  hourlyRate: 25,
  distanceKm: 3.2,
  services: ["PERSONAL_CARE", "MOBILITY", "COMPANIONSHIP"],
  bio: "Cuidadora há 8 anos, com foco em mobilidade e acompanhamento diário. Especializada em cuidados paliativos e atendimento humanizado. Minha missão é proporcionar qualidade de vida e dignidade aos idosos e suas famílias.",
  availability: "Seg-Sex · 08h-18h",
  verified: true,
  city: "Lisboa",
  experienceYears: 8,
  languages: ["Português", "Inglês", "Espanhol"],
  education: [
    "Licenciatura em Enfermagem - Universidade de Lisboa",
    "Pós-graduação em Cuidados Paliativos",
  ],
  certifications: [
    "Certificado de Cuidador Profissional",
    "Primeiros Socorros - Cruz Vermelha",
    "Especialização em Alzheimer e Parkinson",
  ],
  stats: {
    totalContracts: 23,
    totalHours: 1840,
    repeatClients: 18,
  },
  reviews: [
    {
      id: 1,
      author: "Maria Silva",
      rating: 5,
      comment: "Profissional excepcional! Cuidou da minha mãe com muito carinho e dedicação.",
      date: "2024-01-10",
    },
    {
      id: 2,
      author: "João Santos",
      rating: 5,
      comment: "Muito pontual e profissional. Recomendo fortemente.",
      date: "2024-01-05",
    },
    {
      id: 3,
      author: "Ana Costa",
      rating: 5,
      comment: "Cuidou do meu pai com muita paciência e competência. Nota 10!",
      date: "2024-01-02",
    },
  ],
};

export default function CaregiverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { status } = useSession();
  const router = useRouter();

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const caregiver = mockCaregiver; // In real app, fetch from API

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
                  {caregiver.verified && (
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
                    <span className="font-semibold text-lg">{caregiver.rating}</span>
                    <span className="text-muted-foreground">
                      ({caregiver.totalReviews} avaliações)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconMapPin className="h-4 w-4" />
                    <span>{caregiver.distanceKm}km de distância</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    <span>{caregiver.experienceYears} anos de experiência</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {caregiver.services.map((service) => (
                    <Badge key={service} variant="secondary">
                      {SERVICE_TYPES[service as keyof typeof SERVICE_TYPES]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-3xl font-bold">€{caregiver.hourlyRate}</p>
                  <p className="text-muted-foreground">por hora</p>
                </div>
                <Button size="lg" asChild>
                  <Link href={`/app/contracts/new?caregiverId=${caregiver.id}`}>
                    <IconContract className="h-4 w-4 mr-2" />
                    Criar Contrato
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  <IconMail className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
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

            {/* Education & Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Formação e Certificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Formação Acadêmica</h4>
                  <ul className="space-y-1">
                    {caregiver.education.map((edu, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <IconCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
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
              </CardContent>
            </Card>

            {/* Reviews */}
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
                          <span className="font-medium">{review.author}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <IconStar key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  <span>{caregiver.availability}</span>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
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

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{caregiver.stats.totalContracts}</p>
                    <p className="text-xs text-muted-foreground">Contratos</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{caregiver.stats.totalHours}h</p>
                    <p className="text-xs text-muted-foreground">Trabalhadas</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg col-span-2">
                    <p className="text-2xl font-bold">{caregiver.stats.repeatClients}</p>
                    <p className="text-xs text-muted-foreground">Clientes Recorrentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tip CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <IconHeart className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium mb-2">Gorjetas em {TOKEN_SYMBOL}</p>
                <p className="text-sm text-muted-foreground">
                  Após um contrato, você pode enviar gorjetas em tokens que valorizam!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
