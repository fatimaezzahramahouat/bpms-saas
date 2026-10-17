import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../shared/components/Toast';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { GlobalModalProvider } from '../shared/components/GlobalModal';
import { ScrollToTop } from '../shared/components';

/**
 * Application Providers
 * 
 * This component wraps the application with all necessary context providers.
 * It's the central place for:
 * - Router setup
 * - Authentication context (future)
 * - Theme providers (future)
 * - Error boundaries
 * - Toast notifications
 * - Global modals
 * - Analytics (future)
 */
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <GlobalModalProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            {children}
          </BrowserRouter>
        </ToastProvider>
      </GlobalModalProvider>
    </ErrorBoundary>
  );
}
