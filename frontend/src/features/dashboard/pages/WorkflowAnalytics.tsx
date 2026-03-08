import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Activity, CheckCircle2, Clock, AlertCircle, TrendingUp,
    ArrowUpRight, ArrowDownRight, RefreshCw, Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { statsService, WorkflowStats } from '../services/stats.service';

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

export function WorkflowAnalytics() {
    const { orgData } = useOutletContext<{ orgData: any }>();
    const [stats, setStats] = useState<WorkflowStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const data = await statsService.getWorkflowStats();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('Error loading analytics:', err);
            setError('Impossible de charger les statistiques.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error || 'Une erreur est survenue'}</p>
                <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">Réessayer</button>
            </div>
        );
    }

    const cards = [
        { label: 'Instances Actives', value: stats.activeInstances, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Taux de Succès', value: `${stats.successRate}%`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Temps Moyen (H)', value: stats.averageCompletionTime, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Actions en Attente', value: stats.pendingTasks, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white">Analytics Performance</h1>
                    <p className="text-zinc-500 mt-1">Efficacité opérationnelle de <span className="text-white font-bold">{orgData?.name}</span></p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchStats} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-zinc-400">
                        <Filter className="w-4 h-4" />
                        Filtres
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={card.label}
                        className="p-6 bg-[#0d0d12]/50 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +12%
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{card.label}</p>
                        <p className="text-3xl font-black text-white mt-1">{card.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Volume bar chart */}
                <div className="lg:col-span-2 p-6 bg-[#0d0d12]/50 backdrop-blur-xl border border-white/5 rounded-3xl h-[450px]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8">Volume par Workflow</h3>
                    <div className="h-full pb-12">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.volumeByWorkflow}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* status pie chart */}
                <div className="p-6 bg-[#0d0d12]/50 backdrop-blur-xl border border-white/5 rounded-3xl h-[450px]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8">Distribution des Status</h3>
                    <div className="h-full pb-12 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusDistribution}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="status"
                                >
                                    {stats.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-black text-white">{stats.totalInstances}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total</p>
                        </div>

                        <div className="mt-4 space-y-2">
                            {stats.statusDistribution.map((entry, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                        <span className="text-zinc-400 font-bold">{entry.status}</span>
                                    </div>
                                    <span className="text-white font-black">{entry.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Area Chart */}
            <div className="p-6 bg-[#0d0d12]/50 backdrop-blur-xl border border-white/5 rounded-3xl h-[400px]">
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8">Activité Temporelle (14j)</h3>
                <div className="h-full pb-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.timeline}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
