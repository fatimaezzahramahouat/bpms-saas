import { Routes, Route } from 'react-router-dom';
import { Home } from '../features/auth/pages/Home';
import { Login } from '../features/auth/pages/Login';
import { RegisterOrg } from '../features/auth/pages/RegisterOrg';
import { Dashboard } from '../features/dashboard/pages/Dashboard';
import { UsersManagement } from '../features/management/pages/UsersManagement';

/**
 * Application Router
 * 
 * This is the central routing configuration for the application.
 * Routes are organized by feature modules.
 * 
 * Future scalability:
 * - Add lazy loading with React.lazy() for code splitting
 * - Add route guards for protected routes (RBAC)
 * - Add nested routes for complex features
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Public Routes - Home/Landing */}
      <Route path="/" element={<Home />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-org" element={<RegisterOrg />} />

      {/* Dashboard Routes - Protected */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<UsersManagement />} />

      {/* 404 Catch-all - Must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Simple 404 Not Found component
function NotFound() {
  return (
    <div className="min-h-screen bg-h1-black flex flex-col items-center justify-center text-white">
      <h1 className="text-6xl font-bold text-h1-blue mb-4">404</h1>
      <p className="text-xl text-h1-slate mb-8">Page non trouvée</p>
      <a
        href="/"
        className="bg-h1-blue hover:bg-h1-blue/90 text-white px-6 py-3 rounded-md font-bold transition-all"
      >
        Retour à l'accueil
      </a>
    </div>
  );
}
