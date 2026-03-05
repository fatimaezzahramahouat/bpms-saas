
import React, { useEffect, useState } from 'react';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    ChevronRight,
    Calendar,
    Briefcase,
    User,
    ExternalLink,
    Search
} from 'lucide-react';
import { taskService } from '../services/task.service';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'motion/react';

interface TaskDocument {
    id: string;
    name: string;
    type: string;
    url: string;
}

interface Task {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    createdAt: string;
    processInstance: {
        application: {
            candidate: {
                fullName: string;
                email: string;
            };
            jobOffer: {
                title: string;
            };
            documents: TaskDocument[];
        };
        workflow: {
            _count: {
                steps: number;
            };
        };
        _count: {
            tasks: number;
        };
    };
    step: {
        name: string;
    };
}

export const EmployeeTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

    const getPriority = (dueDate: string | null) => {
        if (!dueDate) return { label: 'Faible', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };

        const now = new Date();
        const due = new Date(dueDate);
        const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays < 2) return { label: 'Urgent', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertCircle };
        if (diffInDays < 5) return { label: 'Moyen', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Clock };
        return { label: 'Faible', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
    };

    const calculateProgress = (task: Task) => {
        const completed = task.processInstance._count.tasks;
        const total = task.processInstance.workflow._count.steps;
        return {
            percentage: Math.min(Math.round((completed / total) * 100), 100),
            completed,
            total
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-h1-black">
                <div className="w-12 h-12 border-4 border-h1-blue/20 border-t-h1-blue rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-white dark:bg-h1-black transition-colors duration-300">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Ma To-Do List</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Gérez vos tâches de recrutement quotidiennes avec efficacité.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-h1-blue rounded-full"></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{tasks.length} Tâches en attente</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Task List */}
                <div className="xl:col-span-2 space-y-4">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <CheckCircle2 className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                            <p className="text-xl text-zinc-400 dark:text-zinc-500 font-bold">Toutes les tâches sont terminées !</p>
                        </div>
                    ) : (
                        tasks.map((task) => {
                            const priority = getPriority(task.dueDate);
                            const progress = calculateProgress(task);
                            const isSelected = selectedTask?.id === task.id;

                            return (
                                <motion.div
                                    layout
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className={`group relative bg-white dark:bg-zinc-900/50 border-2 rounded-[2rem] p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-h1-blue/5 ${isSelected
                                        ? 'border-h1-blue ring-4 ring-h1-blue/5'
                                        : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Left Side: Progress Circle Mobile/Info */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-h1-blue text-[10px] font-black uppercase tracking-widest">
                                                        <Briefcase size={12} strokeWidth={3} />
                                                        <span>{task.processInstance.application.jobOffer.title}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-h1-blue transition-colors">
                                                        {task.step.name}
                                                    </h3>
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${priority.color}`}>
                                                    <priority.icon size={12} strokeWidth={3} />
                                                    <span>{priority.label}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-h1-blue" />
                                                    <span>{task.processInstance.application.candidate.fullName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-h1-blue" />
                                                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Pas de date'}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Progression du recrutement</p>
                                                    <p className="text-xs font-black text-h1-blue">{progress.percentage}%</p>
                                                </div>
                                                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress.percentage}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full bg-h1-blue rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 italic">
                                                    {progress.completed} sur {progress.total} étapes complétées
                                                </p>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-center justify-center pl-6 border-l border-zinc-100 dark:border-zinc-800">
                                            <ChevronRight className={`w-6 h-6 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-h1-blue' : 'text-zinc-300 dark:text-zinc-700'}`} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Task Details / Documents */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedTask ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="sticky top-8 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-h1-blue/10 rounded-2xl flex items-center justify-center text-h1-blue">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">Documents du Candidat</h2>
                                            <p className="text-zinc-400 font-medium text-sm mt-1">{selectedTask.processInstance.application.candidate.fullName}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {selectedTask.processInstance.application.documents.length === 0 ? (
                                            <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
                                                <p className="text-zinc-500 font-bold text-sm italic">Aucun document disponible</p>
                                            </div>
                                        ) : (
                                            selectedTask.processInstance.application.documents.map((doc) => (
                                                <a
                                                    key={doc.id}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-h1-blue/10 border border-zinc-800 hover:border-h1-blue/30 rounded-2xl transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-zinc-800 group-hover:bg-h1-blue/20 rounded-xl text-zinc-400 group-hover:text-h1-blue transition-colors">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-white group-hover:text-h1-blue transition-colors">{doc.name}</p>
                                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{doc.type}</p>
                                                        </div>
                                                    </div>
                                                    <ExternalLink size={14} className="text-zinc-600 group-hover:text-h1-blue transition-colors" />
                                                </a>
                                            ))
                                        )}
                                    </div>

                                    <div className="pt-8 border-t border-zinc-800 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Contact</span>
                                            <span className="text-sm font-bold text-white">{selectedTask.processInstance.application.candidate.email}</span>
                                        </div>

                                        <button
                                            onClick={() => setSelectedTask(null)}
                                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                                        >
                                            Fermer les détails
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="sticky top-8 p-12 bg-zinc-50 dark:bg-zinc-900/10 border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col items-center text-center justify-center min-h-[400px]">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-300 dark:text-zinc-700 mb-6">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Sélectionnez une tâche</h3>
                                <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">Cliquez sur une tâche pour voir les documents du candidat et les informations complémentaires.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
