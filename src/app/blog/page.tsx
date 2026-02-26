import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconLogo, IconClock, IconUser } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Blog - ${APP_NAME}`,
  description: "Dicas, artigos e novidades sobre cuidados com idosos.",
};

const blogPosts = [
  {
    id: 1,
    title: "Como Escolher o Cuidador Ideal para seu Idoso",
    excerpt: "A escolha de um cuidador é uma decisão importante. Confira os principais fatores a considerar.",
    category: "Dicas",
    author: "Equipe IdosoLink",
    date: "10 Jan 2024",
    readTime: "5 min",
  },
  {
    id: 2,
    title: "Cuidados com a Saúde Mental do Idoso",
    excerpt: "A saúde mental é tão importante quanto a física. Saiba como apoiar seu ente querido.",
    category: "Saúde",
    author: "Dra. Maria Santos",
    date: "8 Jan 2024",
    readTime: "7 min",
  },
  {
    id: 3,
    title: "Benefícios da Tecnologia para Idosos",
    excerpt: "Como dispositivos e aplicativos podem melhorar a qualidade de vida dos mais velhos.",
    category: "Tecnologia",
    author: "Equipe IdosoLink",
    date: "5 Jan 2024",
    readTime: "4 min",
  },
  {
    id: 4,
    title: "Entendendo os Tokens da Plataforma",
    excerpt: "Guia completo sobre como funcionam os tokens SENT e seus benefícios.",
    category: "Plataforma",
    author: "Equipe IdosoLink",
    date: "3 Jan 2024",
    readTime: "6 min",
  },
  {
    id: 5,
    title: "Alimentação Saudável na Terceira Idade",
    excerpt: "Nutrição adequada é fundamental para o bem-estar dos idosos.",
    category: "Saúde",
    author: "Nutricionista Ana Costa",
    date: "1 Jan 2024",
    readTime: "5 min",
  },
  {
    id: 6,
    title: "Direitos do Idoso: O Que Você Precisa Saber",
    excerpt: "Conheça os principais direitos garantidos por lei aos cidadãos idosos.",
    category: "Direitos",
    author: "Advogado João Silva",
    date: "28 Dez 2023",
    readTime: "8 min",
  }
];

const categories = ["Todos", "Dicas", "Saúde", "Tecnologia", "Plataforma", "Direitos"];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <IconLogo className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog IdosoLink</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dicas, artigos e novidades sobre cuidados com idosos e nossa plataforma.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <Button 
              key={cat} 
              variant={cat === "Todos" ? "default" : "outline"}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-4xl">📰</span>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconClock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>
                <h2 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h2>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IconUser className="h-3 w-3" />
                    {post.author}
                  </span>
                  <span>{post.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-2">Receba Nossas Novidades</h2>
              <p className="opacity-90 mb-4">
                Cadastre-se para receber dicas e atualizações da plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  className="px-4 py-2 rounded-lg text-foreground bg-white"
                />
                <Button variant="secondary">Inscrever</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
