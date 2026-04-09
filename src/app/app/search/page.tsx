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
  IconUser,
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

        {/* Caregiver list - visual grid cards */}
        {!isLoading && !isCaregiver && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCaregivers.map((caregiver) => (
              <Link key={caregiver.id} href={`/app/caregivers/${caregiver.id}`} className="group">
                <div className="bg-surface rounded-xl p-4 border-2 border-primary/20 hover:border-primary/40 transition-all card-interactive">
                  {/* Header with avatar and verification */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 rounded-lg shrink-0">
                        <AvatarFallback className="rounded-lg text-sm font-semibold bg-primary/10 text-primary">
                          {caregiver.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-semibold truncate group-hover:text-primary transition-colors">{caregiver.name}</h3>
                          {caregiver.verificationStatus === "VERIFIED" && (
                            <IconShield className="h-4 w-4 text-success shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{caregiver.title || "Cuidador"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating and reviews */}
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <IconStar className="h-4 w-4 fill-amber-500" />
                      {caregiver.averageRating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-muted-foreground">({caregiver.totalReviews || 0} avaliações)</span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/30 mb-3">
                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <IconMapPin className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-medium">Localização</p>
                        <p className="text-xs font-semibold text-foreground truncate">{caregiver.city || "N/A"}</p>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconClock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground font-medium">Experiência</p>
                        <p className="text-xs font-semibold text-foreground">{caregiver.experienceYears || 0}a</p>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Tarifa Horária</p>
                      <p className="text-lg font-bold text-primary">{"\u20AC"}{(caregiver.hourlyRateEur / 100).toFixed(2)}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="text-[10px]">{caregiver.totalContracts || 0} contratos</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filteredCaregivers.length === 0 && (
              <div className="col-span-full text-center py-12 bg-surface rounded-xl border-2 border-dashed border-border/30">
                <IconSearch className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">{t.search.noResults}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.search.placeholder}</p>
              </div>
            )}
          </div>
        )}

        {/* Family list - visual grid cards */}
        {!isLoading && isCaregiver && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFamilies.map((family) => (
              <div key={family.id} className="bg-surface rounded-xl p-4 border-2 border-secondary/20 hover:border-secondary/40 transition-all card-interactive">
                {/* Header with avatar */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 rounded-lg shrink-0">
                      <AvatarFallback className="rounded-lg text-sm font-semibold bg-secondary/10 text-secondary">
                        {family.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-semibold truncate">{family.name}</h3>
                        <Badge className="bg-secondary/10 text-secondary border-0 text-[10px] px-1.5 py-0.5 h-5 shrink-0">
                          <IconFamily className="h-3 w-3 mr-0.5" />
                          Família
                        </Badge>
                      </div>
                      {family.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <IconMapPin className="h-3 w-3" />
                          {family.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Elder info */}
                {family.elderName && (
                  <div className="flex items-center gap-2 mb-3 p-2.5 bg-muted/30 rounded-lg">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconUser className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium">Idoso</p>
                      <p className="text-xs font-semibold text-foreground">
                        {family.elderName}{family.elderAge ? `, ${family.elderAge} anos` : ""}
                      </p>
                    </div>
                  </div>
                )}

                {/* Needs */}
                {family.elderNeeds && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Necessidades</p>
                    <p className="text-xs text-foreground line-clamp-2">{family.elderNeeds}</p>
                  </div>
                )}

                {/* Preferred services badges */}
                {family.preferredServices && family.preferredServices.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">Serviços Procurados</p>
                    <div className="flex flex-wrap gap-1">
                      {family.preferredServices.slice(0, 3).map((service, idx) => (
                        <Badge key={idx} className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0.5 h-5">
                          {serviceLabels[service] || service}
                        </Badge>
                      ))}
                      {family.preferredServices.length > 3 && (
                        <Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-1.5 py-0.5 h-5">
                          +{family.preferredServices.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-3 border-t border-border/30">
                  <Button asChild className="flex-1 h-8 text-xs" size="sm">
                    <Link href={`/app/families/${family.id}`}>Ver Perfil</Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1 h-8 text-xs" size="sm">
                    <Link href={`/app/messages?userId=${family.id}`}>Mensagem</Link>
                  </Button>
                </div>
              </div>
            ))}

            {filteredFamilies.length === 0 && (
              <div className="col-span-full text-center py-12 bg-surface rounded-xl border-2 border-dashed border-border/30">
                <IconSearch className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhuma família encontrada</p>
                <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
