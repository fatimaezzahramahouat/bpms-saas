
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
    Search,
    Download
} from 'lucide-react';
import { taskService } from '../services/task.service';
import { workflowService, IWorkflow } from '../services/workflow.service';
import { processService } from '../services/process.service';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'motion/react';
import { LeaveRequestForm } from '../features/workflow/components/LeaveRequestForm';
import { DynamicRequestForm } from '../features/workflow/components/DynamicRequestForm';

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
        id: string;
        context?: any;
        status: string;
        workflow: {
            name: string;
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

interface ProcessInstanceRequest {
    id: string;
    status: string;
    createdAt: string;
    workflow: {
        name: string;
    };
    context?: any;
    documents?: {
        id: string;
        fileName: string;
        fileUrl: string;
        docType: string;
    }[];
    tasks: {
        title: string;
        user: {
            firstName: string;
            lastName: string;
        } | null;
    }[];
}

export const EmployeeTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [requests, setRequests] = useState<ProcessInstanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
    const [isStarting, setIsStarting] = useState(false);

    const fetchData = async () => {
        try {
            const [tasksData, requestsData] = await Promise.all([
                taskService.getTasks(),
                processService.getMyRequests()
            ]);
            setTasks(tasksData);
            setRequests(requestsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erreur lors de la récupération des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await workflowService.getAllWorkflows();
            setWorkflows(response.data || []);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        }
    };

    const handleStartProcess = async () => {
        if (!selectedWorkflowId) {
            toast.error('Veuillez sélectionner un workflow');
            return;
        }

        setIsStarting(true);
        try {
            await processService.startProcess(selectedWorkflowId);
            toast.success('Demande créée avec succès !');
            setIsModalOpen(false);
            setSelectedWorkflowId('');
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error('Error starting process:', error);
            toast.error(error.response?.data?.error || 'Erreur lors du lancement de la demande');
        } finally {
            setIsStarting(false);
        }
    };

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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return { label: 'En cours', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
            case 'COMPLETED': return { label: 'Approuvée', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
            case 'REJECTED': return { label: 'Refusée', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
            default: return { label: status, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
        }
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
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Mes Demandes & Tâches</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Gérez vos requêtes et suivez l'avancement de vos workflows.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            await fetchWorkflows();
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-h1-blue hover:bg-h1-blue/90 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-h1-blue/20 transition-all flex items-center gap-2"
                    >
                        <Briefcase size={16} />
                        Nouvelle Demande
                    </button>
                    <div className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-h1-blue rounded-full"></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{tasks.length} Tâches en attente</span>
                    </div>
                </div>
            </header>

            {/* Modal de Nouvelle Demande */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Nouvelle Demande</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Choisissez le type de processus à lancer.</p>
                                </div>

                                {selectedWorkflowId ? (
                                    (() => {
                                        const selectedWf = workflows.find(w => w.id === selectedWorkflowId);
                                        // If no workflow is selected somehow, or it's not found:
                                        if (!selectedWf) return null;

                                        // If workflow has a data_model with fields, use DynamicRequestForm
                                        if (selectedWf.data_model && Array.isArray(selectedWf.data_model) && selectedWf.data_model.length > 0) {
                                            return (
                                                <DynamicRequestForm
                                                    workflow={selectedWf as any}
                                                    onSuccess={() => {
                                                        setIsModalOpen(false);
                                                        fetchData();
                                                    }}
                                                    onCancel={() => setSelectedWorkflowId('')}
                                                />
                                            );
                                        }

                                        // Fallback to LeaveRequestForm for legacy 'Congé' workflows without data_model
                                        if (selectedWf.name.toUpperCase().includes("CONGÉ") || selectedWf.name.toUpperCase().includes("CONGE") || selectedWf.name.toUpperCase().includes("LEAVE")) {
                                            return (
                                                <LeaveRequestForm
                                                    onSuccess={() => {
                                                        setIsModalOpen(false);
                                                        fetchData();
                                                    }}
                                                    onCancel={() => setSelectedWorkflowId('')}
                                                />
                                            );
                                        }

                                        // Otherwise, default simple submission view
                                        return (
                                            <div className="space-y-6">
                                                <div className="p-4 bg-h1-blue/5 border border-h1-blue/20 rounded-xl text-sm text-gray-700 dark:text-zinc-300">
                                                    Ce processus (<strong>{selectedWf.name}</strong>) ne requiert aucun formulaire spécifique. Vous pouvez le lancer directement.
                                                </div>
                                                <div className="flex flex-col gap-3 pt-4">
                                                    <button
                                                        onClick={handleStartProcess}
                                                        disabled={isStarting}
                                                        className="w-full py-4 bg-h1-blue hover:bg-h1-blue/90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-h1-blue/20 flex items-center justify-center gap-2"
                                                    >
                                                        {isStarting ? (
                                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                        ) : 'Lancer directement'}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedWorkflowId('')}
                                                        className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                                                    >
                                                        Changer de workflow
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Type de Workflow</label>
                                            <select
                                                value={selectedWorkflowId}
                                                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                                                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl text-gray-900 dark:text-white font-bold appearance-none cursor-pointer focus:border-h1-blue transition-colors outline-none"
                                            >
                                                <option value="">Sélectionnez un workflow...</option>
                                                {workflows.map((wf) => (
                                                    <option key={wf.id} value={wf.id}>{wf.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-4">
                                            <button
                                                onClick={() => setIsModalOpen(false)}
                                                className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                                        <span>{task.processInstance.workflow.name}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-h1-blue transition-colors">
                                                        Étape Actuelle : {task.step.name}
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
                                                    <span>Créé le {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-h1-blue" />
                                                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Pas de date'}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Statut du Processus</p>
                                                    <p className="text-xs font-black text-h1-blue uppercase">{task.processInstance.status.replace('_', ' ')}</p>
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

                {/* Right Side: Requests History */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6 p-6 bg-h1-blue/5 rounded-3xl border border-h1-blue/20">
                        <div className="w-12 h-12 bg-h1-blue/20 rounded-2xl flex items-center justify-center text-h1-blue shrink-0">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Historique de vos requêtes</h2>
                            <p className="text-zinc-400 font-medium text-xs mt-1">Suivez le statut de vos demandes en temps réel.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="p-8 bg-zinc-50 dark:bg-zinc-900/10 border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-[2rem] flex flex-col items-center text-center">
                                <Search size={24} className="text-zinc-300 dark:text-zinc-700 mb-4" />
                                <p className="text-sm text-zinc-400 font-bold">Aucune demande initiée</p>
                            </div>
                        ) : (
                            requests.map((request) => {
                                const currentTask = request.tasks && request.tasks[0];
                                const statusInfo = getStatusLabel(request.status);
                                const context = request.context || {};

                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-h1-blue/5 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white leading-tight pr-4">
                                                {request.workflow.name}
                                            </h3>
                                            <span className={`shrink-0 px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="space-y-4 font-medium">
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                <Calendar size={14} className="text-h1-blue" />
                                                <span>Soumis le {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                                            </div>

                                            {context.startDate && context.endDate && (
                                                <div className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <Clock size={14} className="text-h1-blue shrink-0 mt-0.5" />
                                                    <div className="flex flex-col">
                                                        <span>Du {new Date(context.startDate).toLocaleDateString('fr-FR')} au {new Date(context.endDate).toLocaleDateString('fr-FR')}</span>
                                                        {context.duration && <span className="text-h1-blue font-bold">Durée: {context.duration} jour(s)</span>}
                                                    </div>
                                                </div>
                                            )}

                                            {request.status === 'IN_PROGRESS' && currentTask && (
                                                <div className="mt-4 p-4 bg-h1-blue/5 border border-h1-blue/20 rounded-2xl space-y-2">
                                                    <p className="text-[10px] text-h1-blue font-black uppercase tracking-widest">Étape Actuelle</p>
                                                    <p className="text-sm text-gray-900 dark:text-white font-bold">{currentTask.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                                                        <User size={12} className="text-zinc-400" />
                                                        <span>En attente de: <strong className="text-gray-700 dark:text-zinc-300">
                                                            {currentTask.user ? `${currentTask.user.firstName} ${currentTask.user.lastName}` : 'Manager'}
                                                        </strong></span>
                                                    </div>
                                                </div>
                                            )}

                                            {request.status === 'COMPLETED' && request.documents && request.documents.some(d => d.docType === 'CERTIFICATE') && (
                                                <div className="mt-4">
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${request.documents.find(d => d.docType === 'CERTIFICATE')?.fileUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <Download size={14} />
                                                        Télécharger le Certificat
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
