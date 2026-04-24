"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoginView } from "@isanat/bloom-elements";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { tokens, cn, getCardClasses, getHeadingClasses, getBadgeClasses } from "@/lib/design-tokens";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/dashboard";
  const { t } = useI18n();

  const handleNavigate = (view: string) => {
    const routes: Record<string, string> = {
      register: "/auth/register",
      dashboard: callbackUrl,
    };
    router.push(routes[view] || "/app/dashboard");
  };

  const handleSubmit = async (email: string, password: string) => {
    if (!email || !password) {
      const msg = "Por favor, preencha todos os campos";
      toast.error(msg);
      throw new Error(msg);
    }

    toast.info("A verificar credenciais...");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const msg = "Email ou senha incorretos. Verifique seus dados e tente novamente.";
        toast.error(msg);
        throw new Error(msg);
      } else if (result?.ok) {
        toast.success("Login efetuado com sucesso! A redirecionar...");
        window.location.href = callbackUrl;
      } else {
        toast.error(t.error);
        throw new Error(t.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  return <LoginView onNavigate={handleNavigate} onSubmit={handleSubmit} />;
}

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div className={cn("min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background", tokens.spacing.paddingX.mobile, tokens.spacing.paddingY.mobile)}>
          <Card className={cn("w-full max-w-md")}>
            <CardContent className={cn(tokens.spacing.padding.cardLarge, "text-center")}>
              <p>{t.loading}</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
