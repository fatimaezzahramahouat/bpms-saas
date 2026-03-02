import React, { useState } from 'react';
import { Save, RotateCcw, CheckCircle2, Loader2, Workflow } from 'lucide-react';

interface WorkflowHeaderProps {
    onSave: () => Promise<void>;
    onReset: () => void;
    title?: string;
    subtitle?: string;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
    onSave,
    onReset,
    title = 'Workflow Editor',
    subtitle = 'Design your automated process',
}) => {
    const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSaveClick = async () => {
        if (saveState !== 'idle') return;

        setSaveState('loading');
        try {
            await onSave();
            setSaveState('success');
            setTimeout(() => {
                setSaveState('idle');
            }, 2000);
        } catch (error) {
            console.error('Failed to save', error);
            setSaveState('idle');
        }
    };

    const handleResetClick = () => {
        if (window.confirm("Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.")) {
            onReset();
        }
    };

    return (
        <div className="absolute top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-6 shadow-sm">
            {/* Left Side: Title & Subtitle */}
            <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Workflow className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">{title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{subtitle}</p>
                </div>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleResetClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser
                </button>

                <button
                    onClick={handleSaveClick}
                    disabled={saveState !== 'idle'}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${saveState === 'idle'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                            : saveState === 'loading'
                                ? 'bg-blue-400 text-white cursor-not-allowed opacity-80'
                                : 'bg-emerald-500 text-white shadow-emerald-500/20'
                        }`}
                >
                    {saveState === 'idle' && (
                        <>
                            <Save className="w-4 h-4" />
                            Sauvegarder
                        </>
                    )}
                    {saveState === 'loading' && (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enregistrement...
                        </>
                    )}
                    {saveState === 'success' && (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Sauvegardé !
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
