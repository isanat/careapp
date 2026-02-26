"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconLogo, 
  IconCare, 
  IconTrust, 
  IconFamily,
  IconCaregiver,
  IconGlobe,
  IconMail,
  IconPhone,
  IconChevronRight
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export default function SobrePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              Nossa História
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sobre o {APP_NAME}
            </h1>
            <p className="text-lg text-muted-foreground">
              Somos uma empresa de tecnologia com propósito: transformar o cuidado de idosos 
              através de confiança, transparência e valorização profissional.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Nossa Missão</h2>
              <p className="text-muted-foreground mb-6">
                O {APP_NAME} nasceu da observação de um problema real: famílias lutando para 
                encontrar cuidadores de confiança, e cuidadores profissionais sem reconhecimento 
                ou valorização adequada.
              </p>
              <p className="text-muted-foreground mb-6">
                Usamos tecnologia blockchain de forma invisível para resolver problemas humanos: 
                garantir que contratos sejam imutáveis, pagamentos sejam seguros e cuidadores 
                sejam valorizados a longo prazo.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-xl">
                  <IconCare className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Cuidado</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-xl">
                  <IconTrust className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Confiança</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-xl">
                  <IconFamily className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Valor</p>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6">Nossos Números</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">2.500+</p>
                    <p className="text-sm text-muted-foreground">Cuidadores ativos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">15.000+</p>
                    <p className="text-sm text-muted-foreground">Famílias atendidas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">50.000+</p>
                    <p className="text-sm text-muted-foreground">Horas de cuidado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">3</p>
                    <p className="text-sm text-muted-foreground">Países</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossos Valores</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Humanidade</h3>
                <p className="text-muted-foreground">
                  Tecnologia a serviço das pessoas. Cada decisão considera o impacto 
                  em famílias e cuidadores.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconTrust className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Transparência</h3>
                <p className="text-muted-foreground">
                  Contratos imutáveis, taxas claras, sem surpresas. Tudo registrado 
                  e verificável na blockchain.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCaregiver className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Valorização</h3>
                <p className="text-muted-foreground">
                  Cuidadores merecem reconhecimento. Nossos tokens permitem que 
                  ganhem e valorizem seu trabalho.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossa Equipe</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Profissionais apaixonados por tecnologia e cuidados de saúde.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Ana Silva", role: "CEO & Co-founder", initials: "AS" },
              { name: "Carlos Santos", role: "CTO & Co-founder", initials: "CS" },
              { name: "Maria Costa", role: "Head of Care", initials: "MC" },
              { name: "João Pereira", role: "Head of Product", initials: "JP" },
            ].map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{member.initials}</span>
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Entre em Contato</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Estamos aqui para ajudar. Entre em contato conosco.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <IconMail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground text-sm">contato@idosolink.com</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <IconPhone className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Telefone</h3>
                <p className="text-muted-foreground text-sm">+351 210 000 000</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <IconGlobe className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Localização</h3>
                <p className="text-muted-foreground text-sm">Lisboa, Portugal</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Junte-se a nós</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            Faça parte da transformação do cuidado de idosos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Sou Família
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/auth/register?role=caregiver">
                Sou Cuidador
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
