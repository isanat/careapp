"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn, getCardClasses, getHeadingClasses, getLabelClasses, getFormInputClasses, tokens } from "@/lib/design-tokens";
import { ProfileData } from "../../hooks/useProfileData";

interface ElderTabProps {
  isEditing: boolean;
  formData: ProfileData;
  setFormData: (data: ProfileData) => void;
}

export function ElderTab({
  isEditing,
  formData,
  setFormData,
}: ElderTabProps) {
  return (
    <TabsContent value="elder" className={tokens.layout.sectionSpacing}>
      <section className="space-y-4">
        <h3 className={getHeadingClasses("sectionTitle")}>
          Informações do Familiar
        </h3>
        <div className={cn(getCardClasses(), "space-y-4")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={getLabelClasses()}>
                Nome do Idoso
              </Label>
              <Input
                value={formData.elderName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    elderName: e.target.value,
                  })
                }
                disabled={!isEditing}
                className={getFormInputClasses()}
              />
            </div>
            <div>
              <Label className={getLabelClasses()}>
                Idade
              </Label>
              <Input
                type="number"
                value={formData.elderAge || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    elderAge: parseInt(e.target.value) || 0,
                  })
                }
                disabled={!isEditing}
                className={getFormInputClasses()}
              />
            </div>
          </div>
          <div>
            <Label className={getLabelClasses()}>
              Necessidades Específicas
            </Label>
            <Textarea
              value={formData.elderNeeds || ""}
              onChange={(e) =>
                setFormData({ ...formData, elderNeeds: e.target.value })
              }
              rows={4}
              disabled={!isEditing}
              className={getFormInputClasses()}
              placeholder="Descreva as necessidades especificas de saude e cuidado..."
            />
          </div>
        </div>
      </section>
    </TabsContent>
  );
}
