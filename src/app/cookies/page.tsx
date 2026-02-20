import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Política de Cookies | IdosoLink",
  description: "Política de cookies do IdosoLink - como usamos cookies para melhorar sua experiência.",
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
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo que nos ajudam a 
              melhorar sua experiência no IdosoLink. Eles permitem que lembremos suas preferências e 
              entendamos como você usa nossa plataforma.
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
                Lembram suas preferências como idioma e tema (claro/escuro).
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Cookies Analíticos</h3>
              <p className="text-sm text-muted-foreground">
                Nos ajudam a entender como você usa a plataforma para podermos melhorá-la.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você pode gerenciar suas preferências de cookies nas configurações do seu navegador. 
              Observe que desativar certos cookies pode afetar a funcionalidade da plataforma.
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          Última atualização: Janeiro de 2024
        </p>
      </div>
    
  );
}
