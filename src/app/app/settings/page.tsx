"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { 
  IconLogout, 
  IconBell,
  IconMoon,
  IconLanguage,
  IconShield,
  IconTrash,
  IconAlertTriangle,
  IconLoader2,
  IconCheck,
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/hooks/useNotifications";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const { isPushEnabled, subscribeToPush, requestPushPermission, isPushSupported } = useNotifications();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    setIsDeleting(true);
    // Simulate deletion
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      await subscribeToPush();
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.settings.title}</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e conta
          </p>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você recebe alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPushSupported ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas em tempo real no seu dispositivo
                  </p>
                </div>
                {isPushEnabled ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <IconCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">Ativo</span>
                  </div>
                ) : (
                  <Button variant="outline" onClick={handleEnablePush}>
                    Ativar
                  </Button>
                )}
              </div>
            ) : (
              <Alert>
                <IconAlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Seu navegador não suporta notificações push
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">
                  Receba resumos e alertas importantes
                </p>
              </div>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMoon className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.theme.light}/{t.theme.dark}</p>
                <p className="text-sm text-muted-foreground">{t.theme.system}</p>
              </div>
              <ThemeToggle />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconLanguage className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.language.select}</p>
                  <p className="text-sm text-muted-foreground">PT, EN, ES</p>
                </div>
              </div>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie a segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alterar Senha</p>
                <p className="text-sm text-muted-foreground">
                  Atualize sua senha de acesso
                </p>
              </div>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autenticação em Dois Fatores</p>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sessões Ativas</p>
                <p className="text-sm text-muted-foreground">
                  Gerencie onde você está logado
                </p>
              </div>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Privacidade e Dados
            </CardTitle>
            <CardDescription>
              Gerencie seus dados pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Exportar Dados</p>
                <p className="text-sm text-muted-foreground">
                  Baixe uma cópia dos seus dados
                </p>
              </div>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Termos de Uso</p>
                <p className="text-sm text-muted-foreground">
                  Leia nossos termos e condições
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/termos" target="_blank">Ver</a>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Política de Privacidade</p>
                <p className="text-sm text-muted-foreground">
                  Saiba como tratamos seus dados
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/privacidade" target="_blank">Ver</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.auth.logout}</p>
                <p className="text-sm text-muted-foreground">
                  Sair da sua conta no {APP_NAME}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout className="h-4 w-4 mr-2" />
                {t.auth.logout}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <IconTrash className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Apagar Conta</p>
                <p className="text-sm text-muted-foreground">
                  Exclua permanentemente sua conta e todos os dados
                </p>
              </div>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <IconTrash className="h-4 w-4 mr-2" />
                    Apagar Conta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tem certeza?</DialogTitle>
                    <DialogDescription>
                      Esta ação não pode ser desfeita. Todos os seus dados serão
                      permanentemente excluídos, incluindo:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Seu perfil e informações pessoais</li>
                        <li>Histórico de contratos e pagamentos</li>
                        <li>Saldo de tokens na carteira</li>
                        <li>Avaliações e histórico</li>
                      </ul>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Apagando...
                        </>
                      ) : (
                        <>
                          <IconTrash className="h-4 w-4 mr-2" />
                          Sim, apagar minha conta
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>{APP_NAME} v1.0.0</p>
          <p className="mt-1">© 2025 Senior Care App. Todos os direitos reservados.</p>
        </div>
      </div>
    </AppShell>
  );
}
