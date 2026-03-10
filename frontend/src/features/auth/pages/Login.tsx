import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, User, Check, Eye, EyeOff } from 'lucide-react';
import { GlowBackground, PortalLogo, ThemeSwitcher } from '@shared/components';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { useGlobalModal } from '../../../shared/components/GlobalModal';

/**
 * Login Page Component
 * 
 * Authentication page for user login.
 * This page is part of the auth feature module.
 */
export function Login() {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useGlobalModal();

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        // The token is now handled automatically by the browser via HTTP-only cookie
        // BUT we also store it in localStorage for Axios interceptors if cookies are restricted
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        localStorage.setItem('isAuthenticated', 'true');
        window.dispatchEvent(new CustomEvent('user-data-updated'));
        navigate('/dashboard');
      } else {
        const error = await response.json();
        showModal(error.error || 'Connexion échouée', 'error');
      }
    } catch (err) {
      console.error(err);
      showModal('Erreur réseau', 'error');
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
            CONNEXION À VOTRE ESPACE
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gov-card w-full p-6"
        >
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
            <div className="gov-row-compact">
              <div className="gov-label-box-compact w-48">
                <Mail className="w-5 h-5 mr-4" />
                Identifiant
              </div>
              <input
                type="email"
                name="email"
                placeholder="VOTRE EMAIL"
                className="gov-input-compact"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>

            <div className="gov-row-compact">
              <div className="gov-label-box-compact w-48">
                <User className="w-5 h-5 mr-4" />
                Mot de passe
              </div>
              <div className="flex-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="gov-input-compact pr-12"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-h1-blue transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 mt-4">
              <button type="submit" className="gov-button-compact px-16 py-3 text-sm w-full md:w-auto">
                <Check className="w-6 h-6" />
                IDENTIFICATION
              </button>

              <div className="w-full flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">OU</span>
                <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                className="w-full flex items-center justify-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-h1-blue transition-all px-6 py-3 rounded-2xl group cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <span className="text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-widest text-xs group-hover:text-h1-blue">Se connecter avec Google</span>
              </button>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-h1-blue text-xs font-bold uppercase tracking-widest hover:text-white transition-all cursor-pointer"
              >
                Mot de passe oublié ? Récupérer mon accès
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}
