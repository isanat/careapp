"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoginView } from "../../../bloom-elements/src/components/evyra/views/AuthViews";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
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
