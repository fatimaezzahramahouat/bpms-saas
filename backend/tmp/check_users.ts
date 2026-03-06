import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            organisation: true,
            admin: true,
            rh: true,
            manager: true,
            employee: true
        }
    });

    console.log(`Total Users: ${users.length}`);
    users.forEach(u => {
        console.log(`- User: ${u.email} (ID: ${u.id})`);
        console.log(`  Org: ${u.organisation?.name || 'NONE'} (ID: ${u.organisationId})`);
        console.log(`  Roles: admin=${!!u.admin}, rh=${!!u.rh}, manager=${!!u.manager}, employee=${!!u.employee}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
