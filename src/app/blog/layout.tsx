import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos e dicas sobre apoio domiciliário, bem-estar e saúde. Recursos práticos para famílias e cuidadores.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
