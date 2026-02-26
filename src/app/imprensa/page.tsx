import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Imprensa | IdosoLink",
  description: "Contato para imprensa e mídia - IdosoLink",
};

export default function ImprensaPage() {
  return (
    
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Imprensa</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sobre o IdosoLink</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O IdosoLink é a primeira plataforma de cuidado de idosos com tokens blockchain 
              na Europa. Conectamos famílias a cuidadores verificados, com pagamentos transparentes 
              e contratos digitais seguros.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contato de Imprensa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">imprensa@idosolink.com</p>
            </div>
            <div>
              <h3 className="font-semibold">Telefone</h3>
              <p className="text-muted-foreground">+351 21 234 5678</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kit de Mídia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Para obter nosso kit de mídia com logos, fotos e informações corporativas, 
              entre em contato pelo email de imprensa.
            </p>
            <Button variant="outline">
              Solicitar Kit de Mídia
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fatos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Fundado em 2024</li>
              <li>Sede em Lisboa, Portugal</li>
              <li>Operando em Portugal e Itália</li>
              <li>Token próprio: SeniorToken (SENT)</li>
              <li>Blockchain: Polygon</li>
              <li>Mais de 500 cuidadores cadastrados</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    
  );
}
