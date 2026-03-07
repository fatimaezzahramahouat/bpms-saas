import React, { useState } from 'react';
import { Network, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLayoutedElements } from '../..//workflow/utils/workflowUtils';

export const ArchitecteBPMS = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', sector: '', rules: '' });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 1. Appeler ton API qui contient le Prompt Master
            const response = await fetch('http://localhost:5000/api/generate-bpms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            setResult(data);

        } catch (error) {
            console.error("Erreur de génération", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAndRedirect = () => {
        if (!result || !result.nodes || !result.edges) return;

        // 1. Map AI nodes to React Flow nodes
        const rawNodes = result.nodes.map((n: any) => ({
            id: n.id,
            type: n.type === 'start' ? 'turbo' : (n.type === 'end' ? 'turbo' : 'turbo'),
            position: { x: 0, y: 0 },
            data: {
                title: n.label,
                variant: n.type === 'start' ? 'trigger' : (n.type === 'condition' ? 'condition' : (n.type === 'end' ? 'end' : 'action')),
                role: n.role || 'EMPLOYE',
                assigneeType: 'ALL',
                slaDuration: 24,
                requiredDocuments: [],
                autoEmail: { enabled: false }
            },
        }));

        // 2. Map AI edges to React Flow edges
        const rawEdges = result.edges.map((e: any, idx: number) => ({
            id: `e-ai-${idx}`,
            source: e.source,
            target: e.target,
            label: e.condition || undefined,
            type: 'step', // Step type is best for conditional branching
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 3 },
            labelStyle: { fill: '#1e293b', fontWeight: 800, fontSize: '12px' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            labelBgPadding: [4, 4],
            labelBgBorderRadius: 4,
            data: { color: '#3b82f6' }
        }));

        // 3. Apply Dagre Auto-Layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);

        // 4. Create the final package
        const workflowData = {
            nodes: layoutedNodes,
            edges: layoutedEdges,
            metadata: result.metadata,
            dataModel: result.data_model,
            rules: result.business_rules
        };

        // 5. Save to LocalStorage and Redirect
        localStorage.setItem('ai_generated_workflow', JSON.stringify(workflowData));
        navigate('/dashboard/workflow');
    };

    return (
        <div className="flex flex-col lg:flex-row h-full p-8 gap-8">
            {/* Sidebar de l'Architecte (Gauche) */}
            <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-h1-blue/10 flex items-center justify-center text-h1-blue">
                        <Network size={24} />
                    </div>
                    <div>
                        <h1 className="font-black uppercase tracking-tight text-xl text-gray-900 dark:text-white">Architecte BPMS</h1>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Génération par IA</p>
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Nom du processus</label>
                        <input
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 placeholder:text-zinc-400 focus:border-h1-blue outline-none transition-all text-sm"
                            placeholder="ex: Note de Frais"
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Secteur</label>
                        <select
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 focus:border-h1-blue outline-none transition-all text-sm appearance-none"
                            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        >
                            <option>Choisir le Secteur</option>
                            <option value="Banque">Banque / Assurance</option>
                            <option value="BTP">BTP / Industrie</option>
                            <option value="RH">RH / Management</option>
                            <option value="Logistique">Logistique</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Règles & Acteurs</label>
                        <textarea
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 h-40 placeholder:text-zinc-400 focus:border-h1-blue outline-none transition-all text-sm resize-none"
                            placeholder="Décrivez les acteurs et les règles de validation..."
                            onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-h1-blue hover:bg-h1-blue/90 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-h1-blue/20 flex items-center justify-center gap-2 uppercase tracking-widest mt-auto"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} />}
                        {loading ? 'GÉNÉRATION...' : 'Générer avec nexflow ai'}
                    </button>
                </div>
            </div>

            {/* Preview Zone (Droite) */}
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Aperçu de la Modélisation AI</p>
                </div>
                <div className="flex-1 p-8 overflow-auto">
                    {result ? (
                        <div className="space-y-6 h-full flex flex-col">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex justify-between items-center">
                                <div>
                                    <h3 className="text-emerald-500 font-bold mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Architecture Générée
                                    </h3>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Prévisualisation du blueprint généré par l'IA.</p>
                                </div>
                                <button
                                    onClick={handleConfirmAndRedirect}
                                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg flex items-center gap-2 text-sm"
                                >
                                    Confirmer & Ouvrir dans Builder &rarr;
                                </button>
                            </div>
                            <pre className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm overflow-x-auto text-zinc-700 dark:text-zinc-300 font-mono">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                            <Network size={64} className="mb-6 opacity-20" />
                            <p className="font-bold text-center max-w-sm">Remplissez les champs et cliquez sur générer pour voir la structure du workflow.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
