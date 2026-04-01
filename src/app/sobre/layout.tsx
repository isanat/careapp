import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description: "Conheça a Evyra, a plataforma portuguesa de cuidados para idosos que une famílias e cuidadores com segurança e confiança.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
