import React from 'react';
import {
    Zap,
    Play,
    Settings,
    Split,
    Square,
    Activity
} from 'lucide-react';

export type NodeType = 'trigger' | 'action' | 'condition' | 'ai' | 'end';

interface NodeItem {
    type: NodeType;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

const nodeItems: NodeItem[] = [
    {
        type: 'trigger',
        label: 'Trigger',
        description: 'Starts the workflow',
        icon: Play,
        color: 'text-green-400'
    },
    {
        type: 'action',
        label: 'Action',
        description: 'Performs a task',
        icon: Zap,
        color: 'text-blue-400'
    },
    {
        type: 'condition',
        label: 'Condition',
        description: 'If/Else logic',
        icon: Split,
        color: 'text-yellow-400'
    },
    {
        type: 'ai',
        label: 'IA Process',
        description: 'Traitement intelligent',
        icon: Zap,
        color: 'text-purple-400'
    },
    {
        type: 'end',
        label: 'End',
        description: 'Finishes flow',
        icon: Square,
        color: 'text-red-400'
    },
];

export const WorkflowSidebar: React.FC = () => {
    const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType: 'turbo', label, variant: nodeType }));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="absolute left-6 top-6 bottom-6 w-64 bg-white/80 dark:bg-[#0d0d12]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-5 z-10 shadow-2xl flex flex-col gap-6 transition-colors duration-300">
            <div>
                <h2 className="text-zinc-900 dark:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    Nodes Palette
                </h2>
                <p className="text-zinc-500 dark:text-gray-500 text-[10px] mt-1">Drag and drop to build logic</p>
            </div>

            <div className="flex flex-col gap-3">
                {nodeItems.map((item) => (
                    <div
                        key={item.type}
                        className="dndnode group flex items-center gap-3"
                        onDragStart={(event) => onDragStart(event, item.type, item.label)}
                        draggable
                    >
                        <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-white/5 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-colors`}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white">{item.label}</span>
                            <span className="text-[9px] text-zinc-500 dark:text-gray-500">{item.description}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
                <p className="text-[10px] text-purple-600 dark:text-purple-300 font-medium leading-relaxed">
                    TIP: Use conditions to branch your workflow based on custom variables.
                </p>
            </div>
        </div>
    );
};
