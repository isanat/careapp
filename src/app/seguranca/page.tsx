import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconShield, IconLock, IconCheck, IconAlert } from "@/components/icons";

export const metadata: Metadata = {
  title: "Segurança | IdosoLink",
  description: "Saiba como o IdosoLink protege seus dados e garante transações seguras.",
};

export default function SegurancaPage() {
  return (
    
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Segurança</h1>
        <p className="text-muted-foreground mb-8">
          Sua segurança e privacidade são nossa prioridade máxima.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLock className="h-5 w-5 text-primary" />
                Dados Protegidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Todos os dados são criptografados com TLS 1.3. Senhas são armazenadas com hash bcrypt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5 text-primary" />
                Blockchain Segura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tokens na blockchain Polygon, uma das redes mais seguras e eficientes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-primary" />
                Cuidadores Verificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sistema de verificação KYC para cuidadores que desejam mais credibilidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlert className="h-5 w-5 text-primary" />
                Contratos Imutáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contratos digitais registrados na blockchain para segurança jurídica.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conformidade com LGPD/GDPR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Estamos em total conformidade com a Lei Geral de Proteção de Dados (LGPD) do Brasil 
              e o Regulamento Geral sobre a Proteção de Dados (GDPR) da União Europeia.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Direito de acesso aos seus dados</li>
              <li>Direito de retificação</li>
              <li>Direito de eliminação</li>
              <li>Direito de portabilidade</li>
              <li>Consentimento explícito para coleta de dados</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          Para reportar vulnerabilidades de segurança: seguranca@idosolink.com
        </p>
      </div>
    
  );
}
