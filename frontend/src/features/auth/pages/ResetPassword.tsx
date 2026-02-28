import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Check, Loader2, AlertCircle } from 'lucide-react';
import { GlowBackground, PortalLogo, ThemeSwitcher } from '@shared/components';
import { resetPassword } from '../services/authService';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Jeton de réinitialisation manquant.');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token!, password);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-start pt-6 bg-white dark:bg-h1-black font-sans relative overflow-hidden px-[4cm] transition-colors duration-300">
      <div className="absolute top-6 right-8 z-50">
        <ThemeSwitcher />
      </div>
      <GlowBackground />

      <div className="flex flex-col items-center w-full max-w-2xl relative z-10">
        <PortalLogo />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-center"
        >
          <h1 className="text-h1-blue text-xl font-black uppercase tracking-[0.2em] border-b-2 border-h1-blue pb-1 text-center dark:text-h1-blue">
            Réinitialisation du mot de passe
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gov-card w-full p-8"
        >
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                <Check className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Succès !</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Votre mot de passe a été réinitialisé. Redirection vers la page de connexion...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center mb-2">
                Veuillez choisir un nouveau mot de passe sécurisé pour votre compte.
              </p>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-100/50 border border-red-200 text-red-700 text-sm rounded-xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="gov-row-compact">
                <div className="gov-label-box-compact w-56 text-[10px]">
                  <Lock className="w-4 h-4 mr-3" />
                  NOUVEAU MOT DE PASSE
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="gov-input-compact"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting || !token}
                />
              </div>

              <div className="gov-row-compact">
                <div className="gov-label-box-compact w-56 text-[10px]">
                  <Check className="w-4 h-4 mr-3" />
                  CONFIRMATION
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="gov-input-compact"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting || !token}
                />
              </div>

              <div className="flex justify-center mt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !token}
                  className="gov-button-compact px-16 py-4 text-xs w-full disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      MISE À JOUR...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      VALIDER LE NOUVEAU MOT DE PASSE
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
