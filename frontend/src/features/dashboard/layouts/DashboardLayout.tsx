import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Bell, Search } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { OnboardingModal } from '../components/OnboardingModal';
import { ThemeSwitcher } from '@shared/components';

export function DashboardLayout() {
    const getRoleLabel = (user: any) => {
        if (!user) return "";
        // Priority: Role string from login (faster)
        if (user.role === 'ADMIN') return "Administrateur";
        if (user.role === 'RH') return "Responsable RH";
        if (user.role === 'MANAGER') return "Manager";
        if (user.role === 'EMPLOYEE') return "Employé";

        // Fallback: Heritage objects
        if (user.admin) return "Administrateur";
        if (user.rh) return "Responsable RH";
        if (user.manager) return "Manager";
        if (user.employee) return "Employé";
        return "Utilisateur";
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

    const [userName, setUserName] = useState(() => {
        if (userData) return `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        return '';
    });

    const [userRole, setUserRole] = useState(() => {
        if (userData) return getRoleLabel(userData);
        return '';
    });

    const [isAdmin, setIsAdmin] = useState(() => {
        return !!userData?.admin || userData?.role === 'ADMIN';
    });

    const [hasOrgInfo, setHasOrgInfo] = useState(true); // Default to true to prevent flicker blur
    const [showOnboarding, setShowOnboarding] = useState(false); // Default to false to prevent flicker modal
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch full user profile with relations
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                const user = result.data;

                // Persist latest data
                localStorage.setItem('user', JSON.stringify(user));

                setUserData(user);
                setOrgData(user.organisation);
                setUserName(`${user.firstName} ${user.lastName}`);
                setUserRole(getRoleLabel(user));
                setIsAdmin(!!user.admin);

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
        localStorage.setItem('onboarding_done', 'true');
        if (newData.logo) {
            localStorage.setItem('org_logo', newData.logo);
        }
        // Refresh profile to sync all states
        fetchProfile();
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (isLoadingProfile && !userData) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-h1-black transition-colors duration-300">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-h1-blue/20 border-t-h1-blue rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-h1-blue/10 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <img src="/assets/nexflow1.png" alt="NexFlow" className="h-6 dark:hidden opacity-50" />
                        <img src="/assets/nexflow.png" alt="NexFlow" className="h-6 hidden dark:block opacity-50" />
                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-h1-blue mt-4 animate-pulse">
                            Synchronisation en cours...
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-h1-black font-sans text-gray-900 dark:text-white flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col h-screen sticky top-0 z-20 transition-colors duration-300">
                <div className="p-6 border-b border-zinc-800 h-20 flex items-center">
                    {/* App Logo */}
                    <img src="/assets/nexflow1.png" alt="NexFlow" className="h-8 shrink-0 dark:hidden" />
                    <img src="/assets/nexflow.png" alt="NexFlow" className="h-8 shrink-0 hidden dark:block" />

                    {/* Vertical Divider */}
                    <div className="w-[1px] bg-zinc-700 h-8 shrink-0 mx-3" />

                    {/* Organisation Section */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="custom-branding"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 overflow-hidden"
                        >
                            {orgData?.orgInfo?.logo ? (
                                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={orgData.orgInfo.logo} alt="Logo" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-9 h-9 bg-h1-blue rounded-lg flex items-center justify-center font-black shrink-0 text-white text-sm">
                                    {orgData?.name?.charAt(0).toUpperCase() || 'O'}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <NavLink
                        to="/dashboard"
                        end
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20'
                                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white'
                            }`
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Tableau de bord
                    </NavLink>

                    {isAdmin && (
                        <NavLink
                            to="/dashboard/equipe"
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                    ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white'
                                }`
                            }
                        >
                            <Users className="w-5 h-5" />
                            Equipe
                        </NavLink>
                    )}

                    {[
                        { icon: FileText, label: 'Documents', href: '#' },
                        { icon: Settings, label: 'Paramètres', href: '#' },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white transition-all"
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-h-screen transition-all duration-700 ${!hasOrgInfo ? 'blur-xl pointer-events-none' : ''}`}>
                {/* Header */}
                <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm focus:border-h1-blue outline-none transition-all text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <button className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-h1-blue transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-h1-blue rounded-full"></span>
                        </button>
                        <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                        <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-2">
                            <div className="text-right min-w-[100px]">
                                {userName ? (
                                    <>
                                        <p className="text-sm font-bold truncate max-w-[200px] text-gray-900 dark:text-white">{userName}</p>
                                        <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${userRole === 'Administrateur' ? 'text-blue-500' : 'text-h1-blue'}`}>
                                            {userRole}
                                        </p>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                        <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                    </div>
                                )}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-h1-blue/10 border border-h1-blue/20 flex items-center justify-center text-h1-blue font-black text-xs overflow-hidden">
                                {userName ? (
                                    userName.charAt(0).toUpperCase()
                                ) : (
                                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <Outlet context={{ orgData, isAdmin, userData }} />
            </main>

            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                onSuccess={handleOnboardingSuccess}
            />
        </div>
    );
}
