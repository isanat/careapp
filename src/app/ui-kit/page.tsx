"use client";

import * as React from "react";
import { 
  Button, 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Alert, 
  Badge, StatusBadge,
  Input, Textarea, Select,
  Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ActivationModal, TipModal,
  Tabs, TabsList, TabsTrigger, TabsContent,
  BottomNav,
} from "@/components/ui-kit";
import { 
  IconHealthCare, IconHealthFamily, IconHealthCaregiver, IconHealthContract,
  IconHealthWallet, IconHealthToken, IconHealthReputation, IconHealthSchedule,
  IconHealthPayment, IconHealthBurn, IconHealthSupport, IconHealthTrust,
} from "@/components/icons/health-icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function UIKitPage() {
  const [activationModalOpen, setActivationModalOpen] = React.useState(false);
  const [tipModalOpen, setTipModalOpen] = React.useState(false);
  
  const bottomNavItems = [
    { href: "/ui-kit", label: "Home", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { href: "/ui-kit", label: "Carteira", icon: <IconHealthWallet className="w-6 h-6" />, badge: 3 },
    { href: "/ui-kit", label: "Chat", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { href: "/ui-kit", label: "Perfil", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">UI Kit - {APP_NAME}</h1>
          <p className="text-muted-foreground">Design System para Senior Care</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-12">
        
        {/* Colors Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Paleta de Cores</h2>
          <p className="text-muted-foreground mb-6">Health & Care - Não fintech/crypto</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-primary" />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">#2F6F6D</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-secondary" />
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">#6FA8A3</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-accent" />
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">#A8DADC</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-warm" />
              <p className="text-sm font-medium">Warm</p>
              <p className="text-xs text-muted-foreground">#F1C27D</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Botões</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Variantes</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="warm">Warm</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-3">Tamanhos</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-3">Estados</p>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button fullWidth className="max-w-xs">Full Width</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Cards</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card Default</CardTitle>
                <CardDescription>Cards com fundo branco e sombra suave</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo do card com estilo padrão.</p>
              </CardContent>
            </Card>
            
            <Card variant="info">
              <CardHeader>
                <CardTitle>Card Info</CardTitle>
                <CardDescription>Para informações importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fundo com tom teal suave.</p>
              </CardContent>
            </Card>
            
            <Card variant="warning">
              <CardHeader>
                <CardTitle>Card Warning</CardTitle>
                <CardDescription>Para alertas atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fundo com tom dourado quente.</p>
              </CardContent>
            </Card>
            
            <Card variant="success">
              <CardHeader>
                <CardTitle>Card Success</CardTitle>
                <CardDescription>Para confirmações</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fundo com tom verde suave.</p>
              </CardContent>
            </Card>
            
            <Card variant="elevated" hoverable>
              <CardHeader>
                <CardTitle>Card Elevated</CardTitle>
                <CardDescription>Com hover effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Passe o mouse para ver o efeito.</p>
              </CardContent>
            </Card>
            
            <Card variant="outline">
              <CardHeader>
                <CardTitle>Card Outline</CardTitle>
                <CardDescription>Apenas bordas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Minimalista e limpo.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alerts Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Alertas</h2>
          
          <div className="space-y-4">
            <Alert variant="info" title="Dica">
              Este é um alerta informativo. Use para dicas e informações úteis.
            </Alert>
            
            <Alert variant="success" title="Sucesso">
              Operação realizada com sucesso! Seus dados foram salvos.
            </Alert>
            
            <Alert variant="warning" title="Atenção">
              Verifique suas informações antes de continuar.
            </Alert>
            
            <Alert variant="error" title="Erro">
              Não foi possível completar a operação. Tente novamente.
            </Alert>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Badges</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Variantes</p>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="warm">Warm</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-3">Status Badges</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="active" />
                <StatusBadge status="pending" />
                <StatusBadge status="completed" />
                <StatusBadge status="cancelled" />
                <StatusBadge status="verified" />
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-3">Com Dot</p>
              <div className="flex flex-wrap gap-2">
                <Badge dot>Online</Badge>
                <Badge variant="warning" dot>Em análise</Badge>
                <Badge variant="success" dot>Aprovado</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Inputs Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Inputs</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Input 
              label="Nome completo"
              placeholder="Digite seu nome"
              hint="Use seu nome legal"
            />
            
            <Input 
              label="Email"
              type="email"
              placeholder="seu@email.com"
              leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            
            <Input 
              label="Com erro"
              placeholder="Campo com erro"
              error="Este campo é obrigatório"
            />
            
            <Select
              label="Tipo de serviço"
              placeholder="Selecione..."
              options={[
                { value: "companionship", label: "Companhia" },
                { value: "medical", label: "Cuidados Médicos" },
                { value: "personal", label: "Cuidados Pessoais" },
              ]}
            />
            
            <Textarea
              label="Descrição"
              placeholder="Descreva suas necessidades..."
              className="md:col-span-2"
            />
          </div>
        </section>

        {/* Tabs Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Tabs</h2>
          
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Visão Geral</TabsTrigger>
              <TabsTrigger value="tab2">Detalhes</TabsTrigger>
              <TabsTrigger value="tab3">Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tab1">
              <Card>
                <CardContent className="p-4">
                  <p>Conteúdo da tab Visão Geral. Interface limpa e acessível.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tab2">
              <Card>
                <CardContent className="p-4">
                  <p>Conteúdo da tab Detalhes. Navegação intuitiva.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tab3">
              <Card>
                <CardContent className="p-4">
                  <p>Conteúdo da tab Histórico. Tudo organizado.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Icons Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Ícones Health</h2>
          <p className="text-muted-foreground mb-6">Ícones SVG próprios - Rounded, Line style</p>
          
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthCare className="w-8 h-8 text-primary" />
              <span className="text-xs">Care</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthFamily className="w-8 h-8 text-primary" />
              <span className="text-xs">Family</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthCaregiver className="w-8 h-8 text-primary" />
              <span className="text-xs">Caregiver</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthContract className="w-8 h-8 text-primary" />
              <span className="text-xs">Contract</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthWallet className="w-8 h-8 text-primary" />
              <span className="text-xs">Wallet</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthToken className="w-8 h-8 text-primary" />
              <span className="text-xs">Token</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthReputation className="w-8 h-8 text-primary" />
              <span className="text-xs">Reputation</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthSchedule className="w-8 h-8 text-primary" />
              <span className="text-xs">Schedule</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthPayment className="w-8 h-8 text-primary" />
              <span className="text-xs">Payment</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthBurn className="w-8 h-8 text-primary" />
              <span className="text-xs">Burn</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthSupport className="w-8 h-8 text-primary" />
              <span className="text-xs">Support</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <IconHealthTrust className="w-8 h-8 text-primary" />
              <span className="text-xs">Trust</span>
            </div>
          </div>
        </section>

        {/* Modals Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Modals</h2>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setActivationModalOpen(true)}>
              Abrir Modal Ativação
            </Button>
            <Button variant="warm" onClick={() => setTipModalOpen(true)}>
              Abrir Modal Gorjeta
            </Button>
          </div>
          
          <ActivationModal
            open={activationModalOpen}
            onOpenChange={setActivationModalOpen}
            onConfirm={() => {
              alert("Ativação confirmada!");
              setActivationModalOpen(false);
            }}
          />
          
          <TipModal
            open={tipModalOpen}
            onOpenChange={setTipModalOpen}
            caregiverName="Maria Silva"
            onConfirm={(amount) => {
              alert(`Gorjeta de €${amount} enviada!`);
              setTipModalOpen(false);
            }}
          />
        </section>

      </div>
      
      {/* Bottom Nav Demo */}
      <BottomNav items={bottomNavItems} />
    </main>
  );
}
