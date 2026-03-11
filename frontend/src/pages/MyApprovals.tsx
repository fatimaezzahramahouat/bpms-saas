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
        id: string;
        workflow: { name: string };
        context?: any;
        user?: {
            firstName: string;
            lastName: string;
            email: string;
        };
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
            const data = await taskService.getApprovals();
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

    const handleApprove = async (taskId: string) => {
        const loadingToast = toast.loading("Approbation en cours...");
        try {
            await taskService.approveTask(taskId);
            toast.update(loadingToast, {
                render: "Demande approuvée avec succès ! Le workflow a progressé.",
                type: 'success',
                isLoading: false,
                autoClose: 3000
            });
            fetchTasks(); // Refresh list to remove the task
        } catch (error: any) {
            console.error('Approve error:', error);
            toast.update(loadingToast, {
                render: error.response?.data?.error || 'Une erreur est survenue lors de l\'approbation',
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        }
    };

    const handleReject = async (taskId: string) => {
        const loadingToast = toast.loading("Refus en cours...");
        try {
            await taskService.rejectTask(taskId);
            toast.update(loadingToast, {
                render: "Demande refusée et workflow terminé.",
                type: 'success',
                isLoading: false,
                autoClose: 3000
            });
            fetchTasks(); // Refresh list to remove the task
        } catch (error: any) {
            console.error('Reject error:', error);
            toast.update(loadingToast, {
                render: error.response?.data?.error || 'Une erreur est survenue lors du refus',
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)]" />
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <header className="mb-12 relative">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="text-purple-600 dark:text-purple-400" size={20} />
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-[0.2em]">Espace Manager</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Mes Approbations</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gérez et validez les demandes de vos collaborateurs en un clic.</p>
                    </div>
                    <button
                        onClick={fetchTasks}
                        className="p-3 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 transition-all active:scale-95 shadow-sm dark:shadow-none"
                        title="Rafraîchir"
                    >
                        <Clock size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {tasks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none backdrop-blur-md rounded-[3rem] border border-slate-200 dark:border-white/5 border-dashed relative"
                >
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-400 dark:text-slate-600 mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <p className="text-2xl text-slate-700 dark:text-slate-400 font-black tracking-tight">Tout est à jour !</p>
                    <p className="text-slate-500 font-medium mt-1">Vous n'avez aucune approbation en attente pour le moment.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative">
                    {tasks.map((task, index) => {
                        const initiator = task.processInstance.user;
                        const initiatorName = initiator ? `${initiator.firstName} ${initiator.lastName}` : "Employé Inconnu";
                        const context = task.processInstance.context || {};

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white dark:bg-slate-900/40 shadow-md dark:shadow-none backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-purple-300 dark:hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
                                            <GitBranch className="text-purple-600 dark:text-purple-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                {task.processInstance.workflow.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{task.step.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Reçu le</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(task.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5">
                                    <div className="space-y-3">
                                        <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Initié par</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{initiatorName}</p>
                                                <p className="text-xs text-slate-500 font-medium">{initiator?.email || "Email non renseigné"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Détails de la demande</p>
                                        <div className="grid grid-cols-2 gap-4 bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                            {Object.entries(context).map(([key, value]) => (
                                                <div key={key} className="flex flex-col">
                                                    <span className="text-[9px] text-purple-600 dark:text-purple-400 uppercase font-bold">{key.replace('_', ' ')}</span>
                                                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                                                        {typeof value === 'string' && value.includes('202') ? new Date(value as string).toLocaleDateString() : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex gap-4 pl-2">
                                    <button
                                        onClick={() => handleApprove(task.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-purple-200 dark:shadow-xl dark:shadow-purple-900/20 transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        <CheckCircle2 size={18} strokeWidth={3} />
                                        <span>Approuver</span>
                                    </button>
                                    <button
                                        onClick={() => handleReject(task.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-black text-sm uppercase tracking-widest rounded-2xl border border-slate-300 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/50 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        <XCircle size={18} strokeWidth={3} />
                                        <span>Refuser</span>
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div >
            )}
        </div >
    );
};