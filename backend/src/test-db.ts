import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking database connection...");
    await prisma.$connect();
    console.log("Database connected successfully! ✅");

    console.log("Checking applied migrations...");
    const migrations: any[] = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY "finished_at" DESC`;
    console.table(migrations.map(m => ({ 
      id: m.id, 
      migration_name: m.migration_name, 
      finished_at: m.finished_at 
    })));

  } catch (error) {
    console.error("Database diagnostic failed: ❌");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
