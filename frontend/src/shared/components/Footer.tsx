import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

/**
 * Footer Component
 * 
 * Global footer component with contact information and navigation links.
 * This is a shared component that can be used across all pages.
 */
export function Footer() {
  return (
    <footer className="bg-black text-white py-20 px-4 mt-auto w-full border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="flex flex-col gap-6">
          <Link to="/" className="text-2xl font-bold tracking-tighter lowercase flex items-center">
            nex<span className="text-white/40 font-medium">flow</span>
          </Link>
          <p className="text-sm text-h1-slate leading-relaxed">
            Agence Nationale de la Conception Digitale et du BPMS. Propulsé par l'intelligence artificielle.
          </p>
        </div>
        <div>
          <h4 className="font-bold uppercase mb-6 text-xs tracking-[0.2em] text-h1-blue">Liens utiles</h4>
          <ul className="text-sm text-h1-slate space-y-3">
            <li className="hover:text-white cursor-pointer transition-colors"><Link to="/">Accueil</Link></li>
            <li className="hover:text-white cursor-pointer transition-colors">Présentation</li>
            <li className="hover:text-white cursor-pointer transition-colors">Métiers</li>
            <li className="hover:text-white cursor-pointer transition-colors">Espace Media</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold uppercase mb-6 text-xs tracking-[0.2em] text-h1-blue">Services</h4>
          <ul className="text-sm text-h1-slate space-y-3">
            <li className="hover:text-white cursor-pointer transition-colors"><Link to="/register-org">Espace Organisation</Link></li>
            <li className="hover:text-white cursor-pointer transition-colors">Support Technique</li>
            <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold uppercase mb-6 text-xs tracking-[0.2em] text-h1-blue">Contact</h4>
          <ul className="text-sm text-h1-slate space-y-3">
            <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-h1-blue" /> +212 5 22 00 00 00</li>
            <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-h1-blue" /> contact@nexflow.ma</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 pt-10 text-center text-[10px] text-h1-slate uppercase tracking-[0.4em] font-bold">
        <p>© 2026 NEXFLOW. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}
