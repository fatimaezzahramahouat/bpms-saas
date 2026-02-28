import React, { useState, useCallback, useRef } from 'react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    useReactFlow,
    Node,
    ReactFlowProvider,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowSidebar } from '../features/workflow/components/WorkflowSidebar';
import { WorkflowData } from '../features/workflow/types';
import TurboNode from '../features/workflow/components/turbo/TurboNode';
import { AIAssistant } from '../features/workflow/components/AIAssistant';
import '../features/workflow/styles/workflow.css';
import { Lock, Eye, Save, ChevronLeft, ShieldCheck } from 'lucide-react';

// RBAC Configuration
type Role = 'ADMIN' | 'MANAGER' | 'RH';
const USER_ROLE: Role = 'ADMIN';

const nodeTypes = {
    turbo: TurboNode,
};

const initialNodes: Node<WorkflowData>[] = [
    {
        id: '1',
        type: 'turbo',
        data: {
            title: 'Début du Processus',
            variant: 'trigger',
            role: 'ADMIN',
            assigneeType: 'ALL',
            slaDuration: 0,
            requiredDocuments: [],
            autoEmail: { enabled: false }
        },
        position: { x: 250, y: 150 },
    },
];

const EditorContent: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowData>>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();

    const isAdmin = USER_ROLE === 'ADMIN';

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!isAdmin) return;

            const jsonData = event.dataTransfer.getData('application/reactflow');

            if (!jsonData) return;

            try {
                const { variant, label } = JSON.parse(jsonData);

                const position = screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });

                const newNode: Node<WorkflowData> = {
                    id: `node_${Date.now()}`,
                    type: 'turbo',
                    position,
                    data: {
                        title: label,
                        variant: variant,
                        role: 'EMPLOYE',
                        assigneeType: 'ALL',
                        slaDuration: 24,
                        requiredDocuments: [],
                        autoEmail: { enabled: false }
                    },
                };

                setNodes((nds) => nds.concat(newNode));
            } catch (e) {
                console.error('Failed to parse node data', e);
            }
        },
        [screenToFlowPosition, setNodes, isAdmin]
    );

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
            {/* Sidebar - Hidden if not Admin */}
            {isAdmin && <WorkflowSidebar />}

            {/* Canvas Area */}
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                {/* Editor Toolbar */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full shadow-xl">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white px-2">
                        Workflow: Recrutement Senior
                    </span>

                    {!isAdmin && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <Eye className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Mode Visualisation</span>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="flex items-center gap-3 ml-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition-all">
                                <Save className="w-3.5 h-3.5" />
                                Sauvegarder
                            </button>
                        </div>
                    )}
                </div>

                {/* Role Indicator (Corner) */}
                <div className="absolute bottom-6 right-6 z-20">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
                        <div className={`p-2 rounded-lg ${isAdmin ? 'bg-purple-500/10' : 'bg-slate-500/10'}`}>
                            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-purple-500' : 'text-slate-500'}`} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium leading-none">Rôle Actuel</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{USER_ROLE}</p>
                        </div>
                    </div>
                </div>

                <ReactFlow<Node<WorkflowData>, Edge>
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    fitView
                    nodeTypes={nodeTypes}
                    colorMode="system"
                    nodesDraggable={isAdmin}
                    nodesConnectable={isAdmin}
                    elementsSelectable={true}
                >
                    <Background color="#94a3b8" variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Controls className="dark:bg-slate-900 dark:border-slate-800 dark:fill-white" />
                    <MiniMap
                        className="dark:bg-slate-900 dark:border-slate-800 rounded-xl overflow-hidden"
                        nodeStrokeColor={(n) => {
                            if (n.type === 'turbo') return '#9333ea';
                            return '#eee';
                        }}
                        nodeColor={() => {
                            return 'rgba(147, 51, 234, 0.1)';
                        }}
                    />
                </ReactFlow>

                {/* AI Assistant - Only for Admins */}
                {isAdmin && <AIAssistant onGenerate={(prompt) => console.log('AI Generate:', prompt)} />}
            </div>
        </div>
    );
};

const WorkflowEditor: React.FC = () => {
    return (
        <ReactFlowProvider>
            <EditorContent />
        </ReactFlowProvider>
    );
};

export default WorkflowEditor;
