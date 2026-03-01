"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { IconLogo, IconAlert, IconCheck } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    if (!token || !email) {
      setErrorMessage("Link de redefinição inválido.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao redefinir senha"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 mx-auto"
          >
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <div>
            <CardTitle className="text-2xl">
              {t.auth?.resetPassword || "Redefinir Senha"}
            </CardTitle>
            <CardDescription>
              Introduza a sua nova senha abaixo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <IconAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <IconCheck className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  Senha redefinida com sucesso!
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Pode agora iniciar sessão com a sua nova senha.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login">Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "A redefinir..." : "Redefinir Senha"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Voltar ao Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
