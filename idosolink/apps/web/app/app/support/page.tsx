import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Suporte humano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text2">
            Estamos aqui para orientar famílias e cuidadores com atenção e linguagem simples.
          </p>
          <Button>Falar com o suporte</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text2">
          <p>Como funcionam os créditos? Eles cobrem taxas de contrato e bônus.</p>
          <p>Posso cancelar um contrato? Sim, com regras claras definidas na proposta.</p>
          <p>Como garantir segurança? Registramos uma prova digital de cada contrato.</p>
        </CardContent>
      </Card>
    </div>
  );
}
