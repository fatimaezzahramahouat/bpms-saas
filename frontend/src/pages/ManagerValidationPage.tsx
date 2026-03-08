import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, CheckCircle, XSquare, User, FileText, Inbox } from 'lucide-react';

// === Notification Import (Assume React-Toastify is available as in your other files) ===
// If not installed, you can replace toast with standard alerts
import { toast } from 'react-toastify';

// === Types ===
interface MockRequest {
    id: string;
    userName: string;
    userAvatar?: string;
    date: string;
    title: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    department: string;
}

// === Mock Data ===
const INITIAL_REQUESTS: MockRequest[] = [
    {
        id: 'req-001',
        userName: 'Sophie Martin',
        date: 'Aujourd\'hui, 09:15',
        title: 'Demande de Congé Payé',
        description: 'Du 15 Mars au 22 Mars 2026 inclus. Motif: Vacances annuelles.',
        status: 'Pending',
        department: 'Marketing'
    },
    {
        id: 'req-002',
        userName: 'Thomas Dubois',
        date: 'Hier, 16:45',
        title: 'Achat Matériel IT',
        description: 'Nouvel écran Dell 27" pour remplacement (budget pré-approuvé).',
        status: 'Pending',
        department: 'Ingénierie'
    },
    {
        id: 'req-003',
        userName: 'Julie Leroy',
        date: 'Hier, 14:30',
        title: 'Note de Frais - Mars',
        description: 'Déplacement professionnel à Lyon. Total: 345.50€',
        status: 'Pending',
        department: 'Ventes'
    },
    {
        id: 'req-004',
        userName: 'Lucas Petit',
        date: '4 Mars 2026',
        title: 'Télétravail Exceptionnel',
        description: 'Demande pour ce vendredi 6 Mars. Motif: Rendez-vous médical le matin.',
        status: 'Pending',
        department: 'Support'
    }
];

export const ManagerValidationPage: React.FC = () => {
    // === State ===
    const [requests, setRequests] = useState<MockRequest[]>(INITIAL_REQUESTS);

    // We keep track of total metrics even after they are removed from the 'pending' list
    // In a real app, these would be fetched from a backend
    const [metrics, setMetrics] = useState({
        approved: 12,
        rejected: 3
    });

    // === Derived Data ===
    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const pendingCount = pendingRequests.length;

    // === Handlers ===
    const handleApprove = (id: string, userName: string) => {
        // Update list
        setRequests(requests.filter(r => r.id !== id));
        // Update stats
        setMetrics(prev => ({ ...prev, approved: prev.approved + 1 }));

        // Notification
        toast.success(`Demande de ${userName} approuvée avec succès.`);
    };

    const handleReject = (id: string, userName: string) => {
        // Update list
        setRequests(requests.filter(r => r.id !== id));
        // Update stats
        setMetrics(prev => ({ ...prev, rejected: prev.rejected + 1 }));

        // Notification
        toast.info(`Demande de ${userName} rejetée.`);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen bg-slate-50 dark:bg-[#050507]">
            {/* --- HEADER --- */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Mes Approbations</h1>
                <p className="text-slate-500 dark:text-slate-400">Gérez les demandes en attente de votre équipe.</p>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Pending Card (Yellow/Amber) */}
                <div className="bg-white dark:bg-[#0d0d12] border-l-4 border-amber-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-white/5 dark:border-r-white/5 p-5 rounded-r-2xl shadow-sm flex items-center gap-4">
                    <div className="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 p-3 rounded-full">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">En attente</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</h3>
                    </div>
                </div>

                {/* Approved Card (Green) */}
                <div className="bg-white dark:bg-[#0d0d12] border-l-4 border-green-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-white/5 dark:border-r-white/5 p-5 rounded-r-2xl shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-500 p-3 rounded-full">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Validées</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.approved}</h3>
                    </div>
                </div>

                {/* Rejected Card (Red) */}
                <div className="bg-white dark:bg-[#0d0d12] border-l-4 border-red-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-white/5 dark:border-r-white/5 p-5 rounded-r-2xl shadow-sm flex items-center gap-4">
                    <div className="bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500 p-3 rounded-full">
                        <XSquare size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejetées</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.rejected}</h3>
                    </div>
                </div>
            </div>

            {/* --- TASK LIST (CARDS) --- */}
            <div className="space-y-4">
                {pendingCount > 0 ? (
                    pendingRequests.map((req) => (
                        <div
                            key={req.id}
                            className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center"
                        >
                            {/* Left: User Info */}
                            <div className="flex items-center gap-4 md:w-1/4 shrink-0">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-200 dark:border-indigo-500/30 overflow-hidden">
                                    {req.userAvatar ? (
                                        <img src={req.userAvatar} alt={req.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        // Default Initials (e.g., SM for Sophie Martin)
                                        req.userName.split(' ').map(n => n.charAt(0)).join('')
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{req.userName}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Clock size={12} />
                                        {req.date}
                                    </p>
                                </div>
                            </div>

                            {/* Center: Request Details */}
                            <div className="flex-1 min-w-0 border-l-0 md:border-l border-slate-100 dark:border-white/5 pl-0 md:pl-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={16} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{req.title}</h3>
                                    <span className="ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        {req.department}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">
                                    {req.description}
                                </p>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex gap-3 w-full md:w-auto shrink-0 justify-end pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                                <button
                                    onClick={() => handleReject(req.id, req.userName)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 font-medium transition-colors"
                                >
                                    <XCircle size={18} />
                                    Refuser
                                </button>
                                <button
                                    onClick={() => handleApprove(req.id, req.userName)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-white bg-green-500 hover:bg-green-600 shadow-sm shadow-green-500/20 font-medium transition-colors"
                                >
                                    <CheckCircle2 size={18} />
                                    Valider
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    /* --- EMPTY STATE --- */
                    <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
                            <Inbox size={32} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Vous êtes à jour !</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                            Vous n'avez actuellement aucune demande en attente d'approbation. Profitez de votre journée.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerValidationPage;
