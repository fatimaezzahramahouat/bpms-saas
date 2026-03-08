import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveAuthData } from '../utils/auth';
import { GlowBackground, PortalLogo } from '@shared/components';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

/**
 * Google Success Page
 * 
 * Handles the redirect from the backend after a successful Google OAuth login.
 * It extracts the JWT token from the URL, saves it, and redirects the user.
 */
export function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // 1. Save authentication data
      const user = saveAuthData(token);
      
      if (user) {
        // 2. Redirect based on profile completion status
        // Profile completion check: if user hasn't finished setup
        if (user.profileCompleted === false) {
          navigate('/settings/profile');
        } else {
          navigate('/dashboard');
        }
      } else {
        // If decoding failed, back to login
        navigate('/login?error=auth_failed');
      }
    } else {
      // No token found, back to login
      navigate('/login?error=missing_token');
    }
  }, [token, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-h1-black relative overflow-hidden transition-colors">
      <GlowBackground />
      <div className="relative z-10 flex flex-col items-center">
        <PortalLogo />
        
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="mt-8 flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-h1-blue animate-spin" />
          <h2 className="text-zinc-400 font-black uppercase tracking-[0.2em] text-sm">
            Finalisation de la connexion...
          </h2>
        </motion.div>
      </div>
    </div>
  );
}
