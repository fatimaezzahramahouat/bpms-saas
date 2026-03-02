import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TagsInput } from './TagsInput';
import { jobOfferService, JobOffer } from '../../../services/jobOffer.service';

export interface JobOfferFormData {
  title: string;
  description: string;
  contractType: 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'ALTERNANCE';
  level: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'INTERN';
  workMode: 'REMOTE' | 'ONSITE' | 'HYBRID';
  skills: string[];
  responsibilities: string[];
  budget?: number | null;
}

interface JobOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: JobOffer;
}

const initialFormData: JobOfferFormData = {
  title: '',
  description: '',
  contractType: 'CDI',
  level: 'MID',
  workMode: 'ONSITE',
  skills: [],
  responsibilities: [],
  budget: null,
};

interface FormErrors {
  title?: string;
  description?: string;
  skills?: string;
}

const validateForm = (data: JobOfferFormData): FormErrors => {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = 'Le titre est requis';
  else if (data.title.length < 3) errors.title = 'Le titre doit contenir au moins 3 caractères';
  
  if (!data.description.trim()) errors.description = 'La description est requise';
  else if (data.description.length < 10) errors.description = 'La description doit contenir au moins 10 caractères';

  if (data.skills.length === 0) errors.skills = 'Au moins une compétence est requise';
  return errors;
};

const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'ALTERNANCE', label: 'Alternance' },
];

const LEVEL_OPTIONS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-Level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'INTERN', label: 'Intern' },
];

const WORK_MODE_OPTIONS = [
  { value: 'REMOTE', label: 'Télétravail' },
  { value: 'ONSITE', label: 'Sur site' },
  { value: 'HYBRID', label: 'Hybride' },
];

export function JobOfferModal({ isOpen, onClose, onSuccess, initialData }: JobOfferModalProps) {
  const [formData, setFormData] = useState<JobOfferFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          contractType: (initialData.contractType as any) || 'CDI',
          level: (initialData.level as any) || 'MID',
          workMode: (initialData.workMode as any) || 'ONSITE',
          skills: initialData.skills || [],
          responsibilities: initialData.responsibilities || [],
          budget: initialData.budget,
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setApiError(null);
      setToast(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        await jobOfferService.updateOffer(initialData.id, formData);
        setToast({ type: 'success', message: 'Offre mise à jour avec succès ✓' });
      } else {
        await jobOfferService.createOffer(formData);
        setToast({ type: 'success', message: 'Offre créée avec succès ✓' });
      }
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Une erreur est survenue';
      setApiError(errorMessage);
      setToast({ type: 'error', message: `Erreur: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof JobOfferFormData>(field: K, value: JobOfferFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {apiError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Titre du poste*</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-[#8000ff] transition-all"
                placeholder="Ex: Senior Backend Engineer"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500 font-medium">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description*</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-[#8000ff] transition-all resize-none"
                placeholder="Décrivez les missions et le contexte du poste..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-500 font-medium">{errors.description}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contrat*</label>
              <select
                value={formData.contractType}
                onChange={(e) => updateField('contractType', e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-[#8000ff] transition-all"
              >
                {CONTRACT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Niveau*</label>
              <select
                value={formData.level}
                onChange={(e) => updateField('level', e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-[#8000ff] transition-all"
              >
                {LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mode*</label>
              <select
                value={formData.workMode}
                onChange={(e) => updateField('workMode', e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-[#8000ff] transition-all"
              >
                {WORK_MODE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <TagsInput label="Compétences*" tags={formData.skills} onChange={tags => updateField('skills', tags)} placeholder="React, Node.js..." error={errors.skills} />
            <TagsInput label="Responsabilités" tags={formData.responsibilities} onChange={tags => updateField('responsibilities', tags)} placeholder="Concevoir l'architecture..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Budget (MAD/an)</label>
            <input
              type="number"
              value={formData.budget || ''}
              onChange={(e) => updateField('budget', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-[#8000ff] transition-all"
              placeholder="Facultatif"
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex-1">
            {toast && (
              <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {toast.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#8000ff] text-white font-semibold rounded-xl hover:bg-[#6e00d9] shadow-lg shadow-[#8000ff]/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Mettre à jour' : 'Publier l\'offre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
