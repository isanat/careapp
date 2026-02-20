import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "GDPR - Proteção de Dados | IdosoLink",
  description: "Como o IdosoLink cumpre o Regulamento Geral de Proteção de Dados da UE.",
};

export default function GDPRPage() {
  return (
    
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">GDPR - Proteção de Dados</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seus Direitos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              O Regulamento Geral sobre a Proteção de Dados (GDPR) garante direitos fundamentais 
              sobre seus dados pessoais. No IdosoLink, respeitamos todos esses direitos:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li><strong>Direito de Acesso:</strong> Você pode solicitar uma cópia de todos os seus dados</li>
              <li><strong>Direito de Retificação:</strong> Você pode corrigir dados incorretos ou incompletos</li>
              <li><strong>Direito de Eliminação:</strong> Você pode solicitar a exclusão de seus dados</li>
              <li><strong>Direito de Portabilidade:</strong> Você pode receber seus dados em formato estruturado</li>
              <li><strong>Direito de Oposição:</strong> Você pode se opor a certos tratamentos de dados</li>
              <li><strong>Direito de Limitação:</strong> Você pode limitar como usamos seus dados</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados que Coletamos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Dados de identificação (nome, email, telefone)</li>
              <li>Dados de perfil (para cuidadores: experiência, serviços)</li>
              <li>Dados de transação (pagamentos, contratos)</li>
              <li>Dados técnicos (IP, navegador, dispositivo)</li>
              <li>Dados de comunicação (mensagens no chat)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Base Legal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tratamos seus dados com base em: execução de contrato, consentimento explícito, 
              cumprimento de obrigações legais, e legítimo interesse para melhorar nossos serviços.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato do DPO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Para exercer seus direitos ou esclarecer dúvidas sobre proteção de dados:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> dpo@idosolink.com
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          Última atualização: Janeiro de 2024
        </p>
      </div>
    
  );
}
