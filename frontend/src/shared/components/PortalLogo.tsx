import { Link } from 'react-router-dom';

/**
 * Portal Logo Component
 * 
 * Logo used on portal pages (login, register).
 * This is a shared component that can be used across all pages.
 */
export function PortalLogo() {
  return (
    <div className="mb-4 flex flex-col items-center relative z-10">
      <Link to="/" className="flex flex-col items-center">
        <div className="w-28 h-28 bg-portal-navy p-3 shadow-xl flex items-center justify-center rounded-lg">
          <div className="border-2 border-white w-full h-full flex flex-col items-center justify-center text-white font-serif italic">
            <span className="text-2xl font-bold leading-none uppercase tracking-tighter">Nex</span>
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase mt-1">flow</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
