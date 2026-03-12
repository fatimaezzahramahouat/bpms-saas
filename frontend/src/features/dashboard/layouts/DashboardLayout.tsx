import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, GitMerge, FileText, Settings, LogOut, Bell, Search, Zap, Briefcase, BarChart3, Network, Menu, X as CloseIcon } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { OnboardingModal } from '../components/OnboardingModal';
import { ForceChangePasswordModal } from '../components/ForceChangePasswordModal';
import { ThemeSwitcher } from '@shared/components';
import { usePermission } from '@shared/hooks/usePermission';
import { RHJobOffersButton } from '@/features/rh/components';
import { NotificationBell } from '../components/NotificationBell';

export function DashboardLayout() {
    const { role: currentRole, isAdmin: isUserAdmin, isHR: isUserHR, isEmployee } = usePermission();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- MODIFICATION: Fonction sécurisée pour déterminer le nom du rôle à afficher ---
    const getRoleLabel = (role?: string) => {
        if (!role) return "Employé"; // Rôle par défaut si non trouvé
        const r = String(role).toUpperCase();
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

    // --- MODIFICATION: Récupération dynamique du rôle exact de l'utilisateur connecté ---
    const actualRole = userData?.role || currentRole || '';
    const userRole = getRoleLabel(actualRole);
    const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Utilisateur';

    // Helper to determine if current user should see "Admin/HR" dashboard features
    const hasElevatedAccess = isUserAdmin || isUserHR;

    const [hasOrgInfo, setHasOrgInfo] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
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

                if (user.profileCompleted === false) {
                    if (user.organisation?.orgInfo) {
                        // Collaborator's first login
                        setShowForcePasswordChange(true);
                        setHasOrgInfo(true);
                    } else if (user.role === 'ADMIN') {
                        // Main Admin's onboarding
                        setHasOrgInfo(false);
                        setShowOnboarding(true);
                    }
                } else if (user.organisation?.orgInfo) {
                    setHasOrgInfo(true);
                    setShowOnboarding(false);
                    setShowForcePasswordChange(false);
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
        <div className="flex h-screen overflow-hidden bg-white dark:bg-h1-black font-sans text-gray-900 dark:text-white transition-colors duration-300">
            {/* Arrière-plan pour le menu latéral mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Menu Latéral (Sidebar) */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-screen z-[50] 
                overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 h-20 flex items-center justify-between">
                    <div className="flex items-center">
                        <img src="/assets/nexflow.png" alt="NexFlow" className="h-8 shrink-0 hidden dark:block" />
                        <img src="/assets/nexflow1.png" alt="NexFlow" className="h-8 shrink-0 dark:hidden" />
                        <div className="w-[1px] bg-zinc-300 dark:bg-zinc-700 h-8 shrink-0 mx-3" />
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
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <NavLink to="/dashboard" end onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        Tableau de bord
                    </NavLink>

                    {(isUserAdmin || isUserHR) && (
                        <NavLink to="/dashboard/equipe" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                            <Users className="w-5 h-5" />
                            Equipe
                        </NavLink>
                    )}

                                       {/* Gestion Workflows & Builder (Admin w RH) */}
                    {(isUserAdmin || isUserHR || userRole === 'Responsable RH' || userRole === 'Administrateur') && (
                        <>
                            <NavLink to="/dashboard/manage-workflows" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                                <FileText className="w-5 h-5" />
                                Gestion Workflows
                            </NavLink>
                            <NavLink to="/dashboard/workflow" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                                <GitMerge className="w-5 h-5" />
                                Workflow Builder
                            </NavLink>
                        </>
                    )}

                    {isUserAdmin && (
                        <NavLink to="/dashboard/architecte" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                            <Network className="w-5 h-5" />
                            Architecte BPMS
                        </NavLink>
                    )}

                    {(isUserAdmin || userRole === 'Manager') && (
                        <NavLink to="/dashboard/analytics" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                            <BarChart3 className="w-5 h-5" />
                            Analytics
                        </NavLink>
                    )}

                    {isUserHR && (
                        <>
                            <NavLink to="/dashboard/rh/job-offers" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                                <Briefcase className="w-5 h-5" />
                                Offres d'emploi
                            </NavLink>
                            <NavLink to="/dashboard/rh/statistics" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                                <BarChart3 className="w-5 h-5" />
                                Statistiques
                            </NavLink>
                        </>
                    )}


                    {/* Approbations (Manager/RH/Admin) */}
                    {(userRole === 'Manager' || userRole === 'Responsable RH' || isUserAdmin) && (
                        <NavLink
                            to="/dashboard/approvals"
                            onClick={() => setIsSidebarOpen(false)}
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
 
                                        {/* Tâches (Employés/Managers/RH/Admins) */}
                    {(userRole === 'Employé' || userRole === 'Manager' || userRole === 'Responsable RH' || isUserAdmin) && (
                        <NavLink
                            to="/dashboard/tasks"
                            onClick={() => setIsSidebarOpen(false)}
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

                    <NavLink to="/dashboard/settings" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                        <Settings className="w-5 h-5" />
                        Paramètres
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
                    <button onClick={() => { setIsSidebarOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-left">
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Conteneur principal (Header + Contenu) */}
            <div className={`relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full ml-0 lg:ml-64 transition-all duration-300 ${!hasOrgInfo ? 'blur-xl pointer-events-none' : ''}`}>
                
                {/* Header Mobile */}
                <header className="lg:hidden h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 sticky top-0 z-30 w-full">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <img src="/assets/nexflow.png" alt="NexFlow" className="h-6 dark:block hidden" />
                        <img src="/assets/nexflow1.png" alt="NexFlow" className="h-6 dark:hidden" />
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeSwitcher />
                        <NotificationBell />
                    </div>
                </header>

                {/* Header Bureau (Desktop Topbar) */}
                <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-8 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300 w-full">
                    <div className="flex-1 max-w-md hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <input type="text" placeholder="Rechercher..." className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue/50" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4 ml-auto">
                        <div className="hidden lg:flex items-center gap-4">
                            <ThemeSwitcher />
                            <NotificationBell />
                        </div>
                        <div className="hidden lg:block h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                        
                                                {/* --- ZONE DU PROFIL (NOM ET RÔLE DYNAMIQUE) --- */}
                        <div className="flex items-center gap-2 lg:gap-3 border-zinc-200 dark:border-zinc-800 lg:pl-6">
                            {/* Radinaha sm:block bach tban dima f l'PC */}
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold truncate max-w-[120px] lg:max-w-[200px] text-gray-900 dark:text-white leading-tight">
                                    {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}` : (userData?.name || 'Utilisateur')}
                                </p>
                                <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.1em] lg:tracking-[0.2em] font-black text-h1-blue">
                                    {userRole}
                                </p>
                            </div>
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-h1-blue/10 border border-h1-blue/20 flex items-center justify-center text-h1-blue font-black text-xs lg:text-sm overflow-hidden shrink-0">
                                {(userData?.firstName?.charAt(0) || userData?.name?.charAt(0) || 'U').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet context={{ orgData, isAdmin: isUserAdmin, isHR: isUserHR, userData }} />
                </div>
            </div>

            <OnboardingModal isOpen={showOnboarding} onSuccess={handleOnboardingSuccess} />
        </div>
    );
}