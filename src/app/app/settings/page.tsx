"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconUser, 
  IconMail, 
  IconPhone, 
  IconLock,
  IconBell,
  IconGlobe,
  IconMoon,
  IconWallet,
  IconLogout,
  IconExternalLink,
  IconCopy
} from "@/components/icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const isFamily = session?.user?.role === "FAMILY";

  // Mock wallet data
  const wallet = {
    address: "0x7a3d2c4e8f1b5a6d9c3e7f2a4b8d1c6e5f9a2b3c",
    balance: 2500,
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e preferências
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {session?.user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{session?.user?.name}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {isFamily ? "Família" : "Cuidador"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" defaultValue={session?.user?.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={session?.user?.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" type="tel" placeholder="+351 912 345 678" />
                </div>
              </div>
            </div>

            <Button>Salvar alterações</Button>
          </CardContent>
        </Card>

        {/* Wallet Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWallet className="h-5 w-5" />
              Carteira Digital
            </CardTitle>
            <CardDescription>Sua carteira {TOKEN_SYMBOL}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Endereço</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo</span>
                <span className="font-medium">{wallet.balance.toLocaleString()} {TOKEN_SYMBOL}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/app/wallet">
                  Ver Carteira
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href={`https://polygonscan.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <IconExternalLink className="h-4 w-4" />
                  Ver na Blockchain
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações por email</p>
                <p className="text-sm text-muted-foreground">Receba atualizações por email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações push</p>
                <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lembretes de contrato</p>
                <p className="text-sm text-muted-foreground">Avisos antes dos horários</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconGlobe className="h-5 w-5" />
              Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Idioma</p>
                <p className="text-sm text-muted-foreground">Português (PT)</p>
              </div>
              <Button variant="outline" size="sm">Alterar</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tema escuro</p>
                <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconLock className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Alterar senha
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Autenticação de dois fatores
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              Exportar chave privada da carteira
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sair da conta</p>
                <p className="text-sm text-muted-foreground">Encerrar sessão no {APP_NAME}</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
