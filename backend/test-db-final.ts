import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("DATABASE_URL starting with:", process.env.DATABASE_URL?.substring(0, 20));
    const prisma = new PrismaClient();
    try {
        console.log("Attempting to connect to database...");
        await prisma.$connect();
        console.log("✅ Database connection successful!");
        const count = await prisma.user.count();
        console.log("User count:", count);
    } catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
