"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn, getCardClasses, getHeadingClasses, getLabelClasses, getFormInputClasses, tokens } from "@/lib/design-tokens";
import { IconEuro } from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/profile-constants";
import { ProfileData } from "../../hooks/useProfileData";

interface ServicesTabProps {
  isEditing: boolean;
  formData: ProfileData;
  setFormData: (data: ProfileData) => void;
  onServiceToggle: (serviceId: string) => void;
}

export function ServicesTab({
  isEditing,
  formData,
  setFormData,
  onServiceToggle,
}: ServicesTabProps) {
  return (
    <TabsContent value="services" className={tokens.layout.sectionSpacing}>
      <section className="space-y-4">
        <h3 className={getHeadingClasses("sectionTitle")}>
          Serviços Oferecidos
        </h3>
        <div className={cn(getCardClasses(), "space-y-6")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICE_TYPES.map((service) => (
              <label
                key={service.id}
                className={`flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all cursor-pointer ${
                  formData.services?.includes(service.id)
                    ? "border-primary bg-primary/10"
                    : ""
                } ${!isEditing ? "pointer-events-none opacity-60" : ""}`}
              >
                <Checkbox
                  checked={formData.services?.includes(service.id)}
                  onCheckedChange={() =>
                    onServiceToggle(service.id)
                  }
                  disabled={!isEditing}
                  className="h-5 w-5"
                />
                <span className="text-sm font-display font-bold text-foreground">
                  {service.label}
                </span>
              </label>
            ))}
          </div>

          <div className="border-t border-border/30 pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={getLabelClasses()}>
                  Taxa Horaria ({"€"}/hora)
                </Label>
                <div className="relative mt-2">
                  <IconEuro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.hourlyRateEur?.toString() || ""}
                    onChange={(e) => {
                      const normalized = e.target.value.replace(",", ".");
                      const value = parseFloat(normalized) || 0;
                      setFormData({
                        ...formData,
                        hourlyRateEur: value,
                      });
                    }}
                    className="pl-11 rounded-2xl"
                    disabled={!isEditing}
                    placeholder="15.50"
                  />
                </div>
              </div>
              <div>
                <Label className={getLabelClasses()}>
                  Idiomas
                </Label>
                <Input
                  value={formData.languages || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      languages: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className={getFormInputClasses()}
                  placeholder="PT, EN, ES..."
                />
              </div>
            </div>
            <div>
              <Label className={getLabelClasses()}>
                Certificações
              </Label>
              <Input
                value={formData.certifications || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    certifications: e.target.value,
                  })
                }
                disabled={!isEditing}
                className={getFormInputClasses()}
                placeholder="Curso de Cuidador, Primeiros Socorros..."
              />
            </div>
          </div>
        </div>
      </section>
    </TabsContent>
  );
}
