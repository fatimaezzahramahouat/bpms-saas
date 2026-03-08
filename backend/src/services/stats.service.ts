import prisma from "../lib/prisma";

export interface WorkflowStats {
    totalInstances: number;
    statusDistribution: {
        status: string;
        count: number;
        color: string;
    }[];
    volumeByWorkflow: {
        name: string;
        count: number;
    }[];
    averageCompletionTime: number; // in hours
    activeInstances: number;
    successRate: number; // percentage of COMPLETED vs (COMPLETED + REJECTED)
    pendingTasks: number;
    timeline: {
        date: string;
        count: number;
    }[];
}

export const statsService = {
    async getWorkflowStats(organisationId: string): Promise<WorkflowStats> {
        // 1. Fetch all instances for this organization
        const instances = await prisma.processInstance.findMany({
            where: {
                workflow: {
                    organisationId
                }
            },
            include: {
                workflow: true,
                tasks: true
            }
        });

        // 2. Status Distribution
        const statusCounts: Record<string, number> = {
            'IN_PROGRESS': 0,
            'COMPLETED': 0,
            'REJECTED': 0
        };
        instances.forEach(inst => {
            const statusKey = inst.status as string;
            if (statusCounts[statusKey] !== undefined) {
                statusCounts[statusKey]++;
            } else {
                statusCounts[statusKey] = 1;
            }
        });

        const colors: Record<string, string> = {
            'COMPLETED': '#10b981', // emerald-500
            'IN_PROGRESS': '#3b82f6', // blue-500
            'REJECTED': '#ef4444', // red-500
            'PENDING': '#f59e0b' // amber-500
        };

        const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count: count || 0,
            color: colors[status] || '#94a3b8'
        }));

        // 3. Volume by Workflow
        const workflowCounts: Record<string, number> = {};
        instances.forEach(inst => {
            if (inst.workflow && inst.workflow.name) {
                const name = inst.workflow.name;
                workflowCounts[name] = (workflowCounts[name] || 0) + 1;
            }
        });

        const volumeByWorkflow = Object.entries(workflowCounts)
            .map(([name, count]) => ({ name, count: count || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 4. Average Completion Time
        const completedInstances = instances.filter(inst => inst.status === 'COMPLETED');
        let totalTimeMs = 0;
        completedInstances.forEach(inst => {
            const start = new Date(inst.createdAt);
            // We assume the last task's completedAt is the instance's completion time if we don't have updatedAt on instance
            const completionTask = inst.tasks.filter(t => t.status === 'COMPLETED').sort((a, b) => {
                const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                return dateB - dateA;
            })[0];

            if (completionTask && completionTask.completedAt) {
                const end = new Date(completionTask.completedAt);
                totalTimeMs += end.getTime() - start.getTime();
            }
        });

        const averageCompletionTime = completedInstances.length > 0
            ? Math.round((totalTimeMs / completedInstances.length) / (1000 * 60 * 60)) // to hours
            : 0;

        // 5. Success Rate
        const compCount = statusCounts['COMPLETED'] || 0;
        const rejCount = statusCounts['REJECTED'] || 0;
        const totalClosed = compCount + rejCount;
        const successRate = totalClosed > 0
            ? Math.round((compCount / totalClosed) * 100)
            : 0;

        // 6. Timeline (Last 14 days)
        const dateCounts: Record<string, number> = {};
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        instances.forEach(inst => {
            const dateStr = new Date(inst.createdAt).toISOString().split('T')[0];
            if (dateStr && new Date(dateStr) >= fourteenDaysAgo) {
                dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
            }
        });

        const timeline = Object.entries(dateCounts)
            .map(([date, count]) => ({ date, count: count || 0 }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 7. Pending Tasks
        const pendingTasksCount = await prisma.task.count({
            where: {
                organisationId,
                status: 'PENDING'
            }
        });

        return {
            totalInstances: instances.length,
            statusDistribution,
            volumeByWorkflow,
            averageCompletionTime,
            activeInstances: statusCounts['IN_PROGRESS'] || 0,
            successRate,
            pendingTasks: pendingTasksCount,
            timeline
        };
    }
};
