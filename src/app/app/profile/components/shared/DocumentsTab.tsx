"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, getCardClasses, getHeadingClasses, getLabelClasses, getFormInputClasses } from "@/lib/design-tokens";
import { IconShield, IconAlertCircle, IconCheck, IconLoader2, IconUpload } from "@/components/icons";
import { DOCUMENT_TYPES } from "@/lib/profile-constants";
import { ProfileData } from "../../hooks/useProfileData";
import { validateNIF } from "../../utils";

interface DocumentsTabProps {
  isEditing: boolean;
  isCaregiver: boolean;
  uploadingPhoto: boolean;
  formData: ProfileData;
  setFormData: (data: ProfileData) => void;
  onBackgroundCheckUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getBackgroundCheckBadge: () => React.ReactNode;
}

export function DocumentsTab({
  isEditing,
  isCaregiver,
  uploadingPhoto,
  formData,
  setFormData,
  onBackgroundCheckUpload,
  getBackgroundCheckBadge,
}: DocumentsTabProps) {
  return (
    <TabsContent value="documents" className="space-y-6">
      <section className="space-y-4">
        <h3 className={getHeadingClasses("sectionTitle")}>
          Documentos Pessoais
        </h3>
        <div className={cn(getCardClasses(), "space-y-4")}>
          <div>
            <Label className={getLabelClasses()}>NIF</Label>
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
            {formData.nif && formData.nif.length === 9 && !validateNIF(formData.nif) && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                NIF invalido
              </p>
            )}
            {formData.nif && formData.nif.length === 9 && validateNIF(formData.nif) && (
              <p className="text-xs text-success mt-2 flex items-center gap-1">
                <IconCheck className="h-3 w-3" />
                NIF valido
              </p>
            )}
          </div>

          <div>
            <Label className={getLabelClasses()}>Tipo de Documento</Label>
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
              <Label className={getLabelClasses()}>
                Numero do {DOCUMENT_TYPES.find((d) => d.id === formData.documentType)?.label || "Documento"}
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
                className={getFormInputClasses()}
                placeholder={DOCUMENT_TYPES.find((d) => d.id === formData.documentType)?.placeholder || ""}
                maxLength={DOCUMENT_TYPES.find((d) => d.id === formData.documentType)?.maxLength || 20}
              />
            </div>
          )}
        </div>
      </section>

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
              Para trabalhar como cuidador, e necessario apresentar o registo criminal.
            </p>
            <Button
              variant={formData.backgroundCheckUrl ? "outline" : "default"}
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
              onChange={onBackgroundCheckUpload}
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
  );
}
