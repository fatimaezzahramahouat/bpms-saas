export type AppRole = 'ADMIN' | 'RH' | 'MANAGER' | 'EMPLOYE';
export type ActionType = 'CONGE' | 'RECRUTEMENT' | 'DEMANDE_ACHAT' | 'APPROBATION';

export interface BaseWorkflowData {
    title: string;
    subTitle?: string;
    icon?: string;
    category?: string;
    variant: 'trigger' | 'action' | 'condition' | 'end' | 'ai' | 'decision' | 'api' | 'email' | 'timer' | 'file' | 'webhook' | 'document';
    [key: string]: any;
}

export interface TriggerNodeData extends BaseWorkflowData {
    variant: 'trigger';
}

export interface ActionNodeData extends BaseWorkflowData {
    variant: 'action';
    role: AppRole;
    slaDuration: number;
    description?: string;
    requiredDocuments: string[];
    actionType?: ActionType;
    assigneeType?: 'ALL' | 'SPECIFIC';
    specificUserId?: string;
    assignmentType?: 'ROLE' | 'SPECIFIC' | 'DYNAMIC';
    assignedTo?: string;
    autoEmail?: {
        enabled: boolean;
        templateId?: string;
    };
}

export interface DecisionNodeData extends BaseWorkflowData {
    variant: 'decision' | 'condition';
    condition: {
        variable: string;
        operator: string;
        value: string;
    };
}

export interface AINodeData extends BaseWorkflowData {
    variant: 'ai';
    aiModel?: 'gpt-4' | 'claude-3' | 'mistral' | 'gpt-4o';
    systemRole?: string;
    userPrompt?: string;
    temperature?: number;
}

export interface APINodeData extends BaseWorkflowData {
    variant: 'api';
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: Record<string, string>;
}

export interface EndNodeData extends BaseWorkflowData {
    variant: 'end';
}

export interface EmailNodeData extends BaseWorkflowData {
    variant: 'email';
    to?: string;
    subject?: string;
    body?: string;
}

export interface DocumentNodeData extends BaseWorkflowData {
    variant: 'document';
    templateId?: string;
    outputFormat?: 'PDF' | 'DOCX';
}

export interface TimerNodeData extends BaseWorkflowData {
    variant: 'timer';
    duration: number;
    unit: 'minutes' | 'hours' | 'days';
}

export interface FileNodeData extends BaseWorkflowData {
    variant: 'file';
    requiredFiles: string[];
}

export interface WebhookNodeData extends BaseWorkflowData {
    variant: 'webhook';
    url: string;
    method: 'POST' | 'GET';
    payload?: any;
}

export type WorkflowData =
    | ActionNodeData
    | DecisionNodeData
    | AINodeData
    | APINodeData
    | TriggerNodeData
    | EndNodeData
    | EmailNodeData
    | DocumentNodeData
    | TimerNodeData
    | FileNodeData
    | WebhookNodeData;

// Type guard
export const isActionNode = (data: WorkflowData): data is ActionNodeData => data.variant === 'action';
export const isDecisionNode = (data: WorkflowData): data is DecisionNodeData => data.variant === 'decision' || data.variant === 'condition';
export const isAINode = (data: WorkflowData): data is AINodeData => data.variant === 'ai';
export const isAPINode = (data: WorkflowData): data is APINodeData => data.variant === 'api';
