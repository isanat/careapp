"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tokens, cn, getCardClasses, getHeadingClasses } from "@/lib/design-tokens";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import {
  IconUser,
  IconCamera,
  IconEdit,
  IconCheck,
  IconStar,
  IconFamily,
  IconCaregiver,
  IconLoader2,
  IconAlertCircle,
  IconEuro,
  IconBell,
  IconShield,
  IconTrash,
  IconLogout,
  IconFileText,
  IconUpload,
  IconCheckCircle,
  IconClock,
  IconAlertTriangle,
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/hooks/useNotifications";
import { apiFetch } from "@/lib/api-client";

const SERVICE_TYPES = [
  { id: "PERSONAL_CARE", label: "Cuidados Pessoais" },
  { id: "MEDICATION", label: "Medicação" },
  { id: "MOBILITY", label: "Mobilidade" },
  { id: "COMPANIONSHIP", label: "Companhia" },
  { id: "MEAL_PREPARATION", label: "Refeições" },
  { id: "LIGHT_HOUSEWORK", label: "Tarefas Domésticas" },
  { id: "TRANSPORTATION", label: "Transporte" },
  { id: "COGNITIVE_SUPPORT", label: "Estimulação Cognitiva" },
  { id: "NIGHT_CARE", label: "Cuidados Noturnos" },
  { id: "PALLIATIVE_CARE", label: "Cuidados Paliativos" },
  { id: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { id: "NURSING_CARE", label: "Enfermagem" },
];

const DOCUMENT_TYPES = [
  {
    id: "CC",
    label: "Cartão de Cidadão",
    placeholder: "12345678 1 ZZ2",
    maxLength: 15,
  },
  {
    id: "PASSPORT",
    label: "Passaporte",
    placeholder: "AA123456",
    maxLength: 9,
  },
  {
    id: "RESIDENCE",
    label: "Título de Residência",
    placeholder: "Numero do titulo",
    maxLength: 20,
  },
];

function parseElderNeeds(raw: string): string {
  if (!raw) return "";
  try {
    const data = JSON.parse(raw);
    const parts: string[] = [];
    const mobilityLabels: Record<string, string> = {
      total: "Sem mobilidade",
      parcial: "Mobilidade parcial",
      boa: "Boa mobilidade",
    };
    if (data.mobilityLevel)
      parts.push(`Mobilidade: ${mobilityLabels[data.mobilityLevel] || data.mobilityLevel}`);
    const condLabels: Record<string, string> = {
      cancer: "Cancro",
      artrite: "Artrite",
      avc: "AVC",
      diabetes: "Diabetes",
      demencia: "Demência",
      alzheimer: "Alzheimer",
      parkinson: "Parkinson",
      insuficiencia_cardiaca: "Insuficiência cardíaca",
    };
    if (Array.isArray(data.medicalConditions) && data.medicalConditions.length > 0)
      parts.push(`Condições médicas: ${data.medicalConditions.map((c: string) => condLabels[c] || c).join(", ")}`);
    if (data.medicalConditionsNotes)
      parts.push(`Notas médicas: ${data.medicalConditionsNotes}`);
    if (Array.isArray(data.dietaryRestrictions) && data.dietaryRestrictions.length > 0)
      parts.push(`Restrições alimentares: ${data.dietaryRestrictions.join(", ")}`);
    if (Array.isArray(data.servicesNeeded) && data.servicesNeeded.length > 0) {
      const svcLabels: Record<string, string> = {
        personal_care: "Cuidados pessoais",
        medication: "Medicação",
        meal_preparation: "Preparação de refeições",
        mobility: "Mobilidade",
        companionship: "Companhia",
        cognitive_support: "Estimulação cognitiva",
        night_care: "Cuidados noturnos",
        transportation: "Transporte",
      };
      parts.push(`Serviços necessários: ${data.servicesNeeded.map((s: string) => svcLabels[s] || s).join(", ")}`);
    }
    if (data.additionalNotes) parts.push(`Notas adicionais: ${data.additionalNotes}`);
    return parts.length > 0 ? parts.join("\n") : raw;
  } catch {
    return raw;
  }
}

function validateNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const digits = nif.split("").map(Number);
  const checkSum = digits
    .slice(0, 8)
    .reduce((sum, d, i) => sum + d * (9 - i), 0);
  const remainder = checkSum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  return checkDigit === digits[8];
}

function formatPhonePT(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("351")) {
    const num = digits.slice(3);
    if (num.length <= 3) return `+351 ${num}`;
    if (num.length <= 6) return `+351 ${num.slice(0, 3)} ${num.slice(3)}`;
    return `+351 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 9)}`;
  }
  if (digits.length <= 3) return `+351 ${digits}`;
  if (digits.length <= 6)
    return `+351 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  nif?: string;
  documentType?: string;
  documentNumber?: string;
  profileImage?: string;
  title?: string;
  bio?: string;
  experienceYears?: number;
  city?: string;
  services?: string[];
  hourlyRateEur?: number;
  certifications?: string;
  languages?: string;
  averageRating?: number;
  totalReviews?: number;
  totalContracts?: number;
  elderName?: string;
  elderAge?: number;
  elderNeeds?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  backgroundCheckStatus?: string;
  backgroundCheckUrl?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { t } = useI18n();
  const {
    isPushEnabled,
    subscribeToPush,
    requestPushPermission,
    isPushSupported,
    pushError,
  } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/user/profile");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Erro ao carregar perfil: " + errorText);
      }
      const data = await response.json();
      setProfile(data.profile);

      // Parse services from JSON string if it's stored as string
      let services: string[] = [];
      if (typeof data.profile?.services === "string") {
        try {
          services = JSON.parse(data.profile.services);
        } catch {
          services = [];
        }
      } else if (Array.isArray(data.profile?.services)) {
        services = data.profile.services;
      }

      setFormData({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        nif: data.user?.nif || "",
        documentType: data.user?.documentType || "",
        documentNumber: data.user?.documentNumber || "",
        profileImage: data.user?.profileImage || "",
        title: data.profile?.title || "",
        bio: data.profile?.bio || "",
        experienceYears: data.profile?.experienceYears || 0,
        city: data.profile?.city || "",
        services: services,
        hourlyRateEur: data.profile?.hourlyRateEur
          ? data.profile.hourlyRateEur / 100
          : 15,
        certifications: data.profile?.certifications || "",
        languages: data.profile?.languages || "",
        averageRating: data.profile?.averageRating || 0,
        totalReviews: data.profile?.totalReviews || 0,
        totalContracts: data.profile?.totalContracts || 0,
        elderName: data.profile?.elderName || "",
        elderAge: data.profile?.elderAge || undefined,
        elderNeeds: parseElderNeeds(data.profile?.elderNeeds || ""),
        emergencyContactName: data.profile?.emergencyContactName || "",
        emergencyContactPhone: data.profile?.emergencyContactPhone || "",
        backgroundCheckStatus: data.user?.backgroundCheckStatus || "PENDING",
        backgroundCheckUrl: data.user?.backgroundCheckUrl || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    if (formData.nif && formData.nif.length > 0 && formData.nif.length !== 9) {
      setError("O NIF deve ter exatamente 9 digitos");
      setIsSaving(false);
      return;
    }
    if (
      formData.nif &&
      formData.nif.length === 9 &&
      !validateNIF(formData.nif)
    ) {
      setError("NIF invalido - verifique o numero");
      setIsSaving(false);
      return;
    }

    try {
      const response = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const msg =
          errorData?.error || errorData?.detail || "Erro ao salvar perfil";
        throw new Error(msg);
      }

      await response.json();
      setSuccess("Guardado com sucesso!");
      setIsEditing(false);
      if (formData.name !== session?.user?.name)
        await update({ name: formData.name });
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services?.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...(prev.services || []), serviceId],
    }));
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    setError(null);
    try {
      const granted = await requestPushPermission();
      if (granted) {
        const ok = await subscribeToPush();
        if (!ok && pushError) setError(pushError);
        else if (ok) setSuccess("Notificações ativadas!");
      }
    } finally {
      setPushLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await apiFetch("/api/user/account", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao apagar conta");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar conta");
      setIsDeleting(false);
      return;
    }
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Compress image before upload
  const compressImage = async (
    file: File,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Scale down if larger than max dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: "image/jpeg" }));
              } else {
                reject(new Error("Could not compress image"));
              }
            },
            "image/jpeg",
            quality,
          );
        };
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "Ficheiro muito grande. Máximo 5MB. O ficheiro será comprimido automaticamente.",
        );
      }

      // Compress image
      const compressedFile = await compressImage(file);

      const fd = new FormData();
      fd.append("file", compressedFile);
      fd.append("type", "profile");
      const response = await apiFetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao enviar foto");
      }
      const data = await response.json();
      setFormData((prev) => ({ ...prev, profileImage: data.url }));
      await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: data.url }),
      });
      setSuccess("Foto atualizada!");
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBackgroundCheckUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      // Validate file size (10MB for documents/images)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Ficheiro muito grande. Máximo 10MB");
      }

      // For images, compress them
      let uploadFile = file;
      if (file.type.startsWith("image/")) {
        uploadFile = await compressImage(file, 1200, 1200, 0.75);
      }

      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("type", "background_check");
      const response = await apiFetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao enviar documento");
      }
      const data = await response.json();
      await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundCheckUrl: data.url,
          backgroundCheckStatus: "SUBMITTED",
        }),
      });
      setFormData((prev) => ({
        ...prev,
        backgroundCheckUrl: data.url,
        backgroundCheckStatus: "SUBMITTED",
      }));
      setSuccess("Comprovativo enviado!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar documento");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
    );
  }

  const getBackgroundCheckBadge = () => {
    switch (formData.backgroundCheckStatus) {
      case "VERIFIED":
        return (
          <Badge
            className="bg-success/10 text-success border-success/20"
            variant="outline"
          >
            <IconCheckCircle className="h-3 w-3 mr-1" />
            Verificado
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge
            className="bg-warning/10 text-warning border-warning/20"
            variant="outline"
          >
            <IconClock className="h-3 w-3 mr-1" />
            Em analise
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <IconAlertTriangle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <IconClock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className={cn(tokens.layout.sectionSpacing, tokens.layout.maxWidth, tokens.spacing.paddingX.responsive)}>
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className={getHeadingClasses("pageTitle")}>
            Meu Perfil
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            {isCaregiver
              ? "Gira as suas informações profissionais e preferências"
              : "Gerencie as informações do seu familiar"}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-display font-bold text-foreground">
                Erro
              </p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-4 p-5 bg-success/5 border border-success/20 rounded-2xl">
            <IconCheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-display font-bold text-foreground">
                Sucesso
              </p>
              <p className="text-xs text-muted-foreground mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Header Section */}
        <section className="space-y-4">
          <div className={cn(getCardClasses(true), "space-y-4")}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-secondary/30 bg-secondary flex items-center justify-center cursor-pointer group"
                    onClick={handlePhotoClick}
                  >
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt={formData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl font-display font-black text-muted-foreground">
                        {session?.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </div>
                    )}
                  </div>
                  <button
                    className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:shadow-lg transition-all group-hover:scale-110"
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <IconCamera className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0 pt-1 space-y-2">
                  <h2 className="text-2xl font-display font-black text-foreground uppercase tracking-tighter">
                    {session?.user?.name}
                  </h2>
                  {isCaregiver && formData.title && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {formData.title}
                      {formData.city ? ` • ${formData.city}` : ""}
                    </p>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      Email
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formData.email}
                    </p>
                  </div>
                  {formData.phone && (
                    <div className="space-y-1">
                      <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Telefone
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {formData.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={isSaving}
                className="rounded-2xl px-4 h-10 text-sm font-display font-bold uppercase"
                variant={isEditing ? "default" : "outline"}
              >
                {isSaving ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando
                  </>
                ) : isEditing ? (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    {t.save}
                  </>
                ) : (
                  <>
                    <IconEdit className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Stats for caregiver */}
        {isCaregiver && (
          <div className={cn(tokens.layout.grid.responsive4)}>
            {[
              {
                value: profile?.totalContracts || 0,
                label: "Contratos",
                icon: IconFamily,
              },
              {
                value: profile?.totalReviews || 0,
                label: "Avaliações",
                icon: IconStar,
              },
              {
                value: (profile?.averageRating || 0).toFixed(1),
                label: "Nota",
                icon: IconStar,
              },
              {
                value: `€${(formData.hourlyRateEur || 0).toFixed(2)}`,
                label: "/hora",
                icon: IconEuro,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(getCardClasses(true), "space-y-4")}
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </div>
                  <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList
            className={`w-full h-11 rounded-2xl bg-secondary/50 p-1 grid ${isCaregiver ? "grid-cols-5" : "grid-cols-4"} gap-1`}
          >
            <TabsTrigger
              value="about"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Info
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Docs
            </TabsTrigger>
            {isCaregiver && (
              <TabsTrigger
                value="services"
                className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Serviços
              </TabsTrigger>
            )}
            {isFamily && (
              <TabsTrigger
                value="elder"
                className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Idoso
              </TabsTrigger>
            )}
            <TabsTrigger
              value="contact"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Contato
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Config
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="about" className="space-y-6">
            <section className="space-y-4">
              <h3 className={getHeadingClasses("sectionTitle")}>
                Informações Pessoais
              </h3>
              <div className={cn(getCardClasses(), "space-y-4")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      {t.auth.name}
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-2 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      Cidade
                    </Label>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-2 rounded-2xl"
                      placeholder="Cidade"
                    />
                  </div>
                </div>

                {isCaregiver && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Titulo Profissional
                        </Label>
                        <Input
                          value={formData.title || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          disabled={!isEditing}
                          className="mt-2 rounded-2xl"
                          placeholder="Ex: Enfermeira"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Anos de Experiencia
                        </Label>
                        <Input
                          type="number"
                          value={formData.experienceYears || 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              experienceYears: parseInt(e.target.value) || 0,
                            })
                          }
                          disabled={!isEditing}
                          className="mt-2 rounded-2xl"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Bio / Sobre voce
                      </Label>
                      <Textarea
                        value={formData.bio || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        rows={3}
                        disabled={!isEditing}
                        className="mt-2 rounded-2xl"
                        placeholder="Descreva sua experiencia..."
                      />
                    </div>
                  </>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Personal Documents Section */}
            <section className="space-y-4">
              <h3 className={getHeadingClasses("sectionTitle")}>
                Documentos Pessoais
              </h3>
              <div className={cn(getCardClasses(), "space-y-4")}>
                <div>
                  <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                    NIF
                  </Label>
                  <Input
                    value={formData.nif || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                      setFormData({ ...formData, nif: val });
                    }}
                    disabled={!isEditing}
                    className={`mt-2 rounded-2xl ${formData.nif && formData.nif.length === 9 && !validateNIF(formData.nif) ? "border-destructive" : ""}`}
                    placeholder="123456789"
                    maxLength={9}
                    inputMode="numeric"
                  />
                  {formData.nif &&
                    formData.nif.length === 9 &&
                    !validateNIF(formData.nif) && (
                      <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                        <IconAlertCircle className="h-3 w-3" />
                        NIF invalido
                      </p>
                    )}
                  {formData.nif &&
                    formData.nif.length === 9 &&
                    validateNIF(formData.nif) && (
                      <p className="text-xs text-success mt-2 flex items-center gap-1">
                        <IconCheck className="h-3 w-3" />
                        NIF valido
                      </p>
                    )}
                </div>

                <div>
                  <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                    Tipo de Documento
                  </Label>
                  <Select
                    value={formData.documentType || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        documentType: value,
                        documentNumber: "",
                      })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-2 rounded-2xl">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border shadow-card z-50">
                      {DOCUMENT_TYPES.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.documentType && (
                  <div>
                    <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      Numero do{" "}
                      {DOCUMENT_TYPES.find(
                        (d) => d.id === formData.documentType,
                      )?.label || "Documento"}
                    </Label>
                    <Input
                      value={formData.documentNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentNumber: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="mt-2 rounded-2xl"
                      placeholder={
                        DOCUMENT_TYPES.find(
                          (d) => d.id === formData.documentType,
                        )?.placeholder || ""
                      }
                      maxLength={
                        DOCUMENT_TYPES.find(
                          (d) => d.id === formData.documentType,
                        )?.maxLength || 20
                      }
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Background Check - Caregivers only */}
            {isCaregiver && (
              <section className="space-y-4">
                <h3 className={getHeadingClasses("sectionTitle")}>
                  Verificacao de Antecedentes
                </h3>
                <div className={cn(getCardClasses(), "space-y-4")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
                        <IconShield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">
                          Antecedentes Criminais
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Status da verificacao
                        </p>
                      </div>
                    </div>
                    {getBackgroundCheckBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Para trabalhar como cuidador, e necessario apresentar o
                    registo criminal.
                  </p>
                  <Button
                    variant={
                      formData.backgroundCheckUrl ? "outline" : "default"
                    }
                    size="sm"
                    onClick={() =>
                      document.getElementById("backgroundCheckInput")?.click()
                    }
                    disabled={uploadingPhoto}
                    className="w-full rounded-2xl h-10 font-display font-bold uppercase"
                  >
                    {uploadingPhoto ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <IconUpload className="h-4 w-4 mr-2" />
                        {formData.backgroundCheckUrl
                          ? "Atualizar Comprovativo"
                          : "Enviar Comprovativo"}
                      </>
                    )}
                  </Button>
                  <input
                    id="backgroundCheckInput"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleBackgroundCheckUpload}
                  />
                  {formData.backgroundCheckUrl && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <IconCheck className="h-3 w-3" />
                      Documento enviado com sucesso
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Security Info */}
            <div className="flex items-start gap-4 p-5 bg-info/5 border border-info/20 rounded-2xl">
              <IconShield className="h-5 w-5 text-info shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-display font-bold text-foreground">
                  Segurança dos dados
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os seus documentos são armazenados de forma segura e
                  encriptados em conformidade com o RGPD.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          {isCaregiver && (
            <TabsContent value="services" className={tokens.layout.sectionSpacing}>
              <section className="space-y-4">
                <h3 className={getHeadingClasses("sectionTitle")}>
                  Serviços Oferecidos
                </h3>
                <div className={cn(getCardClasses(), "space-y-6")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SERVICE_TYPES.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all cursor-pointer ${
                          formData.services?.includes(service.id)
                            ? "border-primary bg-primary/10"
                            : ""
                        } ${!isEditing ? "pointer-events-none opacity-60" : ""}`}
                      >
                        <Checkbox
                          checked={formData.services?.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceToggle(service.id)
                          }
                          disabled={!isEditing}
                          className="h-5 w-5"
                        />
                        <span className="text-sm font-display font-bold text-foreground">
                          {service.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="border-t border-border/30 pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Taxa Horaria ({"\u20AC"}/hora)
                        </Label>
                        <div className="relative mt-2">
                          <IconEuro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={formData.hourlyRateEur?.toString() || ""}
                            onChange={(e) => {
                              const normalized = e.target.value.replace(
                                ",",
                                ".",
                              );
                              const value = parseFloat(normalized) || 0;
                              setFormData({
                                ...formData,
                                hourlyRateEur: value,
                              });
                            }}
                            className="pl-11 rounded-2xl"
                            disabled={!isEditing}
                            placeholder="15.50"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                          Idiomas
                        </Label>
                        <Input
                          value={formData.languages || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              languages: e.target.value,
                            })
                          }
                          disabled={!isEditing}
                          className="mt-2 rounded-2xl"
                          placeholder="PT, EN, ES..."
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Certificações
                      </Label>
                      <Input
                        value={formData.certifications || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            certifications: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="mt-2 rounded-2xl"
                        placeholder="Curso de Cuidador, Primeiros Socorros..."
                      />
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>
          )}

          {/* Elder Tab */}
          {isFamily && (
            <TabsContent value="elder" className={tokens.layout.sectionSpacing}>
              <section className="space-y-4">
                <h3 className={getHeadingClasses("sectionTitle")}>
                  Informações do Familiar
                </h3>
                <div className={cn(getCardClasses(), "space-y-4")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Nome do Idoso
                      </Label>
                      <Input
                        value={formData.elderName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            elderName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="mt-2 rounded-2xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                        Idade
                      </Label>
                      <Input
                        type="number"
                        value={formData.elderAge || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            elderAge: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={!isEditing}
                        className="mt-2 rounded-2xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                      Necessidades Específicas
                    </Label>
                    <Textarea
                      value={formData.elderNeeds || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, elderNeeds: e.target.value })
                      }
                      rows={4}
                      disabled={!isEditing}
                      className="mt-2 rounded-2xl"
                      placeholder="Descreva as necessidades especificas de saude e cuidado..."
                    />
                  </div>
                </div>
              </section>
            </TabsContent>
          )}

          {/* Contact Tab */}
          <TabsContent value="contact" className={tokens.layout.sectionSpacing}>
            <section className="space-y-4">
              <h3 className={getHeadingClasses("sectionTitle")}>
                Informações de Contacto
              </h3>
              <div className={cn(getCardClasses(), "space-y-4")}>
                <div>
                  <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                    {t.auth.email}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="mt-2 rounded-2xl bg-secondary/50 cursor-not-allowed opacity-60"
                  />
                </div>
                <div>
                  <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                    Telemovel
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: formatPhonePT(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    className="mt-2 rounded-2xl"
                    placeholder="+351 912 345 678"
                    inputMode="tel"
                  />
                </div>

                {isFamily && (
                  <>
                    <div className="border-t border-border/30 pt-6 space-y-4">
                      <h4 className="text-sm font-display font-bold uppercase text-foreground">
                        Contacto de Emergência
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Nome
                          </Label>
                          <Input
                            value={formData.emergencyContactName || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContactName: e.target.value,
                              })
                            }
                            disabled={!isEditing}
                            className="mt-2 rounded-2xl"
                            placeholder="Nome completo"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                            Telefone
                          </Label>
                          <Input
                            type="tel"
                            value={formData.emergencyContactPhone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContactPhone: formatPhonePT(
                                  e.target.value,
                                ),
                              })
                            }
                            disabled={!isEditing}
                            className="mt-2 rounded-2xl"
                            placeholder="+351 912 345 678"
                            inputMode="tel"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className={tokens.layout.sectionSpacing}>
            {/* Settings Section */}
            <section className="space-y-4">
              <h3 className={getHeadingClasses("sectionTitle")}>
                Preferências e Configurações
              </h3>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconBell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold text-foreground">
                      Notificações Push
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Alertas em tempo real
                    </p>
                  </div>
                </div>
                {isPushSupported ? (
                  isPushEnabled ? (
                    <span className="px-3 py-1 text-[10px] font-display font-bold rounded-full uppercase tracking-widest bg-success/10 text-success border border-success/20">
                      Ativo
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleEnablePush}
                      className="rounded-lg h-9 text-xs font-display font-bold uppercase"
                      disabled={pushLoading}
                    >
                      {pushLoading && (
                        <IconLoader2 className="h-3 w-3 animate-spin mr-2" />
                      )}
                      Ativar
                    </Button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
              {pushError && !isPushEnabled && (
                <p className="text-xs text-destructive font-medium">
                  {pushError}
                </p>
              )}

              {/* Theme */}
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconShield className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-display font-bold text-foreground">
                    Tema
                  </p>
                </div>
                <ThemeToggle />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
                <p className="text-sm font-display font-bold text-foreground">
                  Idioma
                </p>
                <LanguageSelector />
              </div>

              {/* Legal Links */}
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all group">
                <p className="text-sm font-display font-bold text-foreground">
                  Legal
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium text-xs font-display font-bold uppercase tracking-widest transition-colors"
                  >
                    Termos
                  </a>
                  <span className="text-border/50">/</span>
                  <a
                    href="/privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium text-xs font-display font-bold uppercase tracking-widest transition-colors"
                  >
                    Privacidade
                  </a>
                </div>
              </div>
            </section>

            {/* Account Actions */}
            <section className="space-y-3 pt-6 border-t border-border/30 mt-8">
              {/* Logout */}
              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl font-display font-bold uppercase text-sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout className="h-4 w-4 mr-2" />
                {t.auth.logout}
              </Button>

              {/* Delete Account */}
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-2xl font-display font-bold uppercase text-sm"
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Apagar conta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-border shadow-elevated rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display font-black uppercase tracking-tighter">
                      Apagar conta?
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Esta ação é irreversível. Todos os seus dados serão
                      apagados permanentemente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={isDeleting}
                      className="rounded-2xl font-display font-bold uppercase"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="rounded-2xl font-display font-bold uppercase"
                    >
                      {isDeleting ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Apagando...
                        </>
                      ) : (
                        <>
                          <IconTrash className="h-4 w-4 mr-2" />
                          Apagar permanentemente
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </section>

            {/* Footer */}
            <div className="text-center pt-8">
              <p className="text-xs text-muted-foreground font-display font-bold uppercase tracking-widest">
                {APP_NAME} v1.0.0
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
