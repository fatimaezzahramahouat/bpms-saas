import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Application Providers
 * 
 * This component wraps the application with all necessary context providers.
 * It's the central place for:
 * - Router setup
 * - Authentication context (future)
 * - Theme providers (future)
 * - Error boundaries (future)
 * - Analytics (future)
 */
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}
