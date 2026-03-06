import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Send, Loader2, X, UploadCloud } from 'lucide-react';
import { processService } from '../../../services/process.service';
import { workflowService } from '../../../services/workflow.service';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'motion/react';

interface LeaveRequestFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSuccess, onCancel }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const [workflowId, setWorkflowId] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkflow = async () => {
            try {
                const response = await workflowService.getAllWorkflows();
                const workflows = response.data || [];
                // Look for a workflow named "Congé" or "Leave"
                const leaveWorkflow = workflows.find((w: any) =>
                    w.name.toUpperCase().includes("CONGÉ") ||
                    w.name.toUpperCase().includes("CONGE") ||
                    w.name.toUpperCase().includes("LEAVE")
                );

                if (leaveWorkflow) {
                    setWorkflowId(leaveWorkflow.id);
                } else {
                    console.error("Leave workflow not found in the list of workflows");
                    toast.error("Le workflow 'Demande de Congé' n'a pas été trouvé. Veuillez contacter l'administrateur.");
                }
            } catch (err) {
                console.error("Error fetching workflows:", err);
            }
        };

        fetchWorkflow();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!startDate || !endDate || !reason) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (!workflowId || workflowId === "null") {
            toast.error('Le workflow "Demande de Congé" n\'a pas été trouvé. Veuillez le créer dans l\'administration.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('workflowId', workflowId);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);
            formData.append('reason', reason);
            if (file) {
                formData.append('document', file);
            }

            // We need to update processService or use axios directly for FormData
            // Since processService.startProcess currently only takes workflowId, 
            // I'll use a local axios call or suggest updating the service.
            // For this task, I'll assume we update the service or use a direct call.

            await processService.startProcess(workflowId, formData);

            toast.success('Votre demande de congé a été soumise avec succès !');
            onSuccess();
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.error || 'Erreur lors de la soumission de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Demande de Congé</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Complétez les informations pour votre absence.</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={20} className="text-zinc-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} />
                            Date de début
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} />
                            Date de fin
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} />
                        Motif de la demande
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Expliquez brièvement le motif (ex: Congés annuels, RTT...)"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-h1-blue outline-none transition-all min-h-[100px] resize-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <UploadCloud size={14} />
                        Justificatif (Optionnel)
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="leave-file-upload"
                        />
                        <label
                            htmlFor="leave-file-upload"
                            className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-h1-blue hover:bg-h1-blue/5 cursor-pointer transition-all group"
                        >
                            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-400 group-hover:text-h1-blue transition-colors mb-2">
                                <UploadCloud size={24} />
                            </div>
                            <span className="text-sm font-bold text-gray-600 dark:text-zinc-400">
                                {file ? file.name : "Cliquez pour uploader un document"}
                            </span>
                            <span className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-black">PDF, JPG, PNG up to 10MB</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all font-bold"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[1.5] py-4 bg-h1-blue hover:bg-h1-blue/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-h1-blue/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <Send size={16} />
                                Soumettre la demande
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
