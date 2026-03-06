import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'Elharirimanal2@gmail.com' },
        include: { employee: true }
    });

    if (!user) {
        console.error('User not found.');
        return;
    }

    if (user.employee) {
        console.log('User is already an employee.');
        return;
    }

    await prisma.employee.create({
        data: {
            userId: user.id
        }
    });

    console.log(`User ${user.email} is now also an Employee.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
