import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter. The Neon serverless driver is used so
// the client works in serverless environments (Vercel) without TCP pooling.
const createPrismaClient = () => {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({ adapter });
};

// Reuse the client across hot reloads in development to avoid exhausting
// connections. In serverless environments the instance is created once per
// function container and never explicitly disconnected.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
