import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Diamond, Split } from 'lucide-react';
import { DecisionNodeData } from '../../types';

const ConditionNode = ({ data, selected }: NodeProps<Node<DecisionNodeData>>) => {
    const { condition } = data;

    return (
        <div className={`relative p-4 rounded-xl bg-slate-900 border-2 transition-all duration-300 min-w-[220px] shadow-2xl
            ${selected ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-slate-800 hover:border-slate-700'}
        `}>
            {/* Diamond Icon Background Ornament */}
            <div className="absolute -top-3 -left-3 p-2 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
                <Diamond className="w-5 h-5 text-white" />
            </div>

            <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condition Logic</span>
                </div>

                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-sm font-medium text-white text-center">
                        {condition?.variable || 'Variable'}
                        <span className="text-amber-500 mx-2 font-mono">{condition?.operator || '==='}</span>
                        {condition?.value || 'Valeur'}
                    </p>
                </div>

                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase">Vrai</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-rose-500 uppercase">Faux</span>
                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    </div>
                </div>
            </div>

            {/* Input Handle (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-slate-900 !border-2 !border-blue-500 !w-3 !h-3 hover:!bg-blue-500 transition-colors"
                style={{ top: -6 }}
            />

            {/* Output Handle A (TRUE - Right) */}
            <Handle
                type="source"
                id="true"
                position={Position.Right}
                className="!bg-slate-900 !border-2 !border-emerald-500 !w-3 !h-3 hover:!bg-emerald-500 transition-colors"
                style={{ right: -6 }}
            />

            {/* Output Handle B (FALSE - Bottom) */}
            <Handle
                type="source"
                id="false"
                position={Position.Bottom}
                className="!bg-slate-900 !border-2 !border-rose-500 !w-3 !h-3 hover:!bg-rose-500 transition-colors"
                style={{ bottom: -6 }}
            />
        </div>
    );
};

export default memo(ConditionNode);
