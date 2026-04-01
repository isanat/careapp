import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Política de Cookies | Senior Care",
  description: "Política de cookies do Senior Care - como utilizamos cookies para melhorar a sua experiência.",
};

export default function CookiesPage() {
  return (
    
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Política de Cookies</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>O que são Cookies?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Cookies são pequenos ficheiros de texto armazenados no seu dispositivo que nos ajudam a
              melhorar a sua experiência no Senior Care. Permitem que recordemos as suas preferências e
              compreendamos como utiliza a nossa plataforma.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipos de Cookies que Usamos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Cookies Essenciais</h3>
              <p className="text-sm text-muted-foreground">
                Necessários para o funcionamento básico da plataforma. Não podem ser desativados.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Cookies de Preferências</h3>
              <p className="text-sm text-muted-foreground">
                Recordam as suas preferências como idioma e tema (claro/escuro).
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Cookies Analíticos</h3>
              <p className="text-sm text-muted-foreground">
                Ajudam-nos a compreender como utiliza a plataforma para podermos melhorá-la.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerir Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pode gerir as suas preferências de cookies nas definições do seu navegador.
              Note que desativar certos cookies pode afetar a funcionalidade da plataforma.
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          Última atualização: Janeiro de 2024
        </p>
      </div>
    
  );
}
