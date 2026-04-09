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
import { AppShell } from "@/components/layout/app-shell";
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
  { id: "MEDICATION", label: "Medicacao" },
  { id: "MOBILITY", label: "Mobilidade" },
  { id: "COMPANIONSHIP", label: "Companhia" },
  { id: "MEAL_PREPARATION", label: "Refeicoes" },
  { id: "LIGHT_HOUSEWORK", label: "Tarefas Domesticas" },
  { id: "TRANSPORTATION", label: "Transporte" },
  { id: "COGNITIVE_SUPPORT", label: "Estimulacao Cognitiva" },
  { id: "NIGHT_CARE", label: "Cuidados Noturnos" },
  { id: "PALLIATIVE_CARE", label: "Cuidados Paliativos" },
  { id: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { id: "NURSING_CARE", label: "Enfermagem" },
];

const DOCUMENT_TYPES = [
  { id: "CC", label: "Cartao de Cidadao", placeholder: "12345678 1 ZZ2", maxLength: 15 },
  { id: "PASSPORT", label: "Passaporte", placeholder: "AA123456", maxLength: 9 },
  { id: "RESIDENCE", label: "Titulo de Residencia", placeholder: "Numero do titulo", maxLength: 20 },
];

function validateNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const digits = nif.split("").map(Number);
  const checkSum = digits.slice(0, 8).reduce((sum, d, i) => sum + d * (9 - i), 0);
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
  if (digits.length <= 6) return `+351 ${digits.slice(0, 3)} ${digits.slice(3)}`;
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
  const { isPushEnabled, subscribeToPush, requestPushPermission, isPushSupported, pushError } = useNotifications();
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
      if (typeof data.profile?.services === 'string') {
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
        hourlyRateEur: data.profile?.hourlyRateEur ? (data.profile.hourlyRateEur / 100) : 15,
        certifications: data.profile?.certifications || "",
        languages: data.profile?.languages || "",
        averageRating: data.profile?.averageRating || 0,
        totalReviews: data.profile?.totalReviews || 0,
        totalContracts: data.profile?.totalContracts || 0,
        elderName: data.profile?.elderName || "",
        elderAge: data.profile?.elderAge || undefined,
        elderNeeds: data.profile?.elderNeeds || "",
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
    if (formData.nif && formData.nif.length === 9 && !validateNIF(formData.nif)) {
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
        const msg = errorData?.error || errorData?.detail || 'Erro ao salvar perfil';
        throw new Error(msg);
      }

      await response.json();
      setSuccess("Guardado com sucesso!");
      setIsEditing(false);
      if (formData.name !== session?.user?.name) await update({ name: formData.name });
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...(prev.services || []), serviceId]
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
        else if (ok) setSuccess("Notificacoes ativadas!");
      }
    } finally {
      setPushLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await apiFetch("/api/user/account", { method: "DELETE" });
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

  const handlePhotoClick = () => { fileInputRef.current?.click(); };

  // Compress image before upload
  const compressImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
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
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                reject(new Error('Could not compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Could not read file'));
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
        throw new Error('Ficheiro muito grande. Máximo 5MB. O ficheiro será comprimido automaticamente.');
      }

      // Compress image
      const compressedFile = await compressImage(file);

      const fd = new FormData();
      fd.append("file", compressedFile);
      fd.append("type", "profile");
      const response = await apiFetch("/api/upload", { method: "POST", body: fd });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao enviar foto");
      }
      const data = await response.json();
      setFormData(prev => ({ ...prev, profileImage: data.url }));
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

  const handleBackgroundCheckUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      // Validate file size (10MB for documents/images)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Ficheiro muito grande. Máximo 10MB');
      }

      // For images, compress them
      let uploadFile = file;
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImage(file, 1200, 1200, 0.75);
      }

      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("type", "background_check");
      const response = await apiFetch("/api/upload", { method: "POST", body: fd });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao enviar documento");
      }
      const data = await response.json();
      await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundCheckUrl: data.url, backgroundCheckStatus: "SUBMITTED" }),
      });
      setFormData(prev => ({ ...prev, backgroundCheckUrl: data.url, backgroundCheckStatus: "SUBMITTED" }));
      setSuccess("Comprovativo enviado!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar documento");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const getBackgroundCheckBadge = () => {
    switch (formData.backgroundCheckStatus) {
      case "VERIFIED":
        return <Badge className="bg-success/10 text-success border-success/20" variant="outline"><IconCheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-warning/10 text-warning border-warning/20" variant="outline"><IconClock className="h-3 w-3 mr-1" />Em analise</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><IconAlertTriangle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline"><IconClock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Profile Header - compact */}
        <div className={`rounded-xl px-4 py-3 text-white flex items-center gap-3 ${isFamily ? 'gradient-primary' : 'gradient-secondary'}`}>
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 ring-2 ring-white/20 cursor-pointer" onClick={handlePhotoClick}>
              {formData.profileImage ? (
                <AvatarImage src={formData.profileImage} alt={formData.name} />
              ) : null}
              <AvatarFallback className="text-sm font-bold bg-white/20 text-white">
                {session?.user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white text-primary flex items-center justify-center shadow-sm"
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? <IconLoader2 className="h-2.5 w-2.5 animate-spin" /> : <IconCamera className="h-2.5 w-2.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{session?.user?.name}</h2>
            {isCaregiver && formData.title && (
              <p className="text-xs opacity-80 truncate">{formData.title}{formData.city ? ` - ${formData.city}` : ""}</p>
            )}
            <p className="text-[10px] opacity-60">{formData.email}</p>
          </div>
          <Button
            size="sm"
            variant={isEditing ? "default" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="bg-white/20 hover:bg-white/30 text-white border-0 h-7 text-[10px] px-2"
          >
            {isSaving ? <IconLoader2 className="h-3 w-3 animate-spin" /> :
             isEditing ? <IconCheck className="h-3 w-3 mr-0.5" /> : <IconEdit className="h-3 w-3 mr-0.5" />}
            {isEditing ? t.save : t.profile.editProfile}
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="rounded-xl border-success/20 bg-success/5">
            <IconCheck className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats for caregiver */}
        {isCaregiver && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: profile?.totalContracts || 0, label: "Contratos", color: "text-primary", bg: "bg-primary/10" },
              { value: profile?.totalReviews || 0, label: "Avaliações", color: "text-secondary", bg: "bg-secondary/10" },
              { value: (profile?.averageRating || 0).toFixed(1), label: "Nota", color: "text-amber-600", bg: "bg-amber-100/20", icon: true },
              { value: `€${(formData.hourlyRateEur || 0).toFixed(2)}`, label: "/hora", color: "text-success", bg: "bg-success/10" },
            ].map((stat, i) => (
              <div key={i} className="bg-surface rounded-xl p-4 border-2 border-border/30 text-center">
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                  {stat.icon && <IconStar className="h-4 w-4 fill-amber-500 text-amber-500" />}
                </div>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="about">
          <TabsList className={`w-full h-8 rounded-lg bg-muted p-0.5 grid ${isCaregiver ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="about" className="rounded-md text-[10px] data-[state=active]:shadow-sm">Info</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-md text-[10px] data-[state=active]:shadow-sm">Docs</TabsTrigger>
            {isCaregiver && <TabsTrigger value="services" className="rounded-md text-[10px] data-[state=active]:shadow-sm">Servicos</TabsTrigger>}
            {isFamily && <TabsTrigger value="elder" className="rounded-md text-[10px] data-[state=active]:shadow-sm">Idoso</TabsTrigger>}
            <TabsTrigger value="contact" className="rounded-md text-[10px] data-[state=active]:shadow-sm">Contato</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-md text-[10px] data-[state=active]:shadow-sm">Config</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="about" className="mt-3 space-y-2">
            <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t.auth.name}</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t.profile.city}</Label>
                  <Input value={formData.city || ""} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" placeholder="Cidade" />
                </div>
              </div>

              {isCaregiver && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Titulo Profissional</Label>
                      <Input value={formData.title || ""} onChange={(e) => setFormData({...formData, title: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" placeholder="Ex: Enfermeira" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Anos de Experiencia</Label>
                      <Input type="number" value={formData.experienceYears || 0} onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value) || 0})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bio / Sobre voce</Label>
                    <Textarea value={formData.bio || ""} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} disabled={!isEditing} className="mt-1 text-sm rounded-xl" placeholder="Descreva sua experiencia..." />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-3 space-y-2">
            <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <IconFileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Documentos Pessoais</span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">NIF</Label>
                <Input
                  value={formData.nif || ""}
                  onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 9); setFormData({...formData, nif: val}); }}
                  disabled={!isEditing}
                  className={`h-8 mt-0.5 text-xs ${formData.nif && formData.nif.length === 9 && !validateNIF(formData.nif) ? "border-error" : ""}`}
                  placeholder="123456789"
                  maxLength={9}
                  inputMode="numeric"
                />
                {formData.nif && formData.nif.length === 9 && !validateNIF(formData.nif) && (
                  <p className="text-xs text-error mt-1">NIF invalido</p>
                )}
                {formData.nif && formData.nif.length === 9 && validateNIF(formData.nif) && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1"><IconCheck className="h-3 w-3" />NIF valido</p>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
                <Select value={formData.documentType || ""} onValueChange={(value) => setFormData({...formData, documentType: value, documentNumber: ""})} disabled={!isEditing}>
                  <SelectTrigger className="h-8 mt-0.5 text-xs"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent className="bg-surface border shadow-soft-md z-50">
                    {DOCUMENT_TYPES.map((doc) => (<SelectItem key={doc.id} value={doc.id}>{doc.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {formData.documentType && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Numero do {DOCUMENT_TYPES.find(d => d.id === formData.documentType)?.label || "Documento"}
                  </Label>
                  <Input
                    value={formData.documentNumber || ""}
                    onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                    disabled={!isEditing}
                    className="h-8 mt-0.5 text-xs"
                    placeholder={DOCUMENT_TYPES.find(d => d.id === formData.documentType)?.placeholder || ""}
                    maxLength={DOCUMENT_TYPES.find(d => d.id === formData.documentType)?.maxLength || 20}
                  />
                </div>
              )}
            </div>

            {/* Background Check - Caregivers only */}
            {isCaregiver && (
              <div className="bg-surface rounded-xl p-3 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconShield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Antecedentes Criminais</span>
                  </div>
                  {getBackgroundCheckBadge()}
                </div>
                <p className="text-xs text-muted-foreground mb-3">Para trabalhar como cuidador, e necessario apresentar o registo criminal.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('backgroundCheckInput')?.click()}
                  disabled={uploadingPhoto}
                  className="w-full rounded-xl"
                >
                  {uploadingPhoto ? <IconLoader2 className="h-4 w-4 animate-spin mr-1.5" /> : <IconUpload className="h-4 w-4 mr-1.5" />}
                  Enviar Comprovativo
                </Button>
                <input id="backgroundCheckInput" type="file" accept="image/*,.pdf" className="hidden" onChange={handleBackgroundCheckUpload} />
                {formData.backgroundCheckUrl && (
                  <p className="text-xs text-success mt-2 flex items-center gap-1"><IconCheck className="h-3 w-3" />Documento enviado</p>
                )}
              </div>
            )}

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
              <div className="flex gap-2">
                <IconAlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-0.5">Seguranca dos dados</p>
                  <p>Seus documentos sao armazenados de forma segura e criptografada.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          {isCaregiver && (
            <TabsContent value="services" className="mt-3 space-y-2">
              <div className="bg-surface rounded-xl p-3 border border-border/30">
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TYPES.map((service) => (
                    <label key={service.id} className={`flex items-center gap-2 p-3 border rounded-xl text-sm cursor-pointer transition-all ${
                      formData.services?.includes(service.id) ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/30"
                    } ${!isEditing ? "pointer-events-none opacity-80" : ""}`}>
                      <Checkbox checked={formData.services?.includes(service.id)} onCheckedChange={() => handleServiceToggle(service.id)} disabled={!isEditing} className="h-4 w-4" />
                      <span className="text-xs">{service.label}</span>
                    </label>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{"\u20AC"}/hora</Label>
                    <div className="relative mt-1">
                      <IconEuro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.hourlyRateEur?.toString() || ""}
                        onChange={(e) => {
                          // Replace comma with period for parsing
                          const normalized = e.target.value.replace(',', '.');
                          const value = parseFloat(normalized) || 0;
                          setFormData({...formData, hourlyRateEur: value});
                        }}
                        className="h-10 pl-8 rounded-xl"
                        disabled={!isEditing}
                        placeholder="15,50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Idiomas</Label>
                    <Input value={formData.languages || ""} onChange={(e) => setFormData({...formData, languages: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" placeholder="PT, EN..." />
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Certificacoes</Label>
                  <Input value={formData.certifications || ""} onChange={(e) => setFormData({...formData, certifications: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" placeholder="Curso de Cuidador..." />
                </div>
              </div>
            </TabsContent>
          )}

          {/* Elder Tab */}
          {isFamily && (
            <TabsContent value="elder" className="mt-4">
              <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome do Idoso</Label>
                    <Input value={formData.elderName || ""} onChange={(e) => setFormData({...formData, elderName: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Idade</Label>
                    <Input type="number" value={formData.elderAge || ""} onChange={(e) => setFormData({...formData, elderAge: parseInt(e.target.value) || 0})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Necessidades Especificas</Label>
                  <Textarea value={formData.elderNeeds || ""} onChange={(e) => setFormData({...formData, elderNeeds: e.target.value})} rows={3} disabled={!isEditing} className="mt-1 text-sm rounded-xl" placeholder="Descreva as necessidades..." />
                </div>
              </div>
            </TabsContent>
          )}

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4">
            <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t.auth.email}</Label>
                <Input type="email" value={formData.email} disabled className="h-8 mt-0.5 text-xs bg-muted" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telemovel</Label>
                <Input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({...formData, phone: formatPhonePT(e.target.value)})}
                  disabled={!isEditing}
                  className="h-8 mt-0.5 text-xs"
                  placeholder="+351 912 345 678"
                  inputMode="tel"
                />
              </div>

              {isFamily && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Contato de Emergencia</Label>
                      <Input value={formData.emergencyContactName || ""} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} disabled={!isEditing} className="h-8 mt-0.5 text-xs" placeholder="Nome" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Telefone</Label>
                      <Input
                        value={formData.emergencyContactPhone || ""}
                        onChange={(e) => setFormData({...formData, emergencyContactPhone: formatPhonePT(e.target.value)})}
                        disabled={!isEditing}
                        className="h-8 mt-0.5 text-xs"
                        placeholder="+351 912 345 678"
                        inputMode="tel"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 space-y-2">
            {/* Push Notifications */}
            <div className="bg-surface rounded-xl p-3 border border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconBell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Notificacoes Push</p>
                    <p className="text-xs text-muted-foreground">Alertas em tempo real</p>
                  </div>
                </div>
                {isPushSupported ? (
                  isPushEnabled ? (
                    <Badge className="bg-success/10 text-success border-success/20" variant="outline">Ativo</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleEnablePush} className="h-8 rounded-lg text-xs" disabled={pushLoading}>
                      {pushLoading && <IconLoader2 className="h-3 w-3 animate-spin mr-1" />}Ativar
                    </Button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
              {pushError && !isPushEnabled && <p className="text-xs text-error mt-2">{pushError}</p>}
            </div>

            {/* Theme */}
            <div className="bg-surface rounded-xl p-3 border border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <IconShield className="h-4 w-4 text-secondary" />
                </div>
                <span className="text-sm font-medium">Tema</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Language */}
            <div className="bg-surface rounded-xl p-3 border border-border/30 flex items-center justify-between">
              <span className="text-sm font-medium">Idioma</span>
              <LanguageSelector />
            </div>

            {/* Terms */}
            <div className="bg-surface rounded-xl p-3 border border-border/30 flex items-center justify-between">
              <span className="text-sm">Termos / Privacidade</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" asChild className="h-7 text-xs px-2"><a href="/termos" target="_blank">Termos</a></Button>
                <Button size="sm" variant="ghost" asChild className="h-7 text-xs px-2"><a href="/privacidade" target="_blank">Privacidade</a></Button>
              </div>
            </div>

            <Separator />

            {/* Logout */}
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => signOut({ callbackUrl: "/" })}>
              <IconLogout className="h-4 w-4 mr-2" />
              {t.auth.logout}
            </Button>

            {/* Delete Account */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full h-10 text-error hover:text-error hover:bg-error/5 rounded-xl">
                  <IconTrash className="h-4 w-4 mr-2" />
                  Apagar conta
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border shadow-soft-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Apagar conta?</DialogTitle>
                  <DialogDescription>Esta acao e irreversivel. Todos os seus dados serao excluidos.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting} className="rounded-xl">Cancelar</Button>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="rounded-xl">
                    {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
                    Apagar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <p className="text-center text-xs text-muted-foreground pt-2">{APP_NAME} v1.0.0</p>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
