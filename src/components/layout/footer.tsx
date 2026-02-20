"use client";

import Link from "next/link";
import { IconLogo, IconToken } from "@/components/icons";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useI18n();

  const footerLinks = {
    platform: [
      { href: "/como-funciona", label: t.nav.howItWorks },
      { href: "/familias", label: t.nav.forFamilies },
      { href: "/cuidadores", label: t.nav.forCaregivers },
      { href: "/token", label: t.nav.token },
    ],
    company: [
      { href: "/sobre", label: t.footer.about },
      { href: "/blog", label: t.footer.blog },
      { href: "/carreiras", label: t.footer.careers },
      { href: "/imprensa", label: t.footer.press },
    ],
    legal: [
      { href: "/privacidade", label: t.footer.privacy },
      { href: "/termos", label: t.footer.terms },
      { href: "/cookies", label: t.footer.cookies },
      { href: "/gdpr", label: t.footer.gdpr },
    ],
    support: [
      { href: "/ajuda", label: t.footer.help },
      { href: "/contato", label: t.footer.contact },
      { href: "/faq", label: t.footer.faq },
      { href: "/seguranca", label: t.footer.security },
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
              <span>{t.footer.poweredBy}</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-4">{t.footer.platform}</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
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
            <h4 className="font-semibold mb-4">{t.footer.company}</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
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
            <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
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
            <h4 className="font-semibold mb-4">{t.footer.support}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
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
            © {currentYear} {APP_NAME}. {t.footer.rights}
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
