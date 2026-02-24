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
        <div className="w-28 h-28 flex items-center justify-center rounded-lg mb-4">
          <img
            src="/assets/nexflow.png"
            alt="Nexflow Logo"
            className="w-full h-auto object-contain"
          />
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
