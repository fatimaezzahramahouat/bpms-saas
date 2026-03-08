import { useState } from 'react';
import { X, MapPin, Clock, Building2, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { ApplicationModal } from './ApplicationModal';

interface JobDetailsModalProps {
  job: {
    id: string | number;
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    postedDate: string;
    skills?: string[];
    budget?: string;
    deadline?: string;
    experienceLevel?: string;
    responsibilities?: string[];
    workMode?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Job Details Modal Component
 * 
 * Displays full job details in a slide-in modal (Upwork-style).
 */
export function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);

  if (!isOpen) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CDI': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CDD': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Stage': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Freelance': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-h1-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-h1-black border-b border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {job.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(job.type)}`}>
                {job.type}
              </span>
              {job.experienceLevel && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {job.experienceLevel}
                </span>
              )}
              {job.workMode && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-h1-blue/10 text-h1-blue">
                  {job.workMode}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {job.postedDate}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 space-y-6">
            {/* Job Description */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-h1-blue" />
                Description du poste
              </h3>
              <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </section>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Responsabilités
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="leading-relaxed">
                      {resp}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Job Details Grid */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Informations complémentaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <MapPin className="w-5 h-5 text-h1-blue" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Localisation</p>
                    <p className="font-medium text-gray-900 dark:text-white">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Briefcase className="w-5 h-5 text-h1-blue" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type de contrat</p>
                    <p className="font-medium text-gray-900 dark:text-white">{job.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Clock className="w-5 h-5 text-h1-blue" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date de publication</p>
                    <p className="font-medium text-gray-900 dark:text-white">{job.postedDate}</p>
                  </div>
                </div>
                {job.deadline && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Calendar className="w-5 h-5 text-h1-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date limite</p>
                      <p className="font-medium text-gray-900 dark:text-white">{job.deadline}</p>
                    </div>
                  </div>
                )}
                {job.budget && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <DollarSign className="w-5 h-5 text-h1-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Budget/Salaire</p>
                      <p className="font-medium text-gray-900 dark:text-white">{job.budget}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Compétences requises
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 bg-h1-blue/10 text-h1-blue dark:bg-h1-blue/20 dark:text-h1-blue rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-h1-black border-t border-gray-200 dark:border-white/10 p-6">
            <button
              onClick={() => setShowApplyModal(true)}
              className="w-full bg-h1-blue hover:bg-h1-blue/90 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg"
            >
              Postuler maintenant
            </button>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobTitle={job.title}
        jobId={String(job?.id)}       />
    </>
  );
}
