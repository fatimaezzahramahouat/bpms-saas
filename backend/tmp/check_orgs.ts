import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orgs = await prisma.organisation.findMany({
        include: {
            workflows: true,
            users: true
        }
    });

    console.log(`Orgs found: ${orgs.length}`);
    orgs.forEach(o => {
        console.log(`Org: ${o.name} (ID: ${o.id})`);
        console.log(`  Users count: ${o.users.length}`);
        console.log(`  Workflows count: ${o.workflows.length}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
