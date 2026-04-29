"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconAlertCircle,
  IconCheckCircle,
  IconLoader2,
  IconCamera,
  IconEdit,
  IconCheck,
} from "@/components/icons";
import {
  tokens,
  cn,
  getHeadingClasses,
  getAlertClasses,
  getCardClasses,
  getAvatarClasses,
  getAvatarEditButtonClasses,
} from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n";
import { ProfileData } from "../../hooks/useProfileData";

interface ProfileHeaderProps {
  isLoading: boolean;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  profile: ProfileData | null;
  formData: ProfileData;
  session: any;
  uploadingPhoto: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isCaregiver: boolean;
  onEditToggle: () => void;
  onPhotoClick: () => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileHeader({
  isLoading,
  isEditing,
  isSaving,
  error,
  success,
  profile,
  formData,
  session,
  uploadingPhoto,
  fileInputRef,
  isCaregiver,
  onEditToggle,
  onPhotoClick,
  onPhotoChange,
}: ProfileHeaderProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <>
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
        <div className={getAlertClasses("error")}>
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
        <div className={getAlertClasses("success")}>
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
                  className={getAvatarClasses()}
                  onClick={onPhotoClick}
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
                  className={getAvatarEditButtonClasses()}
                  onClick={onPhotoClick}
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
                  onChange={onPhotoChange}
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
              onClick={onEditToggle}
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
    </>
  );
}
