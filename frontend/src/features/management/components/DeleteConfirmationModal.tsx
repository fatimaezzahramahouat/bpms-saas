import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}

export function DeleteConfirmationModal({ isOpen, onClose, onSuccess, user }: DeleteConfirmationModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                onSuccess();
            } else {
                const result = await response.json();
                setError(result.error || 'Une erreur est survenue');
            }
        } catch (err) {
            setError('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-red-50/50 dark:bg-red-500/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Supprimer</h2>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Confirmation requise</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-gray-900 dark:text-white font-bold text-lg">
                                        Êtes-vous sûr de vouloir supprimer <span className="text-red-500">{user?.firstName} {user?.lastName}</span> ?
                                    </p>
                                    <p className="text-zinc-500 text-sm mt-2">
                                        Cette action est irréversible. Toutes les données associées à cet utilisateur seront définitivement supprimées.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
                                    <X className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all uppercase tracking-widest"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                    {loading ? 'SUPPRESSION...' : (
                                        <>
                                            <Trash2 className="w-5 h-5" />
                                            CONFIRMER
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
