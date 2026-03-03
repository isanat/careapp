"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
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
  IconEuro,
  IconShield,
  IconFamily,
} from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

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
  verificationStatus?: string;
  distanceKm?: number;
}

interface Family {
  id: string;
  name: string;
  profileImage: string | null;
  city: string;
  elderName: string;
  elderAge: number | null;
  elderNeeds: string;
  medicalConditions: string | null;
  mobilityLevel: string | null;
  preferredServices: string[];
  preferredSchedule: string | null;
  budgetRange: string | null;
}

const serviceLabels: Record<string, string> = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Medicacao",
  MOBILITY: "Mobilidade",
  COMPANIONSHIP: "Companhia",
  MEAL_PREPARATION: "Refeicoes",
  LIGHT_HOUSEWORK: "Domesticas",
  TRANSPORTATION: "Transporte",
  COGNITIVE_SUPPORT: "Cognitiva",
  NIGHT_CARE: "Noturno",
  PALLIATIVE_CARE: "Paliativos",
  PHYSIOTHERAPY: "Fisioterapia",
  NURSING_CARE: "Enfermagem",
};

export default function SearchPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState(50);
  const [selectedService, setSelectedService] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  const userRole = session?.user?.role;
  const isCaregiver = userRole === "CAREGIVER";

  useEffect(() => {
    if (status === "authenticated") {
      if (isCaregiver) {
        fetchFamilies();
      } else {
        fetchCaregivers();
      }
    }
  }, [status, isCaregiver]);

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

  const fetchFamilies = async () => {
    try {
      const response = await fetch('/api/families');
      if (response.ok) {
        const data = await response.json();
        setFamilies(data.families || []);
      }
    } catch (error) {
      console.error('Error fetching families:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter caregivers (for families)
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
    } else if (sortBy === "distance") {
      results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return results;
  }, [caregivers, searchTerm, maxPrice, selectedService, sortBy]);

  // Filter families (for caregivers)
  const filteredFamilies = useMemo(() => {
    let results = [...families];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.city?.toLowerCase().includes(term) ||
          f.elderNeeds?.toLowerCase().includes(term)
      );
    }

    // Filter by service
    if (selectedService !== "all") {
      results = results.filter((f) =>
        f.preferredServices?.some(s => s.includes(selectedService))
      );
    }

    return results;
  }, [families, searchTerm, selectedService]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.search.title}</h1>
          <p className="text-muted-foreground">
            {isCaregiver
              ? "Encontre familias que procuram cuidadores"
              : t.search.placeholder}
          </p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label>{t.search.title}</Label>
                <div className="relative mt-1.5">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isCaregiver ? "Pesquisar familias por nome, cidade..." : t.search.placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Service Filter */}
              <div>
                <Label>{t.search.filters}</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={t.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort (only for caregiver search) */}
              {!isCaregiver && (
                <div>
                  <Label>{t.search.sortBy || "Ordenar por"}</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">{t.search.rating}</SelectItem>
                      <SelectItem value="price">{t.search.hourlyRate}</SelectItem>
                      <SelectItem value="reviews">{t.dashboard.reviews}</SelectItem>
                      <SelectItem value="distance">Proximidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Price Slider (only for caregiver search) */}
            {!isCaregiver && (
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <Label>€{maxPrice}{t.search.perHour}</Label>
                </div>
                <Slider
                  value={[maxPrice]}
                  onValueChange={([value]) => setMaxPrice(value)}
                  min={10}
                  max={50}
                  step={1}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {isCaregiver
              ? filteredFamilies.length > 0
                ? `${filteredFamilies.length} familias encontradas`
                : ""
              : filteredCaregivers.length > 0
                ? `${filteredCaregivers.length} ${t.search.resultsFound || "cuidadores encontrados"}`
                : ""}
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

        {/* ============= FAMILY SEARCH VIEW (for caregivers) ============= */}
        {!isLoading && isCaregiver && (
          <div className="grid gap-4">
            {filteredFamilies.map((family) => (
              <Card key={family.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Avatar & Basic Info */}
                    <div className="p-6 flex-shrink-0">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg bg-primary/10 text-primary">
                            {family.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{family.name}</h3>
                            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                              <IconFamily className="h-3 w-3 mr-1" />
                              Familia
                            </Badge>
                          </div>
                          {family.city && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <IconMapPin className="h-4 w-4" />
                              <span>{family.city}</span>
                            </div>
                          )}
                          {family.elderName && (
                            <p className="text-sm text-muted-foreground">
                              Idoso(a): {family.elderName}
                              {family.elderAge ? `, ${family.elderAge} anos` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 bg-muted/30">
                      {/* Elder Needs */}
                      {family.elderNeeds && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Necessidades</p>
                          <p className="text-sm line-clamp-2">{family.elderNeeds}</p>
                        </div>
                      )}

                      {/* Mobility Level */}
                      {family.mobilityLevel && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Mobilidade</p>
                          <p className="text-sm">{family.mobilityLevel}</p>
                        </div>
                      )}

                      {/* Preferred Services */}
                      {family.preferredServices && family.preferredServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {family.preferredServices.slice(0, 4).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {serviceLabels[service] || service}
                            </Badge>
                          ))}
                          {family.preferredServices.length > 4 && (
                            <span className="text-xs text-muted-foreground">
                              +{family.preferredServices.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Budget */}
                      {family.budgetRange && (
                        <div className="flex items-center gap-1 text-sm">
                          <IconEuro className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{family.budgetRange}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-6 flex flex-col justify-center gap-2 border-l bg-background">
                      <Button asChild>
                        <Link href={`/app/families/${family.id}`}>
                          Ver Perfil
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/app/messages?userId=${family.id}`}>
                          Mensagem
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredFamilies.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <IconSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma familia encontrada</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros de pesquisa
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ============= CAREGIVER SEARCH VIEW (for families) ============= */}
        {!isLoading && !isCaregiver && (
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
                            {caregiver.verificationStatus === "VERIFIED" && (
                              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                                <IconShield className="h-3 w-3 mr-1" />
                                {t.search.verified}
                              </Badge>
                            )}
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
                            {caregiver.distanceKm != null && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <IconMapPin className="h-4 w-4" />
                                <span>{caregiver.distanceKm.toFixed(1)} km</span>
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
                            <span>{caregiver.experienceYears} {t.profile.experience}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <IconEuro className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">€{(caregiver.hourlyRateEur / 100).toFixed(0)}{t.search.perHour}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {caregiver.totalContracts || 0} {t.contracts.title}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 flex flex-col justify-center gap-2 border-l bg-background">
                      <Button asChild>
                        <Link href={`/app/caregivers/${caregiver.id}`}>
                          {t.profile.title}
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/app/contracts/new?caregiverId=${caregiver.id}`}>
                          {t.contracts.new}
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
                  <h3 className="font-semibold mb-2">{t.search.noResults}</h3>
                  <p className="text-muted-foreground">
                    {t.search.placeholder}
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
