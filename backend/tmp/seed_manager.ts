import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organisation.findFirst();
    if (!org) {
        console.error('No organisation found.');
        return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
        data: {
            email: 'manager@manal.com',
            password: hashedPassword,
            firstName: 'Manager',
            lastName: 'BPMS',
            organisationId: org.id,
            manager: {
                create: {}
            }
        }
    });

    console.log(`Created Manager: ${user.email} (ID: ${user.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
