import prisma from "./src/lib/prisma";

async function main() {
    const user = await prisma.user.findFirst({
        include: { organisation: true }
    });
    const workflow = await prisma.workflow.findFirst({
        include: { steps: { orderBy: { order: 'asc' } } }
    });
    const processInstance = await prisma.processInstance.findFirst();

    console.log(JSON.stringify({
        user,
        workflow,
        processInstance
    }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
