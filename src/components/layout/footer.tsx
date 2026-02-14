"use client";

import Link from "next/link";
import { IconLogo, IconToken } from "@/components/icons";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    plataforma: [
      { href: "/como-funciona", label: "Como Funciona" },
      { href: "/familias", label: "Para Famílias" },
      { href: "/cuidadores", label: "Para Cuidadores" },
      { href: "/token", label: "SeniorToken" },
    ],
    empresa: [
      { href: "/sobre", label: "Sobre Nós" },
      { href: "/blog", label: "Blog" },
      { href: "/carreiras", label: "Carreiras" },
      { href: "/imprensa", label: "Imprensa" },
    ],
    legal: [
      { href: "/privacidade", label: "Política de Privacidade" },
      { href: "/termos", label: "Termos de Uso" },
      { href: "/cookies", label: "Política de Cookies" },
      { href: "/gdpr", label: "GDPR" },
    ],
    suporte: [
      { href: "/ajuda", label: "Central de Ajuda" },
      { href: "/contato", label: "Contato" },
      { href: "/faq", label: "FAQ" },
      { href: "/seguranca", label: "Segurança" },
    ],
  };

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container px-4 py-12 mx-auto">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <IconLogo className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">{APP_TAGLINE}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconToken className="h-4 w-4 text-primary" />
              <span>Powered by SeniorToken</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2">
              {footerLinks.plataforma.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2">
              {footerLinks.suporte.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {APP_NAME}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>🇵🇹 Portugal</span>
            <span>•</span>
            <span>🇮🇹 Italia</span>
            <span>•</span>
            <span>🇪🇺 Europa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
