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
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

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
        err instanceof Error ? err.message : "Erro ao redefinir senha",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={cn("min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background", tokens.spacing.paddingX.mobile, tokens.spacing.paddingY.mobile)}>
      <Card className={cn("w-full max-w-md")}>
        <CardHeader className={cn("text-center", tokens.spacing.space.base)}>
          <Link
            href="/"
            className={cn("inline-flex items-center justify-center", tokens.spacing.gap.sm, "mx-auto")}
          >
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <div>
            <CardTitle className={cn(tokens.typography.sizes.h4)}>
              {t.auth?.resetPassword || "Redefinir Senha"}
            </CardTitle>
            <CardDescription>
              Introduza a sua nova senha abaixo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className={tokens.spacing.space.base}>
          {errorMessage && (
            <div className={cn("flex items-center", tokens.spacing.gap.sm, tokens.spacing.padding.tight, "bg-destructive/10 text-destructive", tokens.radius.sm, tokens.typography.sizes.sm)}>
              <IconAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className={cn("text-center", tokens.spacing.space.base)}>
              <div className={cn("w-16 h-16 bg-green-500/10", tokens.radius.full, "flex items-center justify-center mx-auto")}>
                <IconCheck className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className={cn(tokens.typography.weights.semibold, tokens.typography.sizes.lg)}>
                  Senha redefinida com sucesso!
                </h2>
                <p className={cn("text-muted-foreground", tokens.typography.sizes.sm, tokens.spacing.gap.xs)}>
                  Pode agora iniciar sessão com a sua nova senha.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login">Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={tokens.spacing.space.base}>
              <div className={tokens.spacing.space.xs}>
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

              <div className={tokens.spacing.space.xs}>
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

              <div className={cn("text-center", tokens.typography.sizes.sm, "text-muted-foreground")}>
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
