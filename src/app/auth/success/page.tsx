"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLogo, IconCheck, IconWallet, IconToken, IconArrowUp } from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <IconCheck className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-2xl">Conta Ativada!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Parabéns! Sua conta foi ativada com sucesso.</p>
            <p>Você está pronto para começar a usar o {APP_NAME}.</p>
          </div>

          {/* What happened */}
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <IconWallet className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Carteira Criada</p>
                <p className="text-sm text-muted-foreground">Sua carteira digital foi criada automaticamente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconToken className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Tokens Creditados</p>
                <p className="text-sm text-muted-foreground">Você recebeu seus primeiros {TOKEN_SYMBOL} tokens</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconArrowUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Valorização Potencial</p>
                <p className="text-sm text-muted-foreground">Seus tokens podem valorizar com o crescimento da plataforma</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Próximos passos:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Complete seu perfil</li>
              <li>Verifique sua conta para mais credibilidade</li>
              <li>Comece a buscar cuidadores ou receba propostas</li>
            </ul>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/app/dashboard">
              Ir para o Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <p>Carregando...</p>
          </CardContent>
        </Card>
      </main>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
