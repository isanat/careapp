"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAlert } from "@/components/icons";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <IconAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Erro na aplicação</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Ref: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={reset}>Tentar novamente</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/app/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
