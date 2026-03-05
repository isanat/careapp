import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F8FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0D2237" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Senior Care Platform`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "cuidador de idosos",
    "senior care",
    "cuidados paliativos",
    "enfermagem",
    "cuidadores",
    "Senior Care",
    "Portugal",
    "Europa",
    "caregiver",
    "elderly care",
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
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "https://seniorcare.app",
    siteName: APP_NAME,
    type: "website",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
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
      <body
        className={`${roboto.variable} font-sans antialiased bg-background text-foreground`}
      >
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
