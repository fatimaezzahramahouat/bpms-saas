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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)]" />
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-950 min-h-screen relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <header className="mb-12 relative">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="text-purple-400" size={20} />
                    </div>
                    <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em]">Espace Manager</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">Mes Approbations</h1>
                <p className="text-slate-400 mt-2 font-medium">Gérez et validez les demandes de vos collaborateurs en un clic.</p>
            </header>

            {tasks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-20 bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 border-dashed relative"
                >
                    <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-600 mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <p className="text-2xl text-slate-400 font-black tracking-tight">Tout est à jour !</p>
                    <p className="text-slate-500 font-medium mt-1">Vous n'avez aucune approbation en attente pour le moment.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative">
                    {tasks.map((task, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={task.id}
                            className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-8 hover:border-purple-500/40 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500/40 group-hover:bg-purple-500 transition-colors" />

                            <div className="flex justify-between items-start pl-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <GitBranch size={12} strokeWidth={3} />
                                        <span>Étape : {task.step.name}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors leading-tight">
                                        Demande de {task.processInstance.application?.candidate?.fullName || "Employé"}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">En attente</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pl-2">
                                <div className="space-y-3">
                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Type de processus</p>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors text-slate-400">
                                            <Briefcase size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-200">{task.processInstance.application?.jobOffer?.title || task.processInstance.workflow?.name || "Workflow Interne"}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Instance</p>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400">
                                            <div className="w-4 h-4 flex items-center justify-center text-[10px] font-black">#</div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-400">{task.processInstance.id.split('-')[0]}...</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 flex gap-4 pl-2">
                                <button
                                    onClick={() => handleApprove(task.id)}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 transition-all hover:-translate-y-1 active:scale-95"
                                >
                                    <CheckCircle2 size={18} strokeWidth={3} />
                                    <span>Approuver</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
