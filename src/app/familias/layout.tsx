import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Para Famílias",
  description: "Encontre cuidadores qualificados e verificados para o seu familiar idoso. Segurança, transparência e acompanhamento em Portugal.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
