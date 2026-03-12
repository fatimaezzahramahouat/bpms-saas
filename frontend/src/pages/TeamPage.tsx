import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Footer, ThemeSwitcher } from '@shared/components';
import { Navbar } from '../components/Navbar';
import TeamMemberModal from '../components/TeamMemberModal.tsx';

interface TeamMember {
  id: number;
  name: string;
  position: string;
  image: string;
  department: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Dounia Ouafi", // Ktb smiya w lkniya dyalk
    position: "Développeuse Full-Stack", // Bdliha b l'mouhima dyalk f projet
    image: "/assets/Dounia.png",
    department: "Développement"
  },
  {
    id: 2,
    name: "MAHOUAT FATI", // Ktb smiya w lkniya dyal Fati
    position: "Développeuse Full-Stack", // Bdliha
    image: "/assets/Fati.jpeg", // Rdi lbal hna dert .jpeg kifma f tsawira
    department: "Développement"
  },
  {
    id: 3,
    name: "TOUFI MALAK", // Ktb smiya w lkniya dyal Malak
    position: "Développeuse Full-Stack", // Bdliha
    image: "/assets/Malak.png",
    department: "Développement"
  },
  {
    id: 4,
    name: "ELHARIRI MANAL", // Ktb smiya w lkniya dyal Manal
    position: "Développeuse Full-Stack", // Bdliha
    image: "/assets/Manal.png",
    department: "Développement"
  }
];
export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-h1-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* MAIN HEADER */}
      <header className="bg-white/90 dark:bg-black text-gray-900 dark:text-white sticky top-0 z-50 border-b border-gray-200 dark:border-white/5 backdrop-blur-md transition-colors">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center">
              <img src="/assets/nexflow1.png" alt="Nexflow Logo" className="h-10 w-auto dark:hidden" />
              <img src="/assets/nexflow.png" alt="Nexflow Logo" className="h-10 w-auto hidden dark:block" />
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              <button
                onClick={() => setShowSubMenu(!showSubMenu)}
                className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors group"
              >
                Espace d'Organisation
                <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-white/40 group-hover:text-h1-blue dark:group-hover:text-white transition-colors" />
              </button>
              <Link
                to="/features"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                Fonctionnalités
              </Link>
              <Link
                to="/pricing"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                	
              Nos Offres
              </Link>
              <Link
                to="/our-team"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                Notre Équipe
              </Link>
              <Link
                to="/recrutement"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                Recrutement
              </Link>
            </nav>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link
              to="/login"
              className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <button
              onClick={() => navigate('/register-org')}
              className="bg-[#4b4dff] hover:bg-[#3b3de0] text-white pl-6 pr-2 py-2 rounded-full text-[15px] font-bold flex items-center gap-3 transition-all active:scale-95 group"
            >
              Commencer
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#4b4dff] group-hover:scale-110 transition-transform">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* SUB-MENU BAR */}
      <AnimatePresence>
        {showSubMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden z-40 transition-colors"
          >
            <div className="max-w-7xl mx-auto flex justify-center gap-8 py-4">
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-gray-700 dark:text-white hover:bg-h1-blue/20 hover:text-h1-blue"
              >
                Connexion
              </Link>
              <Link
                to="/register-org"
                className="text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-gray-700 dark:text-white hover:bg-h1-blue/20 hover:text-h1-blue"
              >
                Inscription
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-h1-blue/10 via-purple-500/10 to-pink-500/10 dark:from-h1-blue/20 dark:via-purple-500/20 dark:to-pink-500/20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Rencontrez les Créateurs Derrière <span className="text-h1-blue">Nexflow</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Nous sommes une équipe passionnée dédiée à révolutionner l'automatisation des entreprises
          </motion.p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="group cursor-pointer"
              >
                {/* Photo Container with Arch */}
                <div className="relative h-80 overflow-hidden rounded-t-[3rem] bg-gradient-to-br from-h1-blue/20 to-purple-500/20">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Info Section */}
                <div className="bg-white dark:bg-h1-black rounded-b-xl p-4 text-center border border-gray-200 dark:border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-white/70">
                    {member.position}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
            {/* ================= SECTION NOTION (PROFESSIONNELLE) ================= */}
      <section className="py-16 px-4 flex justify-center border-t border-gray-200 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto">
          {/* Titre Professionnel */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Plongez au cœur de notre organisation
          </h2>
          
          {/* Sous-titre (Description) */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-md md:text-lg">
            La transparence et la collaboration sont les piliers de notre équipe. Découvrez comment nous travaillons au quotidien pour concevoir et développer Nexflow.
          </p>

          {/* Bouton */}
          <a
            href="HNA_7ETI_LIEN_DYAL_NOTION_DYALK" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#4b4dff] hover:bg-[#3b3de0] text-white px-8 py-3.5 rounded-full text-[15px] font-bold transition-all hover:scale-105 shadow-lg shadow-[#4b4dff]/30"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" 
              alt="Logo Notion" 
              className="w-5 h-5 filter brightness-0 invert" 
            />
            Explorer notre espace Notion
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </section>
      {/* ==================================================================== */}

      <Footer />

      {/* Team Member Modal - Keep for potential future use */}
      {selectedMember && (
        <TeamMemberModal
          member={{
            id: selectedMember.id,
            name: selectedMember.name,
            position: selectedMember.position,
            image: selectedMember.image,
            shortBio: "",
            fullBio: "",
            skills: [],
            projects: []
          }}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
