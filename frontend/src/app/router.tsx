import { Routes, Route } from 'react-router-dom';
import { Home } from '../features/auth/pages/Home';
import { Pricing } from '../features/auth/pages/Pricing';
import { Login } from '../features/auth/pages/Login';
import { RegisterOrg } from '../features/auth/pages/RegisterOrg';
import { DashboardLayout } from '../features/dashboard/layouts/DashboardLayout';
import { DashboardHome } from '../features/dashboard/pages/DashboardHome';
import { Dashboard } from '../features/dashboard/pages/Dashboard';
import { RecruitmentPage } from '@/pages/RecruitmentPage';
import TeamPage from '@/pages/TeamPage';
import { UsersManagement } from '../features/management/pages/UsersManagement';
import { WorkflowPage } from '../features/workflow/pages/WorkflowPage';
import { WorkflowListPage } from '../features/workflow/pages/WorkflowListPage';
import { EmployeeDashboard } from '../features/workflow/components/EmployeeDashboard';
import { ArchitecteBPMS } from '../features/management/pages/ArchitecteBPMS';
import { ResetPassword } from '../features/auth/pages/ResetPassword';
import { GoogleSuccess } from '../features/auth/pages/GoogleSuccess';
import { JobOffersManagement, JobOfferCandidatsPage, CandidateStatisticsPage } from '../features/rh/pages';
import { CandidateProfilePage } from '../features/rh/pages/CandidateProfilePage';
import { MyApprovals } from '@/pages/MyApprovals';
import { EmployeeTasks } from '@/pages/EmployeeTasks';
import { SettingsPage } from '../features/dashboard/pages/SettingsPage';
import { ManagerValidationPage } from '@/pages/ManagerValidationPage';



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
      <Route path="/pricing" element={<Pricing />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-org" element={<RegisterOrg />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/google-success" element={<GoogleSuccess />} />


      {/* Dashboard Routes - Protected */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="equipe" element={<UsersManagement />} />
        <Route path="architecte" element={<ArchitecteBPMS />} />

        {/* Workflow Pages */}
        <Route path="workflow" element={<WorkflowListPage />} />
        <Route path="workflow/editor" element={<WorkflowPage />} />
        <Route path="workflow/editor/:id" element={<WorkflowPage />} />

        <Route path="mes-demandes" element={<EmployeeDashboard />} />
        <Route path="rh/job-offers" element={<JobOffersManagement />} />
        <Route path="rh/job-offers/:id/candidats" element={<JobOfferCandidatsPage />} />
        <Route path="rh/candidates/:id" element={<CandidateProfilePage />} />
        <Route path="rh/statistics" element={<CandidateStatisticsPage />} />
        <Route path="approvals" element={<ManagerValidationPage />} />
        <Route path="tasks" element={<EmployeeTasks />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Recruitment Route */}
      <Route path="/recrutement" element={<RecruitmentPage />} />

      {/* Team Route */}
      <Route path="/our-team" element={<TeamPage />} />
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
