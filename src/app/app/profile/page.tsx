"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
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
  { id: "CC", label: "Cartão de Cidadão" },
  { id: "PASSPORT", label: "Passaporte" },
  { id: "NIF", label: "NIF" },
  { id: "RESIDENCE", label: "Título de Residência" },
];

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
  emergencyContact?: string;
  emergencyPhone?: string;
  backgroundCheckStatus?: string;
  backgroundCheckUrl?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
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
  });

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Erro ao carregar perfil: " + errorText);
      }

      const data = await response.json();
      
      setProfile(data.profile);
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
        services: Array.isArray(data.profile?.services) ? data.profile.services : [],
        hourlyRateEur: data.profile?.hourlyRateEur ? data.profile.hourlyRateEur / 100 : 15,
        certifications: data.profile?.certifications || "",
        languages: data.profile?.languages || "",
        averageRating: data.profile?.averageRating || 0,
        totalReviews: data.profile?.totalReviews || 0,
        totalContracts: data.profile?.totalContracts || 0,
        elderName: data.profile?.elderName || "",
        elderAge: data.profile?.elderAge || undefined,
        elderNeeds: data.profile?.elderNeeds || "",
        emergencyContact: data.profile?.emergencyContact || "",
        emergencyPhone: data.profile?.emergencyPhone || "",
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
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Erro ao salvar: " + errorText);
      }

      await response.json();

      setSuccess("Salvo!");
      setIsEditing(false);
      if (formData.name !== session?.user?.name) await update({ name: formData.name });
      fetchProfile();
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
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
        const success = await subscribeToPush();
        if (!success && pushError) {
          setError(pushError);
        } else if (success) {
          setSuccess("Notificações ativadas!");
        }
      }
    } finally {
      setPushLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/account", { method: "DELETE" });
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao enviar foto");
      
      const data = await response.json();
      setFormData(prev => ({ ...prev, profileImage: data.url }));
      
      // Save immediately
      await fetch("/api/user/profile", {
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
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "background_check");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Erro ao enviar documento");
      
      const data = await response.json();
      
      // Update background check status
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          backgroundCheckUrl: data.url,
          backgroundCheckStatus: "SUBMITTED"
        }),
      });
      
      setFormData(prev => ({ 
        ...prev, 
        backgroundCheckUrl: data.url,
        backgroundCheckStatus: "SUBMITTED"
      }));
      
      setSuccess("Comprovante enviado! Aguarde verificação.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar documento");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </AppShell>
    );
  }

  const getBackgroundCheckBadge = () => {
    switch (formData.backgroundCheckStatus) {
      case "VERIFIED":
        return <Badge className="bg-green-500"><IconCheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-yellow-500"><IconClock className="h-3 w-3 mr-1" />Em análise</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><IconAlertTriangle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline"><IconClock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Botão de editar/salvar no topo direito - mostrado apenas no header do AppShell */}
        <div className="flex justify-end px-4 py-2">
          <Button 
            size="sm"
            variant={isEditing ? "default" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
          >
            {isSaving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 
             isEditing ? <IconCheck className="h-4 w-4 mr-1" /> : <IconEdit className="h-4 w-4 mr-1" />}
            {isEditing ? t.save : t.profile.editProfile}
          </Button>
        </div>

        {error && <Alert variant="destructive" className="mx-4"><IconAlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mx-4 border-green-500/20 bg-green-500/5"><IconCheck className="h-4 w-4 text-green-500" /><AlertDescription className="text-green-600">{success}</AlertDescription></Alert>}

        {/* Perfil com foto */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-16 w-16 cursor-pointer" onClick={handlePhotoClick}>
              {formData.profileImage ? (
                <AvatarImage src={formData.profileImage} alt={formData.name} />
              ) : null}
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {session?.user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <button 
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <IconLoader2 className="h-3 w-3 animate-spin" />
              ) : (
                <IconCamera className="h-3 w-3" />
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg">{session?.user?.name}</span>
              <Badge variant="outline" className={isFamily ? "text-blue-600 border-blue-600" : "text-green-600 border-green-600"}>
                {isFamily ? <IconFamily className="h-3 w-3 mr-1" /> : <IconCaregiver className="h-3 w-3 mr-1" />}
                {isFamily ? t.auth.family : t.auth.caregiver}
              </Badge>
            </div>
            {isCaregiver && formData.title && (
              <p className="text-sm text-muted-foreground">{formData.title} {formData.city ? `• ${formData.city}` : ""}</p>
            )}
            <p className="text-xs text-muted-foreground">{formData.email}</p>
          </div>
        </div>

        {/* Stats para caregiver */}
        {isCaregiver && (
          <div className="px-4 grid grid-cols-4 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">{profile?.totalContracts || 0}</p>
              <p className="text-[10px] text-muted-foreground">Contratos</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">{profile?.totalReviews || 0}</p>
              <p className="text-[10px] text-muted-foreground">Avaliações</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary flex items-center justify-center gap-0.5">
                <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {(profile?.averageRating || 0).toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">Nota</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">€{formData.hourlyRateEur || 0}</p>
              <p className="text-[10px] text-muted-foreground">/hora</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="about" className="px-4">
          <TabsList className={`grid w-full h-9 ${isCaregiver ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="about" className="text-xs py-1.5">Info</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs py-1.5">Docs</TabsTrigger>
            {isCaregiver && <TabsTrigger value="services" className="text-xs py-1.5">Serviços</TabsTrigger>}
            {isFamily && <TabsTrigger value="elder" className="text-xs py-1.5">Idoso</TabsTrigger>}
            <TabsTrigger value="contact" className="text-xs py-1.5">Contato</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs py-1.5">Config</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="about" className="mt-3 space-y-2">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">{t.auth.name}</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t.profile.city}</Label>
                  <Input value={formData.city || ""} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="Cidade" />
                </div>
              </div>
              
              {isCaregiver && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Título Profissional</Label>
                      <Input value={formData.title || ""} onChange={(e) => setFormData({...formData, title: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="Ex: Enfermeira" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Anos de Experiência</Label>
                      <Input type="number" value={formData.experienceYears || 0} onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value) || 0})} disabled={!isEditing} className="h-9 mt-0.5" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bio / Sobre você</Label>
                    <Textarea value={formData.bio || ""} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={2} disabled={!isEditing} className="mt-0.5 text-sm" placeholder="Descreva sua experiência e especialidades..." />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-3 space-y-2">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <IconFileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Documentos Pessoais</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">NIF (Número de Identificação Fiscal)</Label>
                  <Input 
                    value={formData.nif || ""} 
                    onChange={(e) => setFormData({...formData, nif: e.target.value})} 
                    disabled={!isEditing} 
                    className="h-9 mt-0.5" 
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
                    <Select 
                      value={formData.documentType || ""} 
                      onValueChange={(value) => setFormData({...formData, documentType: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="h-9 mt-0.5">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg">
                        {DOCUMENT_TYPES.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>{doc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Número do Documento</Label>
                    <Input 
                      value={formData.documentNumber || ""} 
                      onChange={(e) => setFormData({...formData, documentNumber: e.target.value})} 
                      disabled={!isEditing} 
                      className="h-9 mt-0.5" 
                      placeholder="000000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Antecedentes Criminais - Apenas Cuidadores */}
            {isCaregiver && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconShield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Antecedentes Criminais</span>
                  </div>
                  {getBackgroundCheckBadge()}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  Para trabalhar como cuidador, é necessário apresentar comprovante de antecedentes criminais.
                  Você pode obter online em justica.gov.pt
                </p>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('backgroundCheckInput')?.click()}
                    disabled={uploadingPhoto}
                    className="flex-1"
                  >
                    {uploadingPhoto ? (
                      <IconLoader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <IconUpload className="h-4 w-4 mr-1" />
                    )}
                    Enviar Comprovante
                  </Button>
                  <input
                    id="backgroundCheckInput"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleBackgroundCheckUpload}
                  />
                </div>
                
                {formData.backgroundCheckUrl && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <IconCheck className="h-3 w-3" />
                    Documento enviado
                  </p>
                )}
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex gap-2">
                <IconAlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-700 dark:text-yellow-400">
                  <p className="font-medium mb-1">Segurança dos dados</p>
                  <p className="text-yellow-600/80 dark:text-yellow-400/80">
                    Seus documentos são armazenados de forma segura e criptografada.
                    Apenas a equipe de verificação tem acesso.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          {isCaregiver && (
            <TabsContent value="services" className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {SERVICE_TYPES.map((service) => (
                  <label key={service.id} className={`flex items-center gap-2 p-2 border rounded-md text-xs cursor-pointer transition-all ${formData.services?.includes(service.id) ? "border-primary bg-primary/5" : "hover:border-primary/50"} ${!isEditing ? "pointer-events-none opacity-80" : ""}`}>
                    <Checkbox checked={formData.services?.includes(service.id)} onCheckedChange={() => handleServiceToggle(service.id)} disabled={!isEditing} className="h-4 w-4" />
                    <span>{service.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">€/hora</Label>
                  <div className="relative mt-0.5">
                    <IconEuro className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="number" step="0.50" value={formData.hourlyRateEur || ""} onChange={(e) => setFormData({...formData, hourlyRateEur: parseFloat(e.target.value) || 0})} className="h-9 pl-8" disabled={!isEditing} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Idiomas</Label>
                  <Input value={formData.languages || ""} onChange={(e) => setFormData({...formData, languages: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="PT, EN..." />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Certificações e Cursos</Label>
                <Input value={formData.certifications || ""} onChange={(e) => setFormData({...formData, certifications: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="Ex: Curso de Cuidador, Primeiros Socorros..." />
              </div>
            </TabsContent>
          )}

          {/* Elder Tab */}
          {isFamily && (
            <TabsContent value="elder" className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome do Idoso</Label>
                  <Input value={formData.elderName || ""} onChange={(e) => setFormData({...formData, elderName: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Idade</Label>
                  <Input type="number" value={formData.elderAge || ""} onChange={(e) => setFormData({...formData, elderAge: parseInt(e.target.value) || 0})} disabled={!isEditing} className="h-9 mt-0.5" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Necessidades Específicas</Label>
                <Textarea value={formData.elderNeeds || ""} onChange={(e) => setFormData({...formData, elderNeeds: e.target.value})} rows={3} disabled={!isEditing} className="mt-0.5 text-sm" placeholder="Descreva as necessidades de cuidados, medicamentos, mobilidade..." />
              </div>
            </TabsContent>
          )}

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-3 space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">{t.auth.email}</Label>
              <Input type="email" value={formData.email} disabled className="h-9 mt-0.5 bg-muted" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.auth.phone}</Label>
              <Input type="tel" value={formData.phone || ""} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="+351 912 345 678" />
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Contato de Emergência</Label>
                <Input value={formData.emergencyContact || ""} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="Nome" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input value={formData.emergencyPhone || ""} onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})} disabled={!isEditing} className="h-9 mt-0.5" placeholder="+351..." />
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-3 space-y-1">
            {/* Notificações */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconBell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Notificações Push</p>
                    <p className="text-[10px] text-muted-foreground">Alertas em tempo real</p>
                  </div>
                </div>
                {isPushSupported ? (
                  isPushEnabled ? (
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Ativo</Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleEnablePush} 
                      className="h-7 text-xs"
                      disabled={pushLoading}
                    >
                      {pushLoading ? (
                        <IconLoader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Ativar
                    </Button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
              {pushError && !isPushEnabled && (
                <p className="text-[10px] text-red-500 mt-2">{pushError}</p>
              )}
            </div>

            {/* Tema */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <IconShield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tema</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Idioma */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Idioma</span>
              <LanguageSelector />
            </div>

            {/* Termos */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Termos / Privacidade</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" asChild className="h-7 text-xs px-2"><a href="/termos" target="_blank">Termos</a></Button>
                <Button size="sm" variant="ghost" asChild className="h-7 text-xs px-2"><a href="/privacidade" target="_blank">Privacidade</a></Button>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Logout */}
            <Button variant="outline" className="w-full h-10" onClick={() => signOut({ callbackUrl: "/" })}>
              <IconLogout className="h-4 w-4 mr-2" />
              {t.auth.logout}
            </Button>

            {/* Delete Account */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                  <IconTrash className="h-4 w-4 mr-2" />
                  Apagar conta
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border shadow-lg">
                <DialogHeader>
                  <DialogTitle>Apagar conta?</DialogTitle>
                  <DialogDescription>Esta ação é irreversível. Todos os seus dados serão excluídos.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
                    Apagar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <p className="text-center text-[10px] text-muted-foreground pt-2">{APP_NAME} v1.0.0</p>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
