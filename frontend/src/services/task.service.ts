import api from './api';

export const taskService = {
    /**
     * Fetches pending tasks for the logged-in user.
     */
    async getTasks() {
        const response = await api.get('/tasks');
        return response.data;
    },

    /**
     * Fetches tasks specifically for manager approvals.
     */
    async getApprovals() {
        const response = await api.get('/tasks/approvals');
        return response.data;
    },

    /**
     * Approves or Rejects a task.
     */
    async updateTaskStatus(taskId: string, action: 'APPROVE' | 'REJECT') {
        const response = await api.patch(`/tasks/${taskId}`, { action });
        return response.data;
    },

    /**
     * Approves a task specifically using the graph progression logic.
     */
    async approveTask(taskId: string) {
        const response = await api.patch(`/tasks/${taskId}/approve`);
        return response.data;
    },

    /**
     * Rejects a task and terminates the graph progression logic.
     */
    async rejectTask(taskId: string) {
        const response = await api.patch(`/tasks/${taskId}/reject`);
        return response.data;
    },
};
