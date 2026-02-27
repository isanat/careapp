"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconLogo, IconClock, IconUser } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/public-layout";

export default function BlogPage() {
  const { t } = useI18n();

  const categories = [
    t.blogPage.categories.all,
    t.blogPage.categories.tips,
    t.blogPage.categories.health,
    t.blogPage.categories.technology,
    t.blogPage.categories.platform,
    t.blogPage.categories.rights,
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t.blogPage.title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.blogPage.subtitle}
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <Button 
                key={cat} 
                variant={cat === t.blogPage.categories.all ? "default" : "outline"}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {t.blogPage.posts.map((post, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">{t.blogPage.newsletter.title}</h2>
                <p className="opacity-90 mb-4">
                  {t.blogPage.newsletter.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <input 
                    type="email" 
                    placeholder={t.blogPage.newsletter.placeholder}
                    className="px-4 py-2 rounded-lg text-foreground bg-white"
                  />
                  <Button variant="secondary">{t.blogPage.newsletter.subscribe}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
