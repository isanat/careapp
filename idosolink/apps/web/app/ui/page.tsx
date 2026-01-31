import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const sections = [
  { href: '/ui/tokens', title: 'Design Tokens', description: 'Cores, tipografia, espaços e estados.' },
  { href: '/ui/icons', title: 'Ícones', description: 'Pack proprietário com estilo care-first.' },
  { href: '/ui/components', title: 'Componentes', description: 'Todos os componentes reutilizáveis.' },
  { href: '/ui/screens', title: 'Screens', description: 'Telas mock para flows principais.' }
];

export default function UiHubPage() {
  return (
    <main className="container-page space-y-8 py-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">UI Kit</p>
        <h1 className="text-3xl font-semibold md:text-4xl">IdosoLink UI Kit</h1>
        <p className="text-text2">Acesso rápido às peças do design system care-first.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.href}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text2">{section.description}</p>
              <Button size="sm" asChild>
                <Link href={section.href}>Abrir</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
