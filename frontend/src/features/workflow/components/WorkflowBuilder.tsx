import React, { useCallback, useRef, useState, useMemo } from 'react';
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
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TurboNode from './turbo/TurboNode';
import { WorkflowData, ActionNodeData, TriggerNodeData } from '../types';
import TurboEdge from './turbo/TurboEdge';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Sparkles, Save, ChevronLeft, Plus, Play, Rocket } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { workflowService } from '../../../services/workflow.service';
import { toast } from 'react-toastify';

const nodeTypes = {
    turbo: TurboNode,
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

let idCounter = 0;
const getId = () => `node_${idCounter++}_${Date.now()}`;

export const WorkflowBuilder: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowData>>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [workflowTitle, setWorkflowTitle] = useState('Nouveau Workflow');

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) || null,
        [nodes, selectedNodeId]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            let color = undefined;

            if (params.sourceHandle === 'approve') {
                color = '#10b981'; // Emerald
            } else if (params.sourceHandle === 'reject') {
                color = '#f43f5e'; // Rose
            }

            setEdges((eds) => addEdge({
                ...params,
                type: 'turbo',
                animated: true,
                data: { color }
            }, eds));
        },
        [setEdges]
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
        if (confirm('Voulez-vous vraiment vider tout le canvas ?')) {
            setNodes([]);
            setEdges([]);
            setSelectedNodeId(null);
            setWorkflowId(null);
        }
    }, [setNodes, setEdges]);

    const addNewNode = (variant: WorkflowData['variant']) => {
        const newNode: Node<WorkflowData> = {
            id: getId(),
            type: 'turbo',
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 400 + 100
            },
            data: {
                title: variant === 'decision' ? 'Nouvelle Décision' : 'Nouvelle Étape',
                variant: variant,
                role: 'EMPLOYE',
                assigneeType: 'ALL',
                slaDuration: 24,
                requiredDocuments: [],
                autoEmail: { enabled: false }
            } as any,
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const runAIAnalysis = () => {
        const nodeCount = nodes.length;
        if (nodeCount > 5) {
            toast.info("💡 Suggestion d'Optimisation IA : Ce workflow semble complexe. Envisagez de fusionner les étapes redondantes.");
        } else {
            toast.success("✨ Analyse IA : Votre workflow est optimal.");
        }
    };

    const saveWorkflow = async () => {
        const loadingToast = toast.loading("Sauvegarde du workflow...");
        try {
            const steps = nodes.map((node, index) => ({
                name: node.data.title || 'Étape sans titre',
                order: index + 1,
                metadata: {
                    variant: node.data.variant,
                    role: node.data.role,
                    slaDuration: node.data.slaDuration,
                    requiredDocuments: node.data.requiredDocuments,
                    autoEmail: node.data.autoEmail,
                    actionType: node.data.actionType,
                    position: node.position,
                    nodeId: node.id
                }
            }));

            const data = {
                name: workflowTitle,
                nodes: nodes,
                edges: edges,
                steps: steps,
            };

            let response;
            if (workflowId) {
                response = await workflowService.updateWorkflow(workflowId, data);
                toast.update(loadingToast, { render: "Workflow mis à jour !", type: "success", isLoading: false, autoClose: 3000 });
            } else {
                response = await workflowService.createWorkflow(data);
                setWorkflowId(response.data.id);
                toast.update(loadingToast, { render: "Workflow créé avec succès !", type: "success", isLoading: false, autoClose: 3000 });
            }
        } catch (error: any) {
            toast.update(loadingToast, { render: `Erreur: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const publishWorkflow = async () => {
        if (!workflowId) {
            toast.warning("Veuillez sauvegarder le workflow avant de le publier.");
            return;
        }

        const loadingToast = toast.loading("Publication en cours...");
        try {
            await workflowService.publishWorkflow(workflowId);
            toast.update(loadingToast, { render: "Workflow publié et activé !", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error: any) {
            toast.update(loadingToast, { render: `Erreur: ${error.response?.data?.error || error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#050507] overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                        <input
                            type="text"
                            value={workflowTitle}
                            onChange={(e) => setWorkflowTitle(e.target.value)}
                            className="bg-transparent border-none text-white font-black uppercase tracking-tighter text-sm focus:ring-0 p-0 w-64 placeholder:text-slate-700"
                            placeholder="Titre du Workflow..."
                        />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Éditeur Turbo v2.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={resetWorkflow}
                        className="px-4 py-2 hover:bg-white/5 text-slate-400 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-white/10"
                    >
                        Réinitialiser
                    </button>
                    <button
                        onClick={runAIAnalysis}
                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                    >
                        <Sparkles className="w-4 h-4" />
                        Analyse IA
                    </button>
                    <button
                        onClick={saveWorkflow}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Sauvegarder
                    </button>
                    <button
                        onClick={publishWorkflow}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <Rocket className="w-4 h-4" />
                        Publier
                    </button>
                </div>
            </div>

            {/* Main Flow Area */}
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                <ReactFlow<Node<WorkflowData>, Edge>
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onInit={setReactFlowInstance}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{ type: 'turbo' }}
                    fitView
                    colorMode="dark"
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="rgba(255,255,255,0.05)"
                    />
                    <Controls className="!bg-slate-900 !border-white/10 !fill-white/70" />

                    <Panel position="bottom-center" className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center gap-2 mb-4">
                        <button onClick={() => addNewNode('action')} className="p-3 hover:bg-white/5 text-blue-400 rounded-xl transition-all flex flex-col items-center gap-1 group">
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Étape</span>
                        </button>
                        <div className="w-px h-8 bg-white/10 mx-1" />
                        <button onClick={() => addNewNode('decision')} className="p-3 hover:bg-white/5 text-amber-400 rounded-xl transition-all flex flex-col items-center gap-1 group">
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Décision</span>
                        </button>
                        <div className="w-px h-8 bg-white/10 mx-1" />
                        <button onClick={() => addNewNode('ai')} className="p-3 hover:bg-white/5 text-purple-400 rounded-xl transition-all flex flex-col items-center gap-1 group">
                            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">IA AI</span>
                        </button>
                    </Panel>
                </ReactFlow>

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

export const WorkflowBuilderPage: React.FC = () => (
    <ReactFlowProvider>
        <WorkflowBuilder />
    </ReactFlowProvider>
);
