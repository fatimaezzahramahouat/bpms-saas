import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export enum WorkflowStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
}

export interface IWorkflow {
    id: string;
    name: string;
    description?: string;
    status: WorkflowStatus;
    version: number;
    nodes: any[];
    edges: any[];
    createdAt: string;
    updatedAt: string;
    _count?: {
        instances: number;
        steps: number;
    };
}

export const workflowService = {
    getAllWorkflows: async (filters?: { status?: string; name?: string }) => {
        const response = await api.get('/workflows', { params: filters });
        return response.data;
    },

    getWorkflowById: async (id: string) => {
        const response = await api.get(`/workflows/${id}`);
        return response.data;
    },

    createWorkflow: async (data: any) => {
        const response = await api.post('/workflows', data);
        return response.data;
    },

    updateWorkflow: async (id: string, data: any) => {
        const response = await api.put(`/workflows/${id}`, data);
        return response.data;
    },

    publishWorkflow: async (id: string) => {
        const response = await api.patch(`/workflows/${id}/publish`);
        return response.data;
    },

    deleteWorkflow: async (id: string) => {
        const response = await api.delete(`/workflows/${id}`);
        return response.data;
    },
};

export default workflowService;
