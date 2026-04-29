import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";

export interface ProfileData {
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

export function useProfileData() {
  const { data: session, status, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/user/profile");
      const json = await response.json();
      const data = json.profile;
      setProfile(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        nif: data.nif || "",
        documentType: data.documentType || "CC",
        documentNumber: data.documentNumber || "",
        profileImage: data.profileImage || undefined,
        title: data.title || "",
        bio: data.bio || "",
        experienceYears: data.experienceYears || 0,
        city: data.city || "",
        services: Array.isArray(data.services)
          ? data.services
          : data.services
            ? JSON.parse(data.services)
            : [],
        hourlyRateEur: data.hourlyRateEur ? data.hourlyRateEur / 100 : 0,
        certifications: data.certifications || "",
        languages: data.languages || "",
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        totalContracts: data.totalContracts || 0,
        elderName: data.elderName || "",
        elderAge: data.elderAge || 0,
        elderNeeds: data.elderNeeds || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        backgroundCheckStatus: data.backgroundCheckStatus || "PENDING",
        backgroundCheckUrl: data.backgroundCheckUrl || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const updates: Record<string, any> = {};

      if (formData.name !== profile?.name) updates.name = formData.name;
      if (formData.phone !== profile?.phone) updates.phone = formData.phone;
      if (formData.profileImage !== profile?.profileImage)
        updates.profileImage = formData.profileImage;
      if (formData.nif !== profile?.nif) updates.nif = formData.nif;
      if (formData.documentType !== profile?.documentType)
        updates.documentType = formData.documentType;
      if (formData.documentNumber !== profile?.documentNumber)
        updates.documentNumber = formData.documentNumber;
      if (formData.title !== profile?.title) updates.title = formData.title;
      if (formData.bio !== profile?.bio) updates.bio = formData.bio;
      if (formData.experienceYears !== profile?.experienceYears)
        updates.experienceYears = formData.experienceYears;
      if (formData.city !== profile?.city) updates.city = formData.city;
      if (formData.certifications !== profile?.certifications)
        updates.certifications = formData.certifications;
      if (formData.services && JSON.stringify(formData.services) !== JSON.stringify(profile?.services))
        updates.services = formData.services;
      if (formData.hourlyRateEur !== profile?.hourlyRateEur)
        updates.hourlyRateEur = formData.hourlyRateEur;
      if (formData.languages !== profile?.languages)
        updates.languages = JSON.parse(formData.languages || "[]");
      if (formData.elderName !== profile?.elderName)
        updates.elderName = formData.elderName;
      if (formData.elderAge !== profile?.elderAge)
        updates.elderAge = formData.elderAge;
      if (formData.elderNeeds !== profile?.elderNeeds)
        updates.elderNeeds = formData.elderNeeds;
      if (formData.emergencyContactName !== profile?.emergencyContactName)
        updates.emergencyContactName = formData.emergencyContactName;
      if (formData.emergencyContactPhone !== profile?.emergencyContactPhone)
        updates.emergencyContactPhone = formData.emergencyContactPhone;

      if (Object.keys(updates).length === 0) {
        setSuccess("Nenhuma alteração realizada");
        return;
      }

      await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      setProfile(formData);
      setIsEditing(false);
      setSuccess("Perfil atualizado com sucesso!");

      await update({
        ...session,
        user: { ...session?.user, name: formData.name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar perfil");
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

  return {
    // State
    isLoading,
    isSaving,
    isEditing,
    error,
    success,
    isDeleting,
    deleteDialogOpen,
    uploadingPhoto,
    profile,
    formData,
    fileInputRef,
    session,
    status,

    // Computed
    isFamily,
    isCaregiver,

    // Methods
    setIsLoading,
    setIsSaving,
    setIsEditing,
    setError,
    setSuccess,
    setIsDeleting,
    setDeleteDialogOpen,
    setUploadingPhoto,
    setFormData,
    fetchProfile,
    handleSave,
    handleServiceToggle,
  };
}
