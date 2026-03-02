import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, User, Check, Eye, EyeOff } from 'lucide-react';
import { GlowBackground, PortalLogo, ThemeSwitcher } from '@shared/components';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

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
        alert(error.error || 'Connexion échouée');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
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
