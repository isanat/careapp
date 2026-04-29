"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn, getCardClasses, getHeadingClasses, getLabelClasses, getFormInputClasses, tokens } from "@/lib/design-tokens";
import { ProfileData } from "../../hooks/useProfileData";
import { useI18n } from "@/lib/i18n";
import { formatPhonePT } from "../../utils";

interface ContactTabProps {
  isEditing: boolean;
  isFamily: boolean;
  formData: ProfileData;
  setFormData: (data: ProfileData) => void;
}

export function ContactTab({
  isEditing,
  isFamily,
  formData,
  setFormData,
}: ContactTabProps) {
  const { t } = useI18n();

  return (
    <TabsContent value="contact" className={tokens.layout.sectionSpacing}>
      <section className="space-y-4">
        <h3 className={getHeadingClasses("sectionTitle")}>
          Informações de Contacto
        </h3>
        <div className={cn(getCardClasses(), "space-y-4")}>
          <div>
            <Label className={getLabelClasses()}>
              {t.auth.email}
            </Label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className="mt-2 rounded-2xl bg-secondary/50 cursor-not-allowed opacity-60"
            />
          </div>
          <div>
            <Label className={getLabelClasses()}>
              Telemovel
            </Label>
            <Input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: formatPhonePT(e.target.value),
                })
              }
              disabled={!isEditing}
              className="mt-2 rounded-2xl"
              placeholder="+351 912 345 678"
              inputMode="tel"
            />
          </div>

          {isFamily && (
            <>
              <div className="border-t border-border/30 pt-6 space-y-4">
                <h4 className="text-sm font-display font-bold uppercase text-foreground">
                  Contacto de Emergência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={getLabelClasses()}>
                      Nome
                    </Label>
                    <Input
                      value={formData.emergencyContactName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactName: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className={getFormInputClasses()}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label className={getLabelClasses()}>
                      Telefone
                    </Label>
                    <Input
                      type="tel"
                      value={formData.emergencyContactPhone || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactPhone: formatPhonePT(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                      className={getFormInputClasses()}
                      placeholder="+351 912 345 678"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </TabsContent>
  );
}
