"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35 },
    },
  };

  return (
    <AppShell>
      <motion.div
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 text-foreground">
            {isCaregiver ? "Famílias em Busca" : "Explorar Cuidadores"}
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            {isCaregiver
              ? "Encontre famílias que precisam de seus serviços"
              : "Descubra os melhores cuidadores disponíveis"}
          </p>
        </motion.div>

        {/* Search/Filter Bar */}
        <motion.div variants={itemVariants} className="bg-card rounded-3xl p-4 sm:p-6 border border-border shadow-card space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isCaregiver ? "Pesquisar familias..." : "Nome, servico ou cidade..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-11 rounded-2xl bg-secondary border border-border text-sm"
              />
            </div>
            <Button
              variant="outline"
              className="h-11 w-11 p-0 rounded-2xl shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <IconFilter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters - expandable */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest block mb-2">
                    {t.search.filters}
                  </label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="h-11 rounded-2xl bg-secondary border border-border text-sm">
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
                    <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest block mb-2">
                      {t.search.sortBy || "Ordenar"}
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-11 rounded-2xl bg-secondary border border-border text-sm">
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
                  <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest block mb-3">
                    Preço máximo: {"\u20AC"}{maxPrice}{t.search.perHour}
                  </label>
                  <Slider value={[maxPrice]} onValueChange={([value]) => setMaxPrice(value)} min={10} max={50} step={1} />
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        {!isLoading && (
          <motion.p variants={itemVariants} className="text-xs text-muted-foreground font-medium">
            {isCaregiver
              ? `${filteredFamilies.length} ${filteredFamilies.length === 1 ? "família encontrada" : "famílias encontradas"}`
              : `${filteredCaregivers.length} ${filteredCaregivers.length === 1 ? "cuidador encontrado" : t.search.resultsFound || "cuidadores encontrados"}`
            }
          </motion.p>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="status" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Caregiver Grid */}
        {!isLoading && !isCaregiver && (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants} initial="hidden" animate="visible">
            {filteredCaregivers.map((caregiver) => (
              <motion.div key={caregiver.id} variants={itemVariants}>
                <Link href={`/app/caregivers/${caregiver.id}`} className="group">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 cursor-pointer space-y-4"
                  >
                  {/* Header with avatar and verification */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16 rounded-2xl shrink-0">
                      <AvatarFallback className="rounded-2xl text-sm font-semibold bg-primary/10 text-primary">
                        {caregiver.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {caregiver.name}
                        </h3>
                        {caregiver.verificationStatus === "VERIFIED" && (
                          <IconShield className="h-5 w-5 text-success shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{caregiver.title || "Cuidador"}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-amber-600 font-display font-bold text-sm">
                      <IconStar className="h-4 w-4 fill-amber-500" />
                      {caregiver.averageRating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({caregiver.totalReviews || 0} {caregiver.totalReviews === 1 ? "avaliação" : "avaliações"})
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 py-3 border-t border-b border-border/50">
                    {/* Location */}
                    <div className="flex justify-between items-center text-sm py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-2xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
                          <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Localização</span>
                      </div>
                      <span className="text-xs font-display font-bold text-foreground">{caregiver.city || "N/A"}</span>
                    </div>

                    {/* Experience */}
                    <div className="flex justify-between items-center text-sm py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconClock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Experiência</span>
                      </div>
                      <span className="text-xs font-display font-bold text-foreground">{caregiver.experienceYears || 0} anos</span>
                    </div>

                    {/* Contracts */}
                    <div className="flex justify-between items-center text-sm py-2">
                      <span className="text-xs text-muted-foreground font-medium">Contratos</span>
                      <span className="text-xs text-muted-foreground font-medium">{caregiver.totalContracts || 0}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest">Tarifa Horária</span>
                    <span className="text-2xl font-display font-black text-primary tracking-tighter">
                      {"\u20AC"}{(caregiver.hourlyRateEur / 100).toFixed(2)}
                    </span>
                  </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredCaregivers.length === 0 && (
              <div className="col-span-full text-center py-12 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <IconSearch className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-display font-bold text-foreground text-lg mb-2">{t.search.noResults}</h4>
                <p className="text-sm text-muted-foreground">{t.search.placeholder}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Family Grid */}
        {!isLoading && isCaregiver && (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants} initial="hidden" animate="visible">
            {filteredFamilies.map((family) => (
              <motion.div key={family.id} variants={itemVariants}>
                <Link href={`/app/families/${family.id}`} className="group">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-secondary/30 transition-all duration-300 cursor-pointer space-y-4"
                  >
                  {/* Header with avatar */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16 rounded-2xl shrink-0">
                      <AvatarFallback className="rounded-2xl text-sm font-semibold bg-secondary/10 text-secondary">
                        {family.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-display font-bold text-foreground truncate">
                          {family.name}
                        </h3>
                        <span className="px-2.5 py-1 text-[9px] font-display font-bold rounded-lg uppercase tracking-widest bg-secondary/10 text-secondary border border-secondary/30 shrink-0">
                          <IconFamily className="h-3 w-3 inline mr-1" />
                          Família
                        </span>
                      </div>
                      {family.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconMapPin className="h-3 w-3" />
                          {family.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Elder info */}
                  {family.elderName && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-2xl">
                      <div className="h-8 w-8 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconUser className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest">Idoso</p>
                        <p className="text-xs font-display font-bold text-foreground">
                          {family.elderName}{family.elderAge ? `, ${family.elderAge}a` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Needs */}
                  {family.elderNeeds && (
                    <div>
                      <p className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">Necessidades</p>
                      <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{family.elderNeeds}</p>
                    </div>
                  )}

                  {/* Preferred services badges */}
                  {family.preferredServices && family.preferredServices.length > 0 && (
                    <div>
                      <p className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">Serviços Procurados</p>
                      <div className="flex flex-wrap gap-1.5">
                        {family.preferredServices.slice(0, 3).map((service, idx) => (
                          <span key={idx} className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary border border-primary/30">
                            {serviceLabels[service] || service}
                          </span>
                        ))}
                        {family.preferredServices.length > 3 && (
                          <span className="text-[9px] font-display font-bold rounded-lg uppercase tracking-widest px-2.5 py-1 bg-muted text-muted-foreground">
                            +{family.preferredServices.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1 h-10 text-xs rounded-2xl" size="sm">
                      <Link href={`/app/families/${family.id}`}>Ver Perfil</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 h-10 text-xs rounded-2xl" size="sm">
                      <Link href={`/app/messages?userId=${family.id}`}>Mensagem</Link>
                    </Button>
                  </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredFamilies.length === 0 && (
              <div className="col-span-full text-center py-12 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <IconSearch className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-display font-bold text-foreground text-lg mb-2">Nenhuma família encontrada</h4>
                <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
