"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn, getCardClasses, getHeadingClasses, getLabelClasses } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n";
import { ProfileData } from "../../hooks/useProfileData";

interface AboutTabProps {
  isEditing: boolean;
  isCaregiver: boolean;
  formData: ProfileData;
  setFormData: (data: ProfileData) => void;
}

export function AboutTab({
  isEditing,
  isCaregiver,
  formData,
  setFormData,
}: AboutTabProps) {
  const { t } = useI18n();

  return (
    <TabsContent value="about" className="space-y-6">
      <section className="space-y-4">
        <h3 className={getHeadingClasses("sectionTitle")}>
          Informações Pessoais
        </h3>
        <div className={cn(getCardClasses(), "space-y-4")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={getLabelClasses()}>
                {t.auth.name}
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
                className={getLabelClasses()}
              />
            </div>
            <div>
              <Label className={getLabelClasses()}>
                Cidade
              </Label>
              <Input
                value={formData.city || ""}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                disabled={!isEditing}
                className="mt-2 rounded-2xl"
                placeholder="Cidade"
              />
            </div>
          </div>

          {isCaregiver && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={getLabelClasses()}>
                    Titulo Profissional
                  </Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    disabled={!isEditing}
                    className="mt-2 rounded-2xl"
                    placeholder="Ex: Enfermeira"
                  />
                </div>
                <div>
                  <Label className={getLabelClasses()}>
                    Anos de Experiencia
                  </Label>
                  <Input
                    type="number"
                    value={formData.experienceYears || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={!isEditing}
                    className="mt-2 rounded-2xl"
                  />
                </div>
              </div>
              <div>
                <Label className={getLabelClasses()}>
                  Bio / Sobre voce
                </Label>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  disabled={!isEditing}
                  className="mt-2 rounded-2xl"
                  placeholder="Descreva sua experiencia..."
                />
              </div>
            </>
          )}
        </div>
      </section>
    </TabsContent>
  );
}
