import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    useReactFlow,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TurboNode from '../components/turbo/TurboNode';
import { WorkflowData, ActionNodeData, TriggerNodeData } from '../types';
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
import { useGlobalModal } from '../../../shared/components/GlobalModal';

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
            title: 'Début du Workflow',
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
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition, fitView, toObject } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowData>>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { isAdmin, canEditWorkflow: canEdit } = usePermission();
    const { showModal, showConfirm } = useGlobalModal();
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [workflowName, setWorkflowName] = useState('Nouveau Workflow');
    const [dataModel, setDataModel] = useState<any>(null);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) || null,
        [nodes, selectedNodeId]
    );

    useEffect(() => {
        if (id && id !== 'new') {
            const fetchWf = async () => {
                try {
                    const response = await workflowService.getWorkflowById(id);
                    const wf = response.data;

                    if (wf) {
                        setNodes(wf.nodes || initialNodes);
                        setEdges(wf.edges || initialEdges);
                        setWorkflowName(wf.name || 'Workflow Sans Titre');
                        setDataModel(wf.data_model || []);

                        setTimeout(() => fitView({ duration: 800 }), 300);
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Erreur de chargement du workflow");
                }
            };

            fetchWf();
        }
    }, [id, setNodes, setEdges, fitView]);

    const onConnect = useCallback(
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const isCondition = sourceNode?.data.variant === 'condition' || sourceNode?.data.variant === 'decision';
            const color = isCondition ? '#22c55e' : '#3b82f6';

            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: 'turbo',
                        animated: true,
                        style: { stroke: color, strokeWidth: 3 },
                        data: { color },
                    },
                    eds
                )
            );
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
            nds.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, ...newData } as WorkflowData }
                    : node
            )
        );
    }, [setNodes]);

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        setSelectedNodeId(null);
    }, [setNodes, setEdges]);

    const resetWorkflow = useCallback(() => {
        showConfirm({
            message: 'Êtes-vous sûr de vouloir tout effacer ?',
            title: 'Réinitialiser le Workflow',
            confirmLabel: 'Tout effacer',
            variant: 'danger',
            onConfirm: () => {
                setNodes(initialNodes);
                setEdges(initialEdges);
                setSelectedNodeId(null);
                toast.info("Canvas réinitialisé.");
            }
        });
    }, [setNodes, setEdges, showConfirm]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const dataStr = event.dataTransfer.getData('application/reactflow');
            if (!dataStr) return;

            const parsed = JSON.parse(dataStr);

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node<WorkflowData> = {
                id: getNewId(),
                type: parsed.nodeType || 'turbo',
                position,
                data: {
                    title: parsed.label,
                    variant: parsed.variant,
                    role: 'EMPLOYE',
                    assigneeType: 'ALL',
                    slaDuration: 24,
                    requiredDocuments: [],
                    autoEmail: { enabled: false }
                } as any,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes]
    );

    const saveWorkflow = async () => {
        const flow = toObject();

        if (!workflowName || workflowName.trim() === '') {
            toast.error("Veuillez donner un nom à votre workflow avant de sauvegarder.");
            return;
        }

        const startNode = flow.nodes.find(n => n.data.variant === 'trigger');

        if (!startNode) {
            toast.error("Erreur : Aucun nœud 'Début' trouvé !");
            return;
        }

        const steps = flow.nodes.map((node, index) => ({
            name: node.data.title || 'Étape sans titre',
            order: index + 1,
            metadata: {
                variant: node.data.variant,
                position: node.position,
                nodeId: node.id
            }
        }));

        const payload = {
            name: workflowName,
            nodes: flow.nodes,
            edges: flow.edges,
            steps,
            data_model: dataModel,
        };

        const loadingToast = toast.loading(
            id && id !== 'new'
                ? "Mise à jour du workflow..."
                : "Création du workflow..."
        );

        try {
            if (id && id !== 'new') {

                await workflowService.updateWorkflow(id, payload);

                toast.update(loadingToast, {
                    render: "Workflow mis à jour !",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });

            } else {

                const response = await workflowService.createWorkflow(payload);
                const newWf = response.data;

                toast.update(loadingToast, {
                    render: "Workflow créé !",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });

                showModal('Workflow créé avec succès !', 'success');

                if (newWf?.id) {
                    navigate(`/dashboard/workflow/${newWf.id}`, { replace: true });
                }
            }

        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;

            toast.update(loadingToast, {
                render: `Échec : ${msg}`,
                type: "error",
                isLoading: false,
                autoClose: 5000
            });
        }
    };

    const handleAIGeneration = (newNodes: Node<WorkflowData>[], newEdges: Edge[]) => {
        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));
        setTimeout(() => fitView({ duration: 800 }), 100);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#050507] overflow-hidden relative">

            {/* HEADER LFOQ W MAFIHCH ABSOLUTE */}
            <div className="z-50 relative w-full">
                <WorkflowHeader
                    title={workflowName}
                    setName={setWorkflowName}
                    subtitle={isAdmin ? 'Mode Éditeur (Admin)' : 'Mode Visionneuse'}
                    onSave={saveWorkflow}
                    onReset={resetWorkflow}
                />
            </div>

            <div className="flex-1 relative" ref={reactFlowWrapper}>

                {/* 7IYEDNA hidden lg:block BACH SLIDE MA TEKHTAFACH F RESPONSIVE */}
                {canEdit && (
                    <div className="absolute inset-y-0 left-0 z-40 pt-4">
                        <WorkflowSidebar dataModel={dataModel} />
                    </div>
                )}

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                >

                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                    />

                    <Controls />

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

export default WorkflowPage;