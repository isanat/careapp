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
      <div className="space-y-3">
        {/* Header + Search inline */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isCaregiver ? "Pesquisar familias..." : "Nome, servico ou cidade..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-lg bg-surface border-border/50"
            />
          </div>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            <IconFilter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters - compact */}
        {showFilters && (
          <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t.search.filters}</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-8 rounded-lg text-xs">
                    <SelectValue placeholder={t.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isCaregiver && (
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t.search.sortBy || "Ordenar"}</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-8 rounded-lg text-xs">
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
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Max: {"\u20AC"}{maxPrice}{t.search.perHour}</label>
                <Slider value={[maxPrice]} onValueChange={([value]) => setMaxPrice(value)} min={10} max={50} step={1} />
              </div>
            )}
          </div>
        )}

        {/* Count */}
        {!isLoading && (
          <p className="text-[11px] text-muted-foreground">
            {isCaregiver
              ? `${filteredFamilies.length} familias`
              : `${filteredCaregivers.length} ${t.search.resultsFound || "cuidadores"}`
            }
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        )}

        {/* Caregiver list - compact rows */}
        {!isLoading && !isCaregiver && (
          <div className="space-y-1.5">
            {filteredCaregivers.map((caregiver) => (
              <Link key={caregiver.id} href={`/app/caregivers/${caregiver.id}`} className="block">
                <div className="bg-surface rounded-xl p-2.5 border border-border/30 hover:bg-muted/30 transition-all flex items-center gap-2.5">
                  <Avatar className="h-10 w-10 rounded-lg shrink-0">
                    <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                      {caregiver.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold truncate">{caregiver.name}</h3>
                      {caregiver.verificationStatus === "VERIFIED" && (
                        <IconShield className="h-3.5 w-3.5 text-success shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <IconStar className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {caregiver.averageRating?.toFixed(1) || '0.0'}
                        <span className="text-[10px]">({caregiver.totalReviews || 0})</span>
                      </span>
                      {caregiver.city && (
                        <span className="flex items-center gap-0.5 truncate">
                          <IconMapPin className="h-3 w-3" />
                          {caregiver.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{"\u20AC"}{(caregiver.hourlyRateEur / 100).toFixed(0)}</p>
                    <p className="text-[9px] text-muted-foreground">/hora</p>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}

            {filteredCaregivers.length === 0 && (
              <div className="text-center py-8 bg-surface rounded-xl border border-border/30">
                <IconSearch className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs font-medium">{t.search.noResults}</p>
                <p className="text-[10px] text-muted-foreground">{t.search.placeholder}</p>
              </div>
            )}
          </div>
        )}

        {/* Family list - compact rows */}
        {!isLoading && isCaregiver && (
          <div className="space-y-1.5">
            {filteredFamilies.map((family) => (
              <div key={family.id} className="bg-surface rounded-xl p-2.5 border border-border/30 hover:bg-muted/30 transition-all">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-10 w-10 rounded-lg shrink-0">
                    <AvatarFallback className="rounded-lg text-xs font-semibold bg-secondary/10 text-secondary">
                      {family.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold truncate">{family.name}</h3>
                      <Badge className="bg-secondary/10 text-secondary border-0 text-[9px] px-1 py-0 h-4">
                        <IconFamily className="h-2.5 w-2.5 mr-0.5" />
                        Familia
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {family.city && (
                        <span className="flex items-center gap-0.5">
                          <IconMapPin className="h-3 w-3" />
                          {family.city}
                        </span>
                      )}
                      {family.elderName && (
                        <span className="truncate">{family.elderName}{family.elderAge ? `, ${family.elderAge}a` : ""}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button asChild size="sm" className="h-7 text-[10px] px-2">
                      <Link href={`/app/families/${family.id}`}>Ver</Link>
                    </Button>
                    <Button variant="outline" asChild size="sm" className="h-7 text-[10px] px-2">
                      <Link href={`/app/messages?userId=${family.id}`}>Msg</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFamilies.length === 0 && (
              <div className="text-center py-8 bg-surface rounded-xl border border-border/30">
                <IconSearch className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs font-medium">Nenhuma familia encontrada</p>
                <p className="text-[10px] text-muted-foreground">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
