"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  IconFilter,
  IconChevronRight,
} from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";

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
  const [showFilters, setShowFilters] = useState(false);

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
      const response = await apiFetch('/api/caregivers');
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
      const response = await apiFetch('/api/families');
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

  const filteredCaregivers = useMemo(() => {
    let results = [...caregivers];
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
    results = results.filter((c) => (c.hourlyRateEur / 100) <= maxPrice);
    if (selectedService !== "all") {
      results = results.filter((c) => c.services?.some(s => s.includes(selectedService)));
    }
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
    if (selectedService !== "all") {
      results = results.filter((f) =>
        f.preferredServices?.some(s => s.includes(selectedService))
      );
    }
    return results;
  }, [families, searchTerm, selectedService]);

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.search.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isCaregiver
              ? "Encontre familias que procuram cuidadores"
              : t.search.placeholder}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isCaregiver ? "Pesquisar familias..." : "Pesquisar por nome ou servico..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-surface border-border/50 shadow-card"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 px-3 rounded-xl border-border/50 shadow-card"
            onClick={() => setShowFilters(!showFilters)}
          >
            <IconFilter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 space-y-4 animate-slide-down">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t.search.filters}</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-10 rounded-xl">
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

              {!isCaregiver && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t.search.sortBy || "Ordenar por"}</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 rounded-xl">
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

            {!isCaregiver && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Preco maximo: {"\u20AC"}{maxPrice}{t.search.perHour}</label>
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
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {isCaregiver
              ? `${filteredFamilies.length} familias encontradas`
              : `${filteredCaregivers.length} ${t.search.resultsFound || "cuidadores encontrados"}`
            }
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 shadow-card border border-border/50">
                <div className="flex gap-3">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============= CAREGIVER CARDS (for families) ============= */}
        {!isLoading && !isCaregiver && (
          <div className="space-y-3">
            {filteredCaregivers.map((caregiver) => (
              <Link key={caregiver.id} href={`/app/caregivers/${caregiver.id}`} className="block">
                <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover hover:border-primary/20 transition-all">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar className="h-14 w-14 rounded-xl">
                      <AvatarFallback className="rounded-xl text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                        {caregiver.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base truncate">{caregiver.name}</h3>
                        {caregiver.verificationStatus === "VERIFIED" && (
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0" variant="outline">
                            <IconShield className="h-3 w-3 mr-0.5" />
                            {t.search.verified}
                          </Badge>
                        )}
                      </div>
                      {caregiver.title && (
                        <p className="text-sm text-muted-foreground truncate">{caregiver.title}</p>
                      )}

                      {/* Rating + Location */}
                      <div className="flex items-center gap-3 mt-1.5 text-sm">
                        <div className="flex items-center gap-1">
                          <IconStar className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{caregiver.averageRating?.toFixed(1) || '0.0'}</span>
                          <span className="text-muted-foreground text-xs">({caregiver.totalReviews || 0})</span>
                        </div>
                        {caregiver.city && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <IconMapPin className="h-3.5 w-3.5" />
                            <span className="text-xs">{caregiver.city}</span>
                          </div>
                        )}
                      </div>

                      {/* Services */}
                      {caregiver.services && caregiver.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {caregiver.services.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0 rounded-md bg-muted/50">
                              {service}
                            </Badge>
                          ))}
                          {caregiver.services.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center">+{caregiver.services.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price + Arrow */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        <p className="text-base font-bold text-primary">{"\u20AC"}{(caregiver.hourlyRateEur / 100).toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground">/hora</p>
                      </div>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filteredCaregivers.length === 0 && (
              <div className="text-center py-12 bg-surface rounded-2xl shadow-card border border-border/50">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <IconSearch className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">{t.search.noResults}</h3>
                <p className="text-sm text-muted-foreground">{t.search.placeholder}</p>
              </div>
            )}
          </div>
        )}

        {/* ============= FAMILY CARDS (for caregivers) ============= */}
        {!isLoading && isCaregiver && (
          <div className="space-y-3">
            {filteredFamilies.map((family) => (
              <div key={family.id} className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover transition-all">
                <div className="flex gap-3">
                  <Avatar className="h-14 w-14 rounded-xl">
                    <AvatarFallback className="rounded-xl text-sm font-semibold bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary">
                      {family.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base truncate">{family.name}</h3>
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[10px] px-1.5 py-0" variant="outline">
                        <IconFamily className="h-3 w-3 mr-0.5" />
                        Familia
                      </Badge>
                    </div>

                    {family.city && (
                      <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                        <IconMapPin className="h-3.5 w-3.5" />
                        <span className="text-xs">{family.city}</span>
                      </div>
                    )}

                    {family.elderName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Idoso(a): {family.elderName}{family.elderAge ? `, ${family.elderAge} anos` : ""}
                      </p>
                    )}

                    {family.elderNeeds && (
                      <p className="text-sm text-foreground mt-1.5 line-clamp-2">{family.elderNeeds}</p>
                    )}

                    {family.preferredServices && family.preferredServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {family.preferredServices.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0 rounded-md bg-muted/50">
                            {serviceLabels[service] || service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  <Button asChild size="sm" className="flex-1 h-9 rounded-xl">
                    <Link href={`/app/families/${family.id}`}>Ver Perfil</Link>
                  </Button>
                  <Button variant="outline" asChild size="sm" className="flex-1 h-9 rounded-xl">
                    <Link href={`/app/messages?userId=${family.id}`}>Mensagem</Link>
                  </Button>
                </div>
              </div>
            ))}

            {filteredFamilies.length === 0 && (
              <div className="text-center py-12 bg-surface rounded-2xl shadow-card border border-border/50">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <IconSearch className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nenhuma familia encontrada</h3>
                <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
