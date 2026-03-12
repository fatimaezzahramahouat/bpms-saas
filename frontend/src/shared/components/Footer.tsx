import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Les 4 Colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Colonne 1: Logo w Description JDIDA */}
          <div>
            <Link to="/" className="inline-block mb-6">
              <img src="/assets/nexflow.png" alt="Nexflow" className="h-8 w-auto" />
            </Link>
            <p className="text-[#a0a0ab] text-[15px] leading-relaxed pr-4">
              Plateforme innovante d'automatisation des processus métiers (BPMS). Propulsez et simplifiez la gestion de votre organisation grâce à l'intelligence artificielle.
            </p>
          </div>

          {/* Colonne 2: Navigation (m9ada bach mat3tich 404) */}
          <div>
            <h3 className="text-[#4b4dff] font-bold text-sm tracking-widest uppercase mb-6">
              Navigation
            </h3>
            <ul className="space-y-4">
              <li>
                {/* Reditha to="/" bach mat3tikch 404, w tddi l'page d'accueil */}
                <Link to="/" className="text-[#a0a0ab] hover:text-white transition-colors text-[15px]">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#a0a0ab] hover:text-white transition-colors text-[15px]">
                  Nos Offres
                </Link>
              </li>
              <li>
                <Link to="/our-team" className="text-[#a0a0ab] hover:text-white transition-colors text-[15px]">
                  Notre Équipe
                </Link>
              </li>
              <li>
                <Link to="/recrutement" className="text-[#a0a0ab] hover:text-white transition-colors text-[15px]">
                  Recrutement
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3: Espace Organisation (7iydna Support Technique) */}
          <div>
            <h3 className="text-[#4b4dff] font-bold text-sm tracking-widest uppercase mb-6">
              Espace Organisation
            </h3>
            <ul className="space-y-4">
              <li>
                <Link to="/login" className="text-[#a0a0ab] hover:text-white transition-colors text-[15px]">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register-org" className="text-[#a0a0ab] hover:text-white transition-colors text-[15px]">
                  Inscription
                </Link>
              </li>
              {/* Support technique t7iydat mn hna */}
            </ul>
          </div>

          {/* Colonne 4: Contact */}
          <div>
            <h3 className="text-[#4b4dff] font-bold text-sm tracking-widest uppercase mb-6">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-[#a0a0ab] hover:text-white transition-colors text-[15px] cursor-pointer">
                <Phone className="w-5 h-5 text-[#4b4dff]" />
                +212 6 0127 44 56
              </li>
              <li className="flex items-center gap-3 text-[#a0a0ab] hover:text-white transition-colors text-[15px] cursor-pointer">
                <Mail className="w-5 h-5 text-[#4b4dff]" />
                NexFlow.com
              </li>
            </ul>
          </div>
          
        </div>

        {/* Copyright */}
        <div className="border-t border-[#1f1f2e] pt-8 flex justify-center items-center">
          <p className="text-[#a0a0ab] text-xs font-bold tracking-[0.25em] uppercase">
            © 2026 NEXFLOW. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}