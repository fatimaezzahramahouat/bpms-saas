/**
 * Root App Component
 * 
 * This is the entry point component that sets up the application
 * with providers and routing.
 * 
 * Architecture:
 * - Uses AppRouter for routing
 * - Uses Providers for context providers
 * - All pages are now organized in features/
 */
import { AppRouter } from '@app/router';
import { Providers } from '@app/providers';

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
