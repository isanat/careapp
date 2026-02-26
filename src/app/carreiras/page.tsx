import { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Carreiras | IdosoLink",
  description: "Junte-se à equipe do IdosoLink - vagas disponíveis",
};

const jobs = [
  {
    title: "Desenvolvedor Full Stack",
    location: "Lisboa / Remoto",
    type: "Full-time",
    department: "Engenharia",
  },
  {
    title: "Product Manager",
    location: "Lisboa / Remoto",
    type: "Full-time",
    department: "Produto",
  },
  {
    title: "Customer Success Manager",
    location: "Lisboa",
    type: "Full-time",
    department: "Operações",
  },
  {
    title: "Marketing Manager",
    location: "Lisboa / Remoto",
    type: "Full-time",
    department: "Marketing",
  },
];

export default function CarreirasPage() {
  return (
    
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Carreiras</h1>
        <p className="text-muted-foreground mb-8">
          Junte-se a nós e ajude a transformar o cuidado de idosos na Europa.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Por que IdosoLink?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Startup em crescimento com impacto social real</li>
              <li>Trabalho remoto ou híbrido</li>
              <li>Equipa multicultural e diversa</li>
              <li>Participação em tokens (stock options)</li>
              <li>Ambiente de aprendizagem contínua</li>
            </ul>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mb-4">Vagas Abertas</h2>
        
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{job.location}</Badge>
                      <Badge variant="outline">{job.type}</Badge>
                      <Badge variant="outline">{job.department}</Badge>
                    </div>
                  </div>
                  <Button>Candidatar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Não encontrou sua vaga?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Envie seu currículo para talentos@idosolink.com e entraremos em contato 
              quando tivermos uma vaga adequada ao seu perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    
  );
}
