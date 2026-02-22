import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Criando usuário admin...");

  // Senha hasheada
  const passwordHash = await bcrypt.hash("admin123", 10);

  // Criar ou atualizar usuário
  const user = await prisma.user.upsert({
    where: { email: "admin@idosolink.com" },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
    create: {
      email: "admin@idosolink.com",
      name: "Admin IdosoLink",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Usuário criado:", user.email);

  // Criar perfil admin
  const adminProfile = await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: {
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      userId: user.id,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Perfil admin criado:", adminProfile.role);
  console.log("\n📋 Credenciais:");
  console.log("   Email: admin@idosolink.com");
  console.log("   Senha: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
