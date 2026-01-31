import type { Metadata } from 'next';
import '../styles/globals.css';
import { ServiceWorker } from '../components/ServiceWorker';

export const metadata: Metadata = {
  title: 'IdosoLink | Senior Care',
  description: 'Plataforma de cuidado e bem-estar com experiência PWA clara e confiável.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/logo.svg'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
