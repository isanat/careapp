"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import {
  BloomCard,
  BloomSectionHeader,
  BloomBadge,
  BloomSectionDivider,
  BloomEmpty,
} from "@/components/bloom-custom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  IconFileText,
  IconUser,
  IconClock,
  IconCalendar,
  IconArrowLeft,
  IconChat,
  IconEuro,
  IconChevronRight,
  IconCheck,
} from "@/components/icons";

// ─── Types ───────────────────────────────────────────────────────────────────

type ContractStatus = "ACTIVE" | "PENDING" | "COMPLETED" | "DRAFT";

interface OtherParty {
  id: string;
  name: string;
  title: string;
  city: string;
}

interface Contract {
  id: string;
  status: ContractStatus;
  title: string;
  description: string;
  hourlyRateEur: number; // cents
  totalHours: number;
  totalEurCents: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  serviceTypes: string[];
  hoursPerWeek: number;
  caregiverId: string;
  familyId: string;
  otherParty?: OtherParty;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UUID_PATTERN = /[0-9a-f]{8}-/i;

function resolveTitle(contract: Contract): string {
  if (UUID_PATTERN.test(contract.title)) {
    return `Contrato com ${contract.otherParty?.name ?? "Cuidador"}`;
  }
  return contract.title;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type TabKey = "ALL" | "ACTIVE" | "PENDING" | "COMPLETED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "ACTIVE", label: "Activos" },
  { key: "PENDING", label: "Pendentes" },
  { key: "COMPLETED", label: "Concluídos" },
];

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_MAP: Record<ContractStatus, StatusConfig> = {
  ACTIVE: { label: "Activo", className: "text-success" },
  PENDING: { label: "Pendente", className: "text-warning" },
  COMPLETED: { label: "Concluído", className: "text-info" },
  DRAFT: { label: "Rascunho", className: "text-muted-foreground" },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ContractsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-2/3 rounded-xl" />
              <Skeleton className="h-4 w-1/3 rounded-xl" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-6 pt-2 border-t border-border/30">
            <Skeleton className="h-4 w-20 rounded-xl" />
            <Skeleton className="h-4 w-20 rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Contract List Item ───────────────────────────────────────────────────────

interface ContractListItemProps {
  contract: Contract;
  onClick: () => void;
}

function ContractListItem({ contract, onClick }: ContractListItemProps) {
  const title = resolveTitle(contract);
  const statusConfig = STATUS_MAP[contract.status] ?? STATUS_MAP.DRAFT;
  const hourlyRate = (contract.hourlyRateEur / 100).toFixed(2);
  const totalHours = Math.floor(contract.totalHours);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 hover:shadow-elevated transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <IconFileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">
              {title}
            </p>
            {contract.otherParty?.name && (
              <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                <IconUser className="h-3 w-3 shrink-0" />
                {contract.otherParty.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display font-black uppercase tracking-widest ${
              contract.status === "ACTIVE"
                ? "bg-success/10 text-success"
                : contract.status === "PENDING"
                  ? "bg-warning/10 text-warning"
                  : contract.status === "COMPLETED"
                    ? "bg-info/10 text-info"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {statusConfig.label}
          </span>
          <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <IconEuro className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            {hourlyRate}€/h
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            {totalHours}h total
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <IconCalendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            {formatDate(contract.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Contract Detail View ─────────────────────────────────────────────────────

interface ContractDetailProps {
  contract: Contract;
  onBack: () => void;
}

function ContractDetail({ contract, onBack }: ContractDetailProps) {
  const router = useRouter();
  const title = resolveTitle(contract);
  const statusConfig = STATUS_MAP[contract.status] ?? STATUS_MAP.DRAFT;
  const hourlyRate = (contract.hourlyRateEur / 100).toFixed(2);
  const totalHours = Math.floor(contract.totalHours);
  const totalValue = (contract.totalEurCents / 100).toFixed(2);
  const initials = contract.otherParty?.name
    ? getInitials(contract.otherParty.name)
    : "CG";

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        Voltar aos contratos
      </button>

      {/* Header card */}
      <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconFileText className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-display font-black text-foreground uppercase tracking-tight leading-tight">
                {title}
              </h2>
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mt-1">
                Criado em {formatDate(contract.createdAt)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display font-black uppercase tracking-widest shrink-0 ${
              contract.status === "ACTIVE"
                ? "bg-success/10 text-success"
                : contract.status === "PENDING"
                  ? "bg-warning/10 text-warning"
                  : contract.status === "COMPLETED"
                    ? "bg-info/10 text-info"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {contract.status === "ACTIVE" && (
              <IconCheck className="h-3 w-3" />
            )}
            {statusConfig.label}
          </span>
        </div>

        {contract.description && (
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {contract.description}
          </p>
        )}

        {/* Dates */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border/30">
          {contract.startDate && (
            <div>
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-1">
                Início
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(contract.startDate)}
              </p>
            </div>
          )}
          {contract.endDate && (
            <div>
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mb-1">
                Fim
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(contract.endDate)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Caregiver info card */}
      {contract.otherParty && (
        <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 space-y-4">
          <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
            Cuidador
          </p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-base font-display font-black text-primary">
                {initials}
              </span>
            </div>
            <div>
              <p className="text-base font-display font-black text-foreground uppercase tracking-tight">
                {contract.otherParty.name}
              </p>
              {contract.otherParty.title && (
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {contract.otherParty.title}
                </p>
              )}
              {contract.otherParty.city && (
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {contract.otherParty.city}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Financial details card */}
      <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 space-y-4">
        <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
          Detalhes financeiros
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-2">
              <IconEuro className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                Hora
              </p>
            </div>
            <p className="text-2xl font-display font-black text-foreground tracking-tighter leading-none">
              {hourlyRate}€
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                Horas
              </p>
            </div>
            <p className="text-2xl font-display font-black text-foreground tracking-tighter leading-none">
              {totalHours}h
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-2">
              <IconEuro className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                Total
              </p>
            </div>
            <p className="text-2xl font-display font-black text-foreground tracking-tighter leading-none">
              {totalValue}€
            </p>
          </div>
        </div>

        {contract.hoursPerWeek > 0 && (
          <div className="pt-4 border-t border-border/30 flex items-center gap-2">
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {contract.hoursPerWeek}h por semana
            </span>
          </div>
        )}
      </div>

      {/* Service types */}
      {contract.serviceTypes && contract.serviceTypes.length > 0 && (
        <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-6 space-y-3">
          <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
            Tipos de serviço
          </p>
          <div className="flex flex-wrap gap-2">
            {contract.serviceTypes.map((svc) => (
              <span
                key={svc}
                className="text-[10px] font-display font-black text-muted-foreground bg-secondary rounded-2xl px-2.5 py-1.5 border border-border/50 uppercase tracking-widest"
              >
                {svc.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => router.push("/app/chat")}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          <IconChat className="h-4 w-4 mr-2" />
          Fazer Pergunta
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex-1 sm:flex-none"
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

function ContractsPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") return;

    const fetchContracts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/contracts");
        if (!res.ok) {
          throw new Error(`Erro ao carregar contratos (${res.status})`);
        }
        const data = await res.json();
        setContracts(data.contracts ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro inesperado. Tenta novamente.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [sessionStatus]);

  // If viewing a contract detail, render that instead
  if (selectedContract) {
    return (
      <ContractDetail
        contract={selectedContract}
        onBack={() => setSelectedContract(null)}
      />
    );
  }

  // Filter contracts by active tab
  const filteredContracts =
    activeTab === "ALL"
      ? contracts
      : contracts.filter((c) => c.status === activeTab);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <BloomSectionHeader
        title="Contratos"
        description="Consulta e gere todos os teus contratos de cuidados."
      />

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto scrollbar-none -mb-px">
          {TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? contracts.length
                : contracts.filter((c) => c.status === tab.key).length;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-display font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-[10px] rounded-full px-1.5 py-0.5 font-black ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && <ContractsSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-5 sm:p-6">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-display font-black text-destructive underline underline-offset-2 uppercase tracking-widest"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredContracts.length === 0 && (
        <BloomEmpty
          icon={<IconFileText className="h-8 w-8" />}
          title={
            activeTab === "ALL"
              ? "Nenhum contrato encontrado"
              : `Nenhum contrato ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}`
          }
          description={
            activeTab === "ALL"
              ? "Os teus contratos aparecerão aqui quando forem criados."
              : "Altera o filtro para ver outros contratos."
          }
        />
      )}

      {/* Contracts list */}
      {!loading && !error && filteredContracts.length > 0 && (
        <div className="space-y-3">
          {filteredContracts.map((contract) => (
            <ContractListItem
              key={contract.id}
              contract={contract}
              onClick={() => setSelectedContract(contract)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContractsPage() {
  return (
    <div suppressHydrationWarning>
      <ContractsPageContent />
    </div>
  );
}
