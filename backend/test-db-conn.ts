import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DIRECT_URL,
            },
        },
    });
    try {
        console.log("Testing DIRECT_URL...");
        await prisma.$connect();
        console.log("Database connection successful!");
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);
    } catch (error) {
        console.error("Database connection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
