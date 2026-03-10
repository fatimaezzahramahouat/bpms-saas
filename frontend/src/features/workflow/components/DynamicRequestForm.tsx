import React, { useState } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { processService } from '../../../services/process.service';
import { toast } from 'react-toastify';

interface FieldDef {
    name: string;
    type: string;
    required: boolean;
}

interface Workflow {
    id: string;
    name: string;
    data_model?: FieldDef[];
}

interface DynamicRequestFormProps {
    workflow: Workflow;
    onSuccess: () => void;
    onCancel: () => void;
}

export const DynamicRequestForm: React.FC<DynamicRequestFormProps> = ({ workflow, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    // Explicit array cast/fallback to ensure mapped safely
    const rawDataModel = workflow.data_model || (workflow as any).dataModel || [];
    const dataModel: FieldDef[] = (Array.isArray(rawDataModel) ? rawDataModel : []).map(f => ({
        ...f,
        name: f.name?.trim() || ''
    }));

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        const missingFields = dataModel.filter(f => f.required && !formData[f.name]);
        if (missingFields.length > 0) {
            toast.error(`Veuillez remplir : ${missingFields.map(f => f.name).join(', ')}`);
            return;
        }

        setLoading(true);
        try {
            await processService.startProcess(workflow.id, formData);
            toast.success(`Votre demande pour ${workflow.name} a été soumise avec succès !`);
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
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        Nouvelle Demande: {workflow.name}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Complétez les informations requises.</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={20} className="text-zinc-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {dataModel.map((field) => (
                    <div key={field.name} className="flex flex-col gap-2">
                        <label className="text-xs font-black text-h1-blue uppercase tracking-widest flex gap-1">
                            {field.name.replace(/_/g, ' ')}
                            {field.required && <span className="text-rose-500">*</span>}
                        </label>

                        {field.type === 'date' && (
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'number' && (
                            <input
                                type="number"
                                placeholder={`Entrez ${field.name}...`}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {(field.type === 'text' || field.type === 'string') && (
                            <textarea
                                placeholder={`Précisez ${field.name}...`}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-h1-blue outline-none transition-all min-h-[100px] resize-none"
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'dropdown' && (
                            <select
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-h1-blue outline-none transition-all"
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                            >
                                <option value="">Sélectionnez une option...</option>
                                <option value="Option A">Option A</option>
                                <option value="Option B">Option B</option>
                            </select>
                        )}
                    </div>
                ))}

                {dataModel.length === 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                        Aucun champ personnalisé n'a été défini pour ce workflow.
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[1.5] py-4 bg-h1-blue hover:bg-h1-blue/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-h1-blue/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : (
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
