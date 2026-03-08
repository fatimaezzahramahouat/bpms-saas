import React, { useState } from 'react';
import {
    Play, ClipboardList, Clock, CheckCircle2, ArrowRight,
    Zap, FileText, X, XCircle, AlertCircle, ChevronRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

type WorkflowType = 'Demande de Congé' | 'Note de Frais' | 'Demande de Télétravail';
type RequestStatus = 'En cours' | 'Approuvée' | 'Refusée';

interface Request {
    id: string;
    type: WorkflowType;
    date: string;
    status: RequestStatus;
    summary: string; // e.g. "Du 10 au 15 mars" or "120€ — Transport"
}

interface WorkflowDefinition {
    id: string;
    name: WorkflowType;
    description: string;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    borderClass: string;
}

// ─── Configuration ────────────────────────────────────────

const WORKFLOWS: WorkflowDefinition[] = [
    {
        id: '1',
        name: 'Demande de Congé',
        description: "Soumettre une demande pour congés annuels, maladie ou exceptionnels.",
        icon: Clock,
        colorClass: 'text-blue-500',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
    },
    {
        id: '2',
        name: 'Note de Frais',
        description: "Remboursement de frais professionnels (transport, repas, hébergement…)",
        icon: FileText,
        colorClass: 'text-purple-500',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/20',
    },
    {
        id: '3',
        name: 'Demande de Télétravail',
        description: "Planifier vos jours de travail à distance facilement.",
        icon: Zap,
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
    },
];

// ─── Initial mock data ────────────────────────────────────

const INITIAL_REQUESTS: Request[] = [
    {
        id: 'r1',
        type: 'Demande de Congé',
        date: '02 Mars 2026',
        status: 'En cours',
        summary: 'Du 10 au 15 mars',
    },
    {
        id: 'r2',
        type: 'Note de Frais',
        date: '28 Fév 2026',
        status: 'Approuvée',
        summary: '120€ — Transport',
    },
    {
        id: 'r3',
        type: 'Demande de Télétravail',
        date: '20 Fév 2026',
        status: 'Refusée',
        summary: 'Lundi 24 & Mardi 25 fév',
    },
];

// ─── Status badge helper ──────────────────────────────────

const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
    const styles: Record<RequestStatus, { cls: string; icon: React.ReactNode }> = {
        'En cours': {
            cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            icon: <Clock size={11} />,
        },
        'Approuvée': {
            cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            icon: <CheckCircle2 size={11} />,
        },
        'Refusée': {
            cls: 'bg-red-500/10 text-red-500 border-red-500/20',
            icon: <XCircle size={11} />,
        },
    };
    const { cls, icon } = styles[status];
    return (
        <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold border ${cls}`}>
            {icon}
            {status}
        </span>
    );
};

// ─── Input component ─────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";

// ─── Dynamic form fields per workflow type ────────────────

interface FormState {
    // Congé
    dateDebut: string;
    dateFin: string;
    motif: string;
    // Frais
    montant: string;
    description: string;
    // Télétravail
    joursRequis: string;
    justification: string;
}

const EMPTY_FORM: FormState = {
    dateDebut: '', dateFin: '', motif: '',
    montant: '', description: '',
    joursRequis: '', justification: '',
};

const CongeForm: React.FC<{ form: FormState; onChange: (k: keyof FormState, v: string) => void }> = ({ form, onChange }) => (
    <>
        <Field label="Date de début">
            <input type="date" value={form.dateDebut} onChange={e => onChange('dateDebut', e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Date de fin">
            <input type="date" value={form.dateFin} onChange={e => onChange('dateFin', e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Motif">
            <textarea
                value={form.motif}
                onChange={e => onChange('motif', e.target.value)}
                placeholder="Ex: Vacances annuelles, raison personnelle…"
                rows={3}
                className={inputCls}
                required
            />
        </Field>
    </>
);

const FraisForm: React.FC<{ form: FormState; onChange: (k: keyof FormState, v: string) => void }> = ({ form, onChange }) => (
    <>
        <Field label="Montant (€)">
            <input
                type="number" min="0" step="0.01"
                value={form.montant}
                onChange={e => onChange('montant', e.target.value)}
                placeholder="Ex: 45.50"
                className={inputCls}
                required
            />
        </Field>
        <Field label="Description">
            <textarea
                value={form.description}
                onChange={e => onChange('description', e.target.value)}
                placeholder="Ex: Transport — réunion client Paris"
                rows={3}
                className={inputCls}
                required
            />
        </Field>
    </>
);

const TeletravailForm: React.FC<{ form: FormState; onChange: (k: keyof FormState, v: string) => void }> = ({ form, onChange }) => (
    <>
        <Field label="Jours souhaités">
            <input
                type="text"
                value={form.joursRequis}
                onChange={e => onChange('joursRequis', e.target.value)}
                placeholder="Ex: Lundi 10 & Mardi 11 mars"
                className={inputCls}
                required
            />
        </Field>
        <Field label="Justification">
            <textarea
                value={form.justification}
                onChange={e => onChange('justification', e.target.value)}
                placeholder="Ex: Meilleure concentration pour livrable urgent"
                rows={3}
                className={inputCls}
                required
            />
        </Field>
    </>
);

// ─── Main Component ───────────────────────────────────────

export const EmployeeDashboard: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
    const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenModal = (wf: WorkflowDefinition) => {
        setForm(EMPTY_FORM);
        setActiveWorkflow(wf);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setActiveWorkflow(null);
    };

    const handleFormChange = (key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    /** Build a human-readable summary line from form data */
    const buildSummary = (type: WorkflowType): string => {
        if (type === 'Demande de Congé') {
            return form.dateDebut && form.dateFin
                ? `Du ${form.dateDebut} au ${form.dateFin}`
                : form.motif || '—';
        }
        if (type === 'Note de Frais') {
            return form.montant
                ? `${form.montant}€ — ${form.description || 'Frais'}`
                : form.description || '—';
        }
        return form.joursRequis || form.justification || '—';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkflow) return;

        setIsSubmitting(true);

        // Simulate async submission (replace with real API call later)
        setTimeout(() => {
            const newRequest: Request = {
                id: `r_${Date.now()}`,
                type: activeWorkflow.name,
                date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
                status: 'En cours',
                summary: buildSummary(activeWorkflow.name),
            };

            // Prepend to the top of the list
            setRequests(prev => [newRequest, ...prev]);
            setIsSubmitting(false);
            setActiveWorkflow(null);
        }, 600);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* ── Header ── */}
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Mes Demandes</h1>
                <p className="text-slate-500 dark:text-slate-400">Sélectionnez un processus pour démarrer une nouvelle demande.</p>
            </header>

            {/* ── Workflow Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {WORKFLOWS.map((wf) => {
                    const Icon = wf.icon;
                    return (
                        <div
                            key={wf.id}
                            className="group relative bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${wf.bgClass} ${wf.colorClass} border ${wf.borderClass}`}>
                                <Icon size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{wf.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">{wf.description}</p>

                            <button
                                onClick={() => handleOpenModal(wf)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-white dark:text-slate-950 text-white font-bold rounded-xl transition-all hover:bg-slate-700 dark:hover:bg-slate-100 group-hover:gap-3"
                            >
                                <Play size={16} fill="currentColor" />
                                <span>Démarrer</span>
                                <ArrowRight size={16} className="opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0" />
                            </button>

                            {/* Decorative gradient */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-transparent rounded-tr-2xl pointer-events-none" />
                        </div>
                    );
                })}
            </div>

            {/* ── Recent Requests Table ── */}
            <section className="mt-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-purple-500" />
                        Mes demandes récentes
                        <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                            ({requests.length})
                        </span>
                    </h2>
                </div>

                <div className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                    {requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune demande pour le moment.</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm">Démarrez un processus ci-dessus pour créer votre première demande.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Résumé</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-900 dark:text-white">{req.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell max-w-xs truncate">
                                            {req.summary}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {req.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="flex items-center gap-1 ml-auto text-sm text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors font-medium opacity-0 group-hover:opacity-100">
                                                Détails <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* ── Modal ── */}
            {activeWorkflow && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${activeWorkflow.bgClass} ${activeWorkflow.colorClass} border ${activeWorkflow.borderClass}`}>
                                    <activeWorkflow.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{activeWorkflow.name}</h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Remplissez le formulaire ci-dessous</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-4">
                                {activeWorkflow.name === 'Demande de Congé' && (
                                    <CongeForm form={form} onChange={handleFormChange} />
                                )}
                                {activeWorkflow.name === 'Note de Frais' && (
                                    <FraisForm form={form} onChange={handleFormChange} />
                                )}
                                {activeWorkflow.name === 'Demande de Télétravail' && (
                                    <TeletravailForm form={form} onChange={handleFormChange} />
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} fill="currentColor" />
                                            Soumettre la demande
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
