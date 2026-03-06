const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workflows = await prisma.workflow.findMany({
        select: { id: true, name: true, organisationId: true }
    });
    console.log(JSON.stringify(workflows, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
