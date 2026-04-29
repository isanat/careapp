"use client";

import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "../components/shared/ProfileHeader";
import { AboutTab } from "../components/shared/AboutTab";
import { DocumentsTab } from "../components/shared/DocumentsTab";
import { ElderTab } from "../components/family/ElderTab";
import { ContactTab } from "../components/shared/ContactTab";
import { SettingsTab } from "../components/shared/SettingsTab";
import { useProfilePageLogic } from "../hooks/useProfilePageLogic";
import { useNotifications } from "@/hooks/useNotifications";

export function FamilyProfile() {
  const { data: session, status } = useSession();
  const {
    isPushEnabled,
    isPushSupported,
    pushError,
  } = useNotifications();
  const {
    isLoading,
    isSaving,
    isEditing,
    isDeleting,
    deleteDialogOpen,
    uploadingPhoto,
    pushLoading,
    error,
    success,
    profile,
    formData,
    fileInputRef,
    setError,
    setSuccess,
    setFormData,
    setIsEditing,
    setDeleteDialogOpen,
    fetchProfile,
    handleSave,
    handleEnablePush,
    handleDeleteAccount,
    handlePhotoClick,
    handlePhotoChange,
    handleBackgroundCheckUpload,
    getBackgroundCheckBadge,
  } = useProfilePageLogic();

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
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
        isCaregiver={false}
        onEditToggle={() => {
          setError(null);
          setSuccess(null);
          setIsEditing(!isEditing);
        }}
        onPhotoClick={handlePhotoClick}
        onPhotoChange={handlePhotoChange}
      />

      {isSaving && (
        <div className="flex items-center justify-center py-8">
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-display font-bold text-foreground">
            Detalhes do Perfil
          </h2>
          <p className="text-sm text-muted-foreground">
            Edite suas informações pessoais e do familiar idoso
          </p>
        </div>
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2 text-sm font-display font-bold text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-display font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-secondary/20 rounded-xl p-1">
            <TabsTrigger
              value="about"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Sobre
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Documentos
            </TabsTrigger>
            <TabsTrigger
              value="elder"
              className="rounded-xl text-xs font-display font-bold uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Idoso
            </TabsTrigger>
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
            isCaregiver={false}
            formData={formData}
            setFormData={setFormData}
          />

          {/* Documents Tab */}
          <DocumentsTab
            isEditing={isEditing}
            isCaregiver={false}
            uploadingPhoto={uploadingPhoto}
            formData={formData}
            setFormData={setFormData}
            onBackgroundCheckUpload={handleBackgroundCheckUpload}
            getBackgroundCheckBadge={getBackgroundCheckBadge}
          />

          {/* Elder Tab */}
          <ElderTab
            isEditing={isEditing}
            formData={formData}
            setFormData={setFormData}
          />

          {/* Contact Tab */}
          <ContactTab
            isEditing={isEditing}
            isFamily={true}
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
    </div>
  );
}
