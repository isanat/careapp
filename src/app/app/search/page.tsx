"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconSearch, 
  IconMapPin, 
  IconStar, 
  IconClock, 
  IconEuro
} from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/constants";

interface Caregiver {
  id: string;
  name: string;
  title: string;
  bio: string;
  city: string;
  services: string[];
  hourlyRateEur: number;
  averageRating: number;
  totalReviews: number;
  totalContracts: number;
  experienceYears: number;
  profileImage: string | null;
}

export default function SearchPage() {
  const { status } = useSession();
  const router = useRouter();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState(50);
  const [selectedService, setSelectedService] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    if (status === "authenticated") {
      fetchCaregivers();
    }
  }, [status]);

  const fetchCaregivers = async () => {
    try {
      const response = await fetch('/api/caregivers');
      if (response.ok) {
        const data = await response.json();
        setCaregivers(data.caregivers || []);
      }
    } catch (error) {
      console.error('Error fetching caregivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter caregivers
  const filteredCaregivers = useMemo(() => {
    let results = [...caregivers];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.title?.toLowerCase().includes(term) ||
          c.bio?.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term)
      );
    }

    // Filter by price (hourlyRateEur is in cents)
    results = results.filter((c) => (c.hourlyRateEur / 100) <= maxPrice);

    // Filter by service
    if (selectedService !== "all") {
      results = results.filter((c) => c.services?.some(s => s.includes(selectedService)));
    }

    // Sort
    if (sortBy === "rating") {
      results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === "price") {
      results.sort((a, b) => (a.hourlyRateEur || 0) - (b.hourlyRateEur || 0));
    } else if (sortBy === "reviews") {
      results.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    }

    return results;
  }, [caregivers, searchTerm, maxPrice, selectedService, sortBy]);

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
                    placeholder="Nome, especialidade, cidade..."
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
                    <SelectItem value="reviews">Mais avaliações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Slider */}
            <div className="mt-6">
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
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {filteredCaregivers.length} cuidadores encontrados
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Caregiver Cards */}
        {!isLoading && (
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
                            <Badge variant="secondary" className="text-xs">
                              Verificado
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{caregiver.title}</p>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <IconStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{caregiver.averageRating?.toFixed(1) || '0.0'}</span>
                              <span className="text-muted-foreground">
                                ({caregiver.totalReviews || 0})
                              </span>
                            </div>
                            {caregiver.city && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <IconMapPin className="h-4 w-4" />
                                <span>{caregiver.city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 bg-muted/30">
                      {caregiver.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {caregiver.bio}
                        </p>
                      )}

                      {/* Services */}
                      {caregiver.services && caregiver.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {caregiver.services.slice(0, 4).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats & Price */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {caregiver.experienceYears && (
                          <div className="flex items-center gap-1">
                            <IconClock className="h-4 w-4 text-muted-foreground" />
                            <span>{caregiver.experienceYears} anos exp.</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <IconEuro className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">€{(caregiver.hourlyRateEur / 100).toFixed(0)}/hora</span>
                        </div>
                        <div className="text-muted-foreground">
                          {caregiver.totalContracts || 0} contratos
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
        )}
      </div>
    </AppShell>
  );
}
