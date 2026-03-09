import React, { useState } from 'react';
import { X, Settings2, Trash2, Cpu, FileText, Globe, Split, Clock, Mail, CheckCircle2, Play, Timer, Paperclip, UserCheck } from 'lucide-react';
import { Node } from '@xyflow/react';
import { WorkflowData, isDecisionNode, isAINode, isActionNode, isAPINode } from '../types';
import { motion } from 'motion/react';
import { organisationService } from '../../../services/organisation.service';

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
    const [members, setMembers] = useState<any[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    if (!node) return null;
    const { data } = node;

    React.useEffect(() => {
        const fetchMembers = async () => {
            setIsLoadingMembers(true);
            try {
                const response = await organisationService.getMembers();
                if (response && response.data) {
                    setMembers(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch members:', error);
            } finally {
                setIsLoadingMembers(false);
            }
        };

        if (data && data.variant === 'action') {
            fetchMembers();
        }
    }, [data?.variant]);

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

    const renderContent = () => {
        switch (data.variant) {
            case 'ai':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modèle AI (Demo)</label>
                            <select
                                value={data.aiModel || 'gpt-4'}
                                onChange={(e) => handleInputChange('aiModel', e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
                            >
                                <option value="gpt-4">GPT-4 (OpenAI)</option>
                                <option value="claude-3">Claude 3 (Anthropic)</option>
                                <option value="mistral">Mistral (Open Source)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rôle Système</label>
                            <textarea
                                value={data.systemRole || ''}
                                onChange={(e) => handleInputChange('systemRole', e.target.value)}
                                rows={3}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none font-sans"
                                placeholder="You are an AI Expert..."
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Température</label>
                                <span className="text-xs font-bold text-purple-500">{data.temperature || 0.7}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.1"
                                value={data.temperature || 0.7}
                                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                                className="w-full accent-purple-500 cursor-pointer"
                            />
                        </div>
                    </div>
                );
            case 'decision':
            case 'condition':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Variable</label>
                                <input
                                    type="text"
                                    value={data.condition?.variable || ''}
                                    onChange={(e) => handleNestedChange('condition', 'variable', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <select
                                    value={data.condition?.operator || '==='}
                                    onChange={(e) => handleNestedChange('condition', 'operator', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                                >
                                    <option value="===">===</option>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Valeur</label>
                                <input
                                    type="text"
                                    value={data.condition?.value || ''}
                                    onChange={(e) => handleNestedChange('condition', 'value', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'action':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type d'assignation</label>
                                <select
                                    value={data.assignmentType || 'ROLE'}
                                    onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="ROLE">Par Rôle</option>
                                    <option value="SPECIFIC">Employé Spécifique</option>
                                    <option value="DYNAMIC">Dynamique</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigné à</label>
                                <select
                                    value={data.assignedTo || ''}
                                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Choisir...</option>
                                    {data.assignmentType === 'ROLE' && (
                                        <>
                                            <option value="ADMIN">Administrateur</option>
                                            <option value="RH">Responsable RH</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="EMPLOYE">Employé</option>
                                        </>
                                    )}
                                    {data.assignmentType === 'SPECIFIC' && (
                                        isLoadingMembers ? (
                                            <option value="" disabled>Chargement...</option>
                                        ) : members.length > 0 ? (
                                            members.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Aucun membre trouvé</option>
                                        )
                                    )}
                                    {data.assignmentType === 'DYNAMIC' && (
                                        <option value="MANAGER_INIT">Manager de l'initiateur</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'email':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destinataire</label>
                            <input
                                type="text"
                                value={data.to || ''}
                                onChange={(e) => handleInputChange('to', e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                                placeholder="ex: {{initiator.email}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sujet</label>
                            <input
                                type="text"
                                value={data.subject || ''}
                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                                placeholder="Objet de l'email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message (HTML/Text)</label>
                            <textarea
                                value={data.body || ''}
                                onChange={(e) => handleInputChange('body', e.target.value)}
                                rows={4}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                );
            case 'timer':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Durée</label>
                                <input
                                    type="number"
                                    value={data.duration || 1}
                                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unité</label>
                                <select
                                    value={data.unit || 'hours'}
                                    onChange={(e) => handleInputChange('unit', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Heures</option>
                                    <option value="days">Jours</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'webhook':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2">
                            <select
                                value={data.method || 'POST'}
                                onChange={(e) => handleInputChange('method', e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                            </select>
                            <input
                                type="text"
                                value={data.url || ''}
                                onChange={(e) => handleInputChange('url', e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-mono"
                                placeholder="https://api.myapp.com/webhook"
                            />
                        </div>
                    </div>
                );
            case 'document':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template ID</label>
                            <input
                                type="text"
                                value={data.templateId || ''}
                                onChange={(e) => handleInputChange('templateId', e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="ex: LEAVE_DOC_01"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format</label>
                            <div className="flex gap-4">
                                {['PDF', 'DOCX'].map(f => (
                                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="outputFormat"
                                            checked={(data.outputFormat || 'PDF') === f}
                                            onChange={() => handleInputChange('outputFormat', f)}
                                            className="accent-emerald-500"
                                        />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{f}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'file':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3">
                            <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Fichiers Requis</label>
                            <div className="space-y-2">
                                {(data.requiredFiles || ['Justificatif']).map((file: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={file}
                                            className="flex-1 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                                            placeholder="Nom du document..."
                                            onChange={(e) => {
                                                const newFiles = [...(data.requiredFiles || ['Justificatif'])];
                                                newFiles[idx] = e.target.value;
                                                handleInputChange('requiredFiles', newFiles);
                                            }}
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleInputChange('requiredFiles', [...(data.requiredFiles || ['Justificatif']), ''])}
                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                                >
                                    + Ajouter un document
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'trigger':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration du Formulaire</label>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3">
                                <div className="space-y-2">
                                    {(data.data_model || []).map((field: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <input
                                                type="text"
                                                value={field.name || ''}
                                                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white outline-none"
                                                placeholder="Nom du champ (ex: amount)"
                                                onChange={(e) => {
                                                    const newModel = [...(data.data_model || [])];
                                                    newModel[idx] = { ...newModel[idx], name: e.target.value };
                                                    handleInputChange('data_model', newModel);
                                                }}
                                            />
                                            <select
                                                value={field.type || 'string'}
                                                onChange={(e) => {
                                                    const newModel = [...(data.data_model || [])];
                                                    newModel[idx] = { ...newModel[idx], type: e.target.value };
                                                    handleInputChange('data_model', newModel);
                                                }}
                                                className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-xs outline-none"
                                            >
                                                <option value="string">Texte</option>
                                                <option value="number">Nombre</option>
                                                <option value="date">Date</option>
                                                <option value="boolean">Oui/Non</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const newModel = [...(data.data_model || [])];
                                                    newModel.splice(idx, 1);
                                                    handleInputChange('data_model', newModel);
                                                }}
                                                className="text-red-500 hover:text-red-600 transition-colors p-1"
                                                title="Supprimer ce champ"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleInputChange('data_model', [...(data.data_model || []), { name: '', type: 'string' }])}
                                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 transition-colors pt-2 block"
                                    >
                                        + Ajouter un champ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <p className="text-xs text-slate-500 text-center italic">Aucune configuration supplémentaire.</p>;
        }
    };

    const getHeaderConfig = () => {
        switch (data.variant) {
            case 'action': return { icon: <UserCheck className="w-5 h-5 text-blue-500" />, title: 'Tâche Humaine', color: 'bg-blue-500' };
            case 'decision':
            case 'condition': return { icon: <Split className="w-5 h-5 text-amber-500" />, title: 'Règle Logique', color: 'bg-amber-500' };
            case 'ai': return { icon: <Cpu className="w-5 h-5 text-purple-500" />, title: 'Intelligence Artificielle', color: 'bg-purple-500' };
            case 'api': return { icon: <Globe className="w-5 h-5 text-emerald-500" />, title: 'Appel API', color: 'bg-emerald-500' };
            case 'trigger': return { icon: <Play className="w-5 h-5 text-emerald-500" />, title: 'Déclencheur', color: 'bg-emerald-500' };
            case 'email': return { icon: <Mail className="w-5 h-5 text-sky-500" />, title: 'Email Automatique', color: 'bg-sky-500' };
            case 'document': return { icon: <FileText className="w-5 h-5 text-emerald-500" />, title: 'Génération Document', color: 'bg-emerald-500' };
            case 'timer': return { icon: <Timer className="w-5 h-5 text-amber-500" />, title: 'Attente Chrono', color: 'bg-amber-500' };
            case 'file': return { icon: <Paperclip className="w-5 h-5 text-indigo-500" />, title: 'Dépôt de Fichier', color: 'bg-indigo-500' };
            case 'webhook': return { icon: <Globe className="w-5 h-5 text-rose-500" />, title: 'Webhook Sortant', color: 'bg-rose-500' };
            default: return { icon: <Settings2 className="w-5 h-5 text-slate-500" />, title: 'Configuration', color: 'bg-slate-500' };
        }
    };

    const header = getHeaderConfig();

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-6 top-6 bottom-6 w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5 z-50"
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

            {/* Node Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {/* Node Title - Common to all */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider tabular-nums">Titre du nœud</label>
                    <input
                        type="text"
                        value={data.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        placeholder="Ex: Validation Manager"
                    />
                </div>

                {renderContent()}
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
