import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client pour éviter les connexions multiples en dev
 */

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Vérifie si la base de données est connectée
 */
export const isDatabaseConnected = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
};

/**
 * Ferme proprement la connexion Prisma
 */
export const disconnectDatabase = async (): Promise<void> => {
    await prisma.$disconnect();
    console.log('👋 [Prisma] Connexion fermée');
};

export default prisma;
