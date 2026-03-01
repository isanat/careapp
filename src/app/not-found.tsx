import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">
            404
          </div>
          <CardTitle>Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            A página que procura não existe ou foi movida.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button>Ir para o início</Button>
            </Link>
            <Link href="/ajuda">
              <Button variant="outline">Ajuda</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
