import React, { useState } from 'react';
import { X, Settings2, Trash2, Cpu, FileText, Globe, Split, Clock, Mail, CheckCircle2, Play, Users } from 'lucide-react';
import { Node } from '@xyflow/react';
import { WorkflowData, isDecisionNode, isAINode, isActionNode, isAPINode } from '../types';
import { motion } from 'motion/react';

interface NodeConfigPanelProps {
    node: Node<WorkflowData> | null;
    onUpdate: (id: string, data: Partial<WorkflowData>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
    node,
    onUpdate,
    onDelete,
    onClose,
}) => {
    const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success'>('idle');

    if (!node) return null;
    const { data } = node;

    const handleInputChange = (field: string, value: any) => {
        onUpdate(node.id, { [field]: value });
    };

    const handleNestedChange = (parent: string, field: string, value: any) => {
        onUpdate(node.id, {
            [parent]: {
                ...(data[parent] as any || {}),
                [field]: value
            }
        });
    };

    const insertVariable = (field: string, variable: string = '{{candidate.name}}') => {
        const currentValue = data[field] || '';
        handleInputChange(field, `${currentValue} ${variable}`.trim());
    };

    const handleSave = async () => {
        setSaveState('loading');
        // Simulate API update
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSaveState('success');
        setTimeout(() => setSaveState('idle'), 2000);
    };

    const getHeaderConfig = () => {
        switch (data.variant) {
            case 'action': return { icon: <Users className="w-5 h-5 text-blue-500" />, title: 'Tâche Humaine', color: 'bg-blue-500' };
            case 'decision':
            case 'condition': return { icon: <Split className="w-5 h-5 text-amber-500" />, title: 'Règle Logique', color: 'bg-amber-500' };
            case 'ai': return { icon: <Cpu className="w-5 h-5 text-purple-500" />, title: 'Intelligence Artificielle', color: 'bg-purple-500' };
            case 'api': return { icon: <Globe className="w-5 h-5 text-emerald-500" />, title: 'Appel API', color: 'bg-emerald-500' };
            case 'trigger': return { icon: <Play className="w-5 h-5 text-emerald-500" />, title: 'Déclencheur', color: 'bg-emerald-500' };
            default: return { icon: <Settings2 className="w-5 h-5 text-slate-500" />, title: 'Configuration', color: 'bg-slate-500' };
        }
    };

    const header = getHeaderConfig();

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-6 top-6 bottom-6 w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${header.color}/10 border border-${header.color.split('-')[1]}-500/20 shadow-sm`}>
                        {header.icon}
                    </div>
                    <div>
                        <h2 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">{header.title}</h2>
                        <p className="text-xs text-slate-500 font-medium">Édition du nœud</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                {/* Node Title - Common to all */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Titre du nœud</label>
                    <input
                        type="text"
                        value={data.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                        placeholder="Ex: Validation Manager"
                    />
                </div>

                {/* --- CONDITIONAL UI: AI NODE --- */}
                {isAINode(data) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modèle AI</label>
                            <select
                                value={data.model || 'gpt-4o'}
                                onChange={(e) => handleInputChange('model', e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Prompt</label>
                                <button onClick={() => insertVariable('systemPrompt')} className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded hover:bg-purple-200 transition-colors">
                                    {`{ }`} Insérer Var
                                </button>
                            </div>
                            <textarea
                                value={data.systemPrompt || ''}
                                onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                                rows={4}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-xs"
                                placeholder="Tu es un expert RH qui évalue un candidat..."
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Créativité (Température)</label>
                                <span className="text-xs font-bold text-purple-500">{data.temperature || 0.7}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.1"
                                value={data.temperature || 0.7}
                                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                                className="w-full accent-purple-500"
                            />
                        </div>
                    </div>
                )}

                {/* --- CONDITIONAL UI: DECISION NODE --- */}
                {isDecisionNode(data) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Variable à évaluer</label>
                                    <button onClick={() => insertVariable('conditionVariable', 'candidat.score')} className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded hover:bg-amber-200 transition-colors">
                                        {`{ }`} Var
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={data.condition?.variable || ''}
                                    onChange={(e) => handleNestedChange('condition', 'variable', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Ex: {{candidat.score}}"
                                />
                            </div>
                            <div className="space-y-2">
                                <select
                                    value={data.condition?.operator || '==='}
                                    onChange={(e) => handleNestedChange('condition', 'operator', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono text-center"
                                >
                                    <option value="===">Est égal à (===)</option>
                                    <option value=">">Est supérieur à (&gt;)</option>
                                    <option value="<">Est inférieur à (&lt;)</option>
                                    <option value="includes">Contient</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Valeur attendue</label>
                                <input
                                    type="text"
                                    value={data.condition?.value || ''}
                                    onChange={(e) => handleNestedChange('condition', 'value', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Ex: 80"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><Split className="w-3 h-3" /> Branche Vrai (Haut) / Faux (Bas)</p>
                    </div>
                )}

                {/* --- CONDITIONAL UI: ACTION NODE --- */}
                {isActionNode(data) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigné à</label>
                            <select
                                value={data.role || 'EMPLOYE'}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ADMIN">Administrateur</option>
                                <option value="MANAGER">Manager</option>
                                <option value="RH">Responsable RH</option>
                                <option value="EMPLOYE">Employé</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Délai (SLA)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={data.slaDuration || 0}
                                    onChange={(e) => handleInputChange('slaDuration', parseInt(e.target.value))}
                                    className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-sm font-medium text-slate-600">Heures</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CONDITIONAL UI: API NODE --- */}
                {isAPINode(data) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2">
                            <select
                                value={data.method || 'GET'}
                                onChange={(e) => handleInputChange('method', e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                            </select>
                            <input
                                type="text"
                                value={data.url || ''}
                                onChange={(e) => handleInputChange('url', e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                placeholder="https://api.system.com/v1"
                            />
                        </div>
                    </div>
                )}

            </div>

            {/* Smart Footer (Save and Delete) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3">
                <button
                    onClick={handleSave}
                    disabled={saveState !== 'idle'}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${saveState === 'idle' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' :
                            saveState === 'loading' ? 'bg-blue-400 text-white cursor-not-allowed opacity-80' :
                                'bg-emerald-500 text-white'
                        }`}
                >
                    {saveState === 'idle' && 'Enregistrer'}
                    {saveState === 'loading' && <><span className="animate-spin text-lg leading-none">⚙</span> Enregistrement...</>}
                    {saveState === 'success' && <><CheckCircle2 className="w-4 h-4" /> Sauvegardé !</>}
                </button>

                <button
                    onClick={() => onDelete(node.id)}
                    className="w-full py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer ce nœud
                </button>
            </div>
        </motion.div>
    );
};
