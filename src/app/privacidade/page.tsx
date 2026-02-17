import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconLogo } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Política de Privacidade - ${APP_NAME}`,
  description: "Política de privacidade e proteção de dados do IdosoLink.",
};

export default function PrivacidadePage() {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2024</p>

          <Card>
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2>1. Introdução</h2>
              <p>
                O {APP_NAME} está comprometido em proteger a privacidade de seus usuários. 
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e 
                protegemos suas informações pessoais.
              </p>

              <h2>2. Informações que Coletamos</h2>
              <p>Podemos coletar os seguintes tipos de informações:</p>
              <ul>
                <li><strong>Dados de identificação:</strong> nome, email, telefone, CPF/NIF</li>
                <li><strong>Dados de localização:</strong> endereço, cidade, código postal</li>
                <li><strong>Dados de perfil:</strong> foto, descrição, qualificações profissionais</li>
                <li><strong>Dados de transação:</strong> histórico de contratos, pagamentos, tokens</li>
                <li><strong>Dados de uso:</strong> logs de acesso, navegação, preferências</li>
              </ul>

              <h2>3. Como Usamos Suas Informações</h2>
              <p>Utilizamos suas informações para:</p>
              <ul>
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar transações e pagamentos</li>
                <li>Comunicar-nos com você sobre sua conta</li>
                <li>Enviar notificações relevantes sobre cuidadores e contratos</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Prevenir fraudes e garantir a segurança</li>
              </ul>

              <h2>4. Compartilhamento de Dados</h2>
              <p>
                Não vendemos suas informações pessoais. Podemos compartilhar dados com:
              </p>
              <ul>
                <li>Outros usuários (conforme necessário para contratos)</li>
                <li>Processadores de pagamento (Stripe)</li>
                <li>Autoridades legais (quando exigido por lei)</li>
                <li>Provedores de serviços essenciais (hospedagem, análise)</li>
              </ul>

              <h2>5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger 
                seus dados, incluindo:
              </p>
              <ul>
                <li>Criptografia SSL/TLS em todas as comunicações</li>
                <li>Armazenamento seguro com criptografia em repouso</li>
                <li>Controle de acesso restrito aos dados</li>
                <li>Monitoramento contínuo de segurança</li>
              </ul>

              <h2>6. Seus Direitos (RGPD/LGPD)</h2>
              <p>Você tem direito a:</p>
              <ul>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incorretos</li>
                <li>Solicitar exclusão de seus dados</li>
                <li>Portabilidade de dados</li>
                <li>Retirar consentimento a qualquer momento</li>
                <li>Opor-se a determinados tratamentos</li>
              </ul>

              <h2>7. Cookies e Tecnologias Similares</h2>
              <p>
                Utilizamos cookies essenciais para funcionamento da plataforma e cookies 
                analíticos para melhorar nossos serviços. Você pode gerenciar suas 
                preferências de cookies nas configurações do navegador.
              </p>

              <h2>8. Contato</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
                entre em contato:
              </p>
              <ul>
                <li>Email: privacidade@idosolink.com</li>
                <li>Endereço: Av. da Liberdade, 123, 1250-096 Lisboa, Portugal</li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
