import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { settingsService } from '../../../services/settings.service';

interface ForceChangePasswordModalProps {
    isOpen: boolean;
    onSuccess: () => void;
}

export function ForceChangePasswordModal({ isOpen, onSuccess }: ForceChangePasswordModalProps) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.newPassword !== formData.confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas");
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("Le nouveau mot de passe doit comporter au moins 6 caractères");
            return;
        }

        setLoading(true);
        try {
            await settingsService.updatePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors du changement de mot de passe");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                    >
                        {/* Header Gradient */}
                        <div className="h-2 bg-gradient-to-r from-h1-blue via-purple-500 to-pink-500" />

                        <div className="p-8">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 bg-h1-blue/10 rounded-2xl flex items-center justify-center mb-4 border border-h1-blue/20">
                                    <Lock className="w-8 h-8 text-h1-blue" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Sécurisez votre compte
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                                    Pour votre sécurité, vous devez changer le mot de passe provisoire défini par votre administrateur avant de continuer.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-3"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {error}
                                    </motion.div>
                                )}

                                {/* Inputs */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Mot de passe actuel</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            required
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 hover:border-h1-blue focus:border-h1-blue rounded-2xl px-5 py-4 outline-none transition-all text-gray-900 dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Nouveau mot de passe</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            required
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 hover:border-h1-blue focus:border-h1-blue rounded-2xl px-5 py-4 outline-none transition-all text-gray-900 dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-1 ml-1 flex items-center gap-1">
                                        <ShieldCheck size={12} className="text-emerald-500" />
                                        Utilisez au moins 6 caractères
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Confirmer le nouveau mot de passe</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 hover:border-h1-blue focus:border-h1-blue rounded-2xl px-5 py-4 outline-none transition-all text-gray-900 dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-h1-blue hover:bg-h1-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-h1-blue/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Changer mon mot de passe
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                                <p className="text-xs text-zinc-400">
                                    Connecté en tant que <span className="text-zinc-600 dark:text-zinc-200 font-medium">Nexflow Collaborator</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
