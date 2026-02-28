import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { FunctionIcon } from './FunctionIcon';
import { Sparkles, Clock, FileText, MoreVertical, Split } from 'lucide-react';
import './turbo-style.css';

import { WorkflowData, isDecisionNode, isActionNode } from '../../types';

const TurboNode = ({ data, selected }: NodeProps<Node<WorkflowData>>) => {
    const isDecision = data.variant === 'decision';

    return (
        <div className={`turbo-glass turbo-gradient-border min-w-[300px] rounded-xl group ${selected ? 'turbo-node-selected' : ''} ${isDecision ? 'border-amber-500/30' : ''}`}>
            {/* Header Area */}
            <div className="p-4 pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${isDecision ? 'from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'from-blue-500/10 to-purple-500/10 border-white/5'} border shadow-inner`}>
                            {isDecision ? (
                                <Split className="w-5 h-5 text-amber-400" />
                            ) : (
                                <FunctionIcon iconName={data.icon || 'Activity'} className="w-5 h-5 text-blue-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-tight turbo-glow-text">{data.title || 'Sans titre'}</h3>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                {data.category || (isDecision ? 'DECISION' : 'PROCESS STEP')}
                            </p>
                        </div>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body / Description */}
            {(data.subTitle) && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-slate-300 leading-relaxed font-light">{data.subTitle}</p>
                </div>
            )}

            {/* Smart Footer (SLA, Role, Docs) */}
            <div className="px-4 py-2.5 bg-white/5 border-t border-white/5 flex items-center justify-between rounded-b-xl">
                <div className="flex items-center gap-2">
                    {isActionNode(data) && (
                        <>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">{data.role || 'EMPLOYE'}</span>
                            </div>
                            {data.slaDuration > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span className="text-[10px] font-semibold text-amber-400">{data.slaDuration}h</span>
                                </div>
                            )}
                            {data.autoEmail?.enabled && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                                    <Sparkles className="w-3 h-3 text-blue-400" />
                                    <span className="text-[10px] font-semibold text-blue-400 uppercase">Email</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {isActionNode(data) && data.requiredDocuments?.length > 0 && (
                    <div className="group/doc flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
                        <FileText className="w-3.5 h-3.5 text-slate-400 group-hover/doc:text-blue-300" />
                        <span className="text-[10px] text-slate-400 group-hover/doc:text-blue-300">{data.requiredDocuments.length} Docs</span>
                    </div>
                )}
            </div>

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-900 !border-2 !border-blue-500 !w-3.5 !h-3.5 shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:!bg-blue-500 transition-colors"
            />

            {!isDecision ? (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-slate-900 !border-2 !border-purple-500 !w-3.5 !h-3.5 shadow-[0_0_12px_rgba(168,85,247,0.6)] hover:!bg-purple-500 transition-colors"
                />
            ) : (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="approve"
                        style={{ top: '30%' }}
                        className="!bg-slate-900 !border-2 !border-emerald-500 !w-3.5 !h-3.5 shadow-[0_0_12px_rgba(16,185,129,0.6)] hover:!bg-emerald-500 transition-colors"
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="reject"
                        style={{ top: '70%' }}
                        className="!bg-slate-900 !border-2 !border-rose-500 !w-3.5 !h-3.5 shadow-[0_0_12px_rgba(244,63,94,0.6)] hover:!bg-rose-500 transition-colors"
                    />
                </>
            )}

            {/* Decision Specific Handles */}
            {isDecision && (
                <>
                    <div className="absolute -right-4 top-1/2 -translate-y-[24px] text-[8px] text-emerald-400 font-bold uppercase tracking-tighter">Vrai</div>
                    <div className="absolute -right-4 top-1/2 translate-y-[8px] text-[8px] text-rose-400 font-bold uppercase tracking-tighter">Faux</div>
                </>
            )}
        </div>
    );
};

export default memo(TurboNode);
