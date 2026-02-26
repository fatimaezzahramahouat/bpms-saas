import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import {
    Zap,
    Play,
    Split,
    Square,
    AlertCircle
} from 'lucide-react';

export type TurboNodeData = {
    label: string;
    targetRole: 'ADMIN' | 'RH' | 'MANAGER' | 'EMPLOYE' | 'SYSTEM';
    assignedUserId?: string;
    stepType: 'step' | 'condition' | 'ai';
    variant: 'trigger' | 'action' | 'condition' | 'end' | 'ai';
};

const getIcon = (variant: string) => {
    switch (variant) {
        case 'trigger': return <Play className="w-4 h-4 text-green-400" />;
        case 'action': return <Zap className="w-4 h-4 text-blue-400" />;
        case 'condition': return <Split className="w-4 h-4 text-yellow-400" />;
        case 'ai': return <Zap className="w-4 h-4 text-purple-400 animate-pulse" />;
        case 'end': return <Square className="w-4 h-4 text-red-400" />;
        default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
};

const getTitle = (variant: string) => {
    return variant.charAt(0).toUpperCase() + variant.slice(1);
};

export const TurboNode = memo(({ data, selected }: NodeProps<Node<TurboNodeData>>) => {
    const isRH = data.targetRole === 'RH';

    return (
        <div className={`turbo-node p-4 min-w-[180px] bg-white dark:bg-[#0d0d12] border ${isRH ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-zinc-200 dark:border-white/10'} ${selected ? 'selected' : ''}`}>
            <div className="turbo-node-glow" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 shadow-inner">
                    {getIcon(data.variant || 'action')}
                </div>
                <div className="flex flex-col">
                    <h3 className="text-zinc-900 dark:text-white text-xs font-bold leading-none mb-1">
                        {data.label || getTitle(data.variant || 'action')}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <p className="text-zinc-500 dark:text-gray-500 text-[9px] font-medium uppercase tracking-wider">
                            {data.stepType || data.variant}
                        </p>
                        {data.targetRole && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <p className={`text-[9px] font-black tracking-tighter ${isRH ? 'text-blue-500' : 'text-zinc-400'}`}>
                                    {data.targetRole}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !-left-1.5"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !-right-1.5"
            />
        </div>
    );
});

TurboNode.displayName = 'TurboNode';
