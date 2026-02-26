import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLogo, IconFamily, IconCaregiver, IconToken, IconShield } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Central de Ajuda - ${APP_NAME}`,
  description: "Tire suas dúvidas sobre o IdosoLink. Perguntas frequentes e suporte.",
};

const faqs = [
  {
    category: "Para Famílias",
    icon: IconFamily,
    questions: [
      {
        q: "Como encontro um cuidador?",
        a: "Após criar sua conta, acesse a busca de cuidadores. Você pode filtrar por tipo de serviço, localização, disponibilidade e avaliações de outras famílias."
      },
      {
        q: "Como funciona o pagamento?",
        a: "Você paga mensalmente pelo serviço contratado. O valor é calculado com base nas horas acordadas. A plataforma retém uma pequena taxa para garantir a segurança da transação."
      },
      {
        q: "Posso trocar de cuidador?",
        a: "Sim. Se não estiver satisfeito, você pode encerrar o contrato atual e buscar um novo cuidador. Recomendamos sempre conversar antes para resolver possíveis problemas."
      }
    ]
  },
  {
    category: "Para Cuidadores",
    icon: IconCaregiver,
    questions: [
      {
        q: "Como me cadastro como cuidador?",
        a: "Clique em 'Criar Conta', selecione a opção 'Sou Cuidador' e preencha seus dados profissionais. Após verificação, seu perfil estará visível para famílias."
      },
      {
        q: "Quanto custa usar a plataforma?",
        a: "O cadastro é gratuito. Cobramos uma pequena taxa (5%) sobre cada pagamento recebido para manter a plataforma e garantir sua segurança."
      },
      {
        q: "Como recebo meus pagamentos?",
        a: "Os pagamentos são depositados automaticamente em sua carteira digital. Você pode sacar para sua conta bancária a qualquer momento."
      }
    ]
  },
  {
    category: "Tokens e Blockchain",
    icon: IconToken,
    questions: [
      {
        q: "O que são os tokens SENT?",
        a: "SENT (SeniorToken) é o token nativo da plataforma. Ele é usado para taxas de contrato, gorjetas e recompensas. Pode valorizar com o crescimento da plataforma."
      },
      {
        q: "Como ganho tokens?",
        a: "Você recebe tokens ao ativar sua conta. Também pode ganhar através de bônus por indicação, gorjetas e participando do programa de fidelidade."
      }
    ]
  },
  {
    category: "Segurança",
    icon: IconShield,
    questions: [
      {
        q: "Como vocês verificam os cuidadores?",
        a: "Realizamos verificação de identidade, antecedentes criminais e validamos certificações profissionais. Cuidadores verificados têm um selo em seu perfil."
      },
      {
        q: "Meus dados estão seguros?",
        a: "Sim. Utilizamos criptografia de ponta a ponta, seguimos as normas RGPD/LGPD e não vendemos seus dados. Seus contratos são registrados na blockchain para garantir transparência."
      }
    ]
  }
];

export default function AjudaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <IconLogo className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Central de Ajuda</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns ou entre em contato com nosso suporte.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((section) => (
            <Card key={section.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-primary" />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {section.questions.map((faq, index) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <h3 className="font-semibold mb-2">{faq.q}</h3>
                      <p className="text-muted-foreground">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-2">Não encontrou o que procurava?</h2>
              <p className="text-muted-foreground mb-4">
                Nossa equipe de suporte está pronta para ajudar você.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/contato">Falar com Suporte</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:suporte@idosolink.com">suporte@idosolink.com</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
