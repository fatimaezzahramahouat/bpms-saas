import { Routes, Route } from 'react-router-dom';
import { Home } from '../features/auth/pages/Home';
import { Pricing } from '../features/auth/pages/Pricing';
import { Login } from '../features/auth/pages/Login';
import { RegisterOrg } from '../features/auth/pages/RegisterOrg';
import { DashboardLayout } from '../features/dashboard/layouts/DashboardLayout';
import { DashboardHome } from '../features/dashboard/pages/DashboardHome';
import { Dashboard } from '../features/dashboard/pages/Dashboard';
import { WorkflowAnalytics } from '../features/dashboard/pages/WorkflowAnalytics';
import { RecruitmentPage } from '@/pages/RecruitmentPage';
import TeamPage from '@/pages/TeamPage';
import { UsersManagement } from '../features/management/pages/UsersManagement';
import { WorkflowPage } from '../features/workflow/pages/WorkflowPage';

import { ArchitecteBPMS } from '../features/management/pages/ArchitecteBPMS';
import { ResetPassword } from '../features/auth/pages/ResetPassword';
import { GoogleSuccess } from '../features/auth/pages/GoogleSuccess';
import { JobOffersManagement, JobOfferCandidatsPage, CandidateStatisticsPage } from '../features/rh/pages';
import { CandidateProfilePage } from '../features/rh/pages/CandidateProfilePage';
import { MyApprovals } from '@/pages/MyApprovals';
import { EmployeeTasks } from '@/pages/EmployeeTasks';
import { SettingsPage } from '../features/dashboard/pages/SettingsPage';
import { ManageWorkflows } from '../features/workflow/pages/ManageWorkflows';

export function AppRouter() {
  return (
    <Routes>
      {/* 🔓 Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* 🔐 Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-org" element={<RegisterOrg />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/google-success" element={<GoogleSuccess />} />

      {/* 🌐 Recruitment & Team (Public) */}
      <Route path="/recrutement" element={<RecruitmentPage />} />
      <Route path="/our-team" element={<TeamPage />} />

      {/* 🔐 Dashboard Routes - Protected (Wrapper WAHED) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        
        {/* 👥 Management */}
        <Route path="equipe" element={<UsersManagement />} />
        <Route path="manage-workflows" element={<ManageWorkflows />} />
        <Route path="architecte" element={<ArchitecteBPMS />} />
        
        {/* ⚙️ Workflow */}
        <Route path="workflow/:id?" element={<WorkflowPage />} />

        <Route path="analytics" element={<WorkflowAnalytics />} />
        
        {/* 👔 RH / Recruitment */}
        <Route path="rh/job-offers" element={<JobOffersManagement />} />
        <Route path="rh/job-offers/:id/candidats" element={<JobOfferCandidatsPage />} />
        <Route path="rh/candidates/:id" element={<CandidateProfilePage />} />
        <Route path="rh/statistics" element={<CandidateStatisticsPage />} />
        
        {/* 📋 Employee */}
        <Route path="approvals" element={<MyApprovals />} />
        <Route path="tasks" element={<EmployeeTasks />} />
        
        {/* ⚙️ Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 🚫 404 Catch-all - Dima f l'akher */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// 🧱 404 Component
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