import { Link } from 'react-router-dom';

/**
 * Standalone Logo Component
 * 
 * Logo used on the landing/home page.
 * This is a shared component that can be used across all pages.
 */
export function StandaloneLogo() {
  return (
    <div className="py-10 flex flex-col items-center relative z-10">
      <Link to="/" className="flex flex-col items-center">
        <div className="w-24 h-24 bg-portal-navy p-2.5 shadow-lg flex items-center justify-center rounded-lg mb-4">
          <div className="border-2 border-white w-full h-full flex flex-col items-center justify-center text-white font-serif italic">
            <span className="text-xl font-bold leading-none uppercase tracking-tighter">Nex</span>
            <span className="text-[8px] font-bold tracking-[0.4em] uppercase mt-1">flow</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-gov-orange text-sm font-bold tracking-[0.15em] uppercase leading-tight">
            AGENCE NATIONALE DE LA CONCEPTION DIGITALE
          </h2>
          <h2 className="text-gov-orange text-sm font-bold tracking-[0.15em] uppercase leading-tight">
            ET DU BPMS
          </h2>
        </div>
      </Link>
    </div>
  );
}
