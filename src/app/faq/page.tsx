import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Perguntas Frequentes | Evyra",
  description: "FAQ - Respostas para as perguntas mais frequentes sobre o Evyra.",
};

const faqs = [
  {
    question: "Como funciona o Evyra?",
    answer: "O Evyra conecta famílias que precisam de cuidados para idosos com cuidadores verificados. Pode pesquisar cuidadores, ver perfis detalhados e criar contratos digitais seguros.",
  },
  {
    question: "Quanto custa usar a plataforma?",
    answer: "A activação da conta custa €35 (única vez). Cada contrato criado tem uma taxa de €5. A plataforma retém 10% sobre os pagamentos de serviços.",
  },
  {
    question: "Como os cuidadores são verificados?",
    answer: "Oferecemos verificação de identidade (KYC) opcional para cuidadores. Os verificados recebem um selo de confiança e aparecem primeiro nas pesquisas.",
  },
  {
    question: "Como funcionam os pagamentos?",
    answer: "Aceitamos Stripe (cartão de crédito) e Easypay (Multibanco, MB Way). Os pagamentos são processados de forma segura e o saldo é creditado automaticamente.",
  },
  {
    question: "Posso cancelar um contrato?",
    answer: "Sim, contratos podem ser cancelados com acordo mútuo. Verifique os termos específicos no momento da criação do contrato.",
  },
  {
    question: "A plataforma está disponível em quais países?",
    answer: "Actualmente atendemos Portugal, Itália e outros países da União Europeia, com expansão planeada para outros mercados.",
  },
  {
    question: "Como entro em contato com o suporte?",
    answer: "Pode contactar-nos através da página de Contacto ou enviar email para suporte@seniorcare.com.",
  },
];

export default function FAQPage() {
  return (
    
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Perguntas Frequentes</h1>
        <p className="text-muted-foreground mb-8">
          Encontre respostas para as dúvidas mais comuns sobre o Evyra.
        </p>

        <Card>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Não encontrou sua resposta?{" "}
            <a href="/contato" className="text-primary hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    
  );
}
