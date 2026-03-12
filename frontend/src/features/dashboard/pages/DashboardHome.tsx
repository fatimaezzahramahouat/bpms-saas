import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText, Settings, LayoutDashboard, CheckCircle2,
    TrendingUp, TrendingDown, PieChart as PieIcon,
    BarChart3, Zap, Loader2
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../../../services/api';

// --- JEUX DE DONNÉES DE SECOURS (MOCK) ---
const FALLBACK_EVOLUTION = [
    { name: 'Jan', count: 0 }, { name: 'Fév', count: 0 }, { name: 'Mar', count: 0 },
    { name: 'Avr', count: 0 }, { name: 'Mai', count: 0 }, { name: 'Juin', count: 0 },
];

// --- FONCTION POUR GÉNÉRER UNE COULEUR UNIQUE POUR CHAQUE PERSONNE ---
const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-rose-500', 'bg-cyan-500'];
    let hash = 0;
    if (!name) return colors[0];
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export function DashboardHome() {
    const { orgData } = useOutletContext<{ orgData: any }>();

    // --- VÉRIFICATION DES DROITS (ADMIN ET RH UNIQUEMENT) ---
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const canManageEquipe = ['ADMIN', 'ADMINISTRATEUR', 'RH', 'HR', 'HR_MANAGER', 'RESPONSABLE RH', 'RH RESPONSABLE'].includes(user?.role?.toUpperCase() || '');

    // --- GESTION DES ÉTATS ---
    const [selectedCard, setSelectedCard] = useState('Instances Totales');
    const [statsData, setStatsData] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]); // Liste de l'équipe
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // 1. Récupération des Statistiques
            const statsRes = await api.get('/stats/workflows').catch(() => null);
            if (statsRes?.data?.status === 'success') {
                setStatsData(statsRes?.data?.data);
            }

            // 2. Récupération de l'Équipe
            const teamRes = await api.get('/users').catch(() => null);
            if (teamRes?.data) {
                // Gère les différents formats de réponse API
                const usersList = teamRes.data.data || teamRes.data || [];
                setTeamMembers(usersList);
            } else {
                // Fallback de test au cas où l'API n'est pas encore prête
                setTeamMembers([
                    { id: 1, firstName: 'Dounia', lastName: 'Admin', role: 'Administrateur' },
                    { id: 2, firstName: 'Fahd', lastName: 'Ata', role: 'Manager' },
                    { id: 3, firstName: 'Sara', lastName: 'RH', role: 'Responsable RH' },
                ]);
            }
        } catch (err) {
            console.error('❌ Erreur lors de la récupération des données:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCardClick = (label: string) => {
        setSelectedCard(label);
    };

    const stats = [
        {
            label: 'Instances Totales',
            value: statsData?.totalInstances?.toString() || '0',
            icon: LayoutDashboard,
            trend: '+12%',
            trendUp: true,
            color: 'text-h1-blue',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'Instances Actives',
            value: statsData?.activeInstances?.toString() || '0',
            icon: Zap,
            trend: '+5%',
            trendUp: true,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
        },
        {
            label: 'Tâches en attente',
            value: statsData?.pendingTasks?.toString() || '0',
            icon: CheckCircle2,
            trend: '-2%',
            trendUp: false,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            label: 'Taux de Succès',
            value: `${statsData?.successRate || 0}%`,
            icon: FileText,
            trend: '+3%',
            trendUp: true,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
    ];

    return (
        <div className="p-4 lg:p-8 space-y-8 min-h-screen">
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Tableau de bord</h1>
                        <p className="text-gray-500 dark:text-zinc-500 mt-1">Bienvenue dans l'espace de gestion de <span className="text-h1-blue dark:text-white font-bold">{orgData?.name || 'votre organisation'}</span>.</p>
                    </div>
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin text-h1-blue" />}
                </div>
                
                <div className="flex gap-4 items-center">
                    {/* --- AVATARS DYNAMIQUES DE L'ÉQUIPE --- */}
                    <div className="flex -space-x-2">
                        {teamMembers.slice(0, 4).map((member, index) => {
                            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name || 'Utilisateur';
                            const initial = fullName.charAt(0).toUpperCase();
                            const avatarColor = getAvatarColor(fullName); 

                            return (
                                <div 
                                    key={member.id || member._id || index} 
                                    title={fullName}
                                    /* HNA FIN BEDELT CURSOR-POINTER 👇 */
                                    className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#181824] flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer hover:z-10 hover:scale-110 transition-all ${avatarColor}`}
                                >
                                    {initial}
                                </div>
                            );
                        })}

                        {/* Reste de l'équipe (Si > 4) */}
                        {teamMembers.length > 4 && (
                            <div 
                                title={`${teamMembers.length - 4} autres membres`}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#181824] bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-zinc-400 shadow-sm cursor-pointer hover:z-10 hover:scale-110 transition-all"
                            >
                                +{teamMembers.length - 4}
                            </div>
                        )}
                        
                        {/* Affichage si l'équipe est vide */}
                        {!isLoading && teamMembers.length === 0 && (
                            <div className="text-xs text-gray-400 italic mr-2">Aucun membre</div>
                        )}
                    </div>

                    {/* Le bouton "Gérer l'équipe" n'est visible que pour Admin et RH */}
                    {canManageEquipe && (
                        <Link to="/dashboard/equipe" className="text-xs font-bold uppercase tracking-widest text-h1-blue hover:text-h1-blue/80 dark:hover:text-white transition-colors underline underline-offset-4 ml-2">
                            GÉRER L'ÉQUIPE
                        </Link>
                    )}
                </div>
            </div>

            {/* CARTES KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        key={stat.label}
                        onClick={() => handleCardClick(stat.label)}
                        className={`bg-white dark:bg-[#181824] border p-6 rounded-2xl transition-all cursor-pointer group shadow-sm hover:shadow-md dark:shadow-none ${selectedCard === stat.label ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-100 dark:border-white/5 hover:border-h1-blue/20'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="flex items-center gap-1.5">
                                {stat.trendUp ? (
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-tight ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                                {stat.label}
                            </p>
                            <p className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">
                                {isLoading && (!statsData || statsData.totalInstances === undefined) ? '...' : stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* SECTION DES GRAPHIQUES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Graphique d'Évolution (Zone) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 p-6 rounded-2xl shadow-sm dark:shadow-none h-full min-h-[450px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-h1-blue" />
                            <h3 className="font-bold uppercase tracking-widest text-xs text-gray-900 dark:text-white">
                                {selectedCard} : Évolution
                            </h3>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded">2 DERNIÈRES SEMAINES</span>
                    </div>
                    <div className="w-full h-80 min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsData?.timeline?.length > 0 ? statsData.timeline : FALLBACK_EVOLUTION}>
                                <defs>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                    tickFormatter={(val) => {
                                        if (!val) return '';
                                        const d = new Date(val);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#181824',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTasks)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graphique de Répartition (Anneau) */}
                <div className="bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 p-6 rounded-2xl shadow-sm dark:shadow-none relative h-full min-h-[450px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-purple-400" />
                            <h3 className="font-bold uppercase tracking-widest text-xs text-gray-900 dark:text-white">Répartition des Projets</h3>
                        </div>
                    </div>
                    <div className="w-full h-80 min-h-[320px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statsData?.statusDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="status"
                                    stroke="none"
                                >
                                    {(statsData?.statusDistribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#181824',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
                                {statsData?.totalInstances || 0}
                            </span>
                            <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">TOTAL<br />INSTANCES</span>
                        </div>
                    </div>
                    <div className="mt-6 space-y-2">
                        {(statsData?.statusDistribution || []).map((item: any) => (
                            <div key={item.status} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-tight">{item.status}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION INFÉRIEURE : ACTIVITÉ ET TÂCHES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <div className="lg:col-span-2 bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 rounded-2xl p-6 h-[400px] shadow-sm dark:shadow-none flex flex-col transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold uppercase tracking-widest text-sm text-gray-900 dark:text-white">Activité récente</h3>
                        <Settings className="w-4 h-4 text-gray-400 dark:text-zinc-600 cursor-pointer hover:rotate-90 transition-transform" />
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {[
                            { id: 1, title: 'Nouveau flux de travail créé', time: 'Il y a 2 heures', user: 'Admin' },
                            { id: 2, title: 'Demande de congé approuvée', time: 'Il y a 5 heures', user: 'RH' },
                            { id: 3, title: 'Erreur de validation détectée', time: 'Il y a 8 heures', user: 'Système' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-950/30 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 transition-all group">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-h1-blue/10 transition-colors">
                                    <FileText className="w-5 h-5 text-h1-blue" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-gray-400 dark:text-zinc-600 font-medium">{item.time} • par {item.user}</p>
                                </div>
                                <div className="text-[10px] font-black text-h1-blue opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">VOIR PLUS</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-[#181824] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors">
                    <h3 className="font-bold uppercase tracking-widest text-sm mb-6 text-gray-900 dark:text-white">Prochaines Tâches</h3>
                    <div className="space-y-4">
                        {[
                            { id: 1, title: 'Revue trimestrielle des processus', category: 'Admin' },
                            { id: 2, title: 'Mise à jour des rôles utilisateurs', category: 'RH' },
                            { id: 3, title: 'Optimisation des flux IA', category: 'Tech' },
                            { id: 4, title: 'Validation des nouveaux modèles', category: 'Design' },
                        ].map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="w-2 h-2 rounded-full bg-h1-blue group-hover:scale-125 transition-transform"></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600 dark:text-zinc-400 font-bold">{task.title}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{task.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}