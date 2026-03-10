const API_BASE_URL = 'http://localhost:5000/api';

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
    averageCompletionTime: number;
    activeInstances: number;
    successRate: number;
    pendingTasks: number;
    timeline: {
        date: string;
        count: number;
    }[];
}

export const statsService = {
    async getWorkflowStats(): Promise<WorkflowStats> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/stats/workflows`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const result = await response.json();
        return result.data;
    }
};
