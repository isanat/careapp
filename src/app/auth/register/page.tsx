"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { RegisterView } from "@isanat/bloom-elements/components/evyra/views/AuthViews";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

function RegisterPageContent() {
  const router = useRouter();
  const { t } = useI18n();

  const handleNavigate = (view: string) => {
    const routes: Record<string, string> = {
      login: "/auth/login",
      "family-setup": "/app/family-setup",
      "profile-setup": "/app/profile",
    };
    router.push(routes[view] || "/auth/login");
  };

  const handleSubmitRegister = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "FAMILY" | "CAREGIVER";
  }) => {
    toast.info("A criar a sua conta...");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: data.role,
          acceptTerms: true,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.detail || "Erro ao criar conta";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      toast.success("Conta criada com sucesso! A fazer login...");

      const loginResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (loginResult?.error) {
        toast.info("Conta criada! Por favor, faça login.");
        window.location.href = `/auth/login?email=${encodeURIComponent(data.email)}`;
      } else if (loginResult?.ok) {
        if (data.role === "FAMILY") {
          toast.success("Bem-vindo! Vamos configurar a sua conta.");
          window.location.href = `/app/family-setup?userId=${responseData.userId}`;
        } else {
          toast.success("Bem-vindo! Vamos configurar o seu perfil.");
          window.location.href = `/app/profile?userId=${responseData.userId}`;
        }
      } else {
        toast.info("Conta criada! Por favor, faça login.");
        window.location.href = `/auth/login`;
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  return <RegisterView onNavigate={handleNavigate} onSubmitRegister={handleSubmitRegister} />;
}

export default function RegisterPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
          <Card className="w-full max-w-lg">
            <CardContent className="py-12 text-center">
              <p>{t.loading}</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
