import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Para Famílias",
  description: "Apoio domiciliário de confiança para quem precisa. Encontre profissionais verificados, contratos seguros e acompanhamento transparente em Portugal.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
