import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Settings } from 'lucide-react';

export function DashboardHome() {
    const { orgData } = useOutletContext<{ orgData: any }>();

    return (
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
                    <Link to="/dashboard/equipe" className="text-xs font-bold uppercase tracking-widest text-h1-blue hover:text-h1-blue/80 dark:hover:text-white transition-colors underline underline-offset-4">Gérer l'équipe</Link>
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
    );
}
