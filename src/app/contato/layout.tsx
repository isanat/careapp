import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Entre em contacto com a equipa Senior Care. Estamos disponíveis para ajudar famílias e cuidadores em Portugal.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
