import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { Diamond, Split, GitBranch } from 'lucide-react';
import { DecisionNodeData } from '../../types';

const ConditionNode = ({ id, data, selected }: NodeProps<Node<DecisionNodeData>>) => {
    const { setNodes } = useReactFlow();
    const { condition } = data;

    const updateCondition = useCallback((field: string, value: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            condition: {
                                ...((node.data as DecisionNodeData).condition || { variable: '', operator: '===', value: '' }),
                                [field]: value,
                            },
                        },
                    };
                }
                return node;
            })
        );
    }, [id, setNodes]);

    return (
        <div className={`relative p-5 rounded-3xl bg-slate-900 border-2 transition-all duration-300 min-w-[260px] shadow-2xl
            ${selected ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'border-slate-800 hover:border-slate-700'}
        `}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
                    <Split className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest leading-tight">
                        {(data as any).label || data.title || 'Condition Logic'}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5 whitespace-nowrap">Branchement Intelligent</p>
                </div>
            </div>

            {/* Inline Inputs */}
            <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2">
                    <input
                        type="text"
                        value={condition?.variable || ''}
                        onChange={(e) => updateCondition('variable', e.target.value)}
                        placeholder="Variable"
                        className="col-span-12 bg-slate-950/80 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700"
                    />
                    <select
                        value={condition?.operator || '==='}
                        onChange={(e) => updateCondition('operator', e.target.value)}
                        className="col-span-4 bg-slate-950/80 border border-white/5 rounded-lg px-2 py-2 text-[11px] text-amber-500 font-mono focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                    >
                        <option value="===">===</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="!=">!=</option>
                        <option value="contains">In</option>
                    </select>
                    <input
                        type="text"
                        value={condition?.value || ''}
                        onChange={(e) => updateCondition('value', e.target.value)}
                        placeholder="Valeur"
                        className="col-span-8 bg-slate-950/80 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700"
                    />
                </div>
            </div>

            {/* Input Handle (Top) */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-950 !border-2 !border-blue-500 !w-3.5 !h-3.5 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
            />

            {/* Right Side Handles (OUI/NON) */}
            <div className="absolute -right-2 top-0 bottom-0 flex flex-col justify-around py-8">
                <div className="relative group/handle">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="true"
                        className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white dark:!border-slate-900 shadow-[0_0_12px_rgba(16,185,129,0.5)] hover:scale-125 transition-transform"
                    />
                    <span className="absolute left-6 -top-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-0 group-hover/handle:opacity-100 transition-opacity">Vrai</span>
                </div>
                <div className="relative group/handle">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="false"
                        className="!w-4 !h-4 !bg-rose-500 !border-2 !border-white dark:!border-slate-900 shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:scale-125 transition-transform"
                    />
                    <span className="absolute left-6 -top-2 text-[9px] font-black text-rose-500 uppercase tracking-widest opacity-0 group-hover/handle:opacity-100 transition-opacity">Faux</span>
                </div>
            </div>

            {/* Labels in node for visual clarity if no zoom */}
            <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-end gap-2 pr-1">
                    <span className="text-[10px] font-black text-emerald-500/50 uppercase">OUI</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex items-center justify-end gap-2 pr-1">
                    <span className="text-[10px] font-black text-rose-500/50 uppercase">NON</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                </div>
            </div>
        </div>
    );
};

export default memo(ConditionNode);
