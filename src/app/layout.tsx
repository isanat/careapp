import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Apoio Domiciliário de Confiança na Europa`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "evyra",
    "apoio domiciliário",
    "profissionais verificados",
    "cuidados paliativos",
    "enfermagem",
    "Europa",
    "Portugal",
    "infraestrutura de cuidado",
    "serviços domiciliários",
  ],
  authors: [{ name: APP_NAME }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
  },
  openGraph: {
    title: `${APP_NAME} — Apoio Domiciliário de Confiança na Europa`,
    description: "Profissionais verificados, contratos digitais e acompanhamento centralizado. Para as famílias que não podem estar sempre presentes.",
    url: "https://evyra.eu",
    siteName: APP_NAME,
    type: "website",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Apoio Domiciliário de Confiança na Europa`,
    description: "Profissionais verificados, contratos digitais e acompanhamento centralizado. Para as famílias que não podem estar sempre presentes.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
