"use client";

import { useState } from "react";
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
import { IconLogo, IconMail, IconAlert, IconCheck } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reset email");
      }

      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t.forgotPassword.sendError,
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
            <CardTitle className={cn(tokens.typography.sizes.h4)}>{t.forgotPassword.title}</CardTitle>
            <CardDescription>{t.forgotPassword.description}</CardDescription>
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
                  {t.forgotPassword.emailSent}
                </h2>
                <p className={cn("text-muted-foreground", tokens.typography.sizes.sm, tokens.spacing.gap.xs)}>
                  {t.forgotPassword.checkInbox}
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login">{t.forgotPassword.backToLogin}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={tokens.spacing.space.base}>
              <div className={tokens.spacing.space.xs}>
                <Label htmlFor="email">{t.forgotPassword.emailLabel}</Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t.forgotPassword.sending
                  : t.forgotPassword.sendReset}
              </Button>

              <div className={cn("text-center", tokens.typography.sizes.sm, "text-muted-foreground")}>
                {t.forgotPassword.rememberedPassword}{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  {t.forgotPassword.loginLink}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
