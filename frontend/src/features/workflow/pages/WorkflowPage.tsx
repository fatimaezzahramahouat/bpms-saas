import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Lock, Eye, Save, ChevronLeft, ShieldCheck, Play, Zap, Split, Square, AlertCircle, Mail } from 'lucide-react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    Panel,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TurboNode from '../components/turbo/TurboNode';
import { WorkflowData, ActionNodeData, TriggerNodeData, EndNodeData } from '../types';
import TurboEdge from '../components/turbo/TurboEdge';
import { WorkflowSidebar } from '../components/WorkflowSidebar';
import { AIFlowDesigner } from '../components/AIFlowDesigner';
import { AnimatePresence } from 'motion/react';
import { workflowService } from '../../../services/workflow.service';
import { toast } from 'react-toastify';
import { WorkflowHeader } from '../components/WorkflowHeader';
import { NodeConfigPanel } from '../components/NodeConfigPanel';
import ConditionNode from '../components/turbo/ConditionNode';
import { usePermission } from '../../../shared/hooks/usePermission';

const nodeTypes = {
    turbo: TurboNode,
    conditionNode: ConditionNode,
};

const edgeTypes = {
    turbo: TurboEdge,
};

const initialNodes: Node<WorkflowData>[] = [
    {
        id: 'start-1',
        type: 'turbo',
        position: { x: 250, y: 250 },
        data: {
            title: 'Start Workflow',
            variant: 'trigger',
            role: 'ADMIN',
            assigneeType: 'ALL',
            slaDuration: 0,
            requiredDocuments: [],
            autoEmail: { enabled: false }
        } as TriggerNodeData,
    },
];

const initialEdges: Edge[] = [];

let nodeId = 0;
const getNewId = () => `node_ai_${nodeId++}_${Date.now()}`;

const WorkflowEditor: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowData>>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Permission Hook
    const { role: rawRole, canEditWorkflow } = usePermission();

    // DEBUG LOG FOR DEMO
    console.log("DEBUG ROLE:", rawRole);

    const roleString = (rawRole || '').toUpperCase();
    const canEdit = canEditWorkflow;

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) || null,
        [nodes, selectedNodeId]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const isCondition = sourceNode?.data.variant === 'condition' || sourceNode?.data.variant === 'decision';

            const color = isCondition ? '#22c55e' : '#3b82f6';

            setEdges((eds) => addEdge({
                ...params,
                type: 'turbo',
                animated: true,
                style: { stroke: color, strokeWidth: 3 }
            }, eds));
        },
        [nodes, setEdges]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const updateNodeData = useCallback((id: string, newData: Partial<WorkflowData>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...newData } as WorkflowData };
                }
                return node;
            })
        );
    }, [setNodes]);

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        setSelectedNodeId(null);
    }, [setNodes, setEdges]);

    const resetWorkflow = useCallback(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
        setSelectedNodeId(null);
        toast.info("Le canvas a été réinitialisé.");
    }, [setNodes, setEdges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            if (!reactFlowWrapper.current || !reactFlowInstance) return;

            const dataStr = event.dataTransfer.getData('application/reactflow');
            if (!dataStr) return;

            const parsed = JSON.parse(dataStr);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node<WorkflowData> = {
                id: getNewId(),
                type: parsed.nodeType,
                position,
                data: {
                    title: parsed.label,
                    variant: parsed.variant,
                    role: 'EMPLOYE',
                    assigneeType: 'ALL',
                    slaDuration: 24,
                    requiredDocuments: [],
                    autoEmail: { enabled: false }
                } as ActionNodeData,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const saveWorkflow = async () => {
        const startNode = nodes.find(n => n.data.variant === 'trigger');
        if (!startNode) {
            toast.error("Erreur : Aucun nœud 'Début' (Trigger) trouvé !");
            return;
        }

        const steps = nodes.map((node, index) => ({
            name: node.data.title || 'Étape sans titre',
            order: index + 1,
            metadata: {
                variant: node.data.variant,
                role: (node.data as any).role,
                slaDuration: (node.data as any).slaDuration,
                requiredDocuments: (node.data as any).requiredDocuments,
                autoEmail: (node.data as any).autoEmail,
                actionType: (node.data as any).actionType,
                position: node.position,
                nodeId: node.id
            }
        }));

        const payload = {
            name: 'Nouveau Workflow',
            nodes: nodes,
            edges: edges,
            steps: steps,
        };

        const loadingToast = toast.loading("Sauvegarde du workflow...");
        try {
            await workflowService.createWorkflow(payload);
            toast.update(loadingToast, { render: "Workflow sauvegardé dans la base de données !", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error: any) {
            console.error('Save Error:', error);
            toast.update(loadingToast, { render: `Échec de la sauvegarde : ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleAIGeneration = (newNodes: Node<WorkflowData>[], newEdges: Edge[]) => {
        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));

        setTimeout(() => reactFlowInstance?.fitView({ duration: 800 }), 100);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#050507] transition-colors duration-300 overflow-hidden">
            <div className="flex-1 relative turbo-flow z-0" ref={reactFlowWrapper}>
                {canEdit && (
                    <div className="pt-20 absolute inset-y-0 left-0 z-30 pointer-events-none">
                        <div className="h-full pointer-events-auto">
                            <WorkflowSidebar />
                        </div>
                    </div>
                )}
                <div className="z-40 relative">
                    <WorkflowHeader
                        title="Workflow Designer"
                        subtitle={canEdit ? `Editor Mode (${roleString})` : 'Viewer Mode'}
                        onSave={saveWorkflow}
                        onReset={resetWorkflow}
                    />
                </div>

                <ReactFlow<Node<WorkflowData>, Edge>
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{ type: 'turbo' }}
                    fitView
                    colorMode="system"
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        color="currentColor"
                        className="text-zinc-200 dark:text-zinc-800"
                        gap={20}
                        size={1}
                    />

                    <Controls
                        className="!bg-white dark:!bg-[#0d0d12] !border-zinc-200 dark:!border-white/5 !fill-zinc-600 dark:!fill-white/70"
                        showInteractive={canEdit}
                    />

                    <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
                        <defs>
                            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#9333ea" />
                            </linearGradient>
                            <linearGradient id="edge-gradient-selected" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#60a5fa" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>
                </ReactFlow>

                {canEdit && <AIFlowDesigner onGenerate={handleAIGeneration} />}

                <AnimatePresence>
                    {selectedNode && (
                        <NodeConfigPanel
                            node={selectedNode}
                            onUpdate={updateNodeData}
                            onDelete={deleteNode}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const WorkflowPage: React.FC = () => {
    return (
        <ReactFlowProvider>
            <WorkflowEditor />
        </ReactFlowProvider>
    );
};
