import { PrismaClient } from "@prisma/client";

declare global {
    var prisma: PrismaClient | undefined;
}

const prisma =
    global.prisma ??
    new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: [
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
        ],
    });

// Always reuse the singleton to avoid multiple connection pools
global.prisma = prisma;

export { prisma };
export default prisma;
