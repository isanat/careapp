import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";

export const metadata: Metadata = {
  title: "Para Cuidadores",
  description: "Junte-se à Evyra como profissional de apoio domiciliário. Encontre famílias, receba pagamentos seguros e construa a sua reputação.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
