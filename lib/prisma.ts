import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.PRISMA_DATABASE_URL;

// 1. Creamos el pool de conexiones nativo de Postgres
const pool = new Pool({ connectionString });

// 2. Pasamos el pool al adaptador de Prisma
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 3. Inicializamos PrismaClient inyectando el adaptador (como lo exige la v7.8)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;