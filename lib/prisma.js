import { PrismaClient } from '../prisma/generated/prisma-client/index.js';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
