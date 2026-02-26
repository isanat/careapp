"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  IconSettings,
  IconRefresh,
  IconCoin,
  IconCreditCard,
  IconPercentage,
  IconServer,
  IconShield,
  IconMail,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface PlatformSettings {
  activationCostEurCents: number;
  contractFeeEurCents: number;
  platformFeePercent: number;
  tokenPriceEurCents: number;
  maintenanceMode: boolean;
  supportEmail: string;
  supportPhone: string;
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
    platformFeePercent: 15,
    tokenPriceEurCents: 1,
    maintenanceMode: false,
    supportEmail: "",
    supportPhone: "",
  });
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, integrationsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/settings/integrations"),
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
      const response = await fetch("/api/admin/settings", {
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
      const response = await fetch(`/api/admin/settings/test-integration`, {
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
        return "bg-green-500";
      case "degraded":
        return "bg-amber-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Configurações da plataforma"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="fees">Taxas</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Email de Suporte</Label>
                    <Input
                      value={settings.supportEmail}
                      onChange={(e) =>
                        setSettings({ ...settings, supportEmail: e.target.value })
                      }
                      placeholder="suporte@idosolink.com"
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
                      <p className="text-sm text-slate-500">
                        Apenas administradores podem acessar
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, maintenanceMode: checked })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconCoin className="h-5 w-5" />
                Taxas da Plataforma
              </CardTitle>
              <CardDescription>
                Configure as taxas cobradas pela plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Taxa de Ativação (EUR)</Label>
                    <div className="flex items-center gap-2">
                      <IconCreditCard className="h-4 w-4 text-slate-400" />
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
                    <p className="text-xs text-slate-500">
                      Valor pago pelo usuário ao ativar a conta (creditado em tokens)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Taxa de Contrato (EUR)</Label>
                    <div className="flex items-center gap-2">
                      <IconCreditCard className="h-4 w-4 text-slate-400" />
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
                    <p className="text-xs text-slate-500">
                      Valor pago por cada parte ao criar um contrato
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Taxa da Plataforma (%)</Label>
                    <div className="flex items-center gap-2">
                      <IconPercentage className="h-4 w-4 text-slate-400" />
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
                    <p className="text-xs text-slate-500">
                      Porcentagem sobre o valor do contrato
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Preço do Token (EUR)</Label>
                    <div className="flex items-center gap-2">
                      <IconCoin className="h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.tokenPriceEurCents / 100}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            tokenPriceEurCents: parseFloat(e.target.value) * 100,
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Preço fixo: 1 SENT = €0.01
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800">
            <CardContent className="flex items-start gap-4 p-4">
              <IconAlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">Atenção</p>
                <p className="text-sm text-amber-600">
                  Alterações nas taxas afetam apenas novos contratos. Contratos existentes
                  mantêm as taxas originais.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconServer className="h-5 w-5" />
                Status das Integrações
              </CardTitle>
              <CardDescription>
                Monitore a saúde das integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${getStatusColor(
                            integration.status
                          )}`}
                        />
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-slate-500">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
