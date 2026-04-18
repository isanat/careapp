import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Ajuda",
  description:
    "Centro de ajuda Evyra. Encontre respostas às suas dúvidas sobre a plataforma, pagamentos e serviços.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
