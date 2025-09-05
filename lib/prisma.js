const { PrismaClient } = require('../prisma/generated/prisma-client/index.js');
const { withAccelerate } = require('@prisma/extension-accelerate');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = { prisma };
