import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Search, MoreVertical, Edit2, Copy, Trash2,
    GitFork, LayoutTemplate, Loader2, AlertCircle,
} from 'lucide-react';
import { workflowService, IWorkflow, LEAVE_REQUEST_TEMPLATE } from '../../../services/workflow.service';
import { toast } from 'react-toastify';

// ─── Types ────────────────────────────────────────────────

type Category = 'Tous' | 'RH' | 'Finance' | 'IT';

// ─── Helpers ──────────────────────────────────────────────

const getCategoryStyles = (category: string) => {
    switch (category) {
        case 'RH': return 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 border-pink-200 dark:border-pink-500/20';
        case 'Finance': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
        case 'IT': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Component ────────────────────────────────────────────

export const WorkflowListPage: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Category>('Tous');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // ── Fetch workflows from the real API ──
    const fetchWorkflows = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await workflowService.getAllWorkflows();
            setWorkflows(response.data || []);
        } catch (err: any) {
            console.error('[WorkflowListPage] Failed to load workflows:', err);
            setError('Impossible de charger les workflows. Vérifiez que le serveur est démarré.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    // Close dropdowns on outside click
    useEffect(() => {
        const closeDropdown = () => setOpenDropdownId(null);
        window.addEventListener('click', closeDropdown);
        return () => window.removeEventListener('click', closeDropdown);
    }, []);

    // ── Derived stats ──
    const totalWorkflows = workflows.length;
    const activeCount = workflows.filter(w => w.status === 'ACTIVE').length;
    const draftCount = workflows.filter(w => w.status === 'DRAFT').length;

    // ── Filtering ──
    const filteredWorkflows = workflows.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
        // NOTE: category is not in the current IWorkflow type — filtering is name/status only for now
        return matchesSearch;
    });

    // ── Handlers ──────────────────────────────────────────

    /**
     * Create an empty draft workflow, then navigate to its editor.
     */
    const handleStartFromScratch = async () => {
        setIsCreating(true);
        try {
            const response = await workflowService.createWorkflow({
                name: 'Nouveau Workflow',
                nodes: [],
                edges: [],
            });
            const newWorkflow = response.data;
            setIsCreateModalOpen(false);
            toast.success('Nouveau workflow créé !');
            navigate(`/dashboard/workflow/editor/${newWorkflow.id}`);
        } catch (err: any) {
            console.error('[WorkflowListPage] Create from scratch failed:', err);
            toast.error(`Erreur lors de la création : ${err.response?.data?.message || err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    /**
     * Create a pre-filled "Leave Request" template, then navigate to its editor.
     */
    const handleUseTemplate = async () => {
        setIsCreating(true);
        try {
            const response = await workflowService.createWorkflow(LEAVE_REQUEST_TEMPLATE);
            const newWorkflow = response.data;
            setIsCreateModalOpen(false);
            toast.success('Workflow créé depuis le modèle !');
            navigate(`/dashboard/workflow/editor/${newWorkflow.id}`);
        } catch (err: any) {
            console.error('[WorkflowListPage] Create from template failed:', err);
            toast.error(`Erreur lors de la création : ${err.response?.data?.message || err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (id: string) => {
        setOpenDropdownId(null);
        navigate(`/dashboard/workflow/editor/${id}`);
    };

    const handleDuplicate = async (id: string) => {
        setOpenDropdownId(null);
        const loadingToast = toast.loading('Duplication en cours...');
        try {
            await workflowService.duplicateWorkflow(id);
            toast.update(loadingToast, { render: 'Workflow dupliqué !', type: 'success', isLoading: false, autoClose: 3000 });
            fetchWorkflows(); // Refresh list
        } catch (err: any) {
            toast.update(loadingToast, { render: `Erreur: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000 });
        }
    };

    const handleDelete = async (id: string) => {
        setOpenDropdownId(null);
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce workflow définitivement ?')) return;
        const loadingToast = toast.loading('Suppression...');
        try {
            await workflowService.deleteWorkflow(id);
            toast.update(loadingToast, { render: 'Workflow supprimé.', type: 'success', isLoading: false, autoClose: 3000 });
            setWorkflows(prev => prev.filter(w => w.id !== id)); // Optimistic remove
        } catch (err: any) {
            toast.update(loadingToast, { render: `Erreur: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000 });
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await workflowService.toggleStatus(id);
            const updated = response.data;
            setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: updated.status } : w));
        } catch (err: any) {
            toast.error(`Erreur: ${err.message}`);
        }
    };

    const toggleDropdown = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    // ── Render ────────────────────────────────────────────

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-[#050507]">

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Bibliothèque de Processus</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gérez et configurez les workflows de votre organisation.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-semibold"
                >
                    <Sparkles size={18} />
                    Nouveau Workflow
                </button>
            </div>

            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <GitFork size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Workflows</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{isLoading ? '—' : totalWorkflows}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <div className="w-6 h-6 rounded-full border-4 border-current border-t-transparent animate-spin-slow" />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Actifs</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{isLoading ? '—' : activeCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl text-amber-600 dark:text-amber-500">
                            <Edit2 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Brouillons</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{isLoading ? '—' : draftCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FILTERS & SEARCH --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center bg-white dark:bg-[#0d0d12] p-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                    {(['Tous', 'RH', 'Finance', 'IT'] as Category[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un workflow..."
                        className="w-full bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-visible">

                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="ml-3 text-slate-500 dark:text-slate-400">Chargement des workflows...</span>
                    </div>
                )}

                {/* Error state */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-slate-700 dark:text-slate-300 font-medium">Erreur de chargement</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">{error}</p>
                        <button
                            onClick={fetchWorkflows}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Table */}
                {!isLoading && !error && (
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Nom</th>
                                    <th className="py-4 px-6">Version</th>
                                    <th className="py-4 px-6">Dernière modif.</th>
                                    <th className="py-4 px-6">Statut</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredWorkflows.map((workflow) => (
                                    <tr
                                        key={workflow.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => handleEdit(workflow.id)}
                                    >
                                        {/* Name */}
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {workflow.name}
                                            </div>
                                            {workflow.description && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">{workflow.description}</p>
                                            )}
                                        </td>

                                        {/* Version */}
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                v{workflow.version}
                                            </span>
                                        </td>

                                        {/* Last Modified */}
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-sm">
                                            {formatDate(workflow.updatedAt)}
                                        </td>

                                        {/* Status Toggle */}
                                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    onClick={() => handleToggleStatus(workflow.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-[#0d0d12] ${workflow.status === 'ACTIVE' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                >
                                                    <span className="sr-only">Activer workflow</span>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${workflow.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <span className={`text-sm font-medium ${workflow.status === 'ACTIVE' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {workflow.status === 'ACTIVE' ? 'Actif' : 'Brouillon'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions Dropdown */}
                                        <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => toggleDropdown(workflow.id, e)}
                                                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openDropdownId === workflow.id && (
                                                <div
                                                    className="absolute right-8 top-12 w-48 bg-white dark:bg-[#1a1a24] rounded-xl shadow-lg border border-slate-200 dark:border-white/10 py-1 z-50"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => handleEdit(workflow.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                                    >
                                                        <Edit2 size={16} className="text-slate-400" />
                                                        Éditer
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(workflow.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                                    >
                                                        <Copy size={16} className="text-slate-400" />
                                                        Dupliquer
                                                    </button>
                                                    <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                                                    <button
                                                        onClick={() => handleDelete(workflow.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {filteredWorkflows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <GitFork className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                    {searchTerm ? 'Aucun workflow trouvé' : 'Aucun workflow pour le moment'}
                                                </p>
                                                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                                                    {searchTerm ? 'Essayez de modifier votre recherche.' : 'Cliquez sur "Nouveau Workflow" pour commencer.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODAL: CREATE WORKFLOW --- */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => !isCreating && setIsCreateModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1a1a24] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nouveau Workflow</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Comment souhaitez-vous commencer ?</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Option 1: Scratch */}
                            <button
                                onClick={handleStartFromScratch}
                                disabled={isCreating}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-white/5 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all group text-left disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <div className="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                    {isCreating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        Start from Scratch
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        Créez un processus sur mesure avec notre éditeur visuel.
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Template */}
                            <button
                                onClick={handleUseTemplate}
                                disabled={isCreating}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group text-left disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <div className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                    {isCreating ? <Loader2 size={24} className="animate-spin" /> : <LayoutTemplate size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white transition-colors">Use Template</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        Commencez avec le modèle "Demande de Congé" pré-configuré.
                                    </p>
                                </div>
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex justify-end">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={isCreating}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowListPage;
