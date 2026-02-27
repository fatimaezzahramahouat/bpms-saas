import { useState, FormEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';

/**
 * Application Modal Component
 * 
 * Form modal for job applications with validation.
 */
interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobId: string | number;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  cv: File | null;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  cv?: string;
}

export function ApplicationModal({ isOpen, onClose, jobTitle, jobId }: ApplicationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    cv: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Veuillez entrer un numéro valide';
    }

    if (!formData.cv) {
      newErrors.cv = 'Le CV est requis';
    } else if (formData.cv.type !== 'application/pdf') {
      newErrors.cv = 'Le fichier doit être un PDF';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log('Candidature soumise:', {
        jobId,
        jobTitle,
        ...formData,
        cvName: formData.cv?.name,
      });
      alert('Candidature soumise avec succès!');
      onClose();
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        cv: null,
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, cv: file });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-h1-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Candidature
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors"
              required
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numéro de téléphone *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors"
              required
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* CV */}
          <div>
            <label htmlFor="cv" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CV (PDF) *
            </label>
            <input
              type="file"
              id="cv"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-h1-blue file:text-white file:cursor-pointer"
              required
            />
            {errors.cv && (
              <p className="mt-1 text-sm text-red-500">{errors.cv}</p>
            )}
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 flex gap-3 p-6 border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-lg bg-h1-blue hover:bg-h1-blue/90 text-white font-medium transition-colors"
          >
            Soumettre
          </button>
        </div>
      </div>
    </div>
  );
}
