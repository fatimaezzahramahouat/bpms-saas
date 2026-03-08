import api from './api';

// ─── Types ────────────────────────────────────────────────

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
    data_model?: any;
    createdAt: string;
    updatedAt: string;
    steps?: any[];
    _count?: {
        instances: number;
        steps: number;
    };
}

// ─── Leave Request Template ───────────────────────────────

export const LEAVE_REQUEST_TEMPLATE = {
    name: 'Demande de Congé',
    description: 'Workflow standard de demande de congé',
    nodes: [
        {
            id: 'tpl-start',
            type: 'turbo',
            position: { x: 250, y: 80 },
            data: {
                title: 'Demande Soumise',
                variant: 'trigger',
                role: 'EMPLOYE',
                assigneeType: 'ALL',
                slaDuration: 0,
                requiredDocuments: [],
                autoEmail: { enabled: false },
            },
        },
        {
            id: 'tpl-rh',
            type: 'turbo',
            position: { x: 250, y: 230 },
            data: {
                title: 'Validation RH',
                variant: 'approval',
                role: 'RH',
                assigneeType: 'ROLE',
                slaDuration: 48,
                requiredDocuments: ['Justificatif'],
                autoEmail: { enabled: true },
            },
        },
        {
            id: 'tpl-mgr',
            type: 'turbo',
            position: { x: 250, y: 380 },
            data: {
                title: 'Validation Manager',
                variant: 'approval',
                role: 'MANAGER',
                assigneeType: 'ROLE',
                slaDuration: 24,
                requiredDocuments: [],
                autoEmail: { enabled: true },
            },
        },
        {
            id: 'tpl-end',
            type: 'turbo',
            position: { x: 250, y: 530 },
            data: {
                title: 'Congé Approuvé',
                variant: 'end',
                role: 'ADMIN',
                assigneeType: 'ALL',
                slaDuration: 0,
                requiredDocuments: [],
                autoEmail: { enabled: false },
            },
        },
    ],
    edges: [
        { id: 'e1', source: 'tpl-start', target: 'tpl-rh', type: 'turbo', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } },
        { id: 'e2', source: 'tpl-rh', target: 'tpl-mgr', type: 'turbo', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 } },
        { id: 'e3', source: 'tpl-mgr', target: 'tpl-end', type: 'turbo', animated: true, style: { stroke: '#22c55e', strokeWidth: 3 } },
    ],
};

// ─── Service ──────────────────────────────────────────────

export const workflowService = {
    /**
     * Fetch all workflows (with optional filters).
     * Supports: `{ status, name }` as query params.
     */
    getAllWorkflows: async (filters?: { status?: string; name?: string; category?: string }) => {
        const response = await api.get('/workflows', { params: filters });
        return response.data; // { data: IWorkflow[] }
    },

    /**
     * Fetch a single workflow by ID.
     */
    getWorkflowById: async (id: string) => {
        const response = await api.get(`/workflows/${id}`);
        return response.data; // { data: IWorkflow }
    },

    /**
     * Create a new workflow (POST).
     * name is optional — backend defaults to 'Nouveau Workflow'.
     */
    createWorkflow: async (data: {
        name?: string;
        description?: string;
        nodes?: any[];
        edges?: any[];
        steps?: any[];
    }) => {
        const response = await api.post('/workflows', data);
        return response.data; // { message, data: IWorkflow }
    },

    /**
     * Update an existing workflow's graph / name (PUT).
     */
    updateWorkflow: async (id: string, data: {
        name?: string;
        description?: string;
        nodes?: any[];
        edges?: any[];
        status?: string;
    }) => {
        const response = await api.put(`/workflows/${id}`, data);
        return response.data; // { message, data: IWorkflow }
    },

    /**
     * Partial update (PATCH) — same fields as PUT, alias route.
     */
    patchWorkflow: async (id: string, data: {
        name?: string;
        description?: string;
        nodes?: any[];
        edges?: any[];
        status?: string;
    }) => {
        const response = await api.patch(`/workflows/${id}`, data);
        return response.data;
    },

    /**
     * Publish a workflow (validates and sets to ACTIVE).
     */
    publishWorkflow: async (id: string) => {
        const response = await api.patch(`/workflows/${id}/publish`);
        return response.data;
    },

    /**
     * Toggle workflow status (ACTIVE ↔ DRAFT).
     */
    toggleStatus: async (id: string) => {
        const response = await api.patch(`/workflows/${id}/toggle`);
        return response.data;
    },

    /**
     * Duplicate a workflow.
     */
    duplicateWorkflow: async (id: string) => {
        const response = await api.post(`/workflows/${id}/duplicate`);
        return response.data; // { message, data: IWorkflow }
    },

    /**
     * Delete a workflow permanently.
     */
    deleteWorkflow: async (id: string) => {
        const response = await api.delete(`/workflows/${id}`);
        return response.data;
    },
};

export default workflowService;
