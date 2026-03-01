import { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TagsInput } from './TagsInput';

// Types
export interface JobOffer {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  type: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  createdAt: string;
  requirements?: string[];
  applicationsCount?: number;
  level?: 'JUNIOR' | 'MID' | 'SENIOR';
  workMode?: 'REMOTE' | 'ONSITE' | 'HYBRID';
  budget?: number;
  responsibilities?: string[];
}

export interface JobOfferFormData {
  title: string;
  description: string;
  contractType: 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Alternance';
  level: 'JUNIOR' | 'MID' | 'SENIOR';
  workMode: 'REMOTE' | 'ONSITE' | 'HYBRID';
  skills: string[];
  responsibilities: string[];
  budget?: number;
}

interface JobOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: JobOffer;
}

// Form initial state
const initialFormData: JobOfferFormData = {
  title: '',
  description: '',
  contractType: 'CDI',
  level: 'MID',
  workMode: 'ONSITE',
  skills: [],
  responsibilities: [],
  budget: undefined,
};

// Validation
interface FormErrors {
  title?: string;
  description?: string;
  skills?: string;
}

const validateForm = (data: JobOfferFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Le titre est requis';
  } else if (data.title.length < 3) {
    errors.title = 'Le titre doit contenir au moins 3 caractères';
  } else if (data.title.length > 100) {
    errors.title = 'Le titre ne peut pas dépasser 100 caractères';
  }

  if (!data.description.trim()) {
    errors.description = 'La description est requise';
  } else if (data.description.length < 50) {
    errors.description = 'La description doit contenir au moins 50 caractères';
  }

  if (data.skills.length === 0) {
    errors.skills = 'Au moins une compétence est requise';
  }

  return errors;
};

// Contract type options
const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Alternance', label: 'Alternance' },
];

// Level options
const LEVEL_OPTIONS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-Level' },
  { value: 'SENIOR', label: 'Senior' },
];

// Work mode options
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

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          contractType: (initialData.type as JobOfferFormData['contractType']) || 'CDI',
          level: initialData.level || 'MID',
          workMode: initialData.workMode || 'ONSITE',
          skills: initialData.requirements || [],
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditMode 
        ? `/api/job-offers/${initialData.id}`
        : '/api/job-offers';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Une erreur est survenue');
      }

      setToast({ type: 'success', message: 'Offre enregistrée avec succès ✓' });
      
      // Close modal after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setApiError(errorMessage);
      setToast({ type: 'error', message: `Erreur: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof JobOfferFormData>(field: K, value: JobOfferFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* API Error */}
          {apiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {apiError}
            </div>
          )}

          {/* Section 1: Title & Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations générales
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre du poste <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
                placeholder="Ex: Développeur Frontend"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all resize-none"
                placeholder="Décrivez le poste en détail (min. 50 caractères)..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Section 2: Contract Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Détails du contrat
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de contrat <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => updateField('contractType', e.target.value as JobOfferFormData['contractType'])}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
                >
                  {CONTRACT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Niveau <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => updateField('level', e.target.value as JobOfferFormData['level'])}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
                >
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mode de travail <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.workMode}
                  onChange={(e) => updateField('workMode', e.target.value as JobOfferFormData['workMode'])}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
                >
                  {WORK_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Skills & Responsibilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compétences et responsabilités
            </h3>

            <TagsInput
              label="Compétences"
              tags={formData.skills}
              onChange={(tags) => updateField('skills', tags)}
              placeholder="Tapez une compétence et appuyez sur Entrée..."
              required
              error={errors.skills}
            />

            <TagsInput
              label="Responsabilités"
              tags={formData.responsibilities}
              onChange={(tags) => updateField('responsibilities', tags)}
              placeholder="Tapez une responsabilité et appuyez sur Entrée..."
            />
          </div>

          {/* Section 4: Budget */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rémunération
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget (DH/an)
              </label>
              <input
                type="number"
                min="0"
                value={formData.budget || ''}
                onChange={(e) => updateField('budget', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8000ff] focus:border-transparent outline-none transition-all"
                placeholder="Ex: 55000"
              />
              <p className="mt-1 text-sm text-gray-500">Laissez vide si non spécifié</p>
            </div>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-zinc-900 rounded-b-2xl z-10">
          {/* Toast Notification */}
          {toast && (
            <div className={`mr-auto px-4 py-2 rounded-lg text-sm ${
              toast.type === 'success' 
                ? 'bg-green-500/10 text-green-500 border border-green-500/30' 
                : 'bg-red-500/10 text-red-500 border border-red-500/30'
            }`}>
              {toast.message}
            </div>
          )}
          
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#8000ff] text-white rounded-lg hover:bg-[#6a00cc] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
