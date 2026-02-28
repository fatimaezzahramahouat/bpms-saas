import { useState, FormEvent } from 'react';
import { X, Mail, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { requestPasswordReset } from '../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-h1-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Récupération d'accès
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                  Entrez votre adresse email ci-dessous. Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-lg animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-h1-blue transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-h1-blue focus:border-transparent outline-none transition-all text-sm dark:text-white"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-h1-blue hover:bg-h1-blue/90 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-h1-blue/20 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      'Envoyer le lien'
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Email envoyé !</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                  Si un compte est associé à <span className="font-bold text-h1-blue">{email}</span>, vous recevrez un email sous peu avec les instructions.
                </p>
                <button
                  onClick={onClose}
                  className="px-12 py-3 border-2 border-h1-blue text-h1-blue hover:bg-h1-blue hover:text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all"
                >
                  Fermer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
