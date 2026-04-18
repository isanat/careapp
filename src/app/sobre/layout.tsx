import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Conheça a Evyra, a infraestrutura europeia de apoio domiciliário que une famílias e cuidadores verificados com segurança e confiança.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
