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

import { TurboNode, TurboNodeData } from '../components/TurboNode';
import { TurboEdge } from '../components/TurboEdge';
import { WorkflowSidebar } from '../components/WorkflowSidebar';
import { AIAssistant } from '../components/AIAssistant';
import { NodeConfigPanel } from '../components/NodeConfigPanel';
import '../styles/workflow.css';
import { AnimatePresence } from 'motion/react';

const nodeTypes = {
    turbo: TurboNode,
};

const edgeTypes = {
    turbo: TurboEdge,
};

const initialNodes: Node[] = [
    {
        id: 'start-1',
        type: 'turbo',
        position: { x: 250, y: 250 },
        data: { label: 'Start Workflow', variant: 'trigger', targetRole: 'ADMIN', stepType: 'step' },
    },
];

const initialEdges: Edge[] = [];

let nodeId = 0;
const getNewId = () => `node_ai_${nodeId++}_${Date.now()}`;

const WorkflowEditor: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) || null,
        [nodes, selectedNodeId]
    );

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setIsAdmin(userData.role === 'ADMIN' || userData.isAdmin || userData.admin);
    }, []);

    const onConnect = useCallback(
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const isCondition = sourceNode?.data.variant === 'condition';

            // If it's a condition node, we might want to color the edge
            // For simplicity, we can use the sourceHandle to distinguish (if available)
            // or just cycle through colors for this demo
            const color = isCondition ? '#22c55e' : '#3b82f6'; // Default green for condition first branch

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

    const updateNodeData = useCallback((id: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: newData };
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

            const newNode: Node = {
                id: getNewId(),
                type: parsed.nodeType,
                position,
                data: {
                    label: parsed.label,
                    variant: parsed.variant,
                    targetRole: 'SYSTEM',
                    stepType: parsed.variant === 'condition' ? 'condition' : (parsed.variant === 'ai' ? 'ai' : 'step')
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const saveWorkflow = () => {
        // 1. Find the trigger node
        const startNode = nodes.find(n => n.data.variant === 'trigger');
        if (!startNode) {
            alert("Erreur : Aucun nœud 'Début' (Trigger) trouvé !");
            return;
        }

        const steps: any[] = [];
        const visited = new Set<string>();
        const queue: { id: string, order: number }[] = [{ id: startNode.id, order: 1 }];

        // 2. Simple BFS traversal to calculate order
        while (queue.length > 0) {
            const { id, order } = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);

            const node = nodes.find(n => n.id === id);
            if (node && node.data.variant !== 'trigger' && node.data.variant !== 'end') {
                steps.push({
                    id: node.id,
                    label: node.data.label,
                    targetRole: node.data.targetRole || 'SYSTEM',
                    stepType: node.data.stepType || 'step',
                    order: order
                });
            }

            // Find neighbors
            const outboundEdges = edges.filter(e => e.source === id);
            outboundEdges.forEach((edge, index) => {
                if (!visited.has(edge.target)) {
                    queue.push({ id: edge.target, order: steps.length + 1 });
                }
            });
        }

        console.log("=== WORKFLOW EXPORT (JobInTech Schema) ===");
        console.log(JSON.stringify(steps, null, 2));
        alert("Workflow sauvegardé ! Consultez la console pour le JSON.");
    };

    const handleAIGeneration = (prompt: string) => {
        // Simulated AI generation of nodes based on prompt
        const newId1 = getNewId();
        const newId2 = getNewId();

        const aiNodes: Node[] = [
            {
                id: newId1,
                type: 'turbo',
                position: { x: 400, y: 100 },
                data: { label: 'RH Validation', variant: 'action', targetRole: 'RH', stepType: 'step' },
            },
            {
                id: newId2,
                type: 'turbo',
                position: { x: 600, y: 100 },
                data: { label: 'AI Check', variant: 'condition', targetRole: 'SYSTEM', stepType: 'step' },
            }
        ];

        const aiEdges: Edge[] = [
            { id: `e-${newId1}-${newId2}`, source: newId1, target: newId2, type: 'turbo', animated: true }
        ];

        setNodes((nds) => nds.concat(aiNodes));
        setEdges((eds) => eds.concat(aiEdges));

        // Auto-fit view after AI generation
        setTimeout(() => reactFlowInstance?.fitView({ duration: 800 }), 100);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#050507] transition-colors duration-300 overflow-hidden">
            <div className="flex-1 relative turbo-flow" ref={reactFlowWrapper}>
                {isAdmin && <WorkflowSidebar />}

                <ReactFlow
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
                        showInteractive={isAdmin}
                    />

                    <Panel position="top-right" className="bg-white/80 dark:bg-[#0d0d12]/60 backdrop-blur-md border border-zinc-200 dark:border-white/5 p-4 rounded-2xl shadow-xl flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-8">
                            <div>
                                <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 uppercase tracking-tight">
                                    Workflow Designer
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                        {isAdmin ? 'Editor Mode (Admin)' : 'Viewer Mode'}
                                    </p>
                                </div>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={saveWorkflow}
                                    className="px-6 py-2.5 bg-h1-blue hover:bg-h1-blue/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-h1-blue/20 transition-all flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Sauvegarder
                                </button>
                            )}
                        </div>
                    </Panel>

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

                {isAdmin && <AIAssistant onGenerate={handleAIGeneration} />}

                <AnimatePresence>
                    {selectedNode && (
                        <NodeConfigPanel
                            node={selectedNode as Node<TurboNodeData>}
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
