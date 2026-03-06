import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, GitMerge, FileText, Settings, LogOut, Bell, Search, Zap, Briefcase, BarChart3 } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { OnboardingModal } from '../components/OnboardingModal';
import { ThemeSwitcher } from '@shared/components';
import { usePermission } from '@shared/hooks/usePermission';
import { RHJobOffersButton } from '@/features/rh/components';
import { NotificationBell } from '../components/NotificationBell';

export function DashboardLayout() {
    const { role: currentRole, isAdmin: isUserAdmin, isHR: isUserHR, isEmployee } = usePermission();

    const getRoleLabel = (role: string) => {
        const r = role.toUpperCase();
        if (r.includes('ADMIN')) return "Administrateur";
        if (r.includes('RH') || r.includes('HR')) return "Responsable RH";
        if (r.includes('MANAGER')) return "Manager";
        return "Employé";
    };

    const [userData, setUserData] = useState<any>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [orgData, setOrgData] = useState<any>(() => {
        if (userData?.organisation) return userData.organisation;
        const saved = localStorage.getItem('user');
        if (saved) {
            const user = JSON.parse(saved);
            return user.organisation || null;
        }
        return null;
    });

    const userRole = getRoleLabel(currentRole);
    const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Utilisateur';

    // Helper to determine if current user should see "Admin/HR" dashboard features
    const hasElevatedAccess = isUserAdmin || isUserHR;

    const [hasOrgInfo, setHasOrgInfo] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const navigate = useNavigate();

const fetchProfile = async () => {
    try {
        const token = localStorage.getItem('token');
        
        console.log('🔍 [fetchProfile] Token:', token ? token.substring(0, 30) + '...' : 'NULL');
        
        // Fetch full user profile with relations
        const response = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            credentials: 'include'
        });

        console.log('📡 [fetchProfile] Status:', response.status);
        
        if (response.status === 401) {
            console.log('❌ Token invalid - logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
        }

        if (response.ok) {
            const result = await response.json();
            const user = result.data;

            // Persist latest data
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('user-data-updated'));

            setUserData(user);
            setOrgData(user.organisation);

            if (user.organisation?.orgInfo) {
                setHasOrgInfo(true);
                setShowOnboarding(false);
                localStorage.setItem('onboarding_done', 'true');
                localStorage.setItem('org_logo', user.organisation.orgInfo.logo);
            } else {
                setHasOrgInfo(false);
                setShowOnboarding(true);
                localStorage.setItem('onboarding_done', 'false');
            }
        }
    } catch (err) {
        console.error('Failed to fetch profile:', err);
    } finally {
        setIsLoadingProfile(false);
    }
};

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleOnboardingSuccess = (newData: any) => {
        setHasOrgInfo(true);
        setShowOnboarding(false);
        fetchProfile();
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (isLoadingProfile && !userData) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-h1-black transition-colors duration-300">
                <div className="w-16 h-16 border-4 border-h1-blue/20 border-t-h1-blue rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-h1-black font-sans text-gray-900 dark:text-white flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col h-screen sticky top-0 z-20 transition-colors duration-300">
                <div className="p-6 border-b border-zinc-800 h-20 flex items-center">
                    <img src="/assets/nexflow.png" alt="NexFlow" className="h-8 shrink-0 hidden dark:block" />
                    <img src="/assets/nexflow1.png" alt="NexFlow" className="h-8 shrink-0 dark:hidden" />
                    <div className="w-[1px] bg-zinc-700 h-8 shrink-0 mx-3" />
                    {orgData?.orgInfo?.logo ? (
                        <div className="w-14 h-14 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white p-1 shrink-0">
                            <img
                                src={orgData.orgInfo.logo}
                                alt="Organisation Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-lg bg-h1-blue shrink-0">
                            {orgData?.name?.charAt(0).toUpperCase() || "O"}
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <NavLink to="/dashboard" end className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        Tableau de bord
                    </NavLink>

                    {isUserAdmin && (
                        <NavLink to="/dashboard/equipe" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                            <Users className="w-5 h-5" />
                            Equipe
                        </NavLink>
                    )}

                    {hasElevatedAccess && (
                        <NavLink to="/dashboard/workflow" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                            <GitMerge className="w-5 h-5" />
                            Workflow Builder
                        </NavLink>
                    )}

                    {isUserHR && (
                        <>
                            <NavLink to="/dashboard/rh/job-offers" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                                <Briefcase className="w-5 h-5" />
                                Offres d'emploi
                            </NavLink>
                            <NavLink to="/dashboard/rh/statistics" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                                <BarChart3 className="w-5 h-5" />
                                Statistiques
                            </NavLink>
                        </>
                    )}

                    {!hasElevatedAccess && (
                        <NavLink to="/dashboard/mes-demandes" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                            <Zap className="w-5 h-5" />
                            Mes Demandes
                        </NavLink>
                    )}

                    {/* Manager Approvals - Only visible to Managers or Admins */}
                    {(userRole === 'Manager' || isUserAdmin) && (
                        <NavLink
                            to="/dashboard/approvals"
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                    ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white'
                                }`
                            }
                        >
                            <FileText className="w-5 h-5" />
                            Mes Approbations
                        </NavLink>
                    )}

                    {/* Employee Tasks - Only visible to Employees or Admins */}
                    {(userRole === 'Employé' || isUserAdmin) && (
                        <NavLink
                            to="/dashboard/tasks"
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                    ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white'
                                }`
                            }
                        >
                            <div className="relative">
                                <FileText className="w-5 h-5" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            </div>
                            Mes Tâches
                        </NavLink>
                    )}

                    {[
                        
                    ].map((item) => (
                        <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white transition-all"
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}

                    <NavLink to="/dashboard/settings" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                        <Settings className="w-5 h-5" />
                        Paramètres
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-left">
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-h-screen transition-all duration-700 ${!hasOrgInfo ? 'blur-xl pointer-events-none' : ''}`}>
                <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        <input type="text" placeholder="Rechercher..." className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm outline-none text-gray-900 dark:text-white" />
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <NotificationBell />
                        <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                        <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-2">
                            <div className="text-right min-w-[100px]">
                                <p className="text-sm font-bold truncate max-w-[200px] text-gray-900 dark:text-white">{userName || 'Utilisateur'}</p>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-h1-blue">{userRole}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-h1-blue/10 border border-h1-blue/20 flex items-center justify-center text-h1-blue font-black text-xs overflow-hidden">
                                {userName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <Outlet context={{ orgData, isAdmin: isUserAdmin, isHR: isUserHR, userData }} />
                </div>
            </main>

            <OnboardingModal isOpen={showOnboarding} onSuccess={handleOnboardingSuccess} />
        </div>
    );
}
