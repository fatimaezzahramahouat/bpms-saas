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
        <div className="w-32 h-32 flex items-center justify-center rounded-lg">
          <img
            src="/assets/nexflow.png"
            alt="Nexflow Logo"
            className="w-full h-auto object-contain"
          />
        </div>
      </Link>
    </div>
  );
}
