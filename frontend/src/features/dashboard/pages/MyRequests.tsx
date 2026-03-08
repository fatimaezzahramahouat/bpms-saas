import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Plus, Calendar, FileText, X, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../../services/api';

interface ProcessInstance {
    id: string;
    status: string;
    createdAt: string;
    workflow: { name: string };
    context?: any;
    documents?: {
        id: string;
        fileName: string;
        fileUrl: string;
        docType: string;
    }[];
}

export function MyRequests() {
    const { userData } = useOutletContext<{ userData: any }>();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ProcessInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        type: 'Congé',
        startDate: '',
        endDate: '',
        comment: ''
    });

    useEffect(() => {
        if (userData) {
            fetchRequests();
        }
    }, [userData]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/process/my-requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Fetch workflows to find one that matches the type
            const workflowResponse = await api.get('/workflows');
            // Backend returns { data: workflows[] }
            const workflows = workflowResponse.data.data || [];

            let targetWorkflow = workflows.find((w: any) =>
                w.name.toUpperCase().includes(formData.type.toUpperCase())
            );

            // Fallback to the first workflow if no name match (e.g. any active workflow)
            if (!targetWorkflow && workflows.length > 0) {
                targetWorkflow = workflows[0];
            }

            if (!targetWorkflow) {
                alert("Aucun workflow n'est configuré pour cette organisation.");
                return;
            }

            await api.post('/process/start', {
                workflowId: targetWorkflow.id,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.comment
            });

            setIsModalOpen(false);
            // Reset dates and comment, but keep type for the next one
            setFormData(prev => ({ ...prev, startDate: '', endDate: '', comment: '' }));
            fetchRequests();
            alert("Demande soumise avec succès !");
        } catch (error: any) {
            console.error('Error submitting request:', error);
            const msg = error.response?.data?.error || "Une erreur est survenue lors de la soumission.";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date(dateString));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Validé
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> En cours
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <X className="w-3 h-3" /> Refusé
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {status}
                    </span>
                );
        }
    };

    if (!userData) return null;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                        Mes Demandes
                    </h1>
                    <p className="text-zinc-500 mt-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-h1-blue" />
                        Suivez l'état de vos demandes en temps réel.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchRequests}
                        className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-6 py-4 rounded-2xl font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        <Clock className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        Rafraîchir
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative flex items-center gap-2 bg-h1-blue hover:bg-h1-blue/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-h1-blue/20 hover:scale-105 active:scale-95 overflow-hidden"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        Nouvelle Demande
                    </button>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-3xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                    ))}
                </div>
            ) : requests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {requests.map((request, index) => (
                            <motion.div
                                key={request.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-2xl bg-h1-blue/10 text-h1-blue group-hover:bg-h1-blue group-hover:text-white transition-colors duration-300">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {request.workflow?.name || 'Demande'}
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(request.createdAt)}
                                    </div>
                                    {request.context?.startDate && (
                                        <p className="text-xs text-zinc-400 italic">
                                            Du {new Date(request.context.startDate).toLocaleDateString('fr-FR')} au {new Date(request.context.endDate).toLocaleDateString('fr-FR')}
                                        </p>
                                    )}
                                    {request.status === 'COMPLETED' && request.documents && request.documents.some(d => d.docType === 'CERTIFICATE') && (
                                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${request.documents.find(d => d.docType === 'CERTIFICATE')?.fileUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                                Certificat
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-6"
                >
                    <div className="w-24 h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <ClipboardList className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aucune demande</h2>
                        <p className="text-zinc-500 max-w-sm mx-auto">
                            Lancez votre première demande de service pour commencer à automatiser vos processus.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-h1-blue flex items-center justify-center text-white shadow-lg shadow-h1-blue/30">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                            Nouvelle Demande
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-zinc-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                            Type de demande
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-h1-blue outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="Congé">Congé</option>
                                            <option value="Frais">Frais</option>
                                            <option value="Matériel">Matériel</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                                Date de fin
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                            Commentaire
                                        </label>
                                        <textarea
                                            placeholder="Détails de votre demande..."
                                            value={formData.comment}
                                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-h1-blue outline-none transition-all min-h-[120px] resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-h1-blue hover:bg-h1-blue/90 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl shadow-h1-blue/20 flex items-center justify-center gap-3 mt-4"
                                    >
                                        {submitting ? (
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-6 h-6" />
                                                Soumettre
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MyRequests;
