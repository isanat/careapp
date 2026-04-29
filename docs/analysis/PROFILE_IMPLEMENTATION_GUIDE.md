# Profile Pages Implementation Guide
## Code Structure & Component Architecture

---

## Current vs Target Structure

### Current File Structure
```
src/app/app/profile/
├── page.tsx (1544 lines - monolithic)
└── setup/
    └── page.tsx
```

### Target File Structure
```
src/app/app/profile/
├── page.tsx (Router component)
├── layout.tsx (Optional: Shared layout)
├── components/
│   ├── profile-header.tsx
│   ├── caregiver-profile-form.tsx
│   ├── family-profile-form.tsx
│   ├── metrics-block.tsx
│   ├── services-tab.tsx
│   ├── health-profile-tab.tsx
│   ├── documents-tab.tsx
│   ├── contact-tab.tsx
│   └── settings-tab.tsx
└── setup/
    ├── page.tsx
    ├── layout.tsx
    └── components/
        ├── caregiver-setup-form.tsx
        └── family-setup-form.tsx
```

---

## Component Architecture

### 1. ProfilePage (Main Router)

**File:** `src/app/app/profile/page.tsx`

**Purpose:** Route selection and session management

```tsx
"use client";

import { useSession } from "next-auth/react";
import CaregiverProfilePage from "./components/caregiver-profile-page";
import FamilyProfilePage from "./components/family-profile-page";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <ProfileSkeleton />;
  if (status === "unauthenticated") return <RedirectToLogin />;
  
  const isCaregiver = session?.user?.role === "CAREGIVER";
  
  return isCaregiver ? (
    <CaregiverProfilePage />
  ) : (
    <FamilyProfilePage />
  );
}
```

---

### 2. CaregiverProfilePage Component

**File:** `src/app/app/profile/components/caregiver-profile-page.tsx`

**Structure:**
```tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "./profile-header";
import { MetricsBlock } from "./metrics-block";
import { useProfile } from "@/hooks/useProfile";

const CAREGIVER_TABS = [
  { value: "info", label: "INFO" },
  { value: "docs", label: "DOCS" },
  { value: "services", label: "SERVIÇOS" },
  { value: "contact", label: "CONTACTO" },
  { value: "config", label: "CONFIG" }
];

export default function CaregiverProfilePage() {
  const { profile, isLoading, isSaving, updateProfile } = useProfile("CAREGIVER");
  const [activeTab, setActiveTab] = useState("info");
  
  return (
    <div className="space-y-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter">
          Meu Perfil Profissional
        </h1>
        <p className="text-base text-muted-foreground font-medium">
          Gerencie suas informações profissionais e preferências
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader 
        role="CAREGIVER"
        profile={profile}
        onUpdate={updateProfile}
      />

      {/* Metrics Block */}
      {profile && <MetricsBlock role="CAREGIVER" profile={profile} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full h-11 rounded-2xl bg-secondary/50 p-1 gap-1">
          {CAREGIVER_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="info">
          <CaregiverInfoTab profile={profile} onUpdate={updateProfile} />
        </TabsContent>
        <TabsContent value="docs">
          <DocumentsTab role="CAREGIVER" profile={profile} onUpdate={updateProfile} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab profile={profile} onUpdate={updateProfile} />
        </TabsContent>
        <TabsContent value="contact">
          <ContactTab profile={profile} onUpdate={updateProfile} />
        </TabsContent>
        <TabsContent value="config">
          <SettingsTab role="CAREGIVER" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### 3. ProfileHeader Component

**File:** `src/app/app/profile/components/profile-header.tsx`

**Props:**
```tsx
interface ProfileHeaderProps {
  role: "CAREGIVER" | "FAMILY";
  profile: CaregiverProfileData | FamilyProfileData;
  onUpdate: (updates: Partial<ProfileData>) => Promise<void>;
}
```

**Structure:**
```tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconCamera, IconEdit, IconCheck } from "@/components/icons";

export function ProfileHeader({ role, profile, onUpdate }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const isCareGiver = role === "CAREGIVER";
  const isVerified = isCareGiver && profile.backgroundCheckStatus === "VERIFIED";
  
  return (
    <section className="space-y-4">
      <div className="relative">
        {/* Hero/Cover Section */}
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl" />
        
        {/* Avatar with Upload */}
        <div className="relative -mt-16 pl-6 flex items-end gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-card">
              <AvatarImage src={profile?.profileImage} alt={profile?.name} />
              <AvatarFallback>
                {profile?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera Icon Overlay */}
            <button
              onClick={() => setDialogOpen(true)}
              className="absolute bottom-0 right-0 bg-primary p-2 rounded-lg hover:bg-primary/90"
            >
              <IconCamera className="h-4 w-4 text-white" />
            </button>
          </div>
          
          {/* Header Info */}
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-display font-black">
                {profile?.name}
              </h1>
              {isVerified && (
                <Badge className="bg-success/10 text-success">
                  <IconCheck className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isCareGiver 
                ? `${profile?.title} • ${profile?.city}`
                : `Gestor Familiar • ${profile?.city}`
              }
            </p>
          </div>
          
          {/* Edit Button */}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-xl gap-2"
          >
            {isEditing ? (
              <>
                <IconCheck className="h-4 w-4" />
                Salvar
              </>
            ) : (
              <>
                <IconEdit className="h-4 w-4" />
                Editar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <ProfileImageUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpload={handleImageUpload}
        uploading={uploading}
      />
    </section>
  );
}

// Helper component
function ProfileImageUploadDialog({ open, onOpenChange, onUpload, uploading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Foto do Perfil</DialogTitle>
          <DialogDescription>
            Carregue uma imagem em formato JPG, PNG ou WebP.
            Tamanho máximo: 5MB.
          </DialogDescription>
        </DialogHeader>
        {/* Upload form */}
      </DialogContent>
    </Dialog>
  );
}
```

---

### 4. MetricsBlock Component

**File:** `src/app/app/profile/components/metrics-block.tsx`

**Structure:**
```tsx
import { cn } from "@/lib/utils";
import { tokens } from "@/lib/design-tokens";
import {
  IconHome,
  IconStar,
  IconEuro,
  IconCheckCircle,
  IconUsers,
  IconTrendingUp,
  IconBarChart,
} from "@/components/icons";

interface MetricsBlockProps {
  role: "CAREGIVER" | "FAMILY";
  profile: CaregiverProfileData | FamilyProfileData;
}

export function MetricsBlock({ role, profile }: MetricsBlockProps) {
  if (role === "FAMILY") {
    // Family metrics: Active Demands, Members, Budget, Success Rate
    const metrics = [
      {
        value: profile.activeDemands || 0,
        label: "Demandas Ativas",
        icon: IconCheckCircle,
        colorClass: "text-success",
      },
      {
        value: profile.dependents?.length || 0,
        label: "Membros Família",
        icon: IconUsers,
        colorClass: "text-primary",
      },
      {
        value: `€${(profile.totalSpent || 0).toFixed(0)}`,
        label: "Investimento",
        icon: IconEuro,
        colorClass: "text-secondary",
      },
      {
        value: `${(profile.successRate || 0).toFixed(0)}%`,
        label: "Taxa Sucesso",
        icon: IconTrendingUp,
        colorClass: "text-accent",
      },
    ];
    
    return (
      <div className={cn(tokens.layout.grid.responsive4)}>
        {metrics.map((metric, i) => (
          <MetricCard key={i} {...metric} />
        ))}
      </div>
    );
  }

  // Caregiver metrics: Contracts, Reviews, Rating, Hourly Rate
  const metrics = [
    {
      value: profile.totalContracts || 0,
      label: "Contratos",
      icon: IconHome,
      colorClass: "text-primary",
    },
    {
      value: profile.totalReviews || 0,
      label: "Avaliações",
      icon: IconStar,
      colorClass: "text-accent",
    },
    {
      value: (profile.averageRating || 0).toFixed(1),
      label: "Nota",
      icon: IconStar,
      colorClass: "text-secondary",
    },
    {
      value: `€${(profile.hourlyRateEur || 0).toFixed(2)}/h`,
      label: "Taxa/Hora",
      icon: IconEuro,
      colorClass: "text-primary",
    },
  ];

  return (
    <div className={cn(tokens.layout.grid.responsive4)}>
      {metrics.map((metric, i) => (
        <MetricCard key={i} {...metric} />
      ))}
    </div>
  );
}

// Reusable metric card
function MetricCard({ value, label, icon: Icon, colorClass }) {
  return (
    <div className="bg-card rounded-2xl p-5 sm:p-7 space-y-4 border border-border/50 shadow-card">
      <div className={cn("w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center", colorClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </div>
        <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
          {value}
        </div>
      </div>
    </div>
  );
}
```

---

### 5. Tab Components

#### CaregiverInfoTab

**File:** `src/app/app/profile/components/caregiver-info-tab.tsx`

```tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CaregiverInfoTabProps {
  profile: CaregiverProfileData;
  onUpdate: (updates: Partial<CaregiverProfileData>) => Promise<void>;
}

export function CaregiverInfoTab({ profile, onUpdate }: CaregiverInfoTabProps) {
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      // Show success toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold uppercase">
          Informações Pessoais
        </h3>
        
        <div className="bg-card rounded-2xl p-5 sm:p-7 space-y-4 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Nome Completo
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* City */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Cidade
              </Label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* Professional Title */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Título Profissional *
              </Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="ex: Enfermeira Especializada"
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* Experience Years */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Anos de Experiência *
              </Label>
              <Input
                type="number"
                value={formData.experienceYears}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceYears: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2 rounded-2xl"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Bio Profissional
            </Label>
            <Textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={4}
              placeholder="Descreva sua experiência e abordagem profissional..."
              className="mt-2 rounded-2xl"
            />
          </div>

          {/* Languages */}
          <div>
            <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Idiomas
            </Label>
            <div className="mt-2 space-y-2">
              {LANGUAGES.map(lang => (
                <label key={lang} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.languages.includes(lang)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          languages: [...formData.languages, lang],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          languages: formData.languages.filter(l => l !== lang),
                        });
                      }
                    }}
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-2xl"
      >
        {isSaving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </section>
  );
}

const LANGUAGES = ["Português", "English", "Español", "Français", "Italiano"];
```

#### FamilyFamiliarTab

**File:** `src/app/app/profile/components/family-familiar-tab.tsx`

```tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface FamilyFamiliarTabProps {
  profile: FamilyProfileData;
  onUpdate: (updates: Partial<FamilyProfileData>) => Promise<void>;
}

export function FamilyFamiliarTab({ profile, onUpdate }: FamilyFamiliarTabProps) {
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  const primaryDependent = formData.dependents?.[0];
  const primaryHealth = formData.primaryDependentNeeds;

  return (
    <section className="space-y-6">
      {/* Dependent Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold uppercase">
          Informações do Familiar
        </h3>
        
        <div className="bg-card rounded-2xl p-5 sm:p-7 space-y-4 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dependent Name */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Nome do Familiar *
              </Label>
              <Input
                value={primaryDependent?.name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dependents: formData.dependents.map((d, i) =>
                      i === 0 ? { ...d, name: e.target.value } : d
                    ),
                  })
                }
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* Dependent Age */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Idade *
              </Label>
              <Input
                type="number"
                value={primaryDependent?.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dependents: formData.dependents.map((d, i) =>
                      i === 0
                        ? { ...d, age: parseInt(e.target.value) || 0 }
                        : d
                    ),
                  })
                }
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* Relationship */}
            <div>
              <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                Relação
              </Label>
              <Select
                value={primaryDependent?.relationship || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    dependents: formData.dependents.map((d, i) =>
                      i === 0 ? { ...d, relationship: value } : d
                    ),
                  })
                }
              >
                <SelectTrigger className="mt-2 rounded-2xl">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Cônjuge</SelectItem>
                  <SelectItem value="parent">Pai/Mãe</SelectItem>
                  <SelectItem value="child">Filho/Filha</SelectItem>
                  <SelectItem value="sibling">Irmão/Irmã</SelectItem>
                  <SelectItem value="grandparent">Avó/Avó</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specific Needs */}
          <div>
            <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Necessidades Específicas
            </Label>
            <Textarea
              value={primaryHealth?.additionalNotes || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryDependentNeeds: {
                    ...primaryHealth,
                    additionalNotes: e.target.value,
                  },
                })
              }
              rows={4}
              placeholder="Descreva as necessidades específicas de saúde e cuidado..."
              className="mt-2 rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Health Profile */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold uppercase">
          Perfil de Saúde
        </h3>
        
        <div className="bg-card rounded-2xl p-5 sm:p-7 space-y-4 border border-border/50">
          {/* Mobility Level */}
          <div>
            <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Nível de Mobilidade
            </Label>
            <Select
              value={primaryHealth?.mobilityLevel || ""}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  primaryDependentNeeds: {
                    ...primaryHealth,
                    mobilityLevel: value,
                  },
                })
              }
            >
              <SelectTrigger className="mt-2 rounded-2xl">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boa">Boa Mobilidade</SelectItem>
                <SelectItem value="parcial">Mobilidade Parcial</SelectItem>
                <SelectItem value="total">Sem Mobilidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Medical Conditions */}
          <div>
            <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Condições Médicas
            </Label>
            <div className="mt-3 space-y-2">
              {MEDICAL_CONDITIONS.map(condition => (
                <label key={condition} className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      primaryHealth?.medicalConditions.includes(condition) || false
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          primaryDependentNeeds: {
                            ...primaryHealth,
                            medicalConditions: [
                              ...primaryHealth.medicalConditions,
                              condition,
                            ],
                          },
                        });
                      } else {
                        setFormData({
                          ...formData,
                          primaryDependentNeeds: {
                            ...primaryHealth,
                            medicalConditions: primaryHealth.medicalConditions.filter(
                              c => c !== condition
                            ),
                          },
                        });
                      }
                    }}
                  />
                  <span className="text-sm">{CONDITION_LABELS[condition]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Services Needed */}
          <div>
            <Label className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Serviços Necessários
            </Label>
            <div className="mt-3 space-y-2">
              {SERVICE_TYPES.map(service => (
                <label key={service} className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      primaryHealth?.servicesNeeded.includes(service) || false
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          primaryDependentNeeds: {
                            ...primaryHealth,
                            servicesNeeded: [
                              ...primaryHealth.servicesNeeded,
                              service,
                            ],
                          },
                        });
                      }
                    }}
                  />
                  <span className="text-sm">
                    {SERVICE_LABELS[service]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={async () => {
          setIsSaving(true);
          try {
            await onUpdate(formData);
          } finally {
            setIsSaving(false);
          }
        }}
        disabled={isSaving}
        className="rounded-2xl"
      >
        {isSaving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </section>
  );
}

const MEDICAL_CONDITIONS = [
  "cancer", "artrite", "avc", "diabetes", "demencia", "alzheimer", 
  "parkinson", "insuficiencia_cardiaca"
];

const CONDITION_LABELS = {
  cancer: "Cancro",
  artrite: "Artrite",
  avc: "AVC",
  diabetes: "Diabetes",
  demencia: "Demência",
  alzheimer: "Alzheimer",
  parkinson: "Parkinson",
  insuficiencia_cardiaca: "Insuficiência Cardíaca",
};

const SERVICE_TYPES = [
  "PERSONAL_CARE", "MEDICATION", "MOBILITY", "COMPANIONSHIP",
  "MEAL_PREPARATION", "LIGHT_HOUSEWORK", "TRANSPORTATION",
  "COGNITIVE_SUPPORT", "NIGHT_CARE", "PALLIATIVE_CARE",
  "PHYSIOTHERAPY", "NURSING_CARE"
];

const SERVICE_LABELS = {
  PERSONAL_CARE: "Cuidados Pessoais",
  MEDICATION: "Medicação",
  MOBILITY: "Mobilidade",
  COMPANIONSHIP: "Companhia",
  MEAL_PREPARATION: "Refeições",
  LIGHT_HOUSEWORK: "Tarefas Domésticas",
  TRANSPORTATION: "Transporte",
  COGNITIVE_SUPPORT: "Estimulação Cognitiva",
  NIGHT_CARE: "Cuidados Noturnos",
  PALLIATIVE_CARE: "Cuidados Paliativos",
  PHYSIOTHERAPY: "Fisioterapia",
  NURSING_CARE: "Enfermagem",
};
```

---

## API Endpoints

### Current vs Required Changes

**Current Endpoints:**
```
GET /api/user/profile
POST /api/user/profile
DELETE /api/user/profile/photo
```

**Required Enhancements:**

```typescript
// Get profile data (returns role-specific structure)
GET /api/user/profile
Response:
{
  role: "CAREGIVER" | "FAMILY",
  profile: CaregiverProfileData | FamilyProfileData,
  // ... role-specific fields
}

// Update profile (accepts role-specific structure)
POST /api/user/profile
Request:
{
  // role-specific fields only
}

// Upload profile photo
POST /api/user/profile/photo
Request: multipart/form-data (image file)

// Get profile metrics (separate endpoint for efficiency)
GET /api/user/profile/metrics
Response (Caregiver):
{
  totalContracts: number,
  totalReviews: number,
  averageRating: number,
  hourlyRateEur: number,
  recentContracts: Contract[]
}

Response (Family):
{
  activeDemands: number,
  totalDependents: number,
  totalSpent: number,
  successRate: number,
  upcomingAppointments: Appointment[]
}

// Verify credentials (background check, documents)
POST /api/user/profile/verify
Request:
{
  type: "BACKGROUND_CHECK" | "DOCUMENT",
  documentUrl?: string,
  status?: "PENDING" | "VERIFIED" | "FAILED"
}
```

---

## Type Definitions

**File:** `src/types/profile.ts`

```typescript
// Caregiver Profile
export interface CaregiverProfileData {
  // Personal
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  city: string;
  
  // Professional Identity
  title: string;                              // e.g., "Enfermeira Especializada"
  bio: string;
  experienceYears: number;
  languages: string[];
  certifications: {
    name: string;
    issuedYear: number;
    verified: boolean;
  }[];
  
  // Services
  specializations: string[];                  // From 12 service types
  specificConditionsExperience: {
    condition: string;
    yearsExperience: number;
  }[];
  
  // Pricing & Availability
  hourlyRateEur: number;
  availability: {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    available: boolean;
    hoursStart?: string;
    hoursEnd?: string;
  }[];
  responseTimeMinutes: number;
  
  // Stats
  totalContracts: number;
  totalReviews: number;
  averageRating: number;
  
  // Verification
  nif: string;
  documentType: "CC" | "PASSPORT" | "RESIDENCE";
  documentNumber: string;
  backgroundCheckStatus: "PENDING" | "VERIFIED" | "FAILED";
  backgroundCheckUrl?: string;
  backgroundCheckDate?: string;
  verificationBadge: boolean;
  
  // Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
}

// Family Profile
export interface FamilyProfileData {
  // Personal
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  city: string;
  
  // Dependents (Support multiple)
  dependents: {
    id: string;
    name: string;
    age: number;
    relationship: "spouse" | "parent" | "child" | "sibling" | "grandparent" | "other";
    isPrimary: boolean;
  }[];
  
  // Primary Dependent Health Profile
  primaryDependentNeeds: {
    mobilityLevel: "total" | "parcial" | "boa";
    medicalConditions: string[];
    medicalConditionsNotes: string;
    dietaryRestrictions: string[];
    servicesNeeded: string[];
    medicationList: string;
    additionalNotes: string;
  };
  
  // Identification
  nif: string;
  documentType: "CC" | "PASSPORT" | "RESIDENCE";
  documentNumber: string;
  
  // Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  // Stats
  activeDemands: number;
  totalSpent: number;
  successRate: number;
  
  // Preferences
  preferredBudgetRange: {
    min: number;
    max: number;
  };
  serviceFrequency: "daily" | "weekly" | "monthly" | "as_needed";
}

// Union type
export type ProfileData = CaregiverProfileData | FamilyProfileData;
```

---

## Styling Constants

**File:** `src/lib/profile-styles.ts`

```typescript
import { cn } from "@/lib/utils";

export const PROFILE_STYLES = {
  // Layout
  pageContainer: "space-y-8 px-4 md:px-6 lg:px-8",
  section: "space-y-4",
  card: "bg-card rounded-2xl p-5 sm:p-7 space-y-4 border border-border/50 shadow-card",
  
  // Typography
  pageTitle: "text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter",
  sectionTitle: "text-xl font-display font-bold uppercase",
  label: "text-xs font-display font-bold text-muted-foreground uppercase tracking-widest",
  
  // Components
  input: "rounded-2xl",
  textarea: "rounded-2xl",
  button: "rounded-2xl",
  badge: "rounded-xl",
  
  // Header
  heroHeight: "h-32",
  heroGradient: "bg-gradient-to-r from-primary/20 to-primary/5",
  avatarSize: "w-24 h-24",
  avatarBorder: "border-4 border-card",
  
  // Tabs
  tabsList: "grid w-full h-11 rounded-2xl bg-secondary/50 p-1 gap-1",
  tabsTrigger: "rounded-xl text-xs font-display font-bold uppercase",
  
  // Metrics
  metricCard: "bg-card rounded-2xl p-5 sm:p-7 space-y-4 border border-border/50 shadow-card",
  metricIcon: "w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center",
  metricValue: "text-3xl font-display font-black text-foreground tracking-tighter leading-none",
  metricLabel: "text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest",
};

// Helper function to get grid columns
export function getTabGridCols(role: "CAREGIVER" | "FAMILY") {
  return role === "CAREGIVER" ? "grid-cols-5" : "grid-cols-4";
}
```

---

## Migration Strategy

### Step 1: Create New Components (No Breaking Changes)
- Create new component files alongside existing page.tsx
- Build components independently with new structure
- Test each component in isolation

### Step 2: Update Data Model
- Create new TypeScript interfaces
- Update API responses to support both old and new formats
- Add data adapter for backwards compatibility

### Step 3: Gradual Rollout
- Feature flag: `PROFILE_REDESIGN_V2`
- Route percentage of users to new implementation
- Monitor errors and performance
- Gradually increase percentage

### Step 4: Full Migration
- Remove feature flag
- Archive old page.tsx
- Update documentation

---

## Testing Checklist

- [ ] Profile loads without errors
- [ ] All form fields save correctly
- [ ] Tab navigation works smoothly
- [ ] Image upload works
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance (LCP < 2.5s)
- [ ] Error handling (network failures, validation)
- [ ] Role-specific content displays correctly
- [ ] Metrics update in real-time

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-29  
**Status:** Ready for Implementation
