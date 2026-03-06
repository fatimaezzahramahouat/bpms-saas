import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Debug Script ---');

    try {
        const orgCount = await prisma.organisation.count();
        console.log(`Total Organisations: ${orgCount}`);

        const workflowCount = await prisma.workflow.count();
        console.log(`Total Workflows: ${workflowCount}`);

        const workflows = await prisma.workflow.findMany({
            include: {
                steps: true,
                _count: { select: { steps: true, instances: true } }
            }
        });

        workflows.forEach(w => {
            console.log(`\n[Workflow] Name: ${w.name} | ID: ${w.id} | OrgID: ${w.organisationId}`);
            console.log(`  Status: ${w.status} | Version: ${w.version}`);
            console.log(`  Step count: ${w._count.steps}`);
            console.log(`  Process Instances count: ${w._count.instances}`);

            if (w.steps.length > 0) {
                console.log('  Steps:');
                w.steps.forEach(s => {
                    console.log(`    - ${s.name} (order: ${s.order}, id: ${s.id})`);
                });
            } else {
                console.log('  (!) NO STEPS FOUND IN DB FOR THIS WORKFLOW');
            }
        });

    } catch (error) {
        console.error('DATABASE_ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
