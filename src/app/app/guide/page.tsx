"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconBook, 
  IconCheck, 
  IconHeart, 
  IconClock, 
  IconPhone, 
  IconShield,
  IconUser,
  IconAlertCircle,
  IconLoader2,
  IconHome,
  IconPill
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

export default function GuidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Check if already accepted
    const checkAcceptance = async () => {
      try {
        const response = await fetch("/api/guide/status");
        if (response.ok) {
          const data = await response.json();
          setHasAccepted(data.accepted);
        }
      } catch (err) {
        console.error("Error checking guide acceptance:", err);
      }
    };

    if (status === "authenticated") {
      checkAcceptance();
    }
  }, [status]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/guide/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setHasAccepted(true);
      }
    } catch (err) {
      console.error("Error accepting guide:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFamily = session?.user?.role === "FAMILY";

  const guideSections = [
    {
      icon: IconHeart,
      title: "Cuidados Pessoais e Dignidade",
      tips: [
        "Respeite a privacidade do idoso durante o banho e higiene pessoal",
        "Mantenha a comunicação clara e respeitosa durante os cuidados",
        "Preserve a autonomia do idoso sempre que possível",
        "Use linguagem adequada e evite infantilizar"
      ]
    },
    {
      icon: IconPill,
      title: "Administração de Medicação",
      tips: [
        "Verifique sempre os horários e dosagens prescritas",
        "Mantenha registro escrito de todas as medicações administradas",
        "Observe e reporte qualquer reação adversa",
        "Nunca administre medicamentos sem prescrição médica"
      ]
    },
    {
      icon: IconClock,
      title: "Rotina e Pontualidade",
      tips: [
        "Chegue no horário combinado e avise com antecedência em caso de atraso",
        "Siga a rotina estabelecida pela família",
        "Registre o horário de entrada e saída",
        "Mantenha comunicação regular com a família"
      ]
    },
    {
      icon: IconPhone,
      title: "Comunicação com a Família",
      tips: [
        "Informe a família sobre qualquer mudança no estado do idoso",
        "Reporte incidentes ou quedas imediatamente",
        "Mantenha confidencialidade sobre assuntos familiares",
        "Use o chat da plataforma para comunicação oficial"
      ]
    },
    {
      icon: IconShield,
      title: "Segurança e Emergências",
      tips: [
        "Conheça os números de emergência e contatos da família",
        "Mantenha o ambiente livre de obstáculos",
        "Esteja atento a sinais de alerta (quedas, confusão, etc.)",
        "Conheça a localização de extintores e saídas de emergência"
      ]
    },
    {
      icon: IconUser,
      title: "Ética Profissional",
      tips: [
        "Mantenha limites profissionais apropriados",
        "Não aceite presentes de valor significativo",
        "Não compartilhe informações pessoais da família",
        "Respeite as crenças e preferências do idoso"
      ]
    }
  ];

  if (status === "loading") {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6 max-w-3xl">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            <IconBook className="h-3 w-3 mr-1" />
            Guia de Boas Práticas
          </Badge>
          <h1 className="text-3xl font-bold mb-2">
            Guia de Boas Práticas para Cuidados
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Recomendações para garantir qualidade e segurança nos cuidados ao idoso. 
            Este guia é opcional e serve como referência para melhores resultados.
          </p>
        </div>

        {/* Already Accepted Banner */}
        {hasAccepted && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-4 flex items-center gap-3">
              <IconCheck className="h-5 w-5 text-green-500" />
              <span className="text-green-700">
                Você já confirmou que leu e compreendeu este guia.
              </span>
            </CardContent>
          </Card>
        )}

        {/* Guide Sections */}
        {guideSections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start gap-2">
                    <IconCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {/* Additional Resources */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconHome className="h-5 w-5" />
              Recursos Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 bg-background rounded-lg border">
                <p className="font-medium text-sm">Linha de Saúde 24</p>
                <p className="text-xs text-muted-foreground">808 24 24 24</p>
              </div>
              <div className="p-3 bg-background rounded-lg border">
                <p className="font-medium text-sm">Emergência Médica</p>
                <p className="text-xs text-muted-foreground">112</p>
              </div>
              <div className="p-3 bg-background rounded-lg border">
                <p className="font-medium text-sm">APAV - Apoio à Vítima</p>
                <p className="text-xs text-muted-foreground">808 200 204</p>
              </div>
              <div className="p-3 bg-background rounded-lg border">
                <p className="font-medium text-sm">Linha Idosos</p>
                <p className="text-xs text-muted-foreground">808 200 204</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptance Section */}
        <Card className={hasAccepted ? "border-green-500/20" : "border-primary/20"}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept"
                checked={accepted || hasAccepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
                disabled={hasAccepted}
              />
              <Label htmlFor="accept" className="text-sm leading-relaxed cursor-pointer">
                Li e compreendo as boas práticas descritas neste guia. 
                Entendo que estas são recomendações e que a responsabilidade pela 
                execução dos cuidados é minha como profissional ou familiar.
              </Label>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <IconAlertCircle className="h-4 w-4 inline mr-2" />
              Este guia é fornecido como referência. A plataforma IdosoLink atua 
              como intermediário tecnológico e não se responsabiliza pela execução 
              dos serviços contratados.
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                {t.back}
              </Button>
              <Button 
                onClick={handleAccept}
                disabled={!accepted || isSubmitting || hasAccepted}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : hasAccepted ? (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Confirmado
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Confirmar Leitura
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
