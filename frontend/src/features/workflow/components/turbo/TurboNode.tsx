import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FunctionIcon } from './FunctionIcon';
import { Sparkles, Clock, FileText, MoreVertical, Split, Mail, FileStack, Timer, Paperclip, Globe, UserCheck } from 'lucide-react';
import './turbo-style.css';

import { WorkflowData, isDecisionNode, isActionNode, AppRole } from '../../types';

const TurboNode = ({ id, data, selected }: NodeProps<Node<WorkflowData>>) => {
    const { setNodes } = useReactFlow();
    const isDecision = data.variant === 'decision' || data.variant === 'condition';

    const updateNodeData = useCallback((field: string, value: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, [field]: value } };
                }
                return node;
            })
        );
    }, [id, setNodes]);

    const getVariantConfig = () => {
        switch (data.variant) {
            case 'email': return { icon: Mail, color: 'text-sky-400', bg: 'from-sky-500/10 to-blue-500/10', label: 'EMAIL AUTO' };
            case 'document': return { icon: FileStack, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/10', label: 'GEN PDF' };
            case 'timer': return { icon: Timer, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/10', label: 'ATTENTE' };
            case 'file': return { icon: Paperclip, color: 'text-indigo-400', bg: 'from-indigo-500/10 to-blue-500/10', label: 'UPLOAD REQUIS' };
            case 'webhook': return { icon: Globe, color: 'text-rose-400', bg: 'from-rose-500/10 to-pink-500/10', label: 'API WEBHOOK' };
            case 'action': return { icon: UserCheck, color: 'text-blue-400', bg: 'from-blue-500/10 to-purple-500/10', label: 'TÂCHE HUMAINE' };
            default: return { icon: FunctionIcon, color: 'text-slate-400', bg: 'from-slate-500/10 to-slate-700/10', label: 'PROCESS' };
        }
    };

    const config = getVariantConfig();
    const Icon = config.icon as any;

    return (
        <div className={`turbo-glass turbo-gradient-border min-w-[320px] rounded-3xl group shadow-2xl transition-all duration-300 ${selected ? 'turbo-node-selected ring-2 ring-purple-500/50' : 'hover:border-white/20'}`}>
            {/* Header Area */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.bg} border border-white/10 shadow-xl`}>
                            {data.variant === 'action' ? (
                                <Icon className={`w-5 h-5 ${config.color}`} />
                            ) : data.variant === 'condition' || data.variant === 'decision' ? (
                                <Split className="w-5 h-5 text-amber-400" />
                            ) : (
                                <FunctionIcon iconName={data.icon || 'Activity'} className={`w-5 h-5 ${config.color}`} />
                            )}
                        </div>
                        <div>
                            <h3 className="text-[13px] font-black text-white tracking-widest uppercase truncate max-w-[180px]">
                                {data.title || 'Sans titre'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${config.color} tracking-tighter`}>
                                    {config.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Role / Context Selection (Only for Actions) */}
            {data.variant === 'action' && (
                <div className="px-5 pb-4">
                    <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5 space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Acteur Responsable</label>
                        <select
                            value={data.role || 'EMPLOYE'}
                            onChange={(e) => updateNodeData('role', e.target.value)}
                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white font-bold outline-none focus:ring-1 ring-purple-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="EMPLOYE">Employé (Initiateur)</option>
                            <option value="MANAGER">Manager Direct</option>
                            <option value="RH">Responsable RH</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Smart Footer Metrics */}
            <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between rounded-b-3xl">
                <div className="flex items-center gap-3">
                    {isActionNode(data) && data.slaDuration > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] font-black text-amber-400 tracking-tighter">{data.slaDuration}H</span>
                        </div>
                    )}
                    {data.variant === 'email' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                            <Mail className="w-3 h-3 text-sky-400" />
                            <span className="text-[9px] font-black text-sky-400 tracking-tighter">NOTIFICATION</span>
                        </div>
                    )}
                </div>

                {isActionNode(data) && data.requiredDocuments?.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 tracking-tighter">{data.requiredDocuments.length} DOCS</span>
                    </div>
                )}
            </div>

            {/* Universal Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-950 !border-2 !border-blue-500 !w-4 !h-4 shadow-[0_0_15px_rgba(59,130,246,0.6)] hover:scale-125 transition-transform"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-slate-950 !border-2 !border-purple-500 !w-4 !h-4 shadow-[0_0_15px_rgba(168,85,247,0.6)] hover:scale-125 transition-transform"
            />
        </div>
    );
};

export default memo(TurboNode);
