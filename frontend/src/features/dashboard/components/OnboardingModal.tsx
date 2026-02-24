import { useState, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Globe, MapPin, Layout, Home, X, Upload, Check } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onSuccess: (data: any) => void;
}

export function OnboardingModal({ isOpen, onSuccess }: OnboardingModalProps) {
    const [formData, setFormData] = useState({
        website: '',
        city: '',
        domaine: '',
        address: '',
        logo: ''
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoPreview(base64String);
                setFormData(prev => ({ ...prev, logo: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Smart URL logic
        let formattedWebsite = formData.website.trim();
        if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
            formattedWebsite = `https://${formattedWebsite}`;
        }

        const submissionData = {
            ...formData,
            website: formattedWebsite
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/organisation/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submissionData)
            });

            if (response.ok) {
                const result = await response.json();
                onSuccess(result.data);
            } else {
                const error = await response.json();
                alert(error.error || 'Une erreur est survenue');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-h1-blue/10 to-transparent">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Configuration de l'espace</h2>
                                <p className="text-zinc-400 text-sm mt-1">Complétez les informations de votre organisation pour continuer.</p>
                            </div>
                            <Layout className="text-h1-blue w-8 h-8 opacity-50" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Logo Upload */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Logo de l'organisation</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 overflow-hidden relative group">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload className="w-6 h-6" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-zinc-400">Cliquez pour télécharger un logo (PNG, JPG)</p>
                                            {logoFile && <p className="text-xs text-h1-blue mt-1 uppercase font-bold">{logoFile.name}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Site Web</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-h1-blue" />
                                        <input
                                            type="text"
                                            name="website"
                                            placeholder="mycompany.ma"
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-h1-blue outline-none transition-all"
                                            value={formData.website}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Ville</label>
                                    <div className="relative">
                                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-h1-blue" />
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="CASABLANCA"
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-h1-blue outline-none transition-all"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Domaine d'activité</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-h1-blue" />
                                        <input
                                            type="text"
                                            name="domaine"
                                            placeholder="TECHNOLOGIE / FINANCE"
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-h1-blue outline-none transition-all"
                                            value={formData.domaine}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Adresse Siège</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-h1-blue" />
                                        <input
                                            type="text"
                                            name="address"
                                            placeholder="BOULEVARD MOHAMED V..."
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-h1-blue outline-none transition-all"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-h1-blue hover:brightness-110 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest transition-all shadow-lg shadow-h1-blue/20 flex items-center gap-2"
                                >
                                    {loading ? 'Enregistrement...' : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Enregistrer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
