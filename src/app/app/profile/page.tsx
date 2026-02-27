"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { AppShell } from "@/components/layout/app-shell";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCamera,
  IconEdit,
  IconCheck,
  IconStar,
  IconClock,
  IconBriefcase,
  IconFamily,
  IconCaregiver,
  IconLoader2,
  IconAlertCircle,
  IconEuro,
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

// Service types for caregivers
const SERVICE_TYPES = [
  { id: "PERSONAL_CARE", label: "Cuidados Pessoais" },
  { id: "MEDICATION", label: "Administração de Medicação" },
  { id: "MOBILITY", label: "Mobilidade" },
  { id: "COMPANIONSHIP", label: "Companhia" },
  { id: "MEAL_PREPARATION", label: "Preparo de Refeições" },
  { id: "LIGHT_HOUSEWORK", label: "Tarefas Domésticas" },
  { id: "TRANSPORTATION", label: "Transporte" },
  { id: "COGNITIVE_SUPPORT", label: "Estimulação Cognitiva" },
  { id: "NIGHT_CARE", label: "Cuidados Noturnos" },
  { id: "PALLIATIVE_CARE", label: "Cuidados Paliativos" },
  { id: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { id: "NURSING_CARE", label: "Enfermagem" },
];

interface ProfileData {
  // User fields
  name: string;
  email: string;
  phone: string;
  // Caregiver fields
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
  // Family fields
  elderName?: string;
  elderAge?: number;
  elderNeeds?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
  });

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  // Fetch profile data
  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/user/profile");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar perfil");
      }
      
      const data = await response.json();
      
      setProfile(data.profile);
      setFormData({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        // Caregiver fields
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
        // Family fields
        elderName: data.profile?.elderName || "",
        elderAge: data.profile?.elderAge || undefined,
        emergencyContact: data.profile?.emergencyContact || "",
        emergencyPhone: data.profile?.emergencyPhone || "",
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
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar perfil");
      }
      
      setSuccess("Perfil atualizado com sucesso!");
      setIsEditing(false);
      
      // Update session name if changed
      if (formData.name !== session?.user?.name) {
        await update({ name: formData.name });
      }
      
      // Refresh profile data
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
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

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-24 rounded-full -mt-12 ml-6" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header with Cover */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary to-primary/60 rounded-xl" />
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {session?.user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="icon" 
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <IconCamera className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <Button 
              variant={isEditing ? "default" : "outline"}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.loading}
                </>
              ) : isEditing ? (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  {t.save}
                </>
              ) : (
                <>
                  <IconEdit className="h-4 w-4 mr-2" />
                  {t.profile.editProfile}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-500/20 bg-green-500/5">
            <IconCheck className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Info */}
        <div className="pt-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
            <Badge className={isFamily ? "bg-blue-500" : "bg-green-500"}>
              {isFamily ? (
                <><IconFamily className="h-3 w-3 mr-1" /> {t.auth.family}</>
              ) : (
                <><IconCaregiver className="h-3 w-3 mr-1" /> {t.auth.caregiver}</>
              )}
            </Badge>
            {session?.user?.status === "ACTIVE" && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                {t.profile.verified}
              </Badge>
            )}
          </div>
          {isCaregiver && formData.title && (
            <p className="text-muted-foreground mb-4">
              {formData.title} {formData.city ? `• ${formData.city}` : ""}
            </p>
          )}
        </div>

        {/* Tabs - Fixed grid based on role */}
        <Tabs defaultValue="about" className="w-full">
          {isCaregiver ? (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">{t.profile.about}</TabsTrigger>
              <TabsTrigger value="services">{t.profile.services}</TabsTrigger>
              <TabsTrigger value="contact">{t.profile.contactInfo}</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">{t.profile.about}</TabsTrigger>
              <TabsTrigger value="elder">{t.profile.elderInfo || "Idoso"}</TabsTrigger>
              <TabsTrigger value="contact">{t.profile.contactInfo}</TabsTrigger>
            </TabsList>
          )}

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6 mt-6">
            {isFamily ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.about}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.auth.name}</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t.profile.city}</Label>
                      <Input 
                        id="city" 
                        value={formData.city || ""}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Lisboa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.auth.phone}</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        placeholder="+351 912 345 678"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t.profile.about}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.auth.name}</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">{t.profile.titleLabel || "Título Profissional"}</Label>
                        <Input 
                          id="title" 
                          value={formData.title || ""}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          disabled={!isEditing}
                          placeholder="Enfermeira, Cuidadora..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experienceYears">{t.profile.experience || "Anos de Experiência"}</Label>
                        <Input 
                          id="experienceYears" 
                          type="number"
                          value={formData.experienceYears || 0}
                          onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value) || 0})}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">{t.profile.city}</Label>
                      <Input 
                        id="city" 
                        value={formData.city || ""}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Lisboa, Porto..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">{t.profile.bio || "Sobre você"}</Label>
                      <Textarea 
                        id="bio" 
                        value={formData.bio || ""}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        rows={4}
                        disabled={!isEditing}
                        placeholder="Conte sobre sua experiência e especializações..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card - Read Only */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base">{t.dashboard.recentActivity}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">{profile?.totalContracts || 0}</p>
                        <p className="text-sm text-muted-foreground">{t.contracts.title}</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">{profile?.totalReviews || 0}</p>
                        <p className="text-sm text-muted-foreground">{t.dashboard.reviews}</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                          <IconStar className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          {(profile?.averageRating || 0).toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">{t.dashboard.rating}</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">€{formData.hourlyRateEur || 0}</p>
                        <p className="text-sm text-muted-foreground">por hora</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Services Tab (Caregiver only) */}
          {isCaregiver && (
            <TabsContent value="services" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.services}</CardTitle>
                  <CardDescription>Selecione os serviços que você oferece</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SERVICE_TYPES.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.services?.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        } ${!isEditing ? "pointer-events-none opacity-80" : ""}`}
                      >
                        <Checkbox
                          checked={formData.services?.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                          disabled={!isEditing}
                        />
                        <span className="text-sm">{service.label}</span>
                      </label>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">{t.profile.hourlyRate || "Valor por Hora (€)"}</Label>
                    <div className="relative">
                      <IconEuro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="hourlyRate" 
                        type="number"
                        step="0.50"
                        value={formData.hourlyRateEur || ""}
                        onChange={(e) => setFormData({...formData, hourlyRateEur: parseFloat(e.target.value) || 0})}
                        className="pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certifications">Certificações</Label>
                      <Input 
                        id="certifications" 
                        value={formData.certifications || ""}
                        onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Curso de Cuidador..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="languages">Idiomas</Label>
                      <Input 
                        id="languages" 
                        value={formData.languages || ""}
                        onChange={(e) => setFormData({...formData, languages: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Português, Inglês..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Elder Tab (Family only) */}
          {isFamily && (
            <TabsContent value="elder" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.elderInfo || "Informações do Idoso"}</CardTitle>
                  <CardDescription>
                    Informações sobre a pessoa que receberá os cuidados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="elderName">Nome do Idoso</Label>
                      <Input 
                        id="elderName" 
                        value={formData.elderName || ""}
                        onChange={(e) => setFormData({...formData, elderName: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elderAge">Idade</Label>
                      <Input 
                        id="elderAge" 
                        type="number"
                        value={formData.elderAge || ""}
                        onChange={(e) => setFormData({...formData, elderAge: parseInt(e.target.value) || 0})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elderNeeds">Necessidades Especiais</Label>
                    <Textarea 
                      id="elderNeeds" 
                      value={formData.elderNeeds || ""}
                      onChange={(e) => setFormData({...formData, elderNeeds: e.target.value})}
                      rows={3}
                      disabled={!isEditing}
                      placeholder="Descreva as necessidades de cuidado..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.profile.contactInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email}
                      className="pl-10"
                      disabled={true} // Email cannot be changed
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.auth.phone}</Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10"
                      disabled={!isEditing}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">{t.profile.emergency || "Contato de Emergência"}</Label>
                    <Input 
                      id="emergencyContact" 
                      value={formData.emergencyContact || ""}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                    <Input 
                      id="emergencyPhone" 
                      value={formData.emergencyPhone || ""}
                      onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                      disabled={!isEditing}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/app/settings">
                  {t.settings.title}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/wallet">
                  {t.wallet.title}
                </Link>
              </Button>
              {isCaregiver && (
                <Button variant="outline" asChild>
                  <Link href="/app/proposals">
                    Propostas
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
