"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconSearch, 
  IconMapPin, 
  IconStar, 
  IconClock, 
  IconEuro,
  IconFilter,
  IconUser,
  IconHeart
} from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/constants";

// Mock caregivers data
const mockCaregivers = [
  {
    id: "1",
    name: "Carmela Oliveira",
    title: "Enfermeira",
    rating: 4.9,
    totalReviews: 47,
    hourlyRate: 25,
    distanceKm: 3.2,
    services: ["PERSONAL_CARE", "MOBILITY", "COMPANIONSHIP"],
    bio: "Cuidadora há 8 anos, com foco em mobilidade e acompanhamento diário. Especializada em cuidados paliativos.",
    availability: "Seg-Sex · 08h-18h",
    verified: true,
    city: "Lisboa",
  },
  {
    id: "2",
    name: "Tiago Almeida",
    title: "Cuidador Profissional",
    rating: 4.7,
    totalReviews: 32,
    hourlyRate: 22,
    distanceKm: 5.6,
    services: ["MEDICATION", "COMPANIONSHIP", "COGNITIVE_SUPPORT"],
    bio: "Atua em cuidados domiciliares com rotina estruturada e carinho. Experiência com Alzheimer e Parkinson.",
    availability: "Seg-Sáb · 10h-20h",
    verified: true,
    city: "Lisboa",
  },
  {
    id: "3",
    name: "Luiza Pereira",
    title: "Fisioterapeuta",
    rating: 5.0,
    totalReviews: 28,
    hourlyRate: 28,
    distanceKm: 2.1,
    services: ["PHYSIOTHERAPY", "MOBILITY", "PERSONAL_CARE"],
    bio: "Especialista em reabilitação e bem-estar físico. Foco em independência e qualidade de vida.",
    availability: "Ter-Dom · 09h-19h",
    verified: true,
    city: "Lisboa",
  },
  {
    id: "4",
    name: "Ana Santos",
    title: "Auxiliar de Enfermagem",
    rating: 4.8,
    totalReviews: 19,
    hourlyRate: 20,
    distanceKm: 1.8,
    services: ["NURSING_CARE", "MEDICATION", "PERSONAL_CARE"],
    bio: "Auxiliar de enfermagem com 5 anos de experiência em cuidados domiciliares.",
    availability: "Seg-Sex · 07h-15h",
    verified: true,
    city: "Lisboa",
  },
  {
    id: "5",
    name: "João Costa",
    title: "Cuidador",
    rating: 4.6,
    totalReviews: 15,
    hourlyRate: 18,
    distanceKm: 4.5,
    services: ["COMPANIONSHIP", "LIGHT_HOUSEWORK", "TRANSPORTATION"],
    bio: "Cuidador dedicado com experiência em companhia e tarefas domésticas leves.",
    availability: "Seg-Dom · Flexível",
    verified: false,
    city: "Lisboa",
  },
];

export default function SearchPage() {
  const { status } = useSession();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState(30);
  const [maxDistance, setMaxDistance] = useState(10);
  const [selectedService, setSelectedService] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  // Filter caregivers - must be called before any early returns
  const filteredCaregivers = useMemo(() => {
    let results = [...mockCaregivers];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term) ||
          c.bio.toLowerCase().includes(term)
      );
    }

    // Filter by price
    results = results.filter((c) => c.hourlyRate <= maxPrice);

    // Filter by distance
    results = results.filter((c) => c.distanceKm <= maxDistance);

    // Filter by service
    if (selectedService !== "all") {
      results = results.filter((c) => c.services.includes(selectedService));
    }

    // Sort
    if (sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price") {
      results.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (sortBy === "distance") {
      results.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return results;
  }, [searchTerm, maxPrice, maxDistance, selectedService, sortBy]);

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Buscar Cuidadores</h1>
          <p className="text-muted-foreground">
            Encontre profissionais verificados na sua região
          </p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label>Buscar</Label>
                <div className="relative mt-1.5">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, especialidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Service Filter */}
              <div>
                <Label>Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Todos os serviços" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os serviços</SelectItem>
                    {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Label>Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Melhor avaliação</SelectItem>
                    <SelectItem value="price">Menor preço</SelectItem>
                    <SelectItem value="distance">Mais próximos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sliders */}
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Preço máximo: €{maxPrice}/hora</Label>
                </div>
                <Slider
                  value={[maxPrice]}
                  onValueChange={([value]) => setMaxPrice(value)}
                  min={10}
                  max={50}
                  step={1}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Distância máxima: {maxDistance}km</Label>
                </div>
                <Slider
                  value={[maxDistance]}
                  onValueChange={([value]) => setMaxDistance(value)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {filteredCaregivers.length} cuidadores encontrados
          </p>
        </div>

        {/* Caregiver Cards */}
        <div className="grid gap-4">
          {filteredCaregivers.map((caregiver) => (
            <Card key={caregiver.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Avatar & Basic Info */}
                  <div className="p-6 flex-shrink-0">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {caregiver.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{caregiver.name}</h3>
                          {caregiver.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{caregiver.title}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <IconStar className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{caregiver.rating}</span>
                            <span className="text-muted-foreground">
                              ({caregiver.totalReviews})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <IconMapPin className="h-4 w-4" />
                            <span>{caregiver.distanceKm}km</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6 bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-3">
                      {caregiver.bio}
                    </p>

                    {/* Services */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {caregiver.services.map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {SERVICE_TYPES[service as keyof typeof SERVICE_TYPES]}
                        </Badge>
                      ))}
                    </div>

                    {/* Availability & Price */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <span>{caregiver.availability}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconEuro className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">€{caregiver.hourlyRate}/hora</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 flex flex-col justify-center gap-2 border-l bg-background">
                    <Button asChild>
                      <Link href={`/app/caregivers/${caregiver.id}`}>
                        Ver Perfil
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/app/contracts/new?caregiverId=${caregiver.id}`}>
                        Criar Contrato
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCaregivers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <IconSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum cuidador encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
