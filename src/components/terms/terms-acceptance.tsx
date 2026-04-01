"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconShield, IconFile, IconLock, IconHandshake } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface TermsAcceptanceProps {
  acceptTerms: boolean;
  onAcceptChange: (accepted: boolean) => void;
  showDetailed?: boolean;
}

const TERMS_CONTENT = {
  terms_of_use: {
    titleKey: "terms.termsOfUse",
    icon: IconFile,
    content: `
# Termos de Uso

## 1. Aceitação dos Termos
Ao aceder e utilizar a plataforma Evyra, o utilizador concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não deve utilizar a nossa plataforma.

## 2. Descrição do Serviço
O Evyra é uma plataforma digital que conecta famílias a profissionais de apoio domiciliário verificados. A plataforma não presta serviços de cuidado diretamente, mas facilita a conexão segura entre as partes.

## 3. Registo e Conta
- O utilizador deve fornecer informações verdadeiras e precisas durante o registo
- É responsável por manter a confidencialidade da sua conta
- Deve ter pelo menos 18 anos para utilizar a plataforma
- Aceita que as suas informações serão processadas conforme a nossa Política de Privacidade

## 4. Responsabilidades do Utilizador
Como Familiar:
- Fornecer informações precisas sobre as necessidades de apoio domiciliário
- Pagar pontualmente os serviços contratados
- Tratar cuidadores com respeito e dignidade

Como Cuidador:
- Fornecer informações verdadeiras sobre qualificações
- Prestar serviços com profissionalismo e ética
- Cumprir os horários e tarefas acordadas

## 5. Sistema de Pagamentos
A plataforma utiliza um sistema de pagamentos seguro:
- Pagamentos processados através de parceiros certificados
- Proteção de dados financeiros conforme RGPD
- Cuidadores recebem pagamentos após conclusão de serviços

## 6. Taxas
- Taxa de ativação: €25 (única)
- Taxa de contrato: €5 por contrato
- Taxa de plataforma: 15% sobre transações

## 7. Verificação (KYC)
Cuidadores devem passar por verificação de identidade (Know Your Customer) através do nosso parceiro Didit. Esta verificação inclui:
- Confirmação de identidade
- Verificação de antecedentes
- Validação de documentos

## 8. Cancelamento e Reembolso
- Contratos podem ser cancelados com 24h de antecedência
- Reembolsos são processados em até 5 dias úteis
- Taxas de plataforma não são reembolsáveis

## 9. Proibições
É proibido:
- Usar a plataforma para atividades ilegais
- Fornecer informações falsas
- Assediar ou discriminar outros utilizadores
- Tentar fraudar o sistema de pagamentos

## 10. Limitação de Responsabilidade
O Evyra não se responsabiliza por:
- Danos decorrentes de serviços prestados por cuidadores
- Interrupções no serviço por força maior
- Perda de dados por falhas técnicas

## 11. Alterações nos Termos
Podemos alterar estes termos a qualquer momento. Notificaremos sobre mudanças significativas por email ou através da plataforma.

## 12. Foro e Legislação
Estes termos são regidos pela legislação portuguesa. Qualquer litígio será resolvido no foro de Lisboa, Portugal.

Versão: 1.0
Última atualização: Janeiro 2025
    `
  },
  privacy_policy: {
    titleKey: "terms.privacyPolicy",
    icon: IconLock,
    content: `
# Política de Privacidade

## 1. Introdução
O Evyra está comprometido com a proteção dos seus dados pessoais. Esta política descreve como recolhemos, utilizamos e protegemos as suas informações.

## 2. Dados Recolhidos
Recolhemos os seguintes dados:
- **Dados de identificação:** nome, email, telefone, foto
- **Dados de localização:** endereço, cidade, código postal
- **Dados profissionais:** qualificações, experiência (para cuidadores)
- **Dados financeiros:** histórico de pagamentos, tokens
- **Dados técnicos:** endereço IP, dispositivo, navegador

## 3. Finalidade do Tratamento
Os seus dados são utilizados para:
- Prestação dos serviços da plataforma
- Verificação de identidade (KYC)
- Comunicação entre utilizadores
- Cumprimento de obrigações legais
- Melhoria dos serviços

## 4. Base Legal
O tratamento de dados pessoais é realizado com base em:
- Execução de contrato
- Consentimento do titular
- Obrigação legal
- Interesse legítimo

## 5. Partilha de Dados
Podemos partilhar dados com:
- Outros utilizadores (para prestação de serviços)
- Parceiros de verificação (Didit)
- Processadores de pagamento (Stripe)
- Autoridades públicas (quando exigido por lei)

## 6. Direitos do Titular
O utilizador tem direito a:
- Aceder aos seus dados pessoais
- Corrigir dados incorretos
- Solicitar eliminação de dados
- Portabilidade de dados
- Opor-se ao tratamento
- Retirar consentimento

## 7. Segurança
Implementámos medidas técnicas e organizacionais para proteger os seus dados:
- Criptografia de dados sensíveis
- Controle de acesso restrito
- Monitoramento contínuo
- Backup regular

## 8. Retenção de Dados
Mantemos os seus dados enquanto:
- A sua conta estiver activa
- Exigido por lei
- Necessário para finalidades legítimas

## 9. Transferência Internacional
Alguns dados podem ser processados fora do Espaço Económico Europeu, sempre com garantias adequadas.

## 10. Cookies
Utilizamos cookies para:
- Funcionamento da plataforma
- Análise de uso
- Personalização de experiência

## 11. Contato
Para questões de privacidade, entre em contato:
- Email: privacidade@seniorcare.pt
- Endereço: Lisboa, Portugal

## 12. Alterações
Esta política pode ser atualizada. Notificaremos sobre mudanças significativas.

Versão: 1.0
Última atualização: Janeiro 2025
    `
  },
  mediation_policy: {
    titleKey: "terms.mediationPolicy",
    icon: IconHandshake,
    content: `
# Política de Mediação

## 1. Introdução
O Evyra oferece um serviço de mediação para resolver disputas entre familiares e cuidadores de forma justa e eficiente.

## 2. Escopo
Esta política se aplica a:
- Disputas sobre qualidade de serviços
- Divergências sobre valores pagos
- Questões relacionadas com cancelamentos
- Outros conflitos entre utilizadores

## 3. Processo de Mediação

### 3.1. Abertura de Disputa
1. O utilizador deve abrir uma disputa através da plataforma
2. Descrever detalhadamente o problema
3. Anexar evidências (fotos, mensagens, etc.)
4. Indicar a solução desejada

### 3.2. Análise Inicial
- Nossa equipe analisa a disputa em até 48h
- Ambas as partes são notificadas
- Prazo de 7 dias para resposta do outro lado

### 3.3. Mediação
- Um mediador é designado
- Reunião com ambas as partes (se necessário)
- Proposta de resolução em até 14 dias

### 3.4. Decisão
- Se acordo for alcançado, é formalizado na plataforma
- Se não houver acordo, o caso pode ser escalado

## 4. Retenção de Valores
Durante a disputa:
- Valores em disputa ficam retidos em escrow
- Liberação apenas após resolução
- Possibilidade de reembolso parcial

## 5. Proibições
Durante o processo de mediação, é proibido:
- Contatar diretamente a outra parte de forma inadequada
- Fazer ameaças ou intimidação
- Fornecer informações falsas

## 6. Custos
- Primeira mediação: gratuita
- Mediações subsequentes: taxa de €25
- Custos de arbitragem (se necessário): divididos entre partes

## 7. Prazos
- Abertura: até 30 dias após o fato
- Resposta: 7 dias
- Resolução: até 30 dias
- Recurso: 5 dias após decisão

## 8. Confidencialidade
Todo o processo de mediação é confidencial. As partes não podem divulgar informações sem consentimento.

## 9. Decisões Finais
As decisões do mediador são:
- Baseadas em evidências e termos da plataforma
- Registradas com timestamp e identificador único
- Vinculantes para ambas as partes

## 10. Recursos Legais
A mediação não impede:
- Acesso ao sistema judicial
- Reclamações a autoridades de proteção ao consumidor
- Outros meios de resolução de conflitos

Versão: 1.0
Última atualização: Janeiro 2025
    `
  }
};

export function TermsAcceptance({ acceptTerms, onAcceptChange, showDetailed = false }: TermsAcceptanceProps) {
  const { t } = useI18n();
  const [selectedTerm, setSelectedTerm] = useState<keyof typeof TERMS_CONTENT | null>(null);

  const handleCheckboxChange = (checked: boolean) => {
    onAcceptChange(checked);
  };

  const getTermTitle = (key: string) => {
    const titles: Record<string, string> = {
      terms_of_use: t.register?.termsOfUse || "Termos de Uso",
      privacy_policy: t.register?.privacyPolicy || "Política de Privacidade",
      mediation_policy: "Política de Mediação",
    };
    return titles[key] || key;
  };

  return (
    <div className="space-y-4">
      {/* Main acceptance checkbox */}
      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border">
        <Checkbox
          id="terms"
          checked={acceptTerms}
          onCheckedChange={handleCheckboxChange}
          className="mt-0.5"
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="terms"
            className="text-sm cursor-pointer leading-relaxed"
          >
            {t.register?.acceptTerms || "Li e aceito os"}{" "}
            <button
              type="button"
              onClick={() => setSelectedTerm("terms_of_use")}
              className="text-primary hover:underline font-medium"
            >
              {t.register?.termsOfUse || "Termos de Uso"}
            </button>
            {", "}
            <button
              type="button"
              onClick={() => setSelectedTerm("privacy_policy")}
              className="text-primary hover:underline font-medium"
            >
              {t.register?.privacyPolicy || "Política de Privacidade"}
            </button>
            {" "}e{" "}
            <button
              type="button"
              onClick={() => setSelectedTerm("mediation_policy")}
              className="text-primary hover:underline font-medium"
            >
              {"Política de Mediação"}
            </button>
          </label>
          <p className="text-xs text-muted-foreground">
            {t.register?.termsInfo || "Ao aceitar, concorda com os nossos termos e políticas. O seu aceite será registado com data, hora e IP para sua segurança."}
          </p>
        </div>
      </div>

      {/* Quick links to view terms */}
      {showDetailed && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.entries(TERMS_CONTENT).map(([key, term]) => {
            const IconComponent = term.icon;
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="h-auto py-3 flex flex-col gap-1"
                onClick={() => setSelectedTerm(key as keyof typeof TERMS_CONTENT)}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-xs">{getTermTitle(key)}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Legal notice */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-xs text-muted-foreground">
        <IconShield className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p>
          <strong className="text-foreground">{t.register?.legalNotice || "Aviso Legal"}:</strong>{" "}
          {t.register?.legalNoticeText || "O seu aceite será registado electronicamente com data, hora e endereço IP para fins de prova legal, conforme regulamento RGPD."}
        </p>
      </div>

      {/* Term detail dialog */}
      <Dialog open={!!selectedTerm} onOpenChange={() => setSelectedTerm(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTerm && (() => {
                const IconComponent = TERMS_CONTENT[selectedTerm].icon;
                return <IconComponent className="h-5 w-5" />;
              })()}
              {selectedTerm && getTermTitle(selectedTerm)}
            </DialogTitle>
            <DialogDescription>
              Versão 1.0 - Janeiro 2025
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedTerm && (
                <div className="whitespace-pre-wrap text-sm">
                  {TERMS_CONTENT[selectedTerm].content}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedTerm(null)}>
              {t.close || "Fechar"}
            </Button>
            <Button 
              onClick={() => {
                onAcceptChange(true);
                setSelectedTerm(null);
              }}
            >
              {t.accept || "Aceitar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TermsAcceptance;
