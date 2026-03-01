import React, { useState } from 'react';
import { Sparkles, X, Wand2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Node, Edge } from '@xyflow/react';
import { WorkflowData } from '../types';

interface AIFlowDesignerProps {
    onGenerate: (nodes: Node<WorkflowData>[], edges: Edge[]) => void;
}

export const AIFlowDesigner: React.FC<AIFlowDesignerProps> = ({ onGenerate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');

    const generateMockWorkflow = (prompt: string): { nodes: Node<WorkflowData>[], edges: Edge[] } => {
        const p = prompt.toLowerCase();
        const nodes: Node<WorkflowData>[] = [];
        const edges: Edge[] = [];
        const timestamp = Date.now();

        if (p.includes('recrutement') || p.includes('candidat')) {
            // [Start -> IA Filter CV -> Condition (Score > 80?) -> (Yes: Interview) / (No: Email Reject)]
            nodes.push(
                { id: `start-${timestamp}`, type: 'turbo', position: { x: 100, y: 100 }, data: { title: 'Début Recrutement', variant: 'trigger' } as any },
                { id: `ai-filter-${timestamp}`, type: 'turbo', position: { x: 400, y: 100 }, data: { title: 'IA Filter CV', variant: 'ai', model: 'gpt-4', systemRole: 'Expert RH', userPrompt: 'Analyse le CV', temperature: 0.3 } as any },
                { id: `cond-${timestamp}`, type: 'conditionNode', position: { x: 700, y: 100 }, data: { title: 'Score > 80?', variant: 'condition', condition: { variable: 'cv.score', operator: '>', value: '80' } } as any },
                { id: `interview-${timestamp}`, type: 'turbo', position: { x: 1000, y: 0 }, data: { title: 'Entretien', variant: 'action', assignmentType: 'ROLE', assignedTo: 'RH' } as any },
                { id: `reject-${timestamp}`, type: 'turbo', position: { x: 1000, y: 200 }, data: { title: 'Email Refus', variant: 'action', assignmentType: 'DYNAMIC', assignedTo: 'MANAGER_INITIATEUR' } as any }
            );
            edges.push(
                { id: `e1-${timestamp}`, source: `start-${timestamp}`, target: `ai-filter-${timestamp}`, type: 'turbo', animated: true },
                { id: `e2-${timestamp}`, source: `ai-filter-${timestamp}`, target: `cond-${timestamp}`, type: 'turbo', animated: true },
                { id: `e3-${timestamp}`, source: `cond-${timestamp}`, target: `interview-${timestamp}`, sourceHandle: 'true', type: 'turbo', animated: true, label: 'Vrai', style: { stroke: '#22c55e' } },
                { id: `e4-${timestamp}`, source: `cond-${timestamp}`, target: `reject-${timestamp}`, sourceHandle: 'false', type: 'turbo', animated: true, label: 'Faux', style: { stroke: '#ef4444' } }
            );
        } else if (p.includes('congé') || p.includes('vacances')) {
            // [Start -> Check Balance -> Condition (Days < 5) -> Manager Approval]
            nodes.push(
                { id: `start-${timestamp}`, type: 'turbo', position: { x: 100, y: 100 }, data: { title: 'Start', variant: 'trigger' } as any },
                { id: `check-${timestamp}`, type: 'turbo', position: { x: 400, y: 100 }, data: { title: 'Check Balance', variant: 'api', url: '/api/hr/balance', method: 'GET' } as any },
                { id: `cond-${timestamp}`, type: 'conditionNode', position: { x: 700, y: 100 }, data: { title: 'Condition (Days < 5)', variant: 'condition', condition: { variable: 'leave.days', operator: '<', value: '5' } } as any },
                { id: `manager-${timestamp}`, type: 'turbo', position: { x: 1000, y: 100 }, data: { title: 'Manager Approval', variant: 'action', assignmentType: 'ROLE', assignedTo: 'Manager' } as any }
            );
            edges.push(
                { id: `e1-${timestamp}`, source: `start-${timestamp}`, target: `check-${timestamp}`, type: 'turbo', animated: true },
                { id: `e2-${timestamp}`, source: `check-${timestamp}`, target: `cond-${timestamp}`, type: 'turbo', animated: true },
                { id: `e3-${timestamp}`, source: `cond-${timestamp}`, target: `manager-${timestamp}`, sourceHandle: 'true', type: 'turbo', animated: true, style: { stroke: '#22c55e' } }
            );
        } else if (p.includes('frais') || p.includes('remboursement')) {
            // [Start -> Scan Receipt -> Condition (Amount < 500?) -> (Yes: Pay) / (No: Audit)]
            nodes.push(
                { id: `start-${timestamp}`, type: 'turbo', position: { x: 100, y: 100 }, data: { title: 'Note de Frais', variant: 'trigger' } as any },
                { id: `scan-${timestamp}`, type: 'turbo', position: { x: 400, y: 100 }, data: { title: 'Scan Receipt', variant: 'ai', model: 'gpt-4', systemRole: 'Comptable IA', userPrompt: 'Extrait le montant', temperature: 0.1 } as any },
                { id: `cond-${timestamp}`, type: 'conditionNode', position: { x: 700, y: 100 }, data: { title: 'Montant < 500?', variant: 'condition', condition: { variable: 'expense.amount', operator: '<', value: '500' } } as any },
                { id: `pay-${timestamp}`, type: 'turbo', position: { x: 1000, y: 0 }, data: { title: 'Paiement Auto', variant: 'api', url: '/api/finance/pay', method: 'POST' } as any },
                { id: `audit-${timestamp}`, type: 'turbo', position: { x: 1000, y: 200 }, data: { title: 'Audit Manuel', variant: 'action', assignmentType: 'ROLE', assignedTo: 'Finance' } as any }
            );
            edges.push(
                { id: `e1-${timestamp}`, source: `start-${timestamp}`, target: `scan-${timestamp}`, type: 'turbo', animated: true },
                { id: `e2-${timestamp}`, source: `scan-${timestamp}`, target: `cond-${timestamp}`, type: 'turbo', animated: true },
                { id: `e3-${timestamp}`, source: `cond-${timestamp}`, target: `pay-${timestamp}`, sourceHandle: 'true', type: 'turbo', animated: true, style: { stroke: '#22c55e' } },
                { id: `e4-${timestamp}`, source: `cond-${timestamp}`, target: `audit-${timestamp}`, sourceHandle: 'false', type: 'turbo', animated: true, style: { stroke: '#ef4444' } }
            );
        }

        return { nodes, edges };
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            setIsGenerating(true);

            // Simulation logic
            setTimeout(() => {
                const { nodes, edges } = generateMockWorkflow(prompt);
                onGenerate(nodes, edges);
                setPrompt('');
                setIsGenerating(false);
                setIsOpen(false);
            }, 1500);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-2xl z-50 hover:scale-110 transition-transform ai-assistant-btn border border-white/20"
            >
                <Sparkles className="text-white w-8 h-8 fill-white/20" />
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isGenerating && setIsOpen(false)}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-colors duration-300"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-white dark:bg-[#0d0d12] border border-zinc-200 dark:border-white/10 rounded-3xl p-8 relative shadow-[0_0_50px_rgba(147,51,234,0.1)] dark:shadow-[0_0_50px_rgba(147,51,234,0.2)] transition-colors duration-300"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isGenerating}
                                className="absolute top-6 right-6 text-zinc-400 dark:text-gray-500 hover:text-zinc-600 dark:hover:text-white transition-colors disabled:opacity-0"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-12 h-12 rounded-2xl ${isGenerating ? 'bg-purple-500 animate-pulse' : 'bg-purple-500/20'} flex items-center justify-center border border-purple-500/30 transition-all`}>
                                    <Cpu className={`${isGenerating ? 'text-white' : 'text-purple-400'} w-6 h-6`} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {isGenerating ? 'AI is thinking...' : 'AI Flow Designer'}
                                    </h2>
                                    <p className="text-zinc-500 dark:text-gray-400 text-sm">Describe your workflow to generate logic nodes.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        disabled={isGenerating}
                                        placeholder="e.g. Create a recruitment workflow..."
                                        className="w-full h-32 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-600 focus:border-purple-500 outline-none transition-all resize-none text-sm leading-relaxed disabled:opacity-50"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-zinc-400 dark:text-gray-600 font-medium uppercase">
                                        {isGenerating ? 'Processing...' : 'Demo Mode Enabled'}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!prompt.trim() || isGenerating}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
                                >
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Wand2 className="w-5 h-5" />
                                    )}
                                    {isGenerating ? 'Generating...' : 'Generate Workflow'}
                                </button>
                            </form>

                            <div className="mt-8 grid grid-cols-2 gap-3 text-center">
                                <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5 text-[10px] text-zinc-500 dark:text-gray-400 italic cursor-pointer hover:border-purple-500/50 transition-colors"
                                    onClick={() => setPrompt('Recrutement')}>
                                    "Flux de recrutement"
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5 text-[10px] text-zinc-500 dark:text-gray-400 italic cursor-pointer hover:border-purple-500/50 transition-colors"
                                    onClick={() => setPrompt('Congé')}>
                                    "Demande de congé"
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
