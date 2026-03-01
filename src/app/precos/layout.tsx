import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Preços",
  description: "Planos e preços da plataforma Senior Care. Ativação por €35, sem mensalidades. Comissão transparente de 15% por contrato.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
