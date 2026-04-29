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
import {
  tokens,
  cn,
  getCardClasses,
  getHeadingClasses,
  getAlertClasses,
  getLabelClasses,
  getAvatarClasses,
  getAvatarEditButtonClasses,
  getFormInputClasses,
  getIconButtonClasses,
  getBadgeClasses,
} from "@/lib/design-tokens";
import { SERVICE_TYPES, DOCUMENT_TYPES } from "@/lib/profile-constants";
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
import { ProfileHeader } from "./components/shared/ProfileHeader";
import { CaregiverStats } from "./components/caregiver/CaregiverStats";
import { AboutTab } from "./components/shared/AboutTab";
import { DocumentsTab } from "./components/shared/DocumentsTab";
import { ServicesTab } from "./components/caregiver/ServicesTab";
import { ElderTab } from "./components/family/ElderTab";
import { ContactTab } from "./components/shared/ContactTab";
import { SettingsTab } from "./components/shared/SettingsTab";
import { parseElderNeeds, validateNIF, formatPhonePT } from "./utils";

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
            className={getBadgeClasses("success")}
            variant="outline"
          >
            <IconCheckCircle className="h-3 w-3 mr-1" />
            Verificado
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge
            className={getBadgeClasses("warning")}
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
        {/* Profile Header with Alerts */}
        <ProfileHeader
          isLoading={isLoading}
          isEditing={isEditing}
          isSaving={isSaving}
          error={error}
          success={success}
          profile={profile}
          formData={formData}
          session={session}
          uploadingPhoto={uploadingPhoto}
          fileInputRef={fileInputRef}
          isCaregiver={isCaregiver}
          onEditToggle={() => (isEditing ? handleSave() : setIsEditing(true))}
          onPhotoClick={handlePhotoClick}
          onPhotoChange={handlePhotoChange}
        />

        {/* Stats for caregiver */}
        {isCaregiver && (
          <CaregiverStats profile={profile} formData={formData} />
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

          {/* About Tab */}
          <AboutTab
            isEditing={isEditing}
            isCaregiver={isCaregiver}
            formData={formData}
            setFormData={setFormData}
          />

          {/* Documents Tab */}
          <DocumentsTab
            isEditing={isEditing}
            isCaregiver={isCaregiver}
            uploadingPhoto={uploadingPhoto}
            formData={formData}
            setFormData={setFormData}
            onBackgroundCheckUpload={handleBackgroundCheckUpload}
            getBackgroundCheckBadge={getBackgroundCheckBadge}
          />

          {/* Services Tab */}
          {isCaregiver && (
            <ServicesTab
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
              onServiceToggle={handleServiceToggle}
            />
          )}

          {/* Elder Tab */}
          {isFamily && (
            <ElderTab
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {/* Contact Tab */}
          <ContactTab
            isEditing={isEditing}
            isFamily={isFamily}
            formData={formData}
            setFormData={setFormData}
          />

          {/* Settings Tab */}
          <SettingsTab
            deleteDialogOpen={deleteDialogOpen}
            setDeleteDialogOpen={setDeleteDialogOpen}
            pushLoading={pushLoading}
            pushError={pushError}
            isPushSupported={isPushSupported}
            isPushEnabled={isPushEnabled}
            isDeleting={isDeleting}
            handleEnablePush={handleEnablePush}
            handleDeleteAccount={handleDeleteAccount}
          />
        </Tabs>
      </div>
  );
}
