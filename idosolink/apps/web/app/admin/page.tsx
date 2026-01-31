import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="container-page space-y-6 py-12">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Usuários', text: '1.240 usuários · 620 famílias · 590 cuidadores.' },
            { title: 'Contratos', text: '140 ativos · 32 pendentes · 15 cancelados.' },
            { title: 'Pagamentos', text: '€34k processados via Stripe este mês.' },
            { title: 'Flags', text: '3 contas em revisão por compliance.' }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text2">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
