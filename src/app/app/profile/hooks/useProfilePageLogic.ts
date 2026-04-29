"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { validateNIF, parseElderNeeds } from "../utils";
import { getBackgroundCheckBadge } from "../utils/badge";
import { apiFetch } from "@/lib/api-client";

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

interface UseProfilePageLogicReturn {
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  deleteDialogOpen: boolean;
  uploadingPhoto: boolean;
  pushLoading: boolean;
  error: string | null;
  success: string | null;
  profile: ProfileData | null;
  formData: ProfileData;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setFormData: (data: ProfileData) => void;
  setIsEditing: (editing: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setUploadingPhoto: (uploading: boolean) => void;
  fetchProfile: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleServiceToggle: (serviceId: string) => void;
  handleEnablePush: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
  handlePhotoClick: () => void;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBackgroundCheckUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  getBackgroundCheckBadge: () => React.ReactElement;
}

export function useProfilePageLogic(): UseProfilePageLogicReturn {
  const { data: session, status, update } = useSession();
  const {
    isPushEnabled,
    subscribeToPush,
    requestPushPermission,
    isPushSupported,
    pushError,
  } = require("@/hooks/useNotifications").useNotifications();
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
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/" });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

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
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "Ficheiro muito grande. Máximo 5MB. O ficheiro será comprimido automaticamente.",
        );
      }

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
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Ficheiro muito grande. Máximo 10MB");
      }

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

  const getBackgroundCheckBadgeElement = () =>
    getBackgroundCheckBadge(formData.backgroundCheckStatus);

  return {
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
    setUploadingPhoto,
    fetchProfile,
    handleSave,
    handleServiceToggle,
    handleEnablePush,
    handleDeleteAccount,
    handlePhotoClick,
    handlePhotoChange,
    handleBackgroundCheckUpload,
    getBackgroundCheckBadge: getBackgroundCheckBadgeElement,
  };
}
