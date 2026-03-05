import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, User, Briefcase, GitBranch, Sparkles, BrainCircuit, Check } from 'lucide-react';
import { taskService } from '../services/task.service';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';

interface AIAnalysis {
    id: string;
    type: string;
    result: {
        matchingScore: number;
        summary: string[];
        weaknesses?: string[];
    };
    confidence: number;
}

interface Task {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    processInstance: {
        application: {
            candidate: {
                fullName: string;
            };
            jobOffer: {
                title: string;
            };
        };
        aiAnalyses: AIAnalysis[];
    };
    step: {
        name: string;
    };
}

export const MyApprovals: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const data = await taskService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Erreur lors de la récupération des tâches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAction = async (taskId: string, action: 'APPROVE' | 'REJECT') => {
        const loadingToast = toast.loading(`${action === 'APPROVE' ? 'Approbation' : 'Refus'} en cours...`);
        try {
            await taskService.updateTaskStatus(taskId, action);
            toast.update(loadingToast, {
                render: `Tâche ${action === 'APPROVE' ? 'approuvée' : 'rejetée'} avec succès`,
                type: 'success',
                isLoading: false,
                autoClose: 3000
            });
            fetchTasks(); // Refresh list
        } catch (error: any) {
            console.error('Action error:', error);
            toast.update(loadingToast, {
                render: 'Une erreur est survenue',
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-950 min-h-screen">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Mes Approbations</h1>
                <p className="text-slate-400">Gérez les étapes du workflow nécessitant votre validation.</p>
            </header>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
                    <CheckCircle2 className="w-16 h-16 text-slate-700 mb-4" />
                    <p className="text-xl text-slate-500 font-medium">Aucune approbation en attente</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col gap-6 hover:border-purple-500/30 transition-all duration-300 group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                        <GitBranch size={14} />
                                        <span>{task.step.name}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                                        {task.processInstance.application.candidate.fullName}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                    <Clock size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-amber-500 uppercase">En attente</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <Briefcase size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tight leading-none mb-1">Offre d'emploi</p>
                                        <p className="text-sm font-medium text-slate-300">{task.processInstance.application.jobOffer.title}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tight leading-none mb-1">Type de tâche</p>
                                        <p className="text-sm font-medium text-slate-300">{task.title}</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI INSIGHT SECTION */}
                            {task.processInstance.aiAnalyses && task.processInstance.aiAnalyses.length > 0 && (
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl overflow-hidden">
                                    <div className="bg-purple-500/10 px-4 py-2 border-b border-purple-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-purple-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">AI Insight</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-purple-400/70">Matching Score:</span>
                                            <span className="text-xs font-black text-purple-400">{task.processInstance.aiAnalyses[0].result.matchingScore}%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {/* Score Bar */}
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${task.processInstance.aiAnalyses[0].result.matchingScore}%` }}
                                                className={`h-full rounded-full ${task.processInstance.aiAnalyses[0].result.matchingScore > 75
                                                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                        : task.processInstance.aiAnalyses[0].result.matchingScore > 40
                                                            ? 'bg-amber-500'
                                                            : 'bg-rose-500'
                                                    }`}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {task.processInstance.aiAnalyses[0].result.summary.map((point, i) => (
                                                <div key={i} className="flex gap-2 items-start">
                                                    <div className="mt-1 p-0.5 bg-purple-500/20 rounded flex-shrink-0">
                                                        <Check size={10} className="text-purple-400" />
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                                                        {point}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5 flex gap-4">
                                <button
                                    onClick={() => handleAction(task.id, 'APPROVE')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Approuver</span>
                                </button>
                                <button
                                    onClick={() => handleAction(task.id, 'REJECT')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 border border-transparent text-slate-300 font-bold rounded-2xl transition-all active:scale-95"
                                >
                                    <XCircle size={18} />
                                    <span>Rejeter</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
