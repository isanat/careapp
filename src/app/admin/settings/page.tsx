"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/common/page-header";
import { BloomCard } from "@/components/bloom-custom/BloomCard";
import { BloomBadge } from "@/components/bloom-custom/BloomBadge";
import { BloomSectionHeader } from "@/components/bloom-custom/BloomSectionHeader";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconCoin,
  IconCreditCard,
  IconPercentage,
  IconServer,
  IconShield,
  IconVideo,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface PlatformSettings {
  activationCostEurCents: number;
  contractFeeEurCents: number;
  platformFeePercent: number;
  maintenanceMode: boolean;
  supportEmail: string;
  supportPhone: string;
  kycEnabled: boolean;
  kycProvider: string;
  kycApiKey: string;
  easypayEnabled: boolean;
  easypayAccountId: string;
  easypayApiKey: string;
  easypayEnvironment: "sandbox" | "production";
  videoEnabled: boolean;
  videoProvider: string;
  videoApiKey: string;
}

interface IntegrationStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  lastWebhook: string | null;
  connected: boolean;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    activationCostEurCents: 3500,
    contractFeeEurCents: 500,
    platformFeePercent: 10,
    maintenanceMode: false,
    supportEmail: "",
    supportPhone: "",
    kycEnabled: true,
    kycProvider: "didit",
    kycApiKey: "",
    easypayEnabled: true,
    easypayAccountId: "",
    easypayApiKey: "",
    easypayEnvironment: "sandbox",
    videoEnabled: false,
    videoProvider: "daily",
    videoApiKey: "",
  });
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, integrationsRes] = await Promise.all([
        apiFetch("/api/admin/settings"),
        apiFetch("/api/admin/settings/integrations"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || settings);
      }
      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiFetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Configurações salvas" });
      } else {
        const data = await response.json();
        toast({
          title: "Erro",
          description: data.error || "Falha ao salvar",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (integration: string) => {
    try {
      const response = await apiFetch(`/api/admin/settings/test-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration }),
      });

      const data = await response.json();
      toast({
        title: data.success ? "Sucesso" : "Erro",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao testar conexão",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-success";
      case "degraded":
        return "bg-warning";
      default:
        return "bg-destructive";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Configurações"
        description="Configurações da plataforma"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        }
      />

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="fees">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fees">Taxas</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="video">Vídeo</TabsTrigger>
          </TabsList>

          {/* Tab: Taxas */}
          <TabsContent value="fees" className="space-y-6 mt-6">
            <BloomCard>
              <div className="p-5 sm:p-6 md:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <IconCoin className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Taxas da Plataforma</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure as taxas cobradas pela plataforma
                </p>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Taxa de Ativação (EUR)</Label>
                      <div className="flex items-center gap-2">
                        <IconCreditCard className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={settings.activationCostEurCents / 100}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              activationCostEurCents: parseFloat(e.target.value) * 100,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valor pago pela família ao ativar a conta
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Taxa de Contrato (EUR)</Label>
                      <div className="flex items-center gap-2">
                        <IconCreditCard className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={settings.contractFeeEurCents / 100}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contractFeeEurCents: parseFloat(e.target.value) * 100,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valor pago por cada contrato criado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Taxa da Plataforma (%)</Label>
                      <div className="flex items-center gap-2">
                        <IconPercentage className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={settings.platformFeePercent}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              platformFeePercent: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Porcentagem sobre o valor do contrato (cuidador recebe 90%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </BloomCard>

            <BloomCard>
              <div className="p-5 sm:p-6 md:p-7 space-y-4">
                <h3 className="text-base font-semibold">Informações de Contato</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email de Suporte</Label>
                    <Input
                      value={settings.supportEmail}
                      onChange={(e) =>
                        setSettings({ ...settings, supportEmail: e.target.value })
                      }
                      placeholder="suporte@seniorcare.pt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone de Suporte</Label>
                    <Input
                      value={settings.supportPhone}
                      onChange={(e) =>
                        setSettings({ ...settings, supportPhone: e.target.value })
                      }
                      placeholder="+351 210 000 000"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Modo de Manutenção</Label>
                      <p className="text-sm text-muted-foreground">
                        Apenas administradores podem aceder
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, maintenanceMode: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </BloomCard>

            <BloomCard className="border-warning/30 bg-warning/10">
              <div className="flex items-start gap-4 p-5 sm:p-6 md:p-7">
                <IconAlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Atenção</p>
                  <p className="text-sm text-warning/90">
                    Alterações nas taxas afetam apenas novos contratos. Contratos existentes
                    mantêm as taxas originais.
                  </p>
                </div>
              </div>
            </BloomCard>
          </TabsContent>

          {/* Tab: KYC */}
          <TabsContent value="kyc" className="space-y-6 mt-6">
            <BloomCard>
              <div className="p-5 sm:p-6 md:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Verificação de Identidade (KYC)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure a integração com o provedor de KYC
                </p>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Habilitar Verificação KYC</Label>
                        <p className="text-sm text-muted-foreground">
                          Permite que cuidadores verifiquem sua identidade
                        </p>
                      </div>
                      <Switch
                        checked={settings.kycEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, kycEnabled: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Provedor KYC</Label>
                      <Select
                        value={settings.kycProvider}
                        onValueChange={(v) => setSettings({ ...settings, kycProvider: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="didit">Didit</SelectItem>
                          <SelectItem value="veriff">Veriff</SelectItem>
                          <SelectItem value="onfido">Onfido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.kycApiKey}
                        onChange={(e) =>
                          setSettings({ ...settings, kycApiKey: e.target.value })
                        }
                        placeholder="sk_live_..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Chave de API do provedor KYC
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => testConnection("kyc")}
                      disabled={!settings.kycApiKey}
                    >
                      Testar Conexão
                    </Button>
                  </div>
                )}
              </div>
            </BloomCard>
          </TabsContent>

          {/* Tab: Pagamentos */}
          <TabsContent value="payments" className="space-y-6 mt-6">
            <BloomCard>
              <div className="p-5 sm:p-6 md:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <IconCreditCard className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Easypay - Pagamentos</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure a integração com Easypay (Multibanco, MB Way, Cartão)
                </p>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Habilitar Easypay</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativa processamento de pagamentos via Easypay
                        </p>
                      </div>
                      <Switch
                        checked={settings.easypayEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, easypayEnabled: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ambiente</Label>
                      <Select
                        value={settings.easypayEnvironment}
                        onValueChange={(v: "sandbox" | "production") =>
                          setSettings({ ...settings, easypayEnvironment: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                          <SelectItem value="production">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account ID</Label>
                      <Input
                        value={settings.easypayAccountId}
                        onChange={(e) =>
                          setSettings({ ...settings, easypayAccountId: e.target.value })
                        }
                        placeholder="12345"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.easypayApiKey}
                        onChange={(e) =>
                          setSettings({ ...settings, easypayApiKey: e.target.value })
                        }
                        placeholder="API Key da Easypay"
                      />
                      <p className="text-xs text-muted-foreground">
                        Encontrada no painel da Easypay
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => testConnection("easypay")}
                      disabled={!settings.easypayAccountId || !settings.easypayApiKey}
                    >
                      Testar Conexão
                    </Button>
                  </div>
                )}
              </div>
            </BloomCard>
          </TabsContent>

          {/* Tab: Vídeo */}
          <TabsContent value="video" className="space-y-6 mt-6">
            <BloomCard>
              <div className="p-5 sm:p-6 md:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <IconVideo className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Videochamadas</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure a integração para reuniões por vídeo entre famílias e cuidadores
                </p>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Habilitar Videochamadas</Label>
                        <p className="text-sm text-muted-foreground">
                          Permite reuniões por vídeo entre famílias e cuidadores
                        </p>
                      </div>
                      <Switch
                        checked={settings.videoEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, videoEnabled: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Provedor de Vídeo</Label>
                      <Select
                        value={settings.videoProvider}
                        onValueChange={(v) => setSettings({ ...settings, videoProvider: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily.co</SelectItem>
                          <SelectItem value="twilio">Twilio Video</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.videoApiKey}
                        onChange={(e) =>
                          setSettings({ ...settings, videoApiKey: e.target.value })
                        }
                        placeholder="API Key do provedor"
                      />
                      <p className="text-xs text-muted-foreground">
                        Chave de API para criar salas de vídeo
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => testConnection("video")}
                      disabled={!settings.videoApiKey}
                    >
                      Testar Conexão
                    </Button>
                  </div>
                )}
              </div>
            </BloomCard>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Status das Integrações */}
      <motion.div variants={itemVariants}>
        <BloomCard>
          <div className="p-5 sm:p-6 md:p-7 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <IconServer className="h-5 w-5" />
              <h3 className="text-base font-semibold">Status das Integrações</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Monitore a saúde das integrações externas
            </p>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : integrations.length > 0 ? (
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${getStatusColor(integration.status)}`}
                      />
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.lastWebhook
                            ? `Último webhook: ${new Date(
                                integration.lastWebhook
                              ).toLocaleString("pt-PT")}`
                            : "Nenhum webhook recebido"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.connected ? "default" : "destructive"}>
                        {integration.connected ? "Conectado" : "Desconectado"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(integration.name)}
                      >
                        Testar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure as integrações acima para ver o status aqui.
              </p>
            )}
          </div>
        </BloomCard>
      </motion.div>
    </motion.div>
  );
}
