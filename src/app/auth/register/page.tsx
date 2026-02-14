"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  IconLogo, 
  IconToken, 
  IconMail, 
  IconLock, 
  IconUser,
  IconPhone,
  IconEye, 
  IconEyeOff, 
  IconAlert,
  IconCheck,
  IconFamily,
  IconCaregiver,
  IconShield,
  IconWallet
} from "@/components/icons";
import { APP_NAME, TOKEN_NAME, TOKEN_SYMBOL, ACTIVATION_COST_EUR_CENTS } from "@/lib/constants";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get("role");

  const [step, setStep] = useState(preselectedRole ? 2 : 1);
  const [role, setRole] = useState<"FAMILY" | "CAREGIVER">(
    preselectedRole === "caregiver" ? "CAREGIVER" : preselectedRole === "family" ? "FAMILY" : "FAMILY"
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      // Redirect to payment page
      router.push(`/auth/payment?userId=${data.userId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mx-auto">
            <IconLogo className="h-10 w-10 text-primary" />
          </Link>
          <div>
            <CardTitle className="text-2xl">Criar Conta no {APP_NAME}</CardTitle>
            <CardDescription>
              {step === 1 ? "Como você quer usar a plataforma?" : "Preencha seus dados"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <IconAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  role === "FAMILY"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setRole("FAMILY")}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${role === "FAMILY" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <IconFamily className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Sou Familiar</span>
                      {role === "FAMILY" && <IconCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Procuro cuidadores para um ente querido idoso
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  role === "CAREGIVER"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setRole("CAREGIVER")}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${role === "CAREGIVER" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <IconCaregiver className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Sou Cuidador</span>
                      {role === "CAREGIVER" && <IconCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sou profissional e quero oferecer meus serviços
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                {role === "FAMILY" ? <IconFamily className="h-5 w-5" /> : <IconCaregiver className="h-5 w-5" />}
                <span className="text-sm font-medium">
                  {role === "FAMILY" ? "Conta Familiar" : "Conta Cuidador"}
                </span>
                <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setStep(1)}>
                  Alterar
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+351 912 345 678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Activation Info */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <IconShield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Taxa de Ativação</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Valor da ativação</span>
                  <Badge>€{ACTIVATION_COST_EUR_CENTS / 100}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Após o cadastro, você será redirecionado para pagamento. 
                  O valor é convertido em {TOKEN_SYMBOL} tokens na sua carteira automática.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar conta e pagar ativação"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </div>

          {/* Wallet Info */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <IconWallet className="h-4 w-4" />
              <span>Carteira digital criada automaticamente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RegisterPage() {
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
      <RegisterPageContent />
    </Suspense>
  );
}
