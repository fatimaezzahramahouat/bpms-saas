import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Bell, Search } from 'lucide-react';
import { OnboardingModal } from '../components/OnboardingModal';
import { ThemeSwitcher } from '@shared/components';

export function Dashboard() {
    const [hasOrgInfo, setHasOrgInfo] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [orgData, setOrgData] = useState<any>(null);
    const [userName, setUserName] = useState('Utilisateur');
    const [userRole, setUserRole] = useState('Utilisateur');
    const [isAdmin, setIsAdmin] = useState(false);

    const getRoleLabel = (user: any) => {
        if (user.isAdmin || user.admin) return "Administrateur";
        if (user.isRH || user.rh) return "Responsable RH";
        if (user.isManager || user.manager) return "Manager";
        if (user.isEmployee || user.employee) return "Employé";
        return "Utilisateur";
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/organisation/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                const profile = result.data;
                setOrgData(profile);

                if (profile.orgInfo) {
                    setHasOrgInfo(true);
                    setShowOnboarding(false);
                    localStorage.setItem('onboarding_done', 'true');
                    localStorage.setItem('org_logo', profile.orgInfo.logo);
                } else {
                    setHasOrgInfo(false);
                    setShowOnboarding(true);
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
    };

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.firstName && userData.lastName) {
            setUserName(`${userData.firstName} ${userData.lastName}`);
        }
        setIsAdmin(!!(userData.isAdmin || userData.admin));
        setUserRole(getRoleLabel(userData));
        fetchProfile();
    }, []);

    const handleOnboardingSuccess = (newData: any) => {
        setHasOrgInfo(true);
        setShowOnboarding(false);
        localStorage.setItem('onboarding_done', 'true');
        localStorage.setItem('org_logo', newData.logo);
        fetchProfile();
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-h1-black font-sans text-gray-900 dark:text-white flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col h-screen sticky top-0 z-20 transition-colors duration-300">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 h-20 flex items-center">
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
                    {[
                        { icon: LayoutDashboard, label: 'Tableau de bord', active: true, href: '/dashboard' },
                        ...(isAdmin ? [{ icon: Users, label: 'Equipe', href: '/users' }] : []),
                        { icon: FileText, label: 'Documents', href: '#' },
                        { icon: Settings, label: 'Paramètres', href: '#' },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => item.href !== '#' && (window.location.href = item.href)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${item.active ? 'bg-h1-blue text-white shadow-lg shadow-h1-blue/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-h1-blue dark:hover:text-white'}`}
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
                            <div className="text-right">
                                <p className="text-sm font-bold truncate max-w-[200px] text-gray-900 dark:text-white">{userName}</p>
                                <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${userRole === 'Administrateur' ? 'text-blue-500' : 'text-h1-blue'}`}>
                                    {userRole}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-h1-blue/10 border border-h1-blue/20 flex items-center justify-center text-h1-blue font-black text-xs">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Vue d'ensemble</h1>
                            <p className="text-zinc-500 mt-1">Bienvenue dans l'espace de gestion de <span className="text-h1-blue dark:text-white font-bold">{orgData?.name || 'votre organisation'}</span>.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-h1-black bg-zinc-100 dark:bg-zinc-800"></div>
                                ))}
                            </div>
                            <button className="text-xs font-bold uppercase tracking-widest text-h1-blue hover:text-h1-blue/80 dark:hover:text-white transition-colors underline underline-offset-4">Gérer l'équipe</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { label: 'Projets Actifs', value: '12', color: 'bg-h1-blue' },
                            { label: 'Tâches à faire', value: '45', color: 'bg-zinc-800' },
                            { label: 'Membres', value: '8', color: 'bg-zinc-800' },
                            { label: 'Documents', value: '124', color: 'bg-zinc-800' },
                        ].map((stat) => (
                            <motion.div
                                whileHover={{ y: -5 }}
                                key={stat.label}
                                className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl hover:border-h1-blue/50 transition-all cursor-pointer group shadow-sm dark:shadow-none"
                            >
                                <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 group-hover:text-h1-blue transition-colors">{stat.label}</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-[400px] shadow-sm dark:shadow-none transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold uppercase tracking-widest text-sm text-gray-900 dark:text-white">Activité récente</h3>
                                <Settings className="w-4 h-4 text-zinc-400 dark:text-zinc-600 cursor-pointer" />
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950/30 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-h1-blue" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Nouveau flux de travail créé</p>
                                            <p className="text-xs text-zinc-400 dark:text-zinc-600">Il y a 2 heures par Admin</p>
                                        </div>
                                        <div className="text-xs font-bold text-h1-blue">DÉTAILS</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-6 text-gray-900 dark:text-white">Prochaines Tâches</h3>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-h1-blue"></div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Revue trimestrielle des processus</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                onSuccess={handleOnboardingSuccess}
            />
        </div>
    );
}
