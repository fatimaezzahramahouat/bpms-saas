import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GitBranch,
    Trash2,
    Edit3,
    Plus,
    Loader2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { workflowService, IWorkflow, WorkflowStatus } from '../../../services/workflow.service';

const WorkflowCard = ({
    workflow,
    onEdit,
    onDelete
}: {
    workflow: IWorkflow,
    onEdit: (id: string) => void,
    onDelete: (id: string) => void
}) => {
    const statusColors = {
        [WorkflowStatus.DRAFT]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        [WorkflowStatus.ACTIVE]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', // ACTIVE translates to Published in UI context
        [WorkflowStatus.ARCHIVED]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };

    const statusLabel = {
        [WorkflowStatus.DRAFT]: 'Brouillon',
        [WorkflowStatus.ACTIVE]: 'Publié',
        [WorkflowStatus.ARCHIVED]: 'Archivé',
    };

    return (
        <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-[2rem] hover:border-purple-500/40 transition-all group relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-600/5 blur-[50px] group-hover:bg-purple-600/10 transition-colors" />

            <div className="flex justify-between items-start mb-6 relative">
                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <GitBranch size={24} />
                </div>
                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${statusColors[workflow.status]}`}>
                    {statusLabel[workflow.status]}
                </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{workflow.name}</h3>
            <div className="flex items-center gap-4 mb-6">
                <p className="text-slate-500 text-xs font-medium">
                    Utilisé <span className="text-white">{workflow._count?.instances || 0}</span> fois
                </p>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <p className="text-slate-500 text-xs font-medium">
                    {workflow._count?.steps || 0} étapes
                </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <p className="text-[10px] text-slate-600 font-medium italic">
                    Créé le {new Date(workflow.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(workflow.id)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
                        title="Modifier"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(workflow.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all hover:scale-105 active:scale-95"
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ManageWorkflows: React.FC = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await workflowService.getAllWorkflows();
            setWorkflows(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching workflows:', err);
            setError('Impossible de charger les workflows.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const handleEdit = (id: string) => {
        navigate(`/dashboard/workflow/${id}`);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce workflow ? Cette action est irréversible.')) {
            return;
        }

        try {
            await workflowService.deleteWorkflow(id);
            setWorkflows(prev => prev.filter(w => w.id !== id));
        } catch (err) {
            console.error('Error deleting workflow:', err);
            alert('Erreur lors de la suppression.');
        }
    };

    return (
        <div className="min-h-screen bg-[#060608] p-8 mt-16">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                            Gestion des <span className="text-purple-500">Workflows</span>
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Gérez, éditez et surveillez tous les processus de votre organisation.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/architecte')}
                        className="group flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        Nouveau Workflow
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                        <p className="text-slate-500 font-medium animate-pulse">Chargement de la bibliothèque...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                        <p className="text-white font-bold mb-2">{error}</p>
                        <button
                            onClick={fetchWorkflows}
                            className="text-purple-400 hover:text-purple-300 text-sm font-bold flex items-center gap-2"
                        >
                            Réessayer
                        </button>
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-400 mb-6">
                            <GitBranch size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Aucun workflow trouvé</h3>
                        <p className="text-slate-500 mb-8 max-w-md text-center">
                            Commencez par créer votre premier processus automatisé avec notre Architecte IA.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/architecte')}
                            className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-2"
                        >
                            Créer un workflow maintenant
                            <ArrowRight size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workflows.map(workflow => (
                            <WorkflowCard
                                key={workflow.id}
                                workflow={workflow}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
