import React from 'react';
import {
    Play,
    User,
    Cpu,
    Square,
    GripVertical,
    MousePointer2,
    Split
} from 'lucide-react';

interface NodeTemplate {
    type: string;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
}

const nodeTemplates: NodeTemplate[] = [
    {
        type: 'trigger',
        label: 'Début',
        icon: Play,
        description: 'Point d\'entrée du workflow',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
        type: 'action',
        label: 'Tâche Humaine',
        icon: User,
        description: 'Action requise par un utilisateur',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    {
        type: 'action', // or 'condition' if preferred
        label: 'Tâche Système',
        icon: Cpu,
        description: 'Traitement automatique',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    },
    {
        type: 'condition',
        label: 'Condition',
        icon: Split,
        description: 'Logique de branchement If/Else',
        color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
    },
    {
        type: 'end',
        label: 'Fin',
        icon: Square,
        description: 'Terminaison du processus',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    },
];

export const WorkflowSidebar: React.FC = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        const data = JSON.stringify({ variant: nodeType, label });
        event.dataTransfer.setData('application/reactflow', data);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-80 h-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 transition-colors duration-300">
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-purple-500" />
                    Palette d'outils
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Glissez-déposez les éléments pour construire votre workflow.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {nodeTemplates.map((node) => (
                    <div
                        key={node.type}
                        onDragStart={(event) => onDragStart(event, node.type, node.label)}
                        draggable
                        className={`
              group flex items-center justify-between p-4 rounded-xl border
              bg-white dark:bg-slate-900 shadow-sm hover:shadow-md 
              hover:border-purple-500/50 dark:hover:border-purple-500/50
              cursor-grab active:cursor-grabbing transition-all duration-200
              border-slate-200 dark:border-slate-800
            `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg border ${node.color} transition-colors group-hover:scale-110 duration-200`}>
                                <node.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {node.label}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-500">
                                    {node.description}
                                </span>
                            </div>
                        </div>
                        <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400 dark:group-hover:text-slate-500" />
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 dark:border-purple-500/5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "Un workflow bien structuré est la clé d'une organisation performante."
                    </p>
                </div>
            </div>
        </aside>
    );
};
