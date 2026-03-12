import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { applicationService } from '../services/application.service';

/**
 * Application Modal Component
 * 
 * Form modal for job applications with validation.
 */
interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;  // Callback to refresh data after successful submission
  jobTitle: string;
  jobId: string;
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

export function ApplicationModal({ isOpen, onClose, onSuccess, jobTitle, jobId }: ApplicationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    cv: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage(null);
      setErrors({});
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'success' || isLoading) return;

    if (validateForm()) {
      setIsLoading(true);
      setErrorMessage(null);
      
      // ===== DIAGNOSTIC LOGS FOR PROBLEM 2 =====
      console.log('\n📤 ===== FRONTEND SUBMISSION DIAGNOSTIC =====');
      console.log('1. Form data:', { jobId, fullName: formData.fullName, email: formData.email, hasCV: !!formData.cv });
      console.log('2. API endpoint:', `http://localhost:5000/api/applications/${jobId}/apply`);
      // =========================================
      
      try {
        const result = await applicationService.applyToJob(jobId, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          cv: formData.cv!,
        });
        
        // ===== DIAGNOSTIC LOGS FOR PROBLEM 2 =====
        console.log('3. Response received:', result);
        console.log('4. Submission status: SUCCESS');
        console.log('========================================\n');
        // =========================================
        
        // Call onSuccess callback to refresh the candidates list
        if (onSuccess) {
          console.log('🔄 [REFRESH] Calling onSuccess callback to refresh candidates list');
          onSuccess();
        }
        
        // Also dispatch a custom event for cross-component communication
        // This allows the candidates list page to refresh when a new application is submitted
        console.log('🔄 [REFRESH] Dispatching custom event for candidates refresh');
        window.dispatchEvent(new CustomEvent('application-submitted', { 
          detail: { jobId, timestamp: Date.now() } 
        }));
        
        // Also use localStorage for cross-tab communication (works across different routes in same tab)
        localStorage.setItem('application-submitted', JSON.stringify({
          jobId,
          timestamp: Date.now()
        }));
        
        // ✅ Use BroadcastChannel for real-time updates across routes/tabs
        try {
          const channel = new BroadcastChannel('candidate-updates');
          channel.postMessage({ jobId, timestamp: Date.now() });
          channel.close();
        } catch (e) {
          console.warn('BroadcastChannel not supported:', e);
        }
        
        setStatus('success');
        setTimeout(() => {
          onClose();
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            cv: null,
          });
        }, 2000);
      } catch (err: any) {
        console.error('Submission error:', err);
        // ===== DIAGNOSTIC LOGS FOR PROBLEM 2 =====
        console.log('3. Error occurred:', err?.message || err);
        console.log('4. Submission status: FAILED');
        console.log('========================================\n');
        // =========================================
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error || 
          err.response?.data?.message || 
          "Une erreur est survenue lors de l'envoi de votre candidature."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, cv: file });
    if (errors.cv) setErrors({ ...errors, cv: undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-h1-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Candidature
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
              {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Félicitations !</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Votre candidature a été envoyée avec succès. Nous vous contacterons prochainement.
            </p>
          </div>
        ) : (
          <>
            {/* Form - Scrollable */}
            <form id="application-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {status === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="fullName"
                  disabled={isLoading}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors disabled:opacity-50"
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
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors disabled:opacity-50"
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
                  disabled={isLoading}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors disabled:opacity-50"
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
                  disabled={isLoading}
                  onChange={handleFileChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-h1-black text-gray-900 dark:text-white focus:ring-2 focus:ring-h1-blue focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-h1-blue file:text-white file:cursor-pointer disabled:opacity-50"
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
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                form="application-form"
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-h1-blue hover:bg-h1-blue/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Envoi...' : 'Soumettre'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
