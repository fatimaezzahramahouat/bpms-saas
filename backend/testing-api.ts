import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testCreate() {
    try {
        console.log("Testing createUser with 'rh' relation...");
        const org = await prisma.organisation.findFirst();
        if (!org) throw new Error("No org");
        const user = await prisma.user.create({
            data: {
                email: "test_create1@example.com",
                password: "pw",
                firstName: "Test",
                lastName: "User",
                organisationId: org.id,
                rh: {
                    create: {}
                }
            }
        });
        console.log("Created successfully:", user.email);

        await prisma.rH.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    } catch (e: any) {
        console.error("Failed to create RH:", e.message);
    }

    try {
        console.log("Testing createUser with 'manager' relation...");
        const org = await prisma.organisation.findFirst();
        const user = await prisma.user.create({
            data: {
                email: "test_create2@example.com",
                password: "pw",
                firstName: "Test",
                lastName: "User",
                organisationId: org!.id,
                manager: {
                    create: {}
                }
            }
        });
        console.log("Created successfully:", user.email);

        await prisma.manager.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    } catch (e: any) {
        console.error("Failed to create Manager:", e.message);
    }

    try {
        console.log("Testing createUser with 'employee' relation...");
        const org = await prisma.organisation.findFirst();
        const user = await prisma.user.create({
            data: {
                email: "test_create3@example.com",
                password: "pw",
                firstName: "Test",
                lastName: "User",
                organisationId: org!.id,
                employee: {
                    create: {}
                }
            }
        });
        console.log("Created successfully:", user.email);

        await prisma.employee.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    } catch (e: any) {
        console.error("Failed to create Employee:", e.message);
    }
}

testCreate().finally(() => prisma.$disconnect());
