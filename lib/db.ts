// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Graceful shutdown - zatvori konekcije kada se app gasi
if (process.env.NODE_ENV === "production") {
  process.on('beforeExit', async () => {
    await db.$disconnect();
  });
}