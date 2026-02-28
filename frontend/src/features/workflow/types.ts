export type AppRole = 'ADMIN' | 'RH' | 'MANAGER' | 'EMPLOYE';
export type ActionType = 'CONGE' | 'RECRUTEMENT' | 'DEMANDE_ACHAT' | 'APPROBATION';

export interface BaseWorkflowData {
    title: string;
    subTitle?: string;
    icon?: string;
    category?: string;
    variant: 'trigger' | 'action' | 'condition' | 'end' | 'ai' | 'decision' | 'api';
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
    model: 'gpt-4o' | 'claude-3-5-sonnet' | 'gpt-4-turbo';
    systemPrompt: string;
    temperature: number;
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

export type WorkflowData =
    | ActionNodeData
    | DecisionNodeData
    | AINodeData
    | APINodeData
    | TriggerNodeData
    | EndNodeData;

// Type guard
export const isActionNode = (data: WorkflowData): data is ActionNodeData => data.variant === 'action';
export const isDecisionNode = (data: WorkflowData): data is DecisionNodeData => data.variant === 'decision' || data.variant === 'condition';
export const isAINode = (data: WorkflowData): data is AINodeData => data.variant === 'ai';
export const isAPINode = (data: WorkflowData): data is APINodeData => data.variant === 'api';
