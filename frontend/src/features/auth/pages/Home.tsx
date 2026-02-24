import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Users, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { Footer } from '@shared/components';

/**
 * Home Page Component
 * 
 * Main landing page for the Nexflow application.
 * This page is part of the auth feature module.
 */
export function Home() {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col bg-h1-black text-white font-sans">
      {/* 1. HACKERONE TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#1e1e1e] text-white py-2.5 px-6 md:px-12 flex justify-between items-center text-[13px] font-medium border-b border-white/5">
        <div className="flex items-center gap-2">
          <span>Nexflow Agentic - Smarter AI for Faster Digital Design | </span>
          <button className="flex items-center gap-1 hover:text-portal-light transition-colors">
            Learn More
            <div className="w-4 h-4 bg-[#ff4b91] rounded-full flex items-center justify-center text-[10px]">
              <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-8 text-slate-300">
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          <button className="hover:text-white transition-colors">Leaderboard</button>
          <button className="hover:text-white transition-colors">Contacted by a designer?</button>
        </div>
      </div>

      {/* 2. HACKERONE MAIN HEADER */}
      <header className="bg-black text-white sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center">
              <img src="/assets/nexflow.png" alt="Nexflow Logo" className="h-10 w-auto" />
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              {[
                'Platform', 'Solutions', 'Partners', 'Researchers', 'Resources', 'Company'
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => item === 'Platform' && setShowSubMenu(!showSubMenu)}
                  className="flex items-center gap-1.5 text-[15px] font-semibold text-white/90 hover:text-white transition-colors group"
                >
                  {item}
                  <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Action Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/register-org')}
              className="bg-[#4b4dff] hover:bg-[#3b3de0] text-white pl-6 pr-2 py-2 rounded-full text-[15px] font-bold flex items-center gap-3 transition-all active:scale-95 group"
            >
              Get Started
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#4b4dff] group-hover:scale-110 transition-transform">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* 3.5 SUB-MENU BAR */}
      <AnimatePresence>
        {showSubMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0a0a0a] border-b border-white/5 shadow-2xl overflow-hidden z-40"
          >
            <div className="max-w-7xl mx-auto flex justify-center gap-8 py-4">
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-white hover:bg-h1-blue/20 hover:text-h1-blue"
              >
                S'identifier
              </Link>
              <div className="w-px h-6 bg-white/10 self-center" />
              <Link
                to="/register-org"
                className="text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-white hover:bg-h1-blue/20 hover:text-h1-blue"
              >
                Créer une organisation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. HERO BANNER */}
      <div className="relative h-[500px] w-full overflow-hidden">
        <video
          src="/assets/PixVerse_V5.6_Image_Text_360P_create_A_cinemat.mp4"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="max-w-5xl w-full text-center">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white text-4xl md:text-6xl font-black uppercase tracking-tight leading-[1.1] mb-8"
            >
              L'AUTOMATISATION : LE MEILLEUR MOYEN DE <span className="text-h1-blue">SÉCURISER</span> ET DE <span className="text-h1-blue">VALORISER</span> VOS PROCESSUS
            </motion.h1>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-4"
            >
              <button
                onClick={() => navigate('/register-org')}
                className="bg-h1-blue hover:brightness-110 text-white px-8 py-4 rounded-md font-bold uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
              >
                Commencer l'inscription
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="bg-h1-black py-24 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-h1-blue/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Building2 className="w-10 h-10 text-h1-blue" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Modernisation</h3>
            <p className="text-h1-slate leading-relaxed">
              Nexflow accompagne les organisations dans leur transformation digitale with des solutions BPMS de pointe.
            </p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-h1-pink/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Check className="w-10 h-10 text-h1-pink" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Sécurité</h3>
            <p className="text-h1-slate leading-relaxed">
              Garantissez l'intégrité et la traçabilité de vos données grâce à nos processus automatisés et sécurisés.
            </p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-h1-blue/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10 text-h1-blue" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Collaboration</h3>
            <p className="text-h1-slate leading-relaxed">
              Optimisez le travail d'équipe et la communication interne with des flux de travail fluides et intuitifs.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
