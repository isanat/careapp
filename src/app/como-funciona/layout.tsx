import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Como Funciona",
  description: "Saiba como encontrar cuidadores verificados em Portugal. Processo simples: registe-se, pesquise, contrate e acompanhe com segurança.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
