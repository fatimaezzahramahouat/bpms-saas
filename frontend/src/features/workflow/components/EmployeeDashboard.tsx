import React from 'react';
import { Play, ClipboardList, Clock, CheckCircle2, ArrowRight, Zap, FileText } from 'lucide-react';

const availableWorkflows = [
    {
        id: '1',
        name: 'Demande de Congé',
        description: 'Soumettre une demande pour conges annuels, maladie ou exceptionnels.',
        icon: Clock,
        color: 'blue'
    },
    {
        id: '2',
        name: 'Note de Frais',
        description: 'Remboursement de frais professionnels (transport, repas, etc.)',
        icon: FileText,
        color: 'purple'
    },
    {
        id: '3',
        name: 'Demande de Télétravail',
        description: 'Planifier vos jours de travail a distance.',
        icon: Zap,
        color: 'amber'
    }
];

export const EmployeeDashboard: React.FC = () => {
    const handleStartWorkflow = (wfName: string) => {
        alert(`Démarrage du formulaire pour: ${wfName}\n(Ceci est une démo du flux utilisateur)`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Mes Demandes</h1>
                <p className="text-slate-500 dark:text-slate-400">Sélectionnez un processus pour démarrer une nouvelle demande.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableWorkflows.map((wf) => {
                    const Icon = wf.icon;
                    return (
                        <div
                            key={wf.id}
                            className="group relative bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-${wf.color}-500/10 text-${wf.color}-500 border border-${wf.color}-500/20`}>
                                <Icon size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{wf.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                {wf.description}
                            </p>

                            <button
                                onClick={() => handleStartWorkflow(wf.name)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-white dark:text-slate-950 text-white font-bold rounded-xl transition-all hover:bg-slate-800 dark:hover:bg-slate-100 group-hover:gap-3"
                            >
                                <Play size={16} fill="currentColor" />
                                <span>Démarrer</span>
                                <ArrowRight size={16} className="opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0" />
                            </button>

                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-transparent rounded-tr-2xl pointer-events-none" />
                        </div>
                    );
                })}
            </div>

            <section className="mt-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-purple-500" />
                        Mes demandes récentes
                    </h2>
                </div>

                <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            <tr>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-slate-900 dark:text-white">Demande de Congé</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">02 Mars 2024</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <Clock size={12} />
                                        En cours
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-white transition-colors">Détails</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-slate-900 dark:text-white">Note de Frais</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">28 Fév 2024</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <CheckCircle2 size={12} />
                                        Approuvée
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-white transition-colors">Détails</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
