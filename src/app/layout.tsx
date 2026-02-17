import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
    "blockchain",
    "tokens",
    "SeniorToken",
    "IdosoLink",
    "Portugal",
    "Europa",
  ],
  authors: [{ name: APP_NAME }],
  icons: {
    icon: "/assets/logo.svg",
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "https://idosolink.com",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
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
