import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorker } from '../components/ServiceWorker';

export const metadata: Metadata = {
  title: 'IdosoLink | PWA Marketplace',
  description: 'Marketplace de cuidados com contratos digitais e token utilitário',
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
