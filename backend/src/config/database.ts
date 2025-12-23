import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for reuse across services/middleware
export const prisma = new PrismaClient();

export default prisma;
