import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Blog",
  description: "Artigos e dicas sobre cuidados de idosos, saúde sénior e bem-estar. Recursos para famílias e cuidadores.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
