import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://seniorcare.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicPages = [
    { url: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: '/como-funciona', changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: '/familias', changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: '/cuidadores', changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: '/precos', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/sobre', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/blog', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/contato', changeFrequency: 'yearly' as const, priority: 0.6 },
    { url: '/ajuda', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/faq', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/termos', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/privacidade', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/cookies', changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: '/gdpr', changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: '/seguranca', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/carreiras', changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: '/imprensa', changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: '/token', changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  const authPages = [
    { url: '/auth/login', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/auth/register', changeFrequency: 'yearly' as const, priority: 0.6 },
  ];

  return [...publicPages, ...authPages].map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
