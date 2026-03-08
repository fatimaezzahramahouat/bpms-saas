import React from 'react';
import {
    LayoutDashboard,
    Users,
    GitMerge,
    Files,
    Settings,
    ChevronRight,
    Zap,
    BarChart3,
    Briefcase,
    CheckSquare,
    Network
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

const menuItems = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Offres d\'emploi', icon: Briefcase, path: '/dashboard/rh/job-offers' },
    { name: 'Statistiques', icon: BarChart3, path: '/dashboard/rh/statistics' },
    { name: 'Equipe', icon: Users, path: '/dashboard/equipe' },
    { name: 'Workflow Builder', icon: GitMerge, path: '/dashboard/workflow' },
    { name: 'Mes Approbations', icon: CheckSquare, path: '/dashboard/approvals' },
    { name: 'Mes Demandes', icon: Zap, path: '/dashboard/mes-demandes' },
    { name: 'Documents', icon: Files, path: '/documents' },
    { name: 'Architecte BPMS', icon: Network, path: '/dashboard/architecte' },
    { name: 'Paramètres', icon: Settings, path: '/settings' },
];

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const { canEditWorkflow, canManageUsers, role, isAdmin, isHR } = usePermission();

    // Récupération directe du rôle depuis localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleFromStorage = user.role;

    // DEBUG: Log du rôle détecté
    console.log('Vérification rôle Sidebar:', roleFromStorage);
    console.log('Rôle depuis usePermission:', role);

    const filteredMenuItems = menuItems.filter(item => {
        // Only Admin and RH can see Workflow Builder
        if (item.path === '/dashboard/workflow') return isAdmin || isHR;
        //Only  and RH can see Job Offers
        if (item.path === '/dashboard/rh/job-offers') return isHR;
        if (item.path === '/dashboard/rh/statistics') return isHR;
        // Only Employees see "Mes Demandes" (or hide builder for them)
        if (item.path === '/dashboard/mes-demandes') return !isAdmin && !isHR;

        // Admin, Manager and RH can see "Mes Approbations"
        if (item.path === '/dashboard/approvals') {
            const approvalsRoles = ['ADMIN', 'ADMINISTRATEUR', 'MANAGER', 'RH'];
            return approvalsRoles.includes(roleFromStorage?.toUpperCase());
        }

        if (item.path.includes('equipe')) return canManageUsers;

        if (item.path === '/dashboard/architecte') {
            const adminRoles = ['ADMIN', 'ADMINISTRATEUR'];
            return isAdmin || adminRoles.includes(roleFromStorage?.toUpperCase()) || adminRoles.includes(role?.toUpperCase());
        }

        return true;
    });

    return (
        <aside className="w-64 h-screen bg-[#0a0a0c] border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    <Zap className="text-white w-6 h-6 fill-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    NexFlow
                </span>
            </div>

            {/* Navigation section */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`
                group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
                ${isActive
                                    ? 'bg-purple-600/10 text-purple-400 shadow-[inset_0_0_20px_rgba(147,51,234,0.05)]'
                                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}
              `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                    p-2 rounded-lg transition-colors
                                    ${isActive ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-transparent'}
                                `}>
                                    <Icon size={18} />
                                </div>
                                <span className={`font-medium transition-colors ${isActive ? 'text-white' : ''}`}>
                                    {item.name}
                                </span>
                            </div>
                            {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.8)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile placeholder */}
            <div className="p-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">{role}</p>
                        <p className="text-xs text-gray-500">Compte {role === 'ADMIN' ? 'Administrateur' : role === 'HR_MANAGER' ? 'RH' : 'Utilisateur'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                </div>
            </div>
        </aside>
    );
};
