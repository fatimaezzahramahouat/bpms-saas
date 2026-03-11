import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Users, Check, ChevronRight, ChevronDown, UserCheck, TrendingUp, FileText, ArrowRight, Menu, X } from 'lucide-react';
import { Footer, ThemeSwitcher } from '@shared/components';

/**
 * Home Page Component
 * 
 * Main landing page for the Nexflow application.
 * This page is part of the auth feature module.
 */
export function Home() {

  const [showSubMenu, setShowSubMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 👈 ZEDNA STATE DYAL MENU MOBILE
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const element = document.getElementById('fonctionnalites');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Fonction bach nssedou l'menu mobile mnin nscrolliw
  const handleMobileScrollToFeatures = () => {
    setIsMobileMenuOpen(false);
    scrollToFeatures();
  };

  const plans = [
    {
      name: "Démarrage",
      price: 49,
      features: ["Jusqu'à 50 Employés", "Recrutement de Base", "Support par Email", "Fonctionnalités RH de Base"],
      cta: "Commencer l'Essai Gratuit",
      popular: false
    },
    {
      name: "Professionnel",
      price: 149,
      features: ["Jusqu'à 500 Employés", "Analyses Avancées", "Support Prioritaire", "Toutes les Fonctionnalités", "Accès API"],
      cta: "Commencer l'Essai Gratuit",
      popular: true
    },
    {
      name: "Entreprise",
      price: 0,
      isCustom: true,
      features: ["Employés Illimités", "Intégration Personnalisée", "Support Dédié 24/7", "Garantie SLA", "Option Sur Site"],
      cta: "Contacter les Ventes",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-h1-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-white/90 dark:bg-black text-gray-900 dark:text-white sticky top-0 z-50 border-b border-gray-200 dark:border-white/5 backdrop-blur-md transition-colors">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          
          {/* Left: Logo & Nav Desktop */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center">
              <img src="/assets/nexflow1.png" alt="Nexflow Logo" className="h-10 w-auto dark:hidden" />
              <img src="/assets/nexflow.png" alt="Nexflow Logo" className="h-10 w-auto hidden dark:block" />
            </Link>

            {/* Menu Desktop kiban ghir f PC (lg:flex) */}
            <nav className="hidden lg:flex items-center gap-7">
              <button
                onClick={() => setShowSubMenu(!showSubMenu)}
                className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors group"
              >
                Espace d'Organisation
                <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-white/40 group-hover:text-h1-blue dark:group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={scrollToFeatures}
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Fonctionnalités
              </button>

              <Link to="/pricing" className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors">
                Nos Offres
              </Link>
              <Link to="/our-team" className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors">
                Notre Équipe
              </Link>
              <Link to="/recrutement" className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors">
                Recrutement
              </Link>
            </nav>
          </div>

          {/* Right: Action Buttons w Burger Icon */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            
            {/* Boutons dyal PC (mkhbiyin f mobile) */}
            <div className="hidden lg:flex items-center gap-4">
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

            {/* Bouton BURGER dyal Mobile (Mkhbi f PC) */}
            <button 
              className="lg:hidden p-2 text-gray-600 dark:text-white focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* 📱 DROPDOWN MOBILE MENU (Kayban ghir ila klicikina 3la Burger) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-white/5 bg-white dark:bg-black overflow-hidden shadow-xl"
            >
              <div className="flex flex-col px-6 py-6 space-y-4">
                <Link to="/register-org" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-semibold text-gray-800 dark:text-white">Créer une organisation</Link>
                <button onClick={handleMobileScrollToFeatures} className="text-left text-[16px] font-semibold text-gray-800 dark:text-white">Fonctionnalités</button>
                <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-semibold text-gray-800 dark:text-white">Nos Offres</Link>
                <Link to="/our-team" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-semibold text-gray-800 dark:text-white">Notre Équipe</Link>
                <Link to="/recrutement" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-semibold text-gray-800 dark:text-white">Recrutement</Link>
                
                <hr className="border-gray-200 dark:border-white/10 my-2" />
                
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-semibold text-gray-800 dark:text-white text-center py-2">
                  Connexion
                </Link>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/register-org'); }}
                  className="bg-[#4b4dff] hover:bg-[#3b3de0] text-white py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-all"
                >
                  Commencer <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3.5 SUB-MENU BAR (Desktop Only) */}
      <AnimatePresence>
        {showSubMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="hidden lg:block bg-zinc-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden z-40 transition-colors"
          >
            <div className="max-w-7xl mx-auto flex justify-center gap-8 py-4">
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-gray-700 dark:text-white hover:bg-h1-blue/20 hover:text-h1-blue"
              >
                S'identifier
              </Link>
              <div className="w-px h-6 bg-gray-200 dark:bg-white/10 self-center" />
              <Link
                to="/register-org"
                className="text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full transition-all text-gray-700 dark:text-white hover:bg-h1-blue/20 hover:text-h1-blue"
              >
                Créer une organisation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO BANNER */}
      <div className="relative h-screen w-full overflow-hidden">
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
      <div className="bg-white dark:bg-h1-black py-24 px-4 border-t border-gray-100 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-h1-blue/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Building2 className="w-10 h-10 text-h1-blue" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Modernisation</h3>
            <p className="text-zinc-500 dark:text-h1-slate leading-relaxed">
              Nexflow accompagne les organisations dans leur transformation digitale with des solutions BPMS de pointe.
            </p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-h1-pink/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Check className="w-10 h-10 text-h1-pink" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Sécurité</h3>
            <p className="text-zinc-500 dark:text-h1-slate leading-relaxed">
              Garantissez l'intégrité et la traçabilité de vos données grâce à nos processus automatisés et sécurisés.
            </p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-h1-blue/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10 text-h1-blue" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Collaboration</h3>
            <p className="text-zinc-500 dark:text-h1-slate leading-relaxed">
              Optimisez le travail d'équipe et la communication interne with des flux de travail fluides et intuitifs.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 px-6 bg-white dark:bg-h1-black scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tout Ce Dont Vous Avez Besoin pour Gérer Votre Équipe
            </h2>
            <p className="text-gray-600 dark:text-white/70">
              Des fonctionnalités puissantes conçues pour les équipes RH modernes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Gestion du Recrutement",
                description: "Suivez les candidats, planifiez les entretiens et gérez votre processus de recrutement en toute simplicité."
              },
              {
                icon: UserCheck,
                title: "Suivi des Employés",
                description: "Base de données complète des employés avec présence, gestion des congés, et plus encore."
              },
              {
                icon: TrendingUp,
                title: "Analyses de Performance",
                description: "Informations et analyses en temps réel pour suivre la performance et l'engagement des employés."
              },
              {
                icon: FileText,
                title: "Conformité et Rapports",
                description: "Suivi automatisé de la conformité et rapports complets pour les audits."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-h1-black rounded-xl border border-gray-200 dark:border-white/10 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="bg-h1-blue w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-white/70 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-h1-blue/90 to-purple-600/90">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tarification Simple et Transparente
            </h2>
            <p className="text-white/80 mb-8">
              Choisissez le plan parfait pour la taille de votre équipe
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!yearly ? 'text-white' : 'text-white/60'}`}>Mensuel</span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-white' : 'bg-white/30'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-h1-blue transition-all ${yearly ? 'left-8' : 'left-1'}`} />
              </button>
              <span className={`text-sm font-medium ${yearly ? 'text-white' : 'text-white/60'}`}>
                Annuel
              </span>
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                Économisez 20%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const displayPrice = plan.isCustom ? 'Sur Mesure' : (yearly ? Math.round(plan.price * 12 * 0.8) : plan.price);
              const period = plan.isCustom ? '' : (yearly ? '/an' : '/mois');

              return (
                <div
                  key={index}
                  className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-white' : 'bg-white/10 backdrop-blur-md'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-h1-blue text-white text-xs font-bold rounded-full">
                      Le Plus Populaire
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold mb-4 ${plan.popular ? 'text-gray-900' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-h1-blue' : 'text-white'}`}>
                      ${displayPrice}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-gray-600' : 'text-white/70'}`}>
                      {period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className={`flex items-center gap-2 ${plan.popular ? 'text-gray-700' : 'text-white/90'}`}>
                        <Check className={`w-5 h-5 ${plan.popular ? 'text-h1-blue' : 'text-white'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${plan.popular
                      ? 'bg-h1-blue hover:bg-[#3b3de0] text-white'
                      : 'bg-white hover:bg-gray-100 text-h1-blue'
                      }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white dark:bg-h1-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Approuvé par les Leaders RH
            </h2>
            <p className="text-gray-600 dark:text-white/70">
              Découvrez ce que les professionnels RH disent de Nexflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Martinez",
                role: "Directrice RH chez TechVentures",
                image: "https://i.pravatar.cc/100?img=1",
                quote: "Nexflow a complètement transformé notre processus de recrutement. Nous avons réduit notre délai d'embauche de 45% et considérablement amélioré la qualité des candidats."
              },
              {
                name: "David Chen",
                role: "Directeur RH chez GlobalCorp",
                image: "https://i.pravatar.cc/100?img=11",
                quote: "Le tableau de bord analytique nous donne des informations en temps réel sur la performance de l'équipe. C'est devenu un outil essentiel pour notre organisation de plus de 500 employés."
              },
              {
                name: "Emily Rodriguez",
                role: "Responsable des Opérations RH",
                image: "https://i.pravatar.cc/100?img=5",
                quote: "Enfin, une plateforme RH intuitive et puissante. Notre équipe l'a adoptée en quelques jours et la satisfaction des employés a augmenté de 30%."
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-h1-blue/10 to-purple-500/10 dark:from-h1-black/50 dark:to-h1-black rounded-xl border border-gray-200 dark:border-white/10 p-6 hover:shadow-lg transition"
              >
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mb-4"
                />
                <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-4">{testimonial.role}</p>
                <p className="text-gray-700 dark:text-white/90 italic mt-4">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-h1-blue/10 to-purple-500/10 dark:from-h1-blue/20 dark:to-purple-500/20 rounded-2xl py-16 px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Prêt à Transformer Vos Opérations RH ?
          </h2>
          <p className="text-gray-600 dark:text-white/70 mb-8">
            Rejoignez des milliers d'entreprises qui modernisent leurs processus RH avec Nexflow
          </p>
          <div className="flex gap-4 justify-center mt-8 flex-wrap">
            <button
              onClick={() => navigate('/register-org')}
              className="bg-h1-blue hover:bg-[#3b3de0] text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              Commencer l'Essai Gratuit
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/recrutement"
              className="border-2 border-h1-blue text-h1-blue hover:bg-h1-blue/10 px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Vous Cherchez un Emploi ?
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}