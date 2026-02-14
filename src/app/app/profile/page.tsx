"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/app-shell";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCamera,
  IconEdit,
  IconCheck,
  IconStar,
  IconClock,
  IconBriefcase,
  IconFamily,
  IconCaregiver
} from "@/components/icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const isFamily = session?.user?.role === "FAMILY";

  // Mock profile data
  const profile = isFamily ? {
    address: "Rua das Flores, 123",
    city: "Lisboa",
    postalCode: "1250-096",
    country: "Portugal",
    elderName: "Dona Maria",
    elderAge: 82,
    elderNeeds: "Cuidados diários, medicação, companhia",
    emergencyContact: "João Silva",
    emergencyPhone: "+351 912 345 678",
  } : {
    title: "Enfermeira",
    bio: "Profissional de saúde com mais de 10 anos de experiência em cuidados geriátricos. Especializada em cuidados paliativos e acompanhamento de idosos com Alzheimer.",
    address: "Lisboa, Portugal",
    experienceYears: 10,
    hourlyRate: 25,
    services: ["Cuidados Pessoais", "Medicação", "Companhia", "Alimentação"],
    languages: ["Português", "Inglês", "Espanhol"],
    totalContracts: 45,
    totalHours: 1200,
    averageRating: 4.9,
    totalReviews: 32,
  };

  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    ...profile,
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsEditing(false);
    setIsLoading(false);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header with Cover */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary to-primary/60 rounded-xl" />
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {session?.user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="icon" 
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <IconCamera className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <Button 
              variant={isEditing ? "default" : "outline"}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                "Salvando..."
              ) : isEditing ? (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Salvar
                </>
              ) : (
                <>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
            <Badge className={isFamily ? "bg-blue-500" : "bg-green-500"}>
              {isFamily ? (
                <><IconFamily className="h-3 w-3 mr-1" /> Família</>
              ) : (
                <><IconCaregiver className="h-3 w-3 mr-1" /> Cuidador</>
              )}
            </Badge>
            {session?.user?.status === "ACTIVE" && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Verificado
              </Badge>
            )}
          </div>
          {!isFamily && (
            <p className="text-muted-foreground mb-4">
              {(profile as any).title} • {(profile as any).address}
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            {!isFamily && <TabsTrigger value="reviews">Avaliações</TabsTrigger>}
            {isFamily && <TabsTrigger value="elder">Idoso</TabsTrigger>}
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6 mt-6">
            {isFamily ? (
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Morada</Label>
                        <Input 
                          id="address" 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input 
                          id="city" 
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre Mim</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bio">Descrição</Label>
                      <Textarea 
                        id="bio" 
                        value={(formData as any).bio}
                        rows={4}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título Profissional</Label>
                        <Input 
                          id="title" 
                          value={(formData as any).title}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Anos de Experiência</Label>
                        <Input 
                          id="experience" 
                          value={(formData as any).experienceYears}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Serviços Oferecidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(formData as any).services?.map((service: string) => (
                        <Badge key={service} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(profile as any).totalContracts}</p>
                        <p className="text-sm text-muted-foreground">Contratos</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(profile as any).totalHours}h</p>
                        <p className="text-sm text-muted-foreground">Trabalhadas</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                          <IconStar className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          {(profile as any).averageRating}
                        </p>
                        <p className="text-sm text-muted-foreground">Avaliação</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(profile as any).totalReviews}</p>
                        <p className="text-sm text-muted-foreground">Avaliações</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="+351 912 345 678"
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                  <Input 
                    id="emergencyContact" 
                    value={isFamily ? (profile as any).emergencyContact : ""}
                    placeholder="Nome do contato"
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input 
                    id="emergencyPhone" 
                    value={isFamily ? (profile as any).emergencyPhone : ""}
                    placeholder="+351 912 345 678"
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Elder Tab (Family only) */}
          {isFamily && (
            <TabsContent value="elder" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Idoso</CardTitle>
                  <CardDescription>
                    Dados sobre a pessoa que receberá os cuidados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="elderName">Nome do Idoso</Label>
                      <Input 
                        id="elderName" 
                        value={(profile as any).elderName}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elderAge">Idade</Label>
                      <Input 
                        id="elderAge" 
                        type="number"
                        value={(profile as any).elderAge}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elderNeeds">Necessidades Especiais</Label>
                    <Textarea 
                      id="elderNeeds" 
                      value={(profile as any).elderNeeds}
                      rows={3}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Reviews Tab (Caregiver only) */}
          {!isFamily && (
            <TabsContent value="reviews" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações Recentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mock reviews */}
                  {[
                    { author: "Ana Silva", rating: 5, comment: "Excelente profissional! Muito dedicada e atenciosa com minha mãe.", date: "10 Jan 2024" },
                    { author: "Pedro Costa", rating: 5, comment: "Muito competente e pontual. Recomendo fortemente.", date: "5 Jan 2024" },
                    { author: "Maria Santos", rating: 4, comment: "Bom trabalho, comunicação clara.", date: "28 Dez 2023" },
                  ].map((review, index) => (
                    <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{review.author.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{review.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/app/settings">
                  Configurações
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/wallet">
                  Minha Carteira
                </Link>
              </Button>
              {!isFamily && (
                <Button variant="outline" asChild>
                  <Link href="/app/contracts">
                    Meus Contratos
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
