import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, Upload, Check, AlertCircle, Info, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [parsedUsers, setParsedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Mapping headers: Prénom, Nom, Email, Rôle
                const formattedUsers = jsonData.map((row: any) => ({
                    firstName: row['Prénom'] || row['FirstName'] || row['First Name'],
                    lastName: row['Nom'] || row['LastName'] || row['Last Name'],
                    email: row['Email'],
                    role: row['Rôle'] || row['Role'] || 'Employee',
                })).filter(u => u.email && u.firstName && u.lastName);

                if (formattedUsers.length === 0) {
                    setError("Aucun utilisateur valide trouvé. Vérifiez les en-têtes (Prénom, Nom, Email, Rôle).");
                    return;
                }

                setParsedUsers(formattedUsers);
                setStep('preview');
                setError(null);
            } catch (err) {
                console.error("Error parsing excel:", err);
                setError("Erreur lors de la lecture du fichier Excel.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:5000/api/users/bulk-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ users: parsedUsers }),
                credentials: 'include',
            });

            const result = await response.json();

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || "Une erreur est survenue lors de l'import.");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Importer via Excel</h2>
                            <p className="text-xs text-zinc-500 font-bold">Importation en masse d'utilisateurs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 'upload' ? (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer overflow-hidden"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                />
                                <div className="relative z-10 space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-gray-900 dark:text-white">Cliquez pour séléctionner</p>
                                        <p className="text-sm text-zinc-500">ou glissez-déposez votre fichier Excel (xlsx, xls)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-blue-500">Structure du fichier attendue :</p>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Le fichier doit contenir les colonnes : <span className="font-bold">Prénom, Nom, Email, Rôle</span>.</p>
                                    <p className="text-xs text-zinc-500 mt-2 italic font-medium">Les rôles acceptés sont : RH, Manager, Employee.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Aperçu ({parsedUsers.length} utilisateurs)</h3>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="text-xs font-bold text-emerald-500 hover:underline"
                                >
                                    Changer de fichier
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-zinc-400">Utilisateur</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-zinc-400">Email</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-zinc-400">Rôle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {parsedUsers.map((user, idx) => (
                                            <tr key={idx} className="text-sm">
                                                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</td>
                                                <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black">
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-500">Mot de passe provisoire</p>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Le mot de passe par défaut sera <span className="font-mono font-black bg-amber-500/20 px-1.5 py-0.5 rounded">NexFlow@2025</span> pour tous ces utilisateurs.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-500"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </motion.div>
                    )}
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                    >
                        ANNULER
                    </button>
                    {step === 'preview' && (
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    IMPORTATION...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    CONFIRMER L'IMPORT
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
