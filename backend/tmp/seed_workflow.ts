import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organisation.findFirst();
    if (!org) {
        console.error('No organisation found.');
        return;
    }

    const workflow = await prisma.workflow.create({
        data: {
            name: 'Demande de Congé',
            description: 'Système automatique de gestion des congés',
            status: 'ACTIVE',
            version: 1,
            organisationId: org.id,
            nodes: [
                { id: 'start', type: 'trigger', data: { variant: 'trigger', title: 'Début' }, position: { x: 0, y: 0 } },
                { id: 'manager', type: 'approval', data: { title: 'Validation Manager', label: 'MANAGER' }, position: { x: 200, y: 0 } },
                { id: 'end', type: 'end', data: { variant: 'end', title: 'Fin' }, position: { x: 400, y: 0 } }
            ],
            edges: [
                { id: 'e1', source: 'start', target: 'manager' },
                { id: 'e2', source: 'manager', target: 'end' }
            ],
            steps: {
                create: [
                    { name: 'Validation Manager', order: 1 }
                ]
            }
        }
    });

    console.log(`Created workflow: ${workflow.name} (ID: ${workflow.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
