import React from 'react';
import { X, Trash2, Settings2, Mail, Terminal, Cpu } from 'lucide-react';
import { Node } from '@xyflow/react';
import { TurboNodeData } from './TurboNode';
import { motion, AnimatePresence } from 'motion/react';

interface NodeConfigPanelProps {
    node: Node<TurboNodeData> | null;
    onUpdate: (id: string, data: Partial<TurboNodeData>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
    node,
    onUpdate,
    onDelete,
    onClose,
}) => {
    if (!node) return null;

    const data = node.data;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onUpdate(node.id, { ...data, [name]: value });
    };

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-6 top-6 bottom-6 w-80 bg-white/80 dark:bg-[#0d0d12]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-6 z-20 shadow-2xl flex flex-col gap-6 transition-colors duration-300"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-purple-500" />
                    <h2 className="text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-tight">Configuration</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 dark:text-gray-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {/* Visual Type Badge */}
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Type de Nœud</span>
                    <span className="px-2 py-1 rounded bg-purple-500 text-white text-[9px] font-bold uppercase">{data.variant}</span>
                </div>

                {/* Label Input */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest">Nom de l'étape</label>
                    <input
                        type="text"
                        name="label"
                        value={data.label || ''}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-purple-500 outline-none transition-all"
                        placeholder="Ex: Validation RH"
                    />
                </div>

                {/* Role Selector */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest">Rôle Responsable</label>
                    <div className="relative">
                        <select
                            name="targetRole"
                            value={data.targetRole || 'SYSTEM'}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-purple-500 outline-none transition-all cursor-pointer appearance-none"
                        >
                            <option value="ADMIN">Administrateur</option>
                            <option value="RH">Responsable RH</option>
                            <option value="MANAGER">Manager</option>
                            <option value="EMPLOYE">Employé</option>
                            <option value="SYSTEM">Système (Automatique)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                            <Settings2 className="w-3 h-3" />
                        </div>
                    </div>
                </div>

                {/* Step Type Selector - Fixed for visual consistency */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest">Type Logique (Backend)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['step', 'condition', 'ai'].map((type) => (
                            <button
                                key={type}
                                onClick={() => onUpdate(node.id, { ...data, stepType: type as any })}
                                className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${data.stepType === type
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-zinc-50 dark:bg-white/5 text-zinc-400 border border-zinc-100 dark:border-white/5'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-zinc-100 dark:bg-white/5" />

                {/* Additional context based on Role */}
                {data.targetRole === 'RH' && (
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                        <div className="flex items-center gap-2 text-blue-500">
                            <Mail className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Notification RH</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 leading-relaxed">
                            Ce nœud générera une notification automatique vers le portail RH pour validation du document.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-white/5">
                <button
                    onClick={() => onDelete(node.id)}
                    className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold"
                >
                    <Trash2 className="w-4 h-4" />
                    Supprimer le Nœud
                </button>
            </div>
        </motion.div>
    );
};
